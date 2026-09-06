/**
 * Lógica pura de exposiciones, extraída para poder probarla de forma exhaustiva sin mockear
 * Supabase (mismo patrón que src/lib/insignias.ts).
 *
 * Contexto (H5, docs/05-plan/plan-intervencion-post-iteracion-3.md): la información de
 * exposiciones y sus resultados vivía dispersa. /exposicion/[id] recalculaba el ranking en vivo
 * también para exposiciones ya archivadas; ahora que archivar bloquea votar/participar
 * (migración 20260819110000, verificada en pg_policies) el registro oficial de una exposición
 * cerrada es lo que quedó en sets_insignias al repartir las insignias -- inmutable, no un
 * recálculo que pudiera divergir.
 */

import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Foto de reserva cuando un set participante no tiene ninguna foto asociada. Igual que la que
 *  usaba src/app/exposicion/[id]/page.tsx antes de esta extracción. */
export const FOTO_SET_RESERVA =
  "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1000&auto=format&fit=crop";

/** Forma mínima de un set tal como llega anidado en las consultas de participación. PostgREST
 *  infiere las relaciones como objeto o como array según la config del join y de si hay tipos
 *  generados (bloqueado por A1, ver ADR-010); se normalizan las dos formas. */
export interface SetAnidado {
  id: string;
  nombre: string;
  num_piezas?: number | null;
  usuarios_perfil?: { username?: string | null } | { username?: string | null }[] | null;
  fotos?: { url: string }[] | null;
}

export interface FilaRanking {
  id: string;
  nombre: string;
  num_piezas: number | null;
  usuarios_perfil: { username?: string | null } | null;
  foto_url: string;
  votos: number;
}

export interface FilaRankingOficial extends FilaRanking {
  rango: number | null;
  titulo_insignia: string;
}

export type MotivoHistoricoVacio = "sin-participantes" | "anterior-al-registro" | null;

function primero<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

function normalizarSet(set: SetAnidado | SetAnidado[] | null | undefined): SetAnidado | null {
  return primero(set);
}

function filaBase(set: SetAnidado, votos: number): FilaRanking {
  return {
    id: set.id,
    nombre: set.nombre,
    num_piezas: set.num_piezas ?? null,
    usuarios_perfil: primero(set.usuarios_perfil),
    foto_url: set.fotos?.[0]?.url || FOTO_SET_RESERVA,
    votos,
  };
}

/** Cuenta cuántos bricks recibió cada set dentro de una exposición. */
export function contarBricksPorSet(bricks: { set_id: string }[] | null | undefined): Record<string, number> {
  const conteo: Record<string, number> = {};
  (bricks || []).forEach((b) => {
    conteo[b.set_id] = (conteo[b.set_id] || 0) + 1;
  });
  return conteo;
}

/**
 * Ranking en vivo de una exposición ACTIVA: participaciones aprobadas ordenadas por bricks
 * recibidos (desc). En empate se conserva el orden de entrada (estable) -- mismo criterio de
 * desempate que calcularRankingInsignias en src/lib/insignias.ts.
 */
export function rankingEnVivo(
  participaciones: { set_id: string; sets: SetAnidado | SetAnidado[] | null }[] | null | undefined,
  bricks: { set_id: string }[] | null | undefined
): FilaRanking[] {
  const porSet = contarBricksPorSet(bricks);
  return (participaciones || [])
    .map((p) => {
      const set = normalizarSet(p.sets);
      if (!set) return null;
      return filaBase(set, porSet[p.set_id] || 0);
    })
    .filter((f): f is FilaRanking => f !== null)
    .sort((a, b) => b.votos - a.votos);
}

/**
 * Ranking OFICIAL de una exposición archivada: lo que quedó registrado en sets_insignias al
 * cerrarla (rango + titulo_insignia, inmutable). El recuento de bricks se adjunta solo como
 * dato histórico -- ya está congelado (no se puede votar tras archivar) y no reordena nada:
 * el orden lo manda `rango`.
 */
