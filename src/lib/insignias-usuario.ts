/**
 * Sistema de insignias de USUARIO (tabla `insignias_usuario`). No confundir con
 * `src/lib/insignias.ts`, que reparte el podio de una EXPOSICIÓN (tabla `sets_insignias`): son
 * dos conceptos distintos y cada fichero se llama como su tabla.
 *
 * Contexto: la decisión D3 (Iteración 4) retiró la "Vitrina de Insignias" porque mostraba 4
 * logros inventados de un supuesto total de 24, sin ninguna tabla ni criterio detrás. Este
 * fichero es el criterio que faltaba. **Cada insignia se calcula a partir de un dato que la
 * aplicación ya tiene**; ninguna depende de un campo que nadie escriba (por eso
 * `usuarios_perfil.total_visitas`, columna muerta que ningún fichero de `src/` actualiza, no
 * aparece aquí).
 *
 * Función pura, sin Supabase dentro: recibe los agregados ya calculados y devuelve las insignias
 * y el progreso. Mismo patrón que `insignias.ts`, `exposiciones.ts` y `galeria.ts` -- probable
 * de forma exhaustiva sin mockear la base de datos.
 */

/** Eje de juego al que pertenece una familia. Determina el color de la medalla: con 11 familias
 *  y 6 tokens de marca, el color agrupa por significado y el icono identifica la familia. */
export type EjeInsignia = "coleccion" | "comunidad" | "escaparate" | "competicion" | "rareza" | "podio";

export const COLOR_POR_EJE: Record<EjeInsignia, string> = {
  coleccion: "brand-red",
  comunidad: "brand-yellow",
  escaparate: "brand-blue",
  competicion: "brand-green",
  rareza: "brand-purple",
  podio: "brand-teal",
};

/** Métricas agregadas del usuario. Todas salen de una consulta concreta documentada en
 *  `docs/03-diseno/sistema-de-insignias.md`; el Server Component las construye y las pasa. */
export interface AgregadosUsuario {
  /** Suma de `sets.num_piezas` de todos mis sets. */
  piezasTotales: number;
  /** Cuántos de mis sets tienen `num_piezas` informado -- para no mentir con el total. */
  setsConPiezas: number;
  numSets: number;
  numVitrinasPublicadas: number;
  bricksRecibidos: number;
  maxBricksUnSet: number;
  bricksDados: number;
  numFotos: number;
  exposicionesAprobadas: number;
  oros: number;
  platas: number;
  bronces: number;
  bountiesReclamados: number;
  bricksDeBounties: number;
  tematicas: number;
  setAntiguo: boolean;
  diasDesdeRegistro: number;
}

export const AGREGADOS_VACIOS: AgregadosUsuario = {
  piezasTotales: 0,
  setsConPiezas: 0,
  numSets: 0,
  numVitrinasPublicadas: 0,
  bricksRecibidos: 0,
  maxBricksUnSet: 0,
  bricksDados: 0,
  numFotos: 0,
  exposicionesAprobadas: 0,
  oros: 0,
  platas: 0,
  bronces: 0,
  bountiesReclamados: 0,
  bricksDeBounties: 0,
  tematicas: 0,
  setAntiguo: false,
  diasDesdeRegistro: 0,
};

/** Clave de `AgregadosUsuario` que es numérica: las familias escalonadas miden una de estas. */
export type MetricaNumerica = {
  [K in keyof AgregadosUsuario]: AgregadosUsuario[K] extends number ? K : never;
}[keyof AgregadosUsuario];

export interface FamiliaInsignia {
  /** Prefijo de los slugs de la familia (`cantera` -> `cantera-1`, `cantera-2`...). */
  id: string;
  nombre: string;
  /** Qué mide, en lenguaje de usuario. Es lo que se muestra en "otras formas de ganar". */
  criterio: string;
  eje: EjeInsignia;
  /** Nombre del icono de lucide-react. Se guarda como string para que este módulo siga siendo
   *  puro (sin JSX); `BadgeMedal.tsx` lo mapea a componente. */
  icono: string;
  metrica: MetricaNumerica;
  /** Umbrales crecientes. El tramo N se desbloquea con `metrica >= tramos[N-1]`. */
  tramos: number[];
  /** Un nombre por tramo, misma longitud que `tramos`. */
  nombresTramo: string[];
  /** Unidad para el texto de progreso ("12.480 / 15.000 piezas"). */
  unidad: string;
}

