import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EditarMesaTrabajo from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
  notFound: vi.fn().mockImplementation(() => { throw new Error('notFound') }),
}));

vi.mock('./EditarSetClient', () => ({
  default: ({ set }: any) => <div data-testid="editar-set-client">{set.nombre}</div>,
}));

/**
 * Reescrito por completo (iteración 3, hallazgo R2). La página anterior ignoraba tanto la
 * sesión como el id real y mostraba siempre MOCK_SETS[0] si no encontraba coincidencia -- ni
 * siquiera comprobaba que el visitante hubiera iniciado sesión. Ahora exige sesión y ownership
 * real (.eq('usuario_id', user.id)) antes de mostrar el formulario de edición.
 */
function mockSupabase({ user, set }: { user?: any; set?: any }) {
  const single = vi.fn().mockResolvedValue({ data: set ?? null });
  const eq2 = vi.fn().mockReturnValue({ single });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const from = vi.fn().mockReturnValue({ select });

  (createClient as any).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: user || null } }) },
    from,
  });
  return { eq1, eq2 };
}

describe('EditarMesaTrabajo Page (SSR)', () => {
  const mockParams = Promise.resolve({ id: 'set-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirecciona a /login si no hay sesión', async () => {
    mockSupabase({ user: null });

    await expect(EditarMesaTrabajo({ params: mockParams })).rejects.toThrow('redirect');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('filtra por id Y por usuario_id del solicitante (ownership)', async () => {
    const { eq1, eq2 } = mockSupabase({
      user: { id: 'u1' },
      set: { id: 'set-1', nombre: 'AT-AT', vitrina_id: 'v1' },
    });

    const jsx = await EditarMesaTrabajo({ params: mockParams });
    render(jsx);

    expect(eq1).toHaveBeenCalledWith('id', 'set-1');
    expect(eq2).toHaveBeenCalledWith('usuario_id', 'u1');
  });

  it('llama notFound() si el set no existe o no pertenece al usuario', async () => {
    mockSupabase({ user: { id: 'u1' }, set: null });

    await expect(EditarMesaTrabajo({ params: mockParams })).rejects.toThrow('notFound');
    expect(notFound).toHaveBeenCalled();
  });

  it('renderiza EditarSetClient con los datos reales del set', async () => {
    mockSupabase({ user: { id: 'u1' }, set: { id: 'set-1', nombre: 'Halcón Milenario', vitrina_id: 'v1' } });

    const jsx = await EditarMesaTrabajo({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('editar-set-client')).toHaveTextContent('Halcón Milenario');
  });
});
