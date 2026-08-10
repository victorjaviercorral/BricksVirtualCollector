import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { getVitrinaPublicaById } from './vitrinas';

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