export interface InsigniaUnica {
  id: string;
  nombre: string;
  criterio: string;
  eje: EjeInsignia;
  icono: string;
  /** Se evalúa sobre los agregados. Pura y determinista. */
  cumple: (a: AgregadosUsuario) => boolean;
}

/**
 * 11 familias escalonadas (40 niveles). Los umbrales son crecientes y el primer tramo es
 * deliberadamente alcanzable: una insignia que nadie desbloquea nunca no motiva a nadie.
 */
export const FAMILIAS: FamiliaInsignia[] = [
  {
    id: "cantera",
    nombre: "Cantera",
    criterio: "Suma de piezas de todos tus sets",
    eje: "coleccion",
    icono: "Blocks",
    metrica: "piezasTotales",
    tramos: [1000, 5000, 15000, 50000, 150000],
    nombresTramo: ["Puñado de Ladrillos", "Cubo Lleno", "Cantera Propia", "Almacén de Ladrillos", "Montaña de Plástico"],
    unidad: "piezas",
  },
  {
    id: "coleccionista",
    nombre: "Coleccionista",
    criterio: "Sets documentados en tus vitrinas",
    eje: "coleccion",
    icono: "Boxes",
    metrica: "numSets",
    tramos: [1, 5, 15, 40, 100],
    nombresTramo: ["Primera Pieza", "Estantería", "Colección", "Gran Colección", "Museo Personal"],
    unidad: "sets",
  },
  {
    id: "eclectico",
    nombre: "Ecléctico",
    criterio: "Temáticas distintas entre tus sets",
    eje: "coleccion",
    icono: "Palette",
    metrica: "tematicas",
    tramos: [3, 6, 12],
    nombresTramo: ["Curioso", "Ecléctico", "Sin Fronteras"],
    unidad: "temáticas",
  },
  {
    id: "aplauso",
    nombre: "Aplauso",
    criterio: "Bricks que ha recibido tu colección",
    eje: "comunidad",
    icono: "Heart",
    metrica: "bricksRecibidos",
    tramos: [1, 10, 50, 250, 1000],
    nombresTramo: ["Primer Aplauso", "Con Público", "Aclamado", "Ovación", "Fenómeno"],
    unidad: "bricks",
  },
  {
    id: "mecenas",
    nombre: "Mecenas",
    criterio: "Bricks que has dado a otros coleccionistas",
    eje: "comunidad",
    icono: "HandHeart",
    metrica: "bricksDados",
    tramos: [1, 10, 50, 200],
    nombresTramo: ["Buen Vecino", "Mano Generosa", "Mecenas", "Patrón de la Comunidad"],
    unidad: "bricks dados",
  },
  {
    id: "comisario",
    nombre: "Comisario",
    criterio: "Vitrinas publicadas y públicas",
    eje: "escaparate",
    icono: "Landmark",
    metrica: "numVitrinasPublicadas",
    tramos: [1, 3, 8],
    nombresTramo: ["Abre las Puertas", "Comisario", "Director de Museo"],
    unidad: "vitrinas públicas",
  },
  {
    id: "retratista",
    nombre: "Retratista",
    criterio: "Fotos subidas a tus sets",
    eje: "escaparate",
    icono: "Camera",
    metrica: "numFotos",
    tramos: [5, 25, 100],
    nombresTramo: ["Primer Carrete", "Fotógrafo de Sets", "Estudio Propio"],
    unidad: "fotos",
  },
  {
    id: "trotamundos",
    nombre: "Trotamundos",
    criterio: "Exposiciones distintas en las que te han aprobado un set",
    eje: "competicion",
    icono: "Plane",
    metrica: "exposicionesAprobadas",
    tramos: [1, 3, 10],
    nombresTramo: ["Debut", "Habitual del Circuito", "Trotamundos"],
    unidad: "exposiciones",
  },
  {
    id: "cazarrecompensas",
    nombre: "Cazarrecompensas",
    criterio: "Retos de la comunidad que has reclamado",
    eje: "competicion",
    icono: "Target",
    metrica: "bountiesReclamados",
    tramos: [1, 5, 15],
    nombresTramo: ["Primer Encargo", "Cazarrecompensas", "Cazador Legendario"],
    unidad: "retos",
  },
  {
    id: "botin",
    nombre: "Botín",
    criterio: "Bricks ganados como recompensa de retos",
    eje: "competicion",
    icono: "Coins",
    metrica: "bricksDeBounties",
    tramos: [1000, 5000, 20000],
    nombresTramo: ["Primer Botín", "Alijo", "Cámara del Tesoro"],
    unidad: "bricks de recompensa",
  },
  {
    id: "veterania",
    nombre: "Veteranía",
    criterio: "Tiempo desde que te uniste",
    eje: "rareza",
    icono: "Hourglass",
    metrica: "diasDesdeRegistro",
    tramos: [30, 180, 365],
    nombresTramo: ["Un Mes Aquí", "Medio Año de Vitrina", "Veterano"],
    unidad: "días",
  },
];

