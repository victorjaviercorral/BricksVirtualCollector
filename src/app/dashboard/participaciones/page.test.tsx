import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipacionesPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

interface MockParticipacionesClientProps {
  misExposiciones: unknown[];
  userProfile?: { avatar_url?: string | null } | null;
}

// Mock ParticipacionesClient
vi.mock('./ParticipacionesClient', () => ({
  default: ({ misExposiciones, userProfile }: MockParticipacionesClientProps) => (
    <div data-testid="participaciones-client">
      Mis Expos: {misExposiciones.length}
      <span data-testid="avatar-url">{userProfile?.avatar_url ?? 'sin-avatar'}</span>
    </div>
  )
}));

type MockFn = ReturnType<typeof vi.fn>;
interface MockQueryBuilder {
  select: MockFn;
  eq: MockFn;
  in: MockFn;
  order: MockFn;
  limit: MockFn;
  single?: MockFn;
}
type MockSupabase = Awaited<ReturnType<typeof createClient>>;

describe('ParticipacionesPage (SSR)', () => {
  let mockGetUser: MockFn;
  let mockFrom: MockFn;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockFrom = vi.fn().mockImplementation((): MockQueryBuilder => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: '1' }] })
    }));
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as unknown as MockSupabase);
  });

  it('redirecciona a login si no hay usuario', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    try {
      await ParticipacionesPage();
    } catch (e) {
      expect((e as Error).message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza y pasa datos al cliente', async () => {
    // Mock the chained calls dynamically based on `from` usage
    mockFrom.mockImplementation((table: string): MockQueryBuilder => {
      const builder: MockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: `mock-${table}` }] })
      };
      // Need to resolve properly since there are await chains
      if (table === 'usuarios_perfil') {
        builder.eq = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { avatar_url: 'https://ejemplo.com/foto.jpg' } }) });
      }
      if (table === 'sets') {
        builder.eq = vi.fn().mockResolvedValue({ data: [{ id: 'set1' }] });
      }
      if (table === 'exposicion_sets' || table === 'bounties' || table === 'bounties_reclamados' || table === 'sets_insignias' || table === 'exposiciones_temporales') {
        // all end with a resolver like in, eq, limit
        builder.in = vi.fn().mockResolvedValue({ data: [{ id: '1' }] });
        builder.eq = vi.fn().mockReturnThis();
        builder.limit = vi.fn().mockResolvedValue({ data: [{ id: '2' }] });
      }
      // bounties_reclamados: cadena .select().eq('usuario_id', ...).order(...) (modelo
      // multi-reclamo, D1 -- ver src/app/dashboard/participaciones/page.tsx)
      if (table === 'bounties_reclamados') {
        builder.order = vi.fn().mockResolvedValue({ data: [] });
      }
      // For exposiciones_temporales
      if (table === 'exposiciones_temporales') {
         builder.eq = vi.fn().mockResolvedValue({ data: [] });
      }
      return builder;
    });

    const jsx = await ParticipacionesPage();
    render(jsx);

    expect(screen.getByTestId('participaciones-client')).toBeInTheDocument();
    // Hallazgo del 19/08/2026: el perfil real ahora se consulta y se pasa al cliente (antes el
    // avatar estaba hardcodeado a un dicebear de ejemplo dentro de ParticipacionesClient.tsx).
    expect(screen.getByTestId('avatar-url')).toHaveTextContent('https://ejemplo.com/foto.jpg');
  });

  it('maneja el caso de arrays nulos correctamente (userSets == null)', async () => {
    mockFrom.mockImplementation((table: string): MockQueryBuilder => {
      const builder: MockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null }) // default null
      };
      if (table === 'usuarios_perfil') {
        builder.eq = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) });
      }
      if (table === 'sets') {
        builder.eq = vi.fn().mockResolvedValue({ data: null }); // triggers || []
      }
      if (table === 'exposicion_sets' || table === 'bounties' || table === 'bounties_reclamados' || table === 'sets_insignias' || table === 'exposiciones_temporales') {
        builder.in = vi.fn().mockResolvedValue({ data: null });
        builder.eq = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: null }), limit: vi.fn().mockResolvedValue({ data: null }) });
        builder.limit = vi.fn().mockResolvedValue({ data: null });
      }
      if (table === 'bounties' || table === 'bounties_reclamados') {
        builder.eq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null }),
          limit: vi.fn().mockResolvedValue({ data: null })
        });
      }
      if (table === 'exposiciones_temporales') {
        builder.eq = vi.fn().mockResolvedValue({ data: null });
      }
      return builder;
    });

    const jsx = await ParticipacionesPage();
    render(jsx);

    // Default mock client says Mis Expos: 0 because validExposiciones is []
    expect(screen.getByText('Mis Expos: 0')).toBeInTheDocument();
  });
});
