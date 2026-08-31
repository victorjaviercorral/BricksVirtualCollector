---
proyecto: lego-virtual-museum
tipo: diseno
estado: implementado
version: 1
fecha: 2026-09-01
tags: [spec-vjc, diseno, onboarding, accesibilidad]
relacionado_con: [design-identity, ADR-009-entorno-demo-publico, plan-intervencion-post-iteracion-3]
---

# Tour / Onboarding interactivo

Recorrido guiado que **se superpone a la interfaz real** de la app y explica los flujos clave a
un visitante nuevo. No sustituye a `/como-funciona` (documentación estática en Markdown servida
desde `docs/09-guia-usuario/`): cada paso del tour enlaza a la sección correspondiente de esa
guía con un enlace "Saber más".

## Decisiones (confirmadas con el titular)

| Tema | Decisión | Motivo |
|---|---|---|
| **Disparo** | Auto-inicio la 1ª vez que un usuario autenticado entra al Hub (`/dashboard`) + botón **"Ver Tour"** para repetirlo (cabecera del Hub y menú de perfil de la Navbar, desktop y móvil). | Un visitante que no ve el tour no descubre el potencial de la app; el botón cubre la repetición sin fricción. |
| **Persistencia del "ya visto"** | Flag `bvc_tour_v1` en `localStorage` (con `try/catch`: tolera almacenamiento bloqueado). | **ADR-009**: en la demo pública la cuenta es **compartida y de solo lectura**. Una fila en `usuarios_perfil` la marcaría "visto" para todos tras el primer visitante. `localStorage` es por navegador. Sin migración. |
| **Mecanismo** | **Tour guiado multi-ruta**: el provider hace `router.push` a la ruta de cada paso y el overlay ancla un *spotlight* al elemento real (`data-tour="…"`). Rutas tocadas: `/dashboard`, `/dashboard/vitrinas`, `/mesa-de-trabajo`. | Los 5 flujos viven en pantallas distintas; enseñarlos "en su sitio" es más claro que un carrusel de capturas. Si un objetivo no aparece en ~2,5 s → degradación limpia a tooltip centrado. |
| **Naturaleza** | **Explicativo** (narración + resaltado). Sin acciones de escritura. El último paso remata con "ahora explora las vitrinas públicas" (acción de solo lectura). | **ADR-009**: en la demo `insert/update/delete` están revocados a nivel de *grant*. Un tour "hazlo tú" sería inservible ahí. |
| **`prefers-reduced-motion`** | Manejo **local** en el overlay con `useReducedMotion()`: atenúa (crossfades, sin grandes desplazamientos ni *spring*/*bounce*, duraciones ~0,12–0,15 s). **No elimina el movimiento.** | Coherente con `design-identity.md` ("`prefers-reduced-motion` respetado atenuando en vez de eliminar"). **No** aborda E2/F3.7 (soporte global vía `MotionConfig`), que sigue diferida en [[05-plan/plan-intervencion-post-iteracion-3]]. |
| **Librería** | Ninguna nueva. Framer Motion (`framer-motion ^13`, ya dependencia) + `AnimatePresence` + `useReducedMotion` + `createPortal`. | Zero-duplication; alinea con E5 (reducir bundle). |

## Arquitectura

Todo en `src/components/tour/`:

| Fichero | Responsabilidad |
|---|---|
| `steps.ts` | Definición declarativa (`TourStep[]`) y `TOUR_STORAGE_KEY`. Fuente única de la verdad del recorrido. |
| `TourProvider.tsx` | Contexto React + máquina de estado (`isActive`, `stepIndex`, `start/next/prev/close`). Lee/escribe la flag. Auto-inicio (diferido un tick). Navegación entre rutas (`router.push` cuando `step.route !== pathname`). Se monta en `src/app/layout.tsx` **dentro de `ThemeProvider`, envolviendo `Navbar + main + Footer`**, con `isAuthed={!!user}`. |
| `TourOverlay.tsx` | Capa `fixed z-[60]` vía portal a `document.body`. Spotlight (sombra gigante con hueco sobre el `getBoundingClientRect` del objetivo), tooltip neo-brutal, backdrop que bloquea la interacción, `Esc`/flechas, bloqueo de scroll del `body`, `aria-live`, sondeo del objetivo con timeout. |
| `geometry.ts` | Funciones **puras** `resolvePlacement` y `computeTooltipPosition` (colocación del tooltip, recorte al viewport, modo móvil). Aisladas para poder probar todas las ramas sin DOM. |
| `TourLauncher.tsx` | Botón "Ver Tour" en dos variantes (`button` neo-brutal para cabeceras, `menu-item` para el desplegable de la Navbar). |

### Recorrido (7 pasos)

| # | Ruta | Ancla `data-tour` | Idea |
|---|---|---|---|
| 1 | `/dashboard` | `hub-hero` | Bienvenida / qué es el museo. |
| 2 | `/dashboard` | `mis-vitrinas` | Una vitrina agrupa tus sets: es lo primero. |
| 3 | `/dashboard/vitrinas` | `crear-vitrina` | Crear vitrina + elegir visibilidad. |
| 4 | `/mesa-de-trabajo` | `mesa-foto` | Mesa de Trabajo: subir foto, EXIF se elimina en servidor. |
| 5 | `/mesa-de-trabajo` | `mesa-guardar` | Rellenar datos y guardar. |
| 6 | `/dashboard/vitrinas` | `vitrina-visibilidad` (con fallback si no hay vitrinas) | Publicar = visibilidad pública. |
| 7 | `/dashboard` | `hub-bento` | Exposiciones y Bounties; CTA final: explorar vitrinas públicas. |

Anclas añadidas (solo atributos `data-tour`, sin cambios de estilo) en `HubClient.tsx`,
`MisVitrinasClient.tsx` y `MesaTrabajoClient.tsx`.

## Estilo visual

Tooltip = receta neo-brutal de la landing (`src/app/page.tsx`):
`bg-panel border-2 border-foreground rounded-2xl shadow-[4px_4px_0px_0px_#0F172A]
dark:shadow-[4px_4px_0px_0px_#F8F9FA]`. Título en `font-display`, contador "Paso N / 7" en
`font-mono`. Spotlight con `outline: 2px solid var(--foreground)`.

## Pruebas

`src/components/tour/*.test.{ts,tsx}` — 44 tests. Cubren: definición de pasos; auto-inicio
condicionado (flag / ruta / `isAuthed`) y persistencia; `localStorage` inaccesible; navegación
entre rutas; `TourOverlay` (render de paso, next/prev, `Esc`, "Saltar tour", último paso =
"Terminar", `aria-live`, medición del objetivo, fallback centrado por timeout, atenuación con
`prefers-reduced-motion`, bloqueo/restauración del scroll); `geometry` (todas las ramas de
colocación); `TourLauncher` (ambas variantes, `onLaunch`).

`vitest.config.ts`: `src/components/tour/**` añadido al `include` de cobertura (nueva fase, no
para inflar el porcentaje). Las 4 métricas globales siguen ≥ 85 %.

## Pendiente / futuro

- Walkthrough visual con sesión autenticada (bloqueado en esta iteración: `/dashboard` exige
  login y el puerto 3000 estaba ocupado por otro servidor de desarrollo).
- Si se abre el registro (fin del régimen ADR-009), evaluar promover la flag a
  `usuarios_perfil` para que el "ya visto" sea cross-device.
- E2/F3.7 (soporte global de `prefers-reduced-motion` con `MotionConfig`) sigue como tarea
  independiente.
