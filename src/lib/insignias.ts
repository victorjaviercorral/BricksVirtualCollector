/**
 * Cálculo del ranking de una exposición al cerrarla (botón "Finalizar y Entregar Insignias" en
 * /admin/exposiciones). Hallazgo D3 del plan de intervención
 * (docs/05-plan/plan-intervencion-post-iteracion-3.md): esto era un TODO sin implementar
 * ("Aquí deberemos calcular y repartir las insignias", admin/exposiciones/page.tsx), y la causa
 * raíz de que /dashboard/insignias mostrara siempre datos simulados.
 *
 * Extraído como función pura (sin Supabase dentro) para poder probar el criterio de desempate y
 * los casos borde de forma exhaustiva, sin mockear la base de datos.
 */

export interface InsigniaOtorgada {
  set_id: string;
  rango: number;
  titulo_insignia: string;
}

/** Título visible según la posición. Solo el podio (1º-3º) tiene título propio; el resto de
 *  participantes aprobados reciben "Participante" -- coincide con el vocabulario que ya usaba
 *  el mock de ExhibitionPassport.tsx ("2º Puesto", "Participante") antes de esta implementación. */
export function tituloParaRango(rango: number): string {
  switch (rango) {
    case 1: return '🥇 1er Puesto';
    case 2: return '🥈 2º Puesto';
    case 3: return '🥉 3er Puesto';
    default: return 'Participante';
  }
}

/**
 * Calcula el ranking de una exposición a partir de los sets participantes aprobados y el
 * recuento de bricks que recibió cada uno dentro de esa exposición.
 *
 * Orden: más bricks primero. En empate, se conserva el orden de entrada de `setIds` (estable) --
 * es decir, a igualdad de bricks gana quien participó antes (orden de aprobación), un criterio
 * de desempate determinista y explicable, no aleatorio.
 *
 * @param setIds IDs de los sets con participación aprobada (exposicion_sets.estado='aprobado').
 * @param bricksPorSet Recuento de bricks recibidos por cada set_id dentro de la exposición
 *   (bricks_recibidos.exposicion_id = la exposición que se está cerrando). Un set sin entrada
 *   aquí se trata como 0 bricks.
 */
export function calcularRankingInsignias(
  setIds: string[],
  bricksPorSet: Record<string, number>
): InsigniaOtorgada[] {
  const conIndice = setIds.map((set_id, indiceOriginal) => ({ set_id, indiceOriginal }));

  conIndice.sort((a, b) => {
    const bricksB = bricksPorSet[b.set_id] || 0;
    const bricksA = bricksPorSet[a.set_id] || 0;
    if (bricksB !== bricksA) return bricksB - bricksA;
    return a.indiceOriginal - b.indiceOriginal; // desempate estable, no aleatorio
  });

  return conIndice.map(({ set_id }, i) => {
    const rango = i + 1;
    return { set_id, rango, titulo_insignia: tituloParaRango(rango) };
  });
}
