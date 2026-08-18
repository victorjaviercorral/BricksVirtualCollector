import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MisInsigniasPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

interface MockInsigniasClientProps {
  userProfile: Record<string, unknown>;
  user: { id: string };
  misInsignias: unknown[];
  bountiesCount: number;
}

vi.mock('@/components/badges/InsigniasClient', () => ({
  default: ({ userProfile, user, misInsignias, bountiesCount }: MockInsigniasClientProps) => (
    <div data-testid="insignias-client">
      <span data-testid="user-id">{user.id}</span>
      <span data-testid="profile-keys">{Object.keys(userProfile).length}</span>
      <span data-testid="insignias-count">{misInsignias.length}</span>
      <span data-testid="bounties-count">{bountiesCount}</span>
    </div>
  ),
}));

type MockSupabase = Awaited<ReturnType<typeof createClient>>;

describe('MisInsigniasPage (SSR)', () => {
  const buildSupabase = (overrides: Record<string, unknown> = {}) => {
    const defaults: Record<string, unknown> = {
      usuarios_perfil: { alias: 'Builder', role: 'user' },
      sets: [{ id: 's1' }],
      sets_insignias: [
        { id: 'i1', rango: 1, titulo_insignia: '🥇 1er Puesto', fecha_otorgada: '2026-08-01', exposiciones_temporales: { titulo: 'Star Wars Day' } },
      ],
    };
    const data = { ...defaults, ...overrides };

    const from = vi.fn((table: string) => {
      if (table === 'usuarios_perfil') {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: data.usuarios_perfil }) }) }) };
      }
      if (table === 'sets') {
        return { select: () => ({ eq: () => Promise.resolve({ data: data.sets }) }) };
      }
      if (table === 'sets_insignias') {
        return { select: () => ({ in: () => ({ order: () => Promise.resolve({ data: data.sets_insignias }) }) }) };
      }
      if (table === 'bounties_reclamados') {
        const count = 'bountiesCount' in overrides ? overrides.bountiesCount : 3;
        return { select: () => ({ eq: () => Promise.resolve({ count }) }) };
      }
      return {};
    });

    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
      from,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirecciona a login si no hay usuario', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as unknown as MockSupabase);

    try {
      await MisInsigniasPage();
    } catch (e) {
      expect((e as Error).message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza InsigniasClient con el perfil, las insignias reales y el recuento de bounties', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase() as unknown as MockSupabase);

    const jsx = await MisInsigniasPage();
    render(jsx);

    expect(screen.getByTestId('insignias-client')).toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
    expect(screen.getByTestId('profile-keys')).toHaveTextContent('2');
    expect(screen.getByTestId('insignias-count')).toHaveTextContent('1');
    expect(screen.getByTestId('bounties-count')).toHaveTextContent('3');
  });

  it('pasa un perfil vacío ({}) si la consulta no devuelve datos', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase({ usuarios_perfil: null }) as unknown as MockSupabase);

    const jsx = await MisInsigniasPage();
    render(jsx);

    expect(screen.getByTestId('profile-keys')).toHaveTextContent('0');
  });

  it('no consulta insignias si el usuario no tiene ningún set (evita un .in() vacío)', async () => {
    const supabase = buildSupabase({ sets: [] });
    vi.mocked(createClient).mockResolvedValue(supabase as unknown as MockSupabase);

    const jsx = await MisInsigniasPage();
    render(jsx);

    expect(supabase.from).not.toHaveBeenCalledWith('sets_insignias');
    expect(screen.getByTestId('insignias-count')).toHaveTextContent('0');
  });

  it('pasa 0 bounties si la consulta de recuento no devuelve count', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase({ bountiesCount: null }) as unknown as MockSupabase);

    const jsx = await MisInsigniasPage();
    render(jsx);

    expect(screen.getByTestId('bounties-count')).toHaveTextContent('0');
  });
});
