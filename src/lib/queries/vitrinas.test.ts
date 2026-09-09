import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { getVitrinaPublicaById, getVitrinasPublicas } from './vitrinas';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

/**
 * Nota sobre `cache()` de React: memoiza por límite de render/petición, pero fuera de ese
 * contexto (en un test unitario plano) el memo persiste durante todo el proceso de Vitest. Por
 * eso cada test de este fichero usa un `id` distinto -- reutilizar el mismo id entre tests
 * devolvería el resultado cacheado del primero en vez de ejercitar el mock del segundo.
 */
describe('getVitrinaPublicaById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve la vitrina con propietario y sets cuando la consulta tiene éxito', async () => {
    const mockVitrina = {
      id: 'vitrina-ok',
      nombre: 'Mi Colección',
      descripcion: 'Sets de Star Wars',
      usuarios_perfil: { username: 'user1', alias: 'Builder', avatar_url: null },
      sets: [{ id: 's1', nombre: 'Halcón', num_piezas: 100, tematica: 'Star Wars', fotos: [] }],
    };
    const single = vi.fn().mockResolvedValue({ data: mockVitrina, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({ from });

    const result = await getVitrinaPublicaById('vitrina-ok');

    expect(from).toHaveBeenCalledWith('vitrinas');
    expect(eq).toHaveBeenCalledWith('id', 'vitrina-ok');
    expect(result).toEqual(mockVitrina);
  });

  it('devuelve null cuando Supabase responde con error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({ from });

    const result = await getVitrinaPublicaById('vitrina-error');

    expect(result).toBeNull();
  });
});

describe('getVitrinasPublicas', () => {
  // Sin argumentos, `cache()` memoiza una sola vez por proceso (ver nota de cabecera): esta
  // función solo se puede ejercitar una vez de forma fiable en un test plano.
  it('filtra por publicada + pública + dueño no invitado (ADR-011, Fase 5) y ordena por fecha', async () => {
    vi.clearAllMocks();
    const filas = [{ id: 'v1', nombre: 'A', descripcion: null, creado_en: '2026-01-02', usuarios_perfil: { username: 'ana', alias: null, es_invitado: false }, sets: [] }];
    const order = vi.fn().mockResolvedValue({ data: filas, error: null });
    const eqInvitado = vi.fn().mockReturnValue({ order });
    const eqVisibilidad = vi.fn().mockReturnValue({ eq: eqInvitado });
    const eqEstado = vi.fn().mockReturnValue({ eq: eqVisibilidad });
    const select = vi.fn().mockReturnValue({ eq: eqEstado });
    const from = vi.fn().mockReturnValue({ select });
    vi.mocked(createClient).mockResolvedValue({ from } as unknown as Awaited<ReturnType<typeof createClient>>);

    const result = await getVitrinasPublicas();

    expect(from).toHaveBeenCalledWith('vitrinas');
    expect(eqEstado).toHaveBeenCalledWith('estado', 'publicada');
    expect(eqVisibilidad).toHaveBeenCalledWith('visibilidad', 'pública');
    expect(eqInvitado).toHaveBeenCalledWith('usuarios_perfil.es_invitado', false);
    expect(order).toHaveBeenCalledWith('creado_en', { ascending: false });
    expect(result).toEqual(filas);
  });
});
