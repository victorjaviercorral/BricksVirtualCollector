import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MisInsigniasPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AgregadosUsuario, ResultadoInsignias } from '@/lib/insignias-usuario';

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
  agregados: AgregadosUsuario;
  insignias: ResultadoInsignias;
}

vi.mock('@/components/badges/InsigniasClient', () => ({
  default: ({ userProfile, user, misInsignias, agregados, insignias }: MockInsigniasClientProps) => (
    <div data-testid="insignias-client">
      <span data-testid="user-id">{user.id}</span>
      <span data-testid="profile-keys">{Object.keys(userProfile).length}</span>
      <span data-testid="insignias-count">{misInsignias.length}</span>
      <span data-testid="piezas">{agregados.piezasTotales}</span>
      <span data-testid="bricks">{agregados.bricksRecibidos}</span>
      <span data-testid="bricks-dados">{agregados.bricksDados}</span>
      <span data-testid="fotos">{agregados.numFotos}</span>
      <span data-testid="vitrinas">{agregados.numVitrinasPublicadas}</span>
      <span data-testid="expos">{agregados.exposicionesAprobadas}</span>
      <span data-testid="oros">{agregados.oros}</span>
      <span data-testid="bounties">{agregados.bountiesReclamados}</span>
      <span data-testid="botin">{agregados.bricksDeBounties}</span>
      <span data-testid="desbloqueadas">{insignias.desbloqueadas.map((i) => i.id).join(',')}</span>
    </div>
  ),
}));

type MockSupabase = Awaited<ReturnType<typeof createClient>>;

describe('MisInsigniasPage (SSR)', () => {
  const buildSupabase = (overrides: Record<string, unknown> = {}) => {
    const defaults: Record<string, unknown> = {
      usuarios_perfil: { alias: 'Builder', role: 'user', creado_en: '2020-01-01T00:00:00.000Z' },
      sets: [{ id: 's1', num_piezas: 1200, tematica: 'Star Wars', anio_lanzamiento: 2015, bricks_recibidos: 30 }],
      sets_insignias: [
        { id: 'i1', rango: 1, titulo_insignia: '🥇 1er Puesto', fecha_otorgada: '2026-08-01', exposiciones_temporales: { titulo: 'Star Wars Day' } },
      ],
      bounties_reclamados: [{ id: 'b1', recompensa: 1000, nombre_set: 'Reto', creado_en: '2026-08-02' }],
      bricksCount: 30,
      bricksDadosCount: 4,
      fotosCount: 6,
      vitrinasCount: 2,
      exposicion_sets: [{ exposicion_id: 'e1' }, { exposicion_id: 'e1' }, { exposicion_id: 'e2' }],
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
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: data.bounties_reclamados }) }) }) };
      }
      if (table === 'vitrinas') {
        return { select: () => ({ eq: () => ({ eq: () => ({ eq: () => Promise.resolve({ count: data.vitrinasCount }) }) }) }) };
      }
      if (table === 'bricks_recibidos') {
        return {
          select: () => ({
            in: () => Promise.resolve({ count: data.bricksCount }),
            or: () => Promise.resolve({ count: data.bricksDadosCount }),
          }),
        };
      }
      if (table === 'fotos') {
        return { select: () => ({ in: () => Promise.resolve({ count: data.fotosCount }) }) };
      }
      if (table === 'exposicion_sets') {
        return { select: () => ({ eq: () => ({ in: () => Promise.resolve({ data: data.exposicion_sets }) }) }) };
      }
      return {};
    });

    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1', created_at: '2020-01-01T00:00:00.000Z' } } }) },
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

  it('renderiza InsigniasClient con el perfil y las insignias reales de exposición', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase() as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
    expect(screen.getByTestId('profile-keys')).toHaveTextContent('3');
    expect(screen.getByTestId('insignias-count')).toHaveTextContent('1');
  });

  it('agrega las métricas del usuario desde sus consultas reales', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase() as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(screen.getByTestId('piezas')).toHaveTextContent('1200');
    expect(screen.getByTestId('bricks')).toHaveTextContent('30');
    expect(screen.getByTestId('bricks-dados')).toHaveTextContent('4');
    expect(screen.getByTestId('fotos')).toHaveTextContent('6');
    expect(screen.getByTestId('vitrinas')).toHaveTextContent('2');
    expect(screen.getByTestId('bounties')).toHaveTextContent('1');
    expect(screen.getByTestId('botin')).toHaveTextContent('1000');
  });

  it('cuenta exposiciones DISTINTAS, no participaciones: dos sets en la misma expo son una', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase() as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(screen.getByTestId('expos')).toHaveTextContent('2');
  });

  it('deriva los podios de sets_insignias para las insignias de metal', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase() as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(screen.getByTestId('oros')).toHaveTextContent('1');
    expect(screen.getByTestId('desbloqueadas')).toHaveTextContent('oro');
  });

  it('evalúa el catálogo contra los agregados reales, no contra valores simulados', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase() as unknown as MockSupabase);

    render(await MisInsigniasPage());

    const slugs = screen.getByTestId('desbloqueadas').textContent!.split(',');
    expect(slugs).toContain('cantera-1');        // 1.200 piezas
    expect(slugs).toContain('coleccionista-1');  // 1 set
    expect(slugs).toContain('pieza-estrella');   // 30 bricks en un solo set
    expect(slugs).toContain('botin-1');          // 1.000 bricks de recompensa
    expect(slugs).not.toContain('cantera-2');    // no llega a 5.000 piezas
  });

  it('pasa un perfil vacío ({}) si la consulta no devuelve datos', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase({ usuarios_perfil: null }) as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(screen.getByTestId('profile-keys')).toHaveTextContent('0');
  });

  it('no consulta insignias si el usuario no tiene ningún set (evita un .in() vacío)', async () => {
    const supabase = buildSupabase({ sets: [] });
    vi.mocked(createClient).mockResolvedValue(supabase as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(supabase.from).not.toHaveBeenCalledWith('sets_insignias');
    expect(screen.getByTestId('insignias-count')).toHaveTextContent('0');
  });

  it('un usuario sin sets obtiene agregados a cero sin romper ni consultar por set', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase({ sets: [], bounties_reclamados: [] }) as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(screen.getByTestId('piezas')).toHaveTextContent('0');
    expect(screen.getByTestId('bricks')).toHaveTextContent('0');
    expect(screen.getByTestId('fotos')).toHaveTextContent('0');
    expect(screen.getByTestId('expos')).toHaveTextContent('0');
    expect(screen.getByTestId('desbloqueadas')).toHaveTextContent('veterania-1');
  });

  it('sin reclamos de bounty el botín es 0, no un valor por defecto', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase({ bounties_reclamados: null }) as unknown as MockSupabase);

    render(await MisInsigniasPage());

    expect(screen.getByTestId('bounties')).toHaveTextContent('0');
    expect(screen.getByTestId('botin')).toHaveTextContent('0');
  });
});
