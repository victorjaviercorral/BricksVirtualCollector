import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SetDetail from './page';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn().mockImplementation(() => { throw new Error('notFound') }),
}));

vi.mock('./SetDetailClient', () => ({
  default: ({ set, isLoggedIn, yaVotado }: any) => (
    <div data-testid="set-client">
      <span data-testid="set-id">{set.id}</span>
      <span data-testid="logged-in">{String(isLoggedIn)}</span>
      <span data-testid="ya-votado">{String(yaVotado)}</span>
    </div>
  ),
}));

/**
 * Reescrito por completo (iteración 3, hallazgo R2). La página buscaba en MOCK_SETS por id y,
 * si no encontraba coincidencia, caía silenciosamente en MOCK_SETS[0] -- cualquier id
 * inexistente mostraba igualmente un set (falso). Ahora consulta la tabla real y usa notFound()
 * si no existe o RLS lo oculta (vitrina privada de otro usuario).
 */
function mockSupabase({ set, user, brickPropio }: { set: any; user?: any; brickPropio?: any }) {
  const from = vi.fn((table: string) => {
    if (table === 'sets') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: set }),
          }),
        }),
      };
    }
    if (table === 'bricks_recibidos') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: brickPropio || null }),
            }),
          }),
        }),
      };
    }
    return {};
  });
  (createClient as any).mockResolvedValue({
    from,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: user || null } }) },
  });
}

describe('SetDetail Page (SSR)', () => {
  const mockParams = Promise.resolve({ id: 'set-real-456' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta el set por el id real de la URL', async () => {
    mockSupabase({ set: { id: 'set-real-456', nombre: 'AT-AT' } });

    const jsx = await SetDetail({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('set-id')).toHaveTextContent('set-real-456');
  });

  it('llama notFound() si el set no existe o RLS lo oculta', async () => {
    mockSupabase({ set: null });

    await expect(SetDetail({ params: mockParams })).rejects.toThrow('notFound');
    expect(notFound).toHaveBeenCalled();
  });

  it('propaga isLoggedIn=false cuando no hay sesión', async () => {
    mockSupabase({ set: { id: 'set-real-456' } });

    const jsx = await SetDetail({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
    expect(screen.getByTestId('ya-votado')).toHaveTextContent('false');
  });

  it('propaga yaVotado=true si el usuario ya dio un brick a este set', async () => {
    mockSupabase({
      set: { id: 'set-real-456' },
      user: { id: 'u1' },
      brickPropio: { id: 'brick-1' },
    });

    const jsx = await SetDetail({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
    expect(screen.getByTestId('ya-votado')).toHaveTextContent('true');
  });
});
