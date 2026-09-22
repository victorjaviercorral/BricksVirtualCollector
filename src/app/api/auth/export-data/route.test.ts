import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('GET /api/auth/export-data (derecho de portabilidad, E6 del preflight)', () => {
  const mockGetUser = vi.fn();

  const buildSupabase = (overrides: Record<string, { data: unknown }> = {}) => {
    const defaults: Record<string, { data: unknown }> = {
      usuarios_perfil: { data: { id: 'u1', username: 'ana' } },
      vitrinas: { data: [{ id: 'v1', nombre: 'Mi vitrina', sets: [] }] },
      bricks_recibidos: { data: [{ set_id: 's1', creado_en: '2026-01-01' }] },
      bounties_reclamados: { data: [{ id: 'r1', bounty_id: 'b1' }] },
      insignias_usuario: { data: [{ insignia: 'coleccionista-1', otorgado_en: '2026-01-01' }] },
      ...overrides,
    };
    const from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(defaults[table]),
          then: (resolve: (v: unknown) => unknown) => Promise.resolve(defaults[table]).then(resolve),
        }),
      }),
    }));
    vi.mocked(createClient).mockResolvedValue({ auth: { getUser: mockGetUser }, from } as unknown as Awaited<ReturnType<typeof createClient>>);
    return from;
  };

  beforeEach(() => vi.clearAllMocks());

  it('devuelve 401 sin sesión', async () => {
    buildSupabase();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('devuelve un JSON descargable con los datos del propio usuario', async () => {
    buildSupabase();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('.json');
    const body = await res.json();
    expect(body.perfil).toEqual({ id: 'u1', username: 'ana' });
    expect(body.vitrinas).toHaveLength(1);
    expect(body.bounties_reclamados).toHaveLength(1);
    expect(body.insignias_desbloqueadas).toEqual([{ insignia: 'coleccionista-1', otorgado_en: '2026-01-01' }]);
  });

  it('nunca revienta si alguna tabla no devuelve datos (null -> [])', async () => {
    buildSupabase({ vitrinas: { data: null }, insignias_usuario: { data: null } });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const res = await GET();
    const body = await res.json();

    expect(body.vitrinas).toEqual([]);
    expect(body.insignias_desbloqueadas).toEqual([]);
  });

  it('devuelve 500 ante una excepción inesperada', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('network down'));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