/** 6 insignias que no escalan: se tienen o no se tienen. */
export const UNICAS: InsigniaUnica[] = [
  {
    id: "oro",
    nombre: "Oro",
    criterio: "Quedar 1º en una exposición",
    eje: "podio",
    icono: "Trophy",
    cumple: (a) => a.oros >= 1,
  },
  {
    id: "plata",
    nombre: "Plata",
    criterio: "Quedar 2º en una exposición",
    eje: "podio",
    icono: "Medal",
    cumple: (a) => a.platas >= 1,
  },
  {
    id: "bronce",
    nombre: "Bronce",
    criterio: "Quedar 3º en una exposición",
    eje: "podio",
    icono: "Award",
    cumple: (a) => a.bronces >= 1,
  },
  {
    id: "triple-corona",
    nombre: "Triple Corona",
    criterio: "Tener oro, plata y bronce",
    eje: "podio",
    icono: "Crown",
    cumple: (a) => a.oros >= 1 && a.platas >= 1 && a.bronces >= 1,
  },
  {
    id: "pieza-estrella",
    nombre: "Pieza Estrella",
    criterio: "Un solo set con 25 bricks o más",
    eje: "rareza",
    icono: "Flame",
    cumple: (a) => a.maxBricksUnSet >= 25,
  },
  {
    id: "arqueologo",
    nombre: "Arqueólogo",
    criterio: "Documentar un set anterior al año 2000",
    eje: "rareza",
    icono: "Pickaxe",
    cumple: (a) => a.setAntiguo,
  },
];

export interface InsigniaEvaluada {
  /** Slug estable, el que se guarda en `insignias_usuario.insignia`. NUNCA se renombra: es la
   *  clave de `unique(usuario_id, insignia)`. */
  id: string;
  nombre: string;
  familia: string;
  criterio: string;
  eje: EjeInsignia;
  icono: string;
  /** 1..5 en las escalonadas; null en las únicas (no llevan aro de tramo). */
  tramo: number | null;
  desbloqueada: boolean;
  /** Progreso hacia esta insignia. null en las únicas: no hay medio camino. */
  progreso: { valor: number; objetivo: number; unidad: string } | null;
}

export interface ResultadoInsignias {
  desbloqueadas: InsigniaEvaluada[];
  /** El siguiente tramo pendiente de las familias en las que ya hay avance, de más cerca a más
   *  lejos. Es lo que se pinta con barra de progreso. */
  proximosObjetivos: InsigniaEvaluada[];
  /** El resto de lo pendiente, para listar como texto plegable en vez de un muro de casillas
   *  grises (que es justo lo que retiró D3). */
  otrasFamilias: InsigniaEvaluada[];
}

/** Cuántas tarjetas de "tu próximo objetivo" se muestran con barra. */
export const MAX_PROXIMOS_OBJETIVOS = 6;

export function slugTramo(familiaId: string, tramo: number): string {
  return `${familiaId}-${tramo}`;
}

function evaluarFamilia(familia: FamiliaInsignia, valor: number): InsigniaEvaluada[] {
  return familia.tramos.map((objetivo, i) => ({
    id: slugTramo(familia.id, i + 1),
    nombre: familia.nombresTramo[i],
    familia: familia.nombre,
    criterio: familia.criterio,
    eje: familia.eje,
    icono: familia.icono,
    tramo: i + 1,
    desbloqueada: valor >= objetivo,
    progreso: { valor, objetivo, unidad: familia.unidad },
  }));
}

