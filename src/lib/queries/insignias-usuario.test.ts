import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAgregadosUsuario, type EntradaAgregados } from './insignias-usuario';

/** Mock mínimo con la forma real de cada cadena de PostgREST que usa el módulo. */
const buildSupabase = (over: Partial<Record<string, unknown>> = {}) => {
  const datos = {
    vitrinasCount: 2,
    bricksCount: 40,
    bricksDadosCount: 7,
    fotosCount: 12,
    participaciones: [{ exposicion_id: 'e1' }, { exposicion_id: 'e2' }],
    ...over,
  };

  const or = vi.fn().mockResolvedValue({ count: datos.bricksDadosCount });

  const from = vi.fn((tabla: string) => {
    if (tabla === 'vitrinas') {
      return { select: () => ({ eq: () => ({ eq: () => ({ eq: () => Promise.resolve({ count: datos.vitrinasCount }) }) }) }) };
    }
    if (tabla === 'bricks_recibidos') {
      return { select: () => ({ in: () => Promise.resolve({ count: datos.bricksCount }), or }) };
    }
    if (tabla === 'fotos') {
      return { select: () => ({ in: () => Promise.resolve({ count: datos.fotosCount }) }) };
    }
    if (tabla === 'exposicion_sets') {
      return { select: () => ({ eq: () => ({ in: () => Promise.resolve({ data: datos.participaciones }) }) }) };
    }
    return {};
  });

  return { cliente: { from } as unknown as SupabaseClient, from, or };
};

const entrada = (over: Partial<EntradaAgregados> = {}): EntradaAgregados => ({
  sets: [{ num_piezas: 800, tematica: 'Technic', anio_lanzamiento: 2018, bricks_recibidos: 15 }],
  setIds: ['s1'],
  insigniasDeSets: [{ rango: 1 }, { rango: 3 }],
  reclamos: [{ recompensa: 500 }, { recompensa: 1000 }],
  creadoEn: '2020-01-01T00:00:00.000Z',
  ...over,
});

describe('getAgregadosUsuario', () => {
  it('ensambla todas las métricas del usuario', async () => {
    const { cliente } = buildSupabase();
    const a = await getAgregadosUsuario(cliente, 'u1', entrada());

    expect(a.numSets).toBe(1);
    expect(a.piezasTotales).toBe(800);
    expect(a.tematicas).toBe(1);
    expect(a.numVitrinasPublicadas).toBe(2);
    expect(a.bricksRecibidos).toBe(40);
    expect(a.bricksDados).toBe(7);
    expect(a.numFotos).toBe(12);
    expect(a.exposicionesAprobadas).toBe(2);
    expect(a.oros).toBe(1);
    expect(a.bronces).toBe(1);
    expect(a.platas).toBe(0);
    expect(a.bountiesReclamados).toBe(2);
    expect(a.bricksDeBounties).toBe(1500);
    expect(a.diasDesdeRegistro).toBeGreaterThan(1000);
  });

  it('cuenta los bricks dados en los dos formatos reales de hash_visitante', async () => {
    const { cliente, or } = buildSupabase();
    await getAgregadosUsuario(cliente, 'u1', entrada());

    expect(or).toHaveBeenCalledWith(
      'hash_visitante.eq.u1,hash_visitante.like.exposicion-*-user-u1'
    );
  });

  it('cuenta exposiciones distintas, no participaciones', async () => {
    const { cliente } = buildSupabase({
      participaciones: [{ exposicion_id: 'e1' }, { exposicion_id: 'e1' }, { exposicion_id: 'e1' }],
    });
    const a = await getAgregadosUsuario(cliente, 'u1', entrada());
    expect(a.exposicionesAprobadas).toBe(1);
  });

  it('un usuario sin sets no consulta por set y obtiene ceros', async () => {
    const { cliente, from } = buildSupabase();
    const a = await getAgregadosUsuario(cliente, 'u1', entrada({ sets: [], setIds: [], insigniasDeSets: [], reclamos: [] }));

    expect(from).not.toHaveBeenCalledWith('fotos');
    expect(from).not.toHaveBeenCalledWith('exposicion_sets');
    expect(a.bricksRecibidos).toBe(0);
    expect(a.numFotos).toBe(0);
    expect(a.exposicionesAprobadas).toBe(0);
    expect(a.maxBricksUnSet).toBe(0);
  });

  it('sigue contando los bricks DADOS aunque el usuario no tenga sets propios', async () => {
    const { cliente, or } = buildSupabase();
    const a = await getAgregadosUsuario(cliente, 'u1', entrada({ sets: [], setIds: [] }));

    expect(or).toHaveBeenCalled();
    expect(a.bricksDados).toBe(7);
  });

  it('el máximo de un set nunca supera el total del usuario, aunque la columna divergiera', async () => {
    const { cliente } = buildSupabase({ bricksCount: 5 });
    const a = await getAgregadosUsuario(
      cliente,
      'u1',
      entrada({ sets: [{ bricks_recibidos: 900 }] })
    );
    expect(a.maxBricksUnSet).toBe(5);
  });

  it('un count nulo de PostgREST se trata como 0, no como NaN', async () => {
    const { cliente } = buildSupabase({ vitrinasCount: null, bricksCount: null, fotosCount: null, bricksDadosCount: null });
    const a = await getAgregadosUsuario(cliente, 'u1', entrada());

    expect(a.numVitrinasPublicadas).toBe(0);
    expect(a.bricksRecibidos).toBe(0);
    expect(a.numFotos).toBe(0);
    expect(a.bricksDados).toBe(0);
  });

  it('participaciones nulas no rompen el recuento de exposiciones', async () => {
    const { cliente } = buildSupabase({ participaciones: null });
    const a = await getAgregadosUsuario(cliente, 'u1', entrada());
    expect(a.exposicionesAprobadas).toBe(0);
  });
});
