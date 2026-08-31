// Definición declarativa del tour de onboarding.
//
// El tour es EXPLICATIVO, no interactivo: narra los flujos clave resaltando elementos reales de
// la interfaz mientras navega entre rutas. No dispara ninguna escritura, por lo que funciona
// también en el entorno de demostración de solo lectura (ADR-009).
//
// Cada paso apunta a un elemento vía atributo `data-tour="<id>"`. Si ese elemento no existe en
// el DOM (p. ej. una cuenta sin vitrinas todavía), el overlay degrada a un tooltip centrado con
// el mismo texto — nunca se rompe el recorrido.

export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";

export interface TourStep {
  /** Identificador estable del paso (para tests y analítica). */
  id: string;
  /** Ruta en la que vive el elemento objetivo. El provider hace `router.push` si hace falta. */
  route: string;
  /** Selector del objetivo. `null` => tooltip centrado sin spotlight (paso puramente narrativo). */
  target: string | null;
  /** Título corto (font-display). */
  title: string;
  /** Cuerpo: 1-2 frases. */
  body: string;
  /** Slug de `/como-funciona/<slug>` para el enlace "Saber más". Opcional. */
  masSlug?: string;
  /** Colocación preferida del tooltip respecto al objetivo. */
  placement?: TourPlacement;
}

export const TOUR_STORAGE_KEY = "bvc_tour_v1";

export const TOUR_STEPS: TourStep[] = [
  {
    id: "bienvenida",
    route: "/dashboard",
    target: '[data-tour="hub-hero"]',
    title: "Bienvenido a tu museo",
    body: "Aquí exhibes tu colección de LEGO® y descubres la de otros coleccionistas. Te enseño los pasos clave en menos de un minuto.",
    masSlug: "que-es-y-que-no",
    placement: "bottom",
  },
  {
    id: "mis-vitrinas",
    route: "/dashboard",
    target: '[data-tour="mis-vitrinas"]',
    title: "1 · Todo empieza con una vitrina",
    body: "Una vitrina es la estantería donde agrupas tus sets, por temática, época o como quieras. Es lo primero que se crea.",
    masSlug: "crea-vitrina",
    placement: "auto",
  },
  {
    id: "crear-vitrina",
    route: "/dashboard/vitrinas",
    target: '[data-tour="crear-vitrina"]',
    title: "2 · Crea la vitrina",
    body: "Le pones nombre y eliges su visibilidad: pública (aparece en el museo), privada (solo tú) o accesible solo con enlace.",
    masSlug: "crea-vitrina",
    placement: "bottom",
  },
  {
    id: "mesa-foto",
    route: "/mesa-de-trabajo",
    target: '[data-tour="mesa-foto"]',
    title: "3 · La Mesa de Trabajo",
    body: "Aquí subes la foto de tu set. Los metadatos EXIF y de localización se eliminan en el servidor antes de guardarla.",
    masSlug: "sube-fotos",
    placement: "right",
  },
  {
    id: "mesa-guardar",
    route: "/mesa-de-trabajo",
    target: '[data-tour="mesa-guardar"]',
    title: "3 · Guarda el set",
    body: "Añades nombre, número de piezas y temática, y guardas. El set queda colocado en la vitrina que elijas.",
    masSlug: "sube-fotos",
    placement: "top",
  },
  {
    id: "publicar",
    route: "/dashboard/vitrinas",
    target: '[data-tour="vitrina-visibilidad"]',
    title: "4 · Publica cuando quieras",
    body: "Cada vitrina lleva una etiqueta con su visibilidad. Ponla en pública y tu colección aparece en el museo para toda la comunidad.",
    masSlug: "visibilidad",
    placement: "auto",
  },
  {
    id: "eventos-bounties",
    route: "/dashboard",
    target: '[data-tour="hub-bento"]',
    title: "5 · Exposiciones y Bounties",
    body: "La comunidad organiza exposiciones temáticas y publica «bounties»: sets que faltan por documentar. Participar da insignias y bricks. Ahora explora las vitrinas públicas y disfruta.",
    masSlug: "explora",
    placement: "top",
  },
];
