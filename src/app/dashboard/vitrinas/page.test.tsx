import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MisVitrinasDashboardPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

interface MockStats {
  numSets: number;
  bricksRecibidos: number;
  temas: string[];
}

vi.mock('@/components/MisVitrinasClient', () => ({
  MisVitrinasClient: ({ vitrinas, stats }: { vitrinas: unknown[]; stats?: MockStats }) => (
    <div data-testid="mis-vitrinas-client">
      <span data-testid="vitrinas-count">{vitrinas.length}</span>
      <span data-testid="stats-sets">{stats?.numSets}</span>
      <span data-testid="stats-bricks">{stats?.bricksRecibidos}</span>
      <span data-testid="stats-temas">{stats?.temas.join(',')}</span>
    </div>
  ),
}));

interface MockRecoProps {
  exposiciones: { id: string }[];
  bounties: { id: string }[];
}

vi.mock('@/components/DondePuedesParticipar', () => ({
  default: ({ exposiciones, bounties }: MockRecoProps) => (
    <div data-testid="donde-participar">
      <span data-testid="reco-expos">{exposiciones.map((e) => e.id).join(',')}</span>
      <span data-testid="reco-bounties">{bounties.map((b) => b.id).join(',')}</span>
    </div>
  ),
}));

type MockSupabase = Awaited<ReturnType<typeof createClient>>;

describe('MisVitrinasDashboardPage (SSR)', () => {
  const buildSupabase = (overrides: Record<string, unknown> = {}) => {
    const data: Record<string, unknown> = {
      vitrinas: [
        { id: 'v1', sets: [{ id: 's1', tematica: 'Star Wars' }, { id: 's2', tematica: 'Technic' }] },
        { id: 'v2', sets: [{ id: 's3', tematica: 'Star Wars' }] },
      ],
      exposiciones: [{ id: 'e1', titulo: 'Abierta' }, { id: 'e2', titulo: 'Ya participo' }],
      bounties: [{ id: 'b1' }, { id: 'b2' }],
      participaciones: [{ exposicion_id: 'e2' }],
      reclamos: [{ bounty_id: 'b2' }],
      bricksCount: 37,
      ...overrides,
    };

    const order = vi.fn().mockResolvedValue({ data: data.vitrinas });
    const eqVitrinas = vi.fn().mockReturnValue({ order });

    const from = vi.fn((tabla: string) => {
      if (tabla === 'vitrinas') return { select: () => ({ eq: eqVitrinas }) };
      if (tabla === 'exposiciones_temporales') {
        return { select: () => ({ eq: () => Promise.resolve({ data: data.exposiciones }) }) };
      }
      if (tabla === 'bounties') {
        return { select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: data.bounties }) }) }) };
      }
      if (tabla === 'exposicion_sets') {
        return { select: () => ({ in: () => Promise.resolve({ data: data.participaciones }) }) };
      }
      if (tabla === 'bounties_reclamados') {
        return { select: () => ({ eq: () => Promise.resolve({ data: data.reclamos }) }) };
      }
      if (tabla === 'bricks_recibidos') {
        return { select: () => ({ in: () => Promise.resolve({ count: data.bricksCount }) }) };
      }
      return {};
    });

    return {
      cliente: {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
        from,
      },
      from,
      eqVitrinas,
      order,
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
      await MisVitrinasDashboardPage();
    } catch (e) {
      expect((e as Error).message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza MisVitrinasClient con las vitrinas del usuario ordenadas por creado_en', async () => {
    const { cliente, from, eqVitrinas, order } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(from).toHaveBeenCalledWith('vitrinas');
    expect(eqVitrinas).toHaveBeenCalledWith('usuario_id', 'user1');
    expect(order).toHaveBeenCalledWith('creado_en', { ascending: false });
    expect(screen.getByTestId('vitrinas-count')).toHaveTextContent('2');
  });

  it('pasa un array vacío si la consulta no devuelve vitrinas', async () => {
    const { cliente } = buildSupabase({ vitrinas: null });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(screen.getByTestId('vitrinas-count')).toHaveTextContent('0');
  });

  it('"Dónde puedes participar" aparece DESPUÉS de la rejilla de vitrinas, no antes', async () => {
    const { cliente } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    const { container } = render(await MisVitrinasDashboardPage());
    const vitrinasEl = screen.getByTestId('mis-vitrinas-client');
    const recoEl = screen.getByTestId('donde-participar');

    // DOCUMENT_POSITION_FOLLOWING (4) confirma que recoEl viene después de vitrinasEl en el DOM.
    expect(vitrinasEl.compareDocumentPosition(recoEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.textContent).toBeTruthy();
  });

  it('calcula el total de sets de todas las vitrinas', async () => {
    const { cliente } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(screen.getByTestId('stats-sets')).toHaveTextContent('3');
  });

  it('cuenta los bricks recibidos por TODOS los sets del usuario, no por vitrina', async () => {
    const { cliente, from } = buildSupabase({ bricksCount: 128 });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(from).toHaveBeenCalledWith('bricks_recibidos');
    expect(screen.getByTestId('stats-bricks')).toHaveTextContent('128');
  });

  it('deriva la lista de temáticas sin duplicados, reutilizando temasDeVitrinas de galeria.ts', async () => {
    const { cliente } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    // "Star Wars" aparece en 2 sets distintos; debe listarse una sola vez.
    expect(screen.getByTestId('stats-temas')).toHaveTextContent('Star Wars,Technic');
  });

  it('recomienda solo las exposiciones en las que el usuario NO participa ya', async () => {
    const { cliente } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(screen.getByTestId('reco-expos')).toHaveTextContent('e1');
    expect(screen.getByTestId('reco-expos')).not.toHaveTextContent('e2');
  });

  it('recomienda solo los retos que el usuario NO ha reclamado', async () => {
    const { cliente } = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(screen.getByTestId('reco-bounties')).toHaveTextContent('b1');
    expect(screen.getByTestId('reco-bounties')).not.toHaveTextContent('b2');
  });

  it('un usuario sin sets no consulta participaciones ni bricks (evita un .in() vacío) y ve todo abierto', async () => {
    const { cliente, from } = buildSupabase({ vitrinas: [{ id: 'v1', sets: [] }] });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(from).not.toHaveBeenCalledWith('exposicion_sets');
    expect(from).not.toHaveBeenCalledWith('bricks_recibidos');
    expect(screen.getByTestId('stats-sets')).toHaveTextContent('0');
    expect(screen.getByTestId('stats-bricks')).toHaveTextContent('0');
    expect(screen.getByTestId('reco-expos')).toHaveTextContent('e1,e2');
  });

  it('sin recomendaciones que hacer sigue renderizando las vitrinas', async () => {
    const { cliente } = buildSupabase({ exposiciones: null, bounties: null });
    vi.mocked(createClient).mockResolvedValue(cliente as unknown as MockSupabase);

    render(await MisVitrinasDashboardPage());

    expect(screen.getByTestId('reco-expos')).toBeEmptyDOMElement();
    expect(screen.getByTestId('vitrinas-count')).toHaveTextContent('2');
  });
});