export function rankingOficial(
  insignias:
    | { set_id: string; rango: number | null; titulo_insignia: string; sets: SetAnidado | SetAnidado[] | null }[]
    | null
    | undefined,
  bricksPorSet: Record<string, number>
): FilaRankingOficial[] {
  return (insignias || [])
    .map((i) => {
      const set = normalizarSet(i.sets);
      if (!set) return null;
      return {
        ...filaBase(set, bricksPorSet[i.set_id] || 0),
        rango: i.rango,
        titulo_insignia: i.titulo_insignia,
      };
    })
    .filter((f): f is FilaRankingOficial => f !== null)
    .sort((a, b) => {
      // rango null (no debería pasar) al final; a igualdad, orden estable de entrada.
      const ra = a.rango ?? Number.MAX_SAFE_INTEGER;
      const rb = b.rango ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
}

/**
 * Por qué una exposición archivada no tiene ranking oficial que mostrar:
 * - 'sin-participantes': se cerró sin ninguna participación aprobada.
 * - 'anterior-al-registro': tuvo participantes pero se archivó antes de que existiera el
 *   reparto real de insignias (D3, ~10/08/2026) -- no hay fila en sets_insignias y ya no se
 *   puede reconstruir de forma fiable.
 * - null: sí hay ranking oficial.
 */
export function motivoHistoricoVacio(numInsignias: number, numAprobados: number): MotivoHistoricoVacio {
  if (numInsignias > 0) return null;
  if (numAprobados > 0) return "anterior-al-registro";
  return "sin-participantes";
}

export interface ResumenExposicion {
  participantes: number;
  bricks: number;
}

/**
 * Resumen inline para /admin/exposiciones: nº de participantes aprobados y total de bricks por
 * exposición, sin tener que entrar en cada una. Toma las filas crudas de dos consultas
 * agregadas (una a exposicion_sets, otra a bricks_recibidos) y las reduce por exposicion_id.
 */
export function resumenExposiciones(
  exposiciones: { id: string }[] | null | undefined,
  aprobados: { exposicion_id: string }[] | null | undefined,
  bricks: { exposicion_id: string }[] | null | undefined
): Map<string, ResumenExposicion> {
  const mapa = new Map<string, ResumenExposicion>();
  (exposiciones || []).forEach((e) => mapa.set(e.id, { participantes: 0, bricks: 0 }));

  (aprobados || []).forEach((a) => {
    const actual = mapa.get(a.exposicion_id) || { participantes: 0, bricks: 0 };
    actual.participantes += 1;
    mapa.set(a.exposicion_id, actual);
  });
  (bricks || []).forEach((b) => {
    const actual = mapa.get(b.exposicion_id) || { participantes: 0, bricks: 0 };
    actual.bricks += 1;
    mapa.set(b.exposicion_id, actual);
  });

  return mapa;
}

/**
 * Posición (1-indexada) de un set dentro del ranking en vivo de su exposición activa, más su
 * recuento de bricks y el total de participantes aprobados. Para el panel "Mis Participaciones":
 * el usuario ve dónde va su set sin salir de la página. Mismo criterio de orden que
 * rankingEnVivo (más bricks primero; empate -> orden de aprobación).
 *
 * @param miSetId El set del usuario en esa exposición.
 * @param setsAprobados set_ids aprobados en ESA exposición, en orden de aprobación (creado_en asc).
 * @param bricksPorSet recuento de bricks por set dentro de esa exposición.
 */
export function posicionEnRankingVivo(
  miSetId: string,
  setsAprobados: string[],
  bricksPorSet: Record<string, number>
): { posicion: number; bricks: number; total: number } | null {
  const indiceOriginal = setsAprobados.indexOf(miSetId);
  if (indiceOriginal === -1) return null;

  const ordenados = setsAprobados
    .map((set_id, i) => ({ set_id, i }))
    .sort((a, b) => {
      const d = (bricksPorSet[b.set_id] || 0) - (bricksPorSet[a.set_id] || 0);
      return d !== 0 ? d : a.i - b.i;
    });

  return {
    posicion: ordenados.findIndex((o) => o.set_id === miSetId) + 1,
    bricks: bricksPorSet[miSetId] || 0,
    total: setsAprobados.length,
  };
}

/**
 * Texto legible del rango de fechas de una exposición. Corrige el "1/1/1970 - 1/1/1970" que
 * mostraba /admin/exposiciones cuando fecha_inicio/fecha_fin eran null (new Date(null) -> epoch).
 */
export function rangoFechasExposicion(expo: {
  es_continua?: boolean | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}): string {
  if (expo.es_continua) return "Exposición continua";
  if (!expo.fecha_inicio || !expo.fecha_fin) return "Fechas por definir";
  const fmt = (iso: string) => format(new Date(iso), "d MMM yyyy", { locale: es });
  return `${fmt(expo.fecha_inicio)} – ${fmt(expo.fecha_fin)}`;
}
