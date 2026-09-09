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
      <span data-testid="bricks">{profile.total_bricks_recibidos}</span>
    </div>
  ),
}));

/**
 * Reescrito por completo (iteración 3, hallazgo R2). La página ignoraba por completo el id de
 * la URL y mostraba siempre MOCK_USER/MOCK_SETS: cualquier perfil que se visitara mostraba
 * "MasterBuilder_84". Ahora consulta usuarios_perfil por id real y sus vitrinas públicas.
 */
function mockSupabase({ profile, vitrinas, bricksCount = 0 }: { profile: any; vitrinas: any; bricksCount?: number | null }) {
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
    if (table === 'bricks_recibidos') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ count: bricksCount }),
        }),
      };
    }
    return {};
  });
  (createClient as any).mockResolvedValue({ from });
  return from;
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

  it('llama notFound() si el perfil es de un invitado (ADR-011, Fase 5)', async () => {
    mockSupabase({
      profile: { id: 'guest-1', username: 'Invitado_ab12cd34', alias: null, avatar_url: null, creado_en: null, es_invitado: true },
      vitrinas: [],
    });

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

  it('cuenta los bricks en vez de leer usuarios_perfil.total_bricks_recibidos, que se desvía', async () => {
    // La columna la mantiene un trigger que solo incrementa: borrar un set cascadea sus filas de
    // bricks_recibidos pero deja el contador del perfil inflado. Aquí la columna dice 999 y el
    // recuento real es 42; debe ganar el recuento, que es el que ve el propio dueño en su Hub.
    mockSupabase({
      profile: { id: 'user-real-123', username: 'ana', alias: null, avatar_url: null, total_bricks_recibidos: 999, creado_en: null },
      vitrinas: [{ id: 'v1', sets: [{ id: 's1' }] }],
      bricksCount: 42,
    });

    render(await PerfilPublico({ params: mockParams }));

    expect(screen.getByTestId('bricks')).toHaveTextContent('42');
  });

  it('un usuario sin sets públicos no consulta bricks (evita un .in() vacío) y muestra 0', async () => {
    const from = mockSupabase({
      profile: { id: 'user-real-123', username: 'ana', alias: null, avatar_url: null, total_bricks_recibidos: 999, creado_en: null },
      vitrinas: [],
    });

    render(await PerfilPublico({ params: mockParams }));

    expect(from).not.toHaveBeenCalledWith('bricks_recibidos');
    expect(screen.getByTestId('bricks')).toHaveTextContent('0');
  });

  it('un recuento nulo se trata como 0, no como vacío', async () => {
    mockSupabase({
      profile: { id: 'user-real-123', username: 'ana', alias: null, avatar_url: null, total_bricks_recibidos: 0, creado_en: null },
      vitrinas: [{ id: 'v1', sets: [{ id: 's1' }] }],
      bricksCount: null,
    });

    render(await PerfilPublico({ params: mockParams }));

    expect(screen.getByTestId('bricks')).toHaveTextContent('0');
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
