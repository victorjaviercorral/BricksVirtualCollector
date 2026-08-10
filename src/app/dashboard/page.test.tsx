import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

// Mock de HubClient (sustituyó a DashboardClient) para aislar el SSR de page.tsx de las
// animaciones/interactividad de framer-motion en pruebas unitarias.
vi.mock('./HubClient', () => ({
  default: ({ userProfile, exposicionesActivas, bountiesActivos, comunidadSets, ultimaInsignia }: any) => (
    <div data-testid="hub-client">
      <span data-testid="profile-alias">{userProfile.alias}</span>
      <span data-testid="total-bricks">{userProfile.total_bricks_recibidos}</span>
      <span data-testid="exposiciones-count">{exposicionesActivas.length}</span>
      <span data-testid="bounties-count">{bountiesActivos.length}</span>
      <span data-testid="comunidad-count">{comunidadSets.length}</span>
      <span data-testid="ultima-insignia">{ultimaInsignia ? 'si' : 'no'}</span>
    </div>
  )
}));

/**
 * Builder de mock encadenable para el cliente de Supabase.
 *
 * DashboardHubPage (src/app/dashboard/page.tsx) hace 5 consultas encadenadas distintas sobre
 * .from(), cada una con su propia combinación de select/eq/order/limit/in/single. Un mock fijo
 * por tabla (como el test anterior) se rompe en cuanto la página añade o reordena una consulta.
 * Este builder soporta cualquier combinación de métodos encadenados y resuelve con el valor
 * configurado para cada tabla, sin acoplarse a la forma exacta de la cadena.
 */
function makeSupabaseMock(responses: Record<string, { data?: any; count?: number }>) {
  const from = vi.fn().mockImplementation((table: string) => {
    const response = responses[table] ?? { data: null };
    // El builder real de PostgREST/Supabase es "thenable" en CADA eslabón de la cadena, no solo
    // al final: tanto `await supabase.from(t).select().single()` como
    // `await supabase.from(t).select().in(...).order(...).limit(...)` deben resolver. Por eso
    // cada método encadenable devuelve el propio objeto `chain`, que además implementa `.then()`.
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      in: vi.fn(() => chain),
      single: vi.fn(() => chain),
      then: (resolve: (v: any) => void) => resolve(response),
    };
    return chain;
  });
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) }, from };
}

describe('Dashboard Page (SSR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirecciona a login si no hay usuario', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn(),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    try {
      await Dashboard();
    } catch (e: any) {
      expect(e.message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza HubClient con perfil y colecciones vacías si no hay datos', async () => {
    const mockSupabase = makeSupabaseMock({
      usuarios_perfil: { data: { alias: 'TestUser' } },
      vitrinas: { data: null },
      exposiciones_temporales: { data: null },
      bounties: { data: null },
      sets: { data: null },
    });
    (createClient as any).mockResolvedValue(mockSupabase);

    const jsx = await Dashboard();
    render(jsx);

    expect(screen.getByTestId('hub-client')).toBeInTheDocument();
    expect(screen.getByTestId('profile-alias')).toHaveTextContent('TestUser');
    expect(screen.getByTestId('total-bricks')).toHaveTextContent('0');
    expect(screen.getByTestId('exposiciones-count')).toHaveTextContent('0');
    expect(screen.getByTestId('bounties-count')).toHaveTextContent('0');
    expect(screen.getByTestId('comunidad-count')).toHaveTextContent('0');
    expect(screen.getByTestId('ultima-insignia')).toHaveTextContent('no');
  });

  it('calcula totalBricks y propaga exposiciones/bounties/comunidad/insignia cuando hay datos', async () => {
    const mockSupabase = makeSupabaseMock({
      usuarios_perfil: { data: { alias: 'BrickFan' } },
      vitrinas: { data: [
        { id: 'v1', sets: [{ id: 'set1' }, { id: 'set2' }] },
        { id: 'v2', sets: null },
      ] },
      bricks_recibidos: { count: 42 },
      exposiciones_temporales: { data: [{ id: 'e1' }, { id: 'e2' }] },
      bounties: { data: [{ id: 'b1' }] },
      sets: { data: [
        { id: 's1', usuarios_perfil: { username: 'a' }, fotos: [] },
        { id: 's2', usuarios_perfil: { username: 'b' }, fotos: [] },
      ] },
      sets_insignias: { data: [{ id: 'i1', exposiciones_temporales: { titulo: 'Expo' } }] },
    });
    (createClient as any).mockResolvedValue(mockSupabase);

    const jsx = await Dashboard();
    render(jsx);

    expect(screen.getByTestId('hub-client')).toBeInTheDocument();
    expect(screen.getByTestId('total-bricks')).toHaveTextContent('42');
    expect(screen.getByTestId('exposiciones-count')).toHaveTextContent('2');
    expect(screen.getByTestId('bounties-count')).toHaveTextContent('1');
    // setDestacado consume el primer set de 'sets'; comunidadSets es el resto (1 de 2).
    expect(screen.getByTestId('comunidad-count')).toHaveTextContent('1');
    expect(screen.getByTestId('ultima-insignia')).toHaveTextContent('si');
  });
});
