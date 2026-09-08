import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

type MockSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Mock con la forma real de cada cadena de PostgREST que recorre la ruta (perfil, sets,
 * sets_insignias, bounties_reclamados, los agregados y el upsert final).
 */
const buildSupabase = (over: Record<string, unknown> = {}) => {
  const datos: Record<string, unknown> = {
    user: { id: 'u1', created_at: '2020-01-01T00:00:00.000Z' },
    perfil: { creado_en: '2020-01-01T00:00:00.000Z' },
    sets: [{ id: 's1', num_piezas: 1200, tematica: 'Technic', anio_lanzamiento: 2015, bricks_recibidos: 3 }],
    sets_insignias: [],
    reclamos: [],
    insertadas: [{ insignia: 'cantera-1' }],
    upsertError: null,
    ...over,
  };

  const upsertSelect = vi.fn().mockResolvedValue({ data: datos.insertadas, error: datos.upsertError });
  const upsert = vi.fn().mockReturnValue({ select: upsertSelect });

  const from = vi.fn((tabla: string) => {
    if (tabla === 'usuarios_perfil') {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: datos.perfil }) }) }) };
    }
    if (tabla === 'sets') {
      return { select: () => ({ eq: () => Promise.resolve({ data: datos.sets }) }) };
    }
    if (tabla === 'sets_insignias') {
      return { select: () => ({ in: () => ({ order: () => Promise.resolve({ data: datos.sets_insignias }) }) }) };
    }
    if (tabla === 'bounties_reclamados') {
      return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: datos.reclamos }) }) }) };
    }
    if (tabla === 'vitrinas') {
      return { select: () => ({ eq: () => ({ eq: () => ({ eq: () => Promise.resolve({ count: 0 }) }) }) }) };
    }
    if (tabla === 'bricks_recibidos') {
      return { select: () => ({ in: () => Promise.resolve({ count: 3 }), or: () => Promise.resolve({ count: 0 }) }) };
    }
    if (tabla === 'fotos') {
      return { select: () => ({ in: () => Promise.resolve({ count: 0 }) }) };
    }
    if (tabla === 'exposicion_sets') {
      return { select: () => ({ eq: () => ({ in: () => Promise.resolve({ data: [] }) }) }) };
    }
    if (tabla === 'insignias_usuario') {
      return { upsert };
    }
    return {};
  });

  return {
    cliente: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: datos.user } }) },
      from,
    },
    upsert,
  };
};

describe('POST /api/insignias/sync', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza a quien no ha iniciado sesión', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as unknown as MockSupabase);

    const res = await POST();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized. Debes iniciar sesión.' });
  });

  it('registra las insignias con el id del usuario autenticado', async () => {
    const { cliente, upsert } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    await POST();

    const filas = upsert.mock.calls[0][0];
    expect(filas.every((f: { usuario_id: string }) => f.usuario_id === 'u1')).toBe(true);
    expect(filas.map((f: { insignia: string }) => f.insignia)).toContain('cantera-1');
  });

  it('el upsert es idempotente: recargar la página no reescribe otorgado_en', async () => {
    const { cliente, upsert } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    await POST();

    expect(upsert.mock.calls[0][1]).toEqual({
      onConflict: 'usuario_id,insignia',
      ignoreDuplicates: true,
    });
  });

  it('devuelve solo las insignias recién insertadas, que son las que se acaban de conseguir', async () => {
    const { cliente } = buildSupabase({ insertadas: [{ insignia: 'coleccionista-1' }] });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    const res = await POST();

    await expect(res.json()).resolves.toEqual({ nuevas: ['coleccionista-1'] });
  });

  it('si no hay ninguna nueva devuelve una lista vacía, no un error', async () => {
    const { cliente } = buildSupabase({ insertadas: [] });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    const res = await POST();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ nuevas: [] });
  });

  it('recalcula en servidor: solo escribe lo que los datos reales justifican', async () => {
    // Cuenta sin sets, sin bricks y recién creada: no ha desbloqueado nada.
    const { cliente, upsert } = buildSupabase({
      sets: [],
      perfil: { creado_en: new Date().toISOString() },
      user: { id: 'u1', created_at: new Date().toISOString() },
    });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    const res = await POST();

    expect(upsert).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ nuevas: [] });
  });

  it('no acepta insignias enviadas por el cliente: el cuerpo de la petición se ignora', async () => {
    const { cliente, upsert } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    // La firma de POST() no recibe Request: no hay forma de que un cliente inyecte slugs.
    expect(POST.length).toBe(0);

    await POST();

    const escritas = upsert.mock.calls[0][0].map((f: { insignia: string }) => f.insignia);
    expect(escritas).not.toContain('triple-corona');
    expect(escritas).not.toContain('oro');
  });

  it('un fallo de escritura devuelve 500 sin tumbar la página, que ya pinta el cálculo al vuelo', async () => {
    const { cliente } = buildSupabase({ upsertError: { message: 'RLS' }, insertadas: null });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'No se pudieron registrar las insignias' });
  });

  it('un error inesperado se traduce a 500 y no se propaga', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Internal Server Error' });
  });

  it('cae a created_at del usuario si el perfil no tiene creado_en', async () => {
    const { cliente, upsert } = buildSupabase({
      perfil: null,
      user: { id: 'u1', created_at: '2020-01-01T00:00:00.000Z' },
    });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    await POST();

    const escritas = upsert.mock.calls[0][0].map((f: { insignia: string }) => f.insignia);
    expect(escritas).toContain('veterania-3');
  });
});
