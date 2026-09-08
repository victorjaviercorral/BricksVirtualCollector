/**
 * Fuente única de verdad de la recompensa de un bounty.
 *
 * Antes de este fichero, `MAX_REWARD_BRICKS = 1000` vivía dentro de
 * `src/app/api/bounties/claim/route.ts` y nadie más lo conocía: `/admin/bounties` creaba retos
 * con recompensa por defecto **5.000**, la tarjeta anunciaba "+5.000 pts" y al reclamar se
 * concedían `min(recompensa, 1000)` bricks. El usuario veía una promesa y recibía otra cosa,
 * sin aviso. `bounties_reclamados.recompensa` sí guardaba el valor real concedido, así que el
 * registro nunca mintió -- quien mentía era la tarjeta.
 *
 * Ahora el tope está en un solo sitio y lo consultan los cuatro puntos: la API que concede, el
 * formulario de admin que crea (valida contra él), la tarjeta que anuncia y la sección de
 * Recompensas que resume.
 *
 * Vocabulario: la recompensa se concede en **Bricks** -- filas reales de `bricks_recibidos`
 * insertadas sobre el set con el que se reclama. No existe ninguna moneda de "puntos" en el
 * esquema, así que la interfaz no la nombra.
 */

/**
 * Tope de bricks que se conceden por un reclamo. Es un límite defensivo real: cada brick es una
 * fila en `bricks_recibidos`, y esas filas cuentan en el ranking de exposiciones y en el
 * contador de bricks del set.
 */
export const MAX_REWARD_BRICKS = 1000;

/** Recompensa por defecto de un bounty nuevo cuando no se indica ninguna. */
export const RECOMPENSA_POR_DEFECTO = 1000;

/**
 * Los Bricks que de verdad se van a conceder por un bounty. Es lo que debe anunciarse en la
 * tarjeta, no el valor crudo de `bounties.recompensa`: los bounties creados antes de que el
 * formulario de admin validara el tope pueden tener valores por encima.
 */
export function recompensaEfectiva(recompensa: number | null | undefined): number {
  const valor = recompensa ?? RECOMPENSA_POR_DEFECTO;
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return Math.min(Math.floor(valor), MAX_REWARD_BRICKS);
}

/** Suma de Bricks ganados en retos. Los reclamos ya guardan el valor concedido (capado). */
export function totalBricksGanados(reclamos: { recompensa?: number | null }[] | null | undefined): number {
  return (reclamos || []).reduce((acc, r) => acc + (r.recompensa || 0), 0);
}