function evaluarUnica(unica: InsigniaUnica, agregados: AgregadosUsuario): InsigniaEvaluada {
  return {
    id: unica.id,
    nombre: unica.nombre,
    familia: unica.nombre,
    criterio: unica.criterio,
    eje: unica.eje,
    icono: unica.icono,
    tramo: null,
    desbloqueada: unica.cumple(agregados),
    progreso: null,
  };
}

/** Fracción 0..1 de avance hacia el objetivo. Sin progreso -> 0. */
export function fraccionProgreso(insignia: InsigniaEvaluada): number {
  if (!insignia.progreso || insignia.progreso.objetivo <= 0) return 0;
  return Math.min(1, insignia.progreso.valor / insignia.progreso.objetivo);
}

/**
 * Evalúa las 46 insignias del catálogo contra los agregados del usuario y reparte lo pendiente
 * en dos cajones: los objetivos cercanos (con barra) y el resto (lista de texto).
 *
 * Criterio del reparto: una familia entra en `proximosObjetivos` si ya hay algún avance real
 * (`valor > 0`). Enseñar "0 / 100 fotos" con una barra vacía no motiva, informa; por eso esas
 * familias van a `otrasFamilias` como una línea de texto con su criterio. Las únicas pendientes
 * van siempre a `otrasFamilias`: no tienen medio camino que pintar.
 */
export function evaluarInsignias(agregados: AgregadosUsuario): ResultadoInsignias {
  const desbloqueadas: InsigniaEvaluada[] = [];
  const candidatasConAvance: InsigniaEvaluada[] = [];
  const otrasFamilias: InsigniaEvaluada[] = [];

  FAMILIAS.forEach((familia) => {
    const valor = agregados[familia.metrica];
    const niveles = evaluarFamilia(familia, valor);

    niveles.filter((n) => n.desbloqueada).forEach((n) => desbloqueadas.push(n));

    // Solo el PRIMER tramo pendiente de cada familia: los siguientes se descubren al llegar.
    const siguiente = niveles.find((n) => !n.desbloqueada);
    if (!siguiente) return; // familia completa
    if (valor > 0) candidatasConAvance.push(siguiente);
    else otrasFamilias.push(siguiente);
  });

  UNICAS.forEach((unica) => {
    const evaluada = evaluarUnica(unica, agregados);
    if (evaluada.desbloqueada) desbloqueadas.push(evaluada);
    else otrasFamilias.push(evaluada);
  });

  candidatasConAvance.sort((a, b) => fraccionProgreso(b) - fraccionProgreso(a));

  return {
    desbloqueadas,
    proximosObjetivos: candidatasConAvance.slice(0, MAX_PROXIMOS_OBJETIVOS),
    otrasFamilias: [...candidatasConAvance.slice(MAX_PROXIMOS_OBJETIVOS), ...otrasFamilias],
  };
}

/** Los slugs desbloqueados, para el upsert idempotente en `insignias_usuario`. */
export function slugsDesbloqueados(agregados: AgregadosUsuario): string[] {
  return evaluarInsignias(agregados).desbloqueadas.map((i) => i.id);
}

export interface EntradaCatalogo {
  nombre: string;
  familia: string;
  eje: EjeInsignia;
  icono: string;
  tramo: number | null;
}

/** Índice slug -> definición, para poder pintar el Mosaico Comunitario a partir de las filas de
 *  `insignias_usuario` (que solo guardan el slug) sin recalcular nada. */
export const CATALOGO_POR_SLUG: Record<string, EntradaCatalogo> = (() => {
  const mapa: Record<string, EntradaCatalogo> = {};
  FAMILIAS.forEach((f) => {
    f.tramos.forEach((_, i) => {
      mapa[slugTramo(f.id, i + 1)] = {
        nombre: f.nombresTramo[i],
        familia: f.nombre,
        eje: f.eje,
        icono: f.icono,
        tramo: i + 1,
      };
    });
  });
  UNICAS.forEach((u) => {
    mapa[u.id] = { nombre: u.nombre, familia: u.nombre, eje: u.eje, icono: u.icono, tramo: null };
  });
  return mapa;
})();

/** Total de insignias del catálogo. Se usa para el "N de M" de la cabecera. */
export const TOTAL_INSIGNIAS = Object.keys(CATALOGO_POR_SLUG).length;

