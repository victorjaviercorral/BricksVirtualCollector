import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AGREGADOS_VACIOS,
  bloquesMosaico,
  contarPodios,
  derivarDeSets,
  diasDesde,
  type AgregadosUsuario,
  type BloqueMosaico,
  type HitoCrudo,
  type SetParaAgregados,
} from "@/lib/insignias-usuario";
import { totalBricksGanados } from "@/lib/bounties";
import { contarBricksPorSet, posicionEnRankingVivo } from "@/lib/exposiciones";

/**
 * Capa de acceso a datos del sistema de insignias de usuario. Vive junto a
 * `src/lib/queries/vitrinas.ts` por el mismo motivo que aquella: agrupar en un sitio las
 * consultas que si no acabarían copiadas y divergiendo entre páginas (hallazgo E3/F2.9).
 *
 * Todo el cálculo está en `src/lib/insignias-usuario.ts` como funciones puras; aquí solo se
 * consulta y se ensambla.
 */

/** Fila de `sets_insignias` tal y como la pinta el Pasaporte. */
export interface InsigniaDeSet {
  id: string;
  exposicion_id: string | null;
  rango: number | null;
  titulo_insignia: string;
  fecha_otorgada: string | null;
  exposiciones_temporales: { titulo: string } | { titulo: string }[] | null;
}

/** Fila de `bounties_reclamados` tal y como la pinta la sección Recompensas. */
export interface ReclamoBounty {
  id: string;
  nombre_set: string | null;
  recompensa: number | null;
  creado_en: string | null;
  set_id: string | null;
  sets: { id: string; nombre: string } | { id: string; nombre: string }[] | null;
}

export interface DatosInsignias {
  setIds: string[];
  insigniasDeSets: InsigniaDeSet[];
  reclamos: ReclamoBounty[];
  agregados: AgregadosUsuario;
}

/**
 * Todo lo que necesita el sistema de insignias de un usuario, en un solo sitio.
 *
 * Lo consumen dos superficies: la página `/dashboard/insignias` (que además pinta el Pasaporte y
 * las Recompensas con estas mismas filas) y el Route Handler `/api/insignias/sync`. El handler
 * **recalcula** aquí en servidor en vez de fiarse de la lista que le mande el cliente; si cada
 * uno hiciera sus propias consultas acabarían divergiendo, que es justo el problema que esta
 * capa existe para evitar.
 */
export async function getDatosInsignias(
  supabase: SupabaseClient,
  userId: string,
  creadoEn: string | null | undefined
): Promise<DatosInsignias> {
  // Las columnas de `sets` son exactamente las que miran los agregados: una consulta alimenta el
  // recuento de sets, el total de piezas, las temáticas, el set más antiguo y el más votado.
  const { data: sets } = await supabase
    .from("sets")
    .select("id, num_piezas, tematica, anio_lanzamiento, bricks_recibidos")
    .eq("usuario_id", userId);
  const setIds = (sets || []).map((s) => s.id);

  const [insignias, reclamosRes] = await Promise.all([
    setIds.length > 0
      ? supabase
          .from("sets_insignias")
          .select("id, exposicion_id, rango, titulo_insignia, fecha_otorgada, exposiciones_temporales ( titulo )")
          .in("set_id", setIds)
          .order("fecha_otorgada", { ascending: false })
      : Promise.resolve({ data: [] as InsigniaDeSet[] }),
    supabase
      .from("bounties_reclamados")
      .select("id, nombre_set, recompensa, creado_en, set_id, sets ( id, nombre )")
      .eq("usuario_id", userId)
      .order("creado_en", { ascending: false }),
  ]);

  const insigniasDeSets = (insignias.data as InsigniaDeSet[] | null) || [];
  const reclamos = (reclamosRes.data as ReclamoBounty[] | null) || [];

  const agregados = await getAgregadosUsuario(supabase, userId, {
    sets,
    setIds,
    insigniasDeSets,
    reclamos,
    creadoEn,
  });

  return { setIds, insigniasDeSets, reclamos, agregados };
}

/** Filas que la página ya trae por otros motivos y que no hace falta volver a pedir. */
export interface EntradaAgregados {
  /** Sets del usuario, con las columnas que miran los agregados. */
  sets: SetParaAgregados[] | null | undefined;
  setIds: string[];
  /** Filas de `sets_insignias` de sus sets (las que pinta el Pasaporte). */
  insigniasDeSets: { rango?: number | null }[] | null | undefined;
  /** Filas de `bounties_reclamados` del usuario (las que pinta Recompensas). */
  reclamos: { recompensa?: number | null }[] | null | undefined;
  /** `usuarios_perfil.creado_en`, para la familia Veteranía. */
  creadoEn: string | null | undefined;
}

