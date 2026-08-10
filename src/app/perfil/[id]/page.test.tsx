import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerfilPublico from './page';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn().mockImplementation(() => { throw new Error('notFound') }),
}));

vi.mock('./PerfilPublicoClient', () => ({
  default: ({ profile, sets }: any) => (
    <div data-testid="perfil-client">
      <span data-testid="profile-id">{profile.id}</span>
      <span data-testid="sets-count">{sets.length}</span>
    </div>
  ),
}));

/**
 * Reescrito por completo (iteración 3, hallazgo R2). La página ignoraba por completo el id de
 * la URL y mostraba siempre MOCK_USER/MOCK_SETS: cualquier perfil que se visitara mostraba
 * "MasterBuilder_84". Ahora consulta usuarios_perfil por id real y sus vitrinas públicas.
 */
function mockSupabase({ profile, vitrinas }: { profile: any; vitrinas: any }) {
  const from = vi.fn((table: string) => {
    if (table === 'usuarios_perfil') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: profile }),
          }),
        }),
      };
    }
    if (table === 'vitrinas') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: vitrinas }),
            }),
          }),
        }),
      };
    }
    return {};
  });
  (createClient as any).mockResolvedValue({ from });
}

describe('PerfilPublico Page (SSR)', () => {
  const mockParams = Promise.resolve({ id: 'user-real-123' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta el perfil por el id real de la URL, no uno fijo', async () => {
    mockSupabase({
      profile: { id: 'user-real-123', username: 'ana', alias: null, avatar_url: null, total_bricks_recibidos: 10, creado_en: '2025-01-01' },
      vitrinas: [],
    });

    const jsx = await PerfilPublico({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('profile-id')).toHaveTextContent('user-real-123');
  });

  it('llama notFound() si no existe un perfil con ese id', async () => {
    mockSupabase({ profile: null, vitrinas: [] });

    await expect(PerfilPublico({ params: mockParams })).rejects.toThrow('notFound');
    expect(notFound).toHaveBeenCalled();
  });

  it('aplana los sets de todas las vitrinas públicas y publicadas del usuario', async () => {
    mockSupabase({
      profile: { id: 'user-real-123', username: 'ana', alias: 'Ana Builder', avatar_url: null, total_bricks_recibidos: 0, creado_en: null },
      vitrinas: [
        { id: 'v1', sets: [{ id: 's1' }, { id: 's2' }] },
        { id: 'v2', sets: [{ id: 's3' }] },
        { id: 'v3', sets: null },
      ],
    });

    const jsx = await PerfilPublico({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('sets-count')).toHaveTextContent('3');
  });

  it('pasa un array de sets vacío si el usuario no tiene vitrinas públicas', async () => {
    mockSupabase({
      profile: { id: 'user-real-123', username: 'ana', alias: null, avatar_url: null, total_bricks_recibidos: 0, creado_en: null },
      vitrinas: null,
    });

    const jsx = await PerfilPublico({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('sets-count')).toHaveTextContent('0');
  });
});