/**
 * Aviso honesto cuando el total de piezas se queda corto porque hay sets sin `num_piezas`.
 * Devuelve null si no aplica. Sin esto, la familia Cantera fingiría que el total es completo.
 */
export function avisoPiezasIncompletas(a: AgregadosUsuario): string | null {
  const sinDato = a.numSets - a.setsConPiezas;
  if (sinDato <= 0) return null;
  return `${sinDato} ${sinDato === 1 ? "set no tiene" : "sets no tienen"} el nº de piezas informado — este total se queda corto.`;
}

// ------------------------------------------------------------------------------------------
// Derivación de agregados a partir de filas crudas. Se mantiene aquí, puro, para que la capa de
// acceso a datos (src/lib/queries/insignias-usuario.ts) solo tenga que hacer las consultas.
// ------------------------------------------------------------------------------------------

/** Un set anterior a este año cuenta como pieza de coleccionista para la insignia Arqueólogo. */
export const ANIO_VINTAGE = 2000;

/** Forma mínima de un set para los agregados. Son columnas reales de `public.sets`. */
export interface SetParaAgregados {
  num_piezas?: number | null;
  tematica?: string | null;
  anio_lanzamiento?: number | null;
  bricks_recibidos?: number | null;
}

export type AgregadosDeSets = Pick<
  AgregadosUsuario,
  "numSets" | "piezasTotales" | "setsConPiezas" | "tematicas" | "setAntiguo" | "maxBricksUnSet"
>;

/**
 * Agregados que salen de los sets del usuario, en una sola pasada.
 *
 * Sobre `maxBricksUnSet`: usa la columna `sets.bricks_recibidos` que mantiene el trigger
 * `increment_bricks`, no un recuento de filas. **Por set** esa columna no puede desviarse (no
 * existe ningún camino de borrado de bricks en la aplicación, y borrar un set se lleva sus filas
 * por cascada junto con el propio contador). Lo que sí se desvía es
 * `usuarios_perfil.total_bricks_recibidos`, que sobrevive al borrado de un set y por eso NO se
 * usa en ningún sitio: el total del usuario se cuenta siempre desde `bricks_recibidos`.
 */
export function derivarDeSets(sets: SetParaAgregados[] | null | undefined): AgregadosDeSets {
  const filas = sets || [];
  const tematicas = new Set<string>();
  let piezasTotales = 0;
  let setsConPiezas = 0;
  let setAntiguo = false;
  let maxBricksUnSet = 0;

  filas.forEach((s) => {
    if (typeof s.num_piezas === "number" && Number.isFinite(s.num_piezas)) {
      piezasTotales += s.num_piezas;
      setsConPiezas += 1;
    }
    const tema = (s.tematica || "").trim();
    if (tema) tematicas.add(tema.toLocaleLowerCase("es-ES"));
    if (typeof s.anio_lanzamiento === "number" && s.anio_lanzamiento < ANIO_VINTAGE) setAntiguo = true;
    if (typeof s.bricks_recibidos === "number" && s.bricks_recibidos > maxBricksUnSet) {
      maxBricksUnSet = s.bricks_recibidos;
    }
  });

  return {
    numSets: filas.length,
    piezasTotales,
    setsConPiezas,
    tematicas: tematicas.size,
    setAntiguo,
    maxBricksUnSet,
  };
}

/** Reparte las filas de `sets_insignias` del usuario por metal. Rangos > 3 no son podio. */
export function contarPodios(
  insignias: { rango?: number | null }[] | null | undefined
): Pick<AgregadosUsuario, "oros" | "platas" | "bronces"> {
  const conteo = { oros: 0, platas: 0, bronces: 0 };
  (insignias || []).forEach((i) => {
    if (i.rango === 1) conteo.oros += 1;
    else if (i.rango === 2) conteo.platas += 1;
    else if (i.rango === 3) conteo.bronces += 1;
  });
  return conteo;
}

/** Días completos transcurridos desde una fecha ISO. Fecha ausente o futura -> 0. */
export function diasDesde(iso: string | null | undefined, ahora: Date = new Date()): number {
  if (!iso) return 0;
  const desde = new Date(iso).getTime();
  if (Number.isNaN(desde)) return 0;
  const dias = Math.floor((ahora.getTime() - desde) / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
}