/**
 * Cuenta los bricks que ha DADO el usuario.
 *
 * `hash_visitante` guarda dos formatos legítimos, según por dónde se votó:
 *   - voto normal desde la ficha del set: el propio `user.id` (`api/bricks/route.ts`)
 *   - voto dentro de una exposición: `exposicion-<expoId>-user-<userId>`
 *     (`ExposicionClient.tsx`), compuesto a propósito para que la restricción
 *     `unique(set_id, hash_visitante)` no impida votar en una exposición un set al que ya se le
 *     dio un brick normal.
 *
 * Los hashes `bounty-<...>` quedan fuera y es correcto: son bricks de recompensa que inserta el
 * servidor, no un voto que haya dado nadie.
 */
async function contarBricksDados(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from("bricks_recibidos")
    .select("*", { count: "exact", head: true })
    .or(`hash_visitante.eq.${userId},hash_visitante.like.exposicion-*-user-${userId}`);
  return count || 0;
}

/**
 * Ensambla las métricas del usuario para el motor de insignias.
 *
 * Los totales que podrían crecer sin límite (`bricksRecibidos`, `numFotos`) se piden con
 * `count: 'exact', head: true` en vez de traerse las filas: PostgREST limita a 1.000 filas por
 * respuesta y un `.length` sobre esa página daría un total silenciosamente truncado.
 */
export async function getAgregadosUsuario(
  supabase: SupabaseClient,
  userId: string,
  entrada: EntradaAgregados
): Promise<AgregadosUsuario> {
  const deSets = derivarDeSets(entrada.sets);
  const podios = contarPodios(entrada.insigniasDeSets);
  const tieneSets = entrada.setIds.length > 0;

  const [vitrinas, bricksRecibidos, fotos, participaciones, bricksDados] = await Promise.all([
    supabase
      .from("vitrinas")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", userId)
      .eq("estado", "publicada")
      .eq("visibilidad", "pública"),
    tieneSets
      ? supabase.from("bricks_recibidos").select("*", { count: "exact", head: true }).in("set_id", entrada.setIds)
      : Promise.resolve({ count: 0 }),
    tieneSets
      ? supabase.from("fotos").select("*", { count: "exact", head: true }).in("set_id", entrada.setIds)
      : Promise.resolve({ count: 0 }),
    tieneSets
      ? supabase.from("exposicion_sets").select("exposicion_id").eq("estado", "aprobado").in("set_id", entrada.setIds)
      : Promise.resolve({ data: [] as { exposicion_id: string }[] }),
    contarBricksDados(supabase, userId),
  ]);

  const totalRecibidos = bricksRecibidos.count || 0;
  const exposiciones = new Set(
    ((participaciones.data as { exposicion_id: string }[] | null) || []).map((p) => p.exposicion_id)
  );

  return {
    ...AGREGADOS_VACIOS,
    ...deSets,
    ...podios,
    numVitrinasPublicadas: vitrinas.count || 0,
    bricksRecibidos: totalRecibidos,
    // Coherencia: el máximo de un set no puede superar el total del usuario. Sale de la columna
    // `sets.bricks_recibidos` (ver derivarDeSets), el total de contar filas; si por lo que fuera
    // divergieran, se muestra el dato conservador en vez de un número imposible.
    maxBricksUnSet: Math.min(deSets.maxBricksUnSet, totalRecibidos),
    numFotos: fotos.count || 0,
    exposicionesAprobadas: exposiciones.size,
    bricksDados,
    bountiesReclamados: (entrada.reclamos || []).length,
    bricksDeBounties: totalBricksGanados(entrada.reclamos),
    diasDesdeRegistro: diasDesde(entrada.creadoEn),
  };
}

/** Cuántos bloques del mural se pintan. El mosaico es un mural vivo, no un archivo histórico. */
export const MAX_BLOQUES_MOSAICO = 120;

/**
 * Los hitos más recientes de TODA la comunidad para el Mosaico Comunitario, más el total.
 *
 * La política de SELECT de `insignias_usuario` es pública desde la migración inicial ("Insignias
 * are viewable by everyone"), y ese es justo el diseño que hace posible el mural: los logros son
 * públicos, el resto de datos del usuario no se toca.
 */
export async function getMosaicoComunitario(
  supabase: SupabaseClient,
  miUsuarioId: string | null
): Promise<{ bloques: BloqueMosaico[]; total: number }> {
  const [recientes, totales] = await Promise.all([
    supabase
      .from("insignias_usuario")
      .select("id, insignia, otorgado_en, usuario_id, usuarios_perfil ( username, avatar_url )")
      .order("otorgado_en", { ascending: false })
      .limit(MAX_BLOQUES_MOSAICO),
    supabase.from("insignias_usuario").select("*", { count: "exact", head: true }),
  ]);

  return {
    bloques: bloquesMosaico((recientes.data as HitoCrudo[] | null) || [], miUsuarioId),
    total: totales.count || 0,
  };
}

/** Participación viva del usuario en una exposición activa. */
export interface ParticipacionActiva {
  id: string;
  estado: string;
  exposicion_id: string;
  set_id?: string | null;
  exposiciones_temporales?: {
    titulo?: string;
    estado?: string;
    imagen_url?: string | null;
    fecha_fin?: string | null;
    es_continua?: boolean | null;
  } | null;
  sets?: { id?: string; nombre?: string } | null;
}

export interface PosicionVivo {
  posicion: number;
  bricks: number;
  total: number;
}

/**
 * La actividad EN CURSO del usuario: sus participaciones en exposiciones ACTIVAS, con el puesto
 * en el ranking en vivo de cada una.
 *
 * Solo activas a propósito. El histórico de exposiciones cerradas vive en el Pasaporte
 * (`sets_insignias`), que es su fuente única desde H5; repintarlo aquí sería la duplicación que
 * aquella consolidación deshizo.
 *
 * Migrado desde `/dashboard/participaciones` al fusionar esa pantalla en "Mis Insignias".
 */
export async function getActividadEnCurso(
  supabase: SupabaseClient,
  setIds: string[]
): Promise<{ participaciones: ParticipacionActiva[]; posiciones: Record<string, PosicionVivo | null> }> {
  if (setIds.length === 0) return { participaciones: [], posiciones: {} };

  const { data: filas } = await supabase
    .from("exposicion_sets")
    .select(`
      id,
      estado,
      creado_en,
      exposicion_id,
      set_id,
      exposiciones_temporales ( id, titulo, estado, imagen_url, fecha_fin, es_continua ),
      sets ( id, nombre )
    `)
    .in("set_id", setIds);

  // Sin tipos generados de Supabase (bloqueado por A1, ver ADR-010) el cliente infiere las
  // relaciones foráneas como array salvo que se declaren explícitamente.
  type FilaCruda = {
    id: string;
    estado: string;
    exposicion_id: string;
    set_id: string | null;
    exposiciones_temporales: Record<string, unknown> | Record<string, unknown>[] | null;
    sets: Record<string, unknown> | Record<string, unknown>[] | null;
  };

  const participaciones: ParticipacionActiva[] = ((filas as FilaCruda[] | null) || [])
    .map((p) => {
      const expo = (Array.isArray(p.exposiciones_temporales) ? p.exposiciones_temporales[0] : p.exposiciones_temporales) as ParticipacionActiva["exposiciones_temporales"];
      const set = (Array.isArray(p.sets) ? p.sets[0] : p.sets) as ParticipacionActiva["sets"];
      return {
        id: p.id,
        estado: p.estado,
        exposicion_id: p.exposicion_id,
        set_id: p.set_id,
        exposiciones_temporales: expo || null,
        sets: set || null,
      };
    })
    .filter((p) => p.exposiciones_temporales?.estado === "activa");

  const idsActivas = Array.from(
    new Set(participaciones.filter((e) => e.estado === "aprobado").map((e) => e.exposicion_id))
  );

  let posiciones: Record<string, PosicionVivo | null> = {};
  if (idsActivas.length > 0) {
    const [{ data: aprobados }, { data: bricks }] = await Promise.all([
      supabase
        .from("exposicion_sets")
        .select("exposicion_id, set_id, creado_en")
        .eq("estado", "aprobado")
        .in("exposicion_id", idsActivas)
        .order("creado_en", { ascending: true }),
      supabase.from("bricks_recibidos").select("exposicion_id, set_id").in("exposicion_id", idsActivas),
    ]);

    posiciones = Object.fromEntries(
      participaciones
        .filter((e) => e.estado === "aprobado" && e.set_id)
        .map((e) => {
          const setsExpo = (aprobados || [])
            .filter((a: { exposicion_id: string }) => a.exposicion_id === e.exposicion_id)
            .map((a: { set_id: string }) => a.set_id);
          const bricksExpo = contarBricksPorSet(
            ((bricks as { exposicion_id: string; set_id: string }[] | null) || []).filter(
              (b) => b.exposicion_id === e.exposicion_id
            )
          );
          return [e.id, posicionEnRankingVivo(e.set_id as string, setsExpo, bricksExpo)];
        })
    );
  }

  return { participaciones, posiciones };
}
