---
proyecto: bricks-virtual-collector
tipo: diseno
subtipo: flujo-de-usuario
estado: implementado
version: 1
fecha: 2026-09-06
relacionada_con: [plan-intervencion-post-iteracion-3, tour-onboarding]
tags: [spec-vjc, diseno, exposiciones, insignias, zero-duplication]
---

# Exposiciones y logros — mapa de superficies y flujo canónico

**Origen:** H5 (`docs/05-plan/plan-intervencion-post-iteracion-3.md` §H5 y §11). Antes de esta
consolidación, la información de exposiciones y sus resultados vivía dispersa en varias
pantallas sin una fuente de verdad, con una ruta enlazada que no existía (404 en producción).

## Regla canónica

> **`/exposicion/[id]` es la única vista del resultado de una exposición. Todo lo demás enlaza
> hacia ella; nada más re-pinta su ranking.**

- Exposición **activa** → ranking en vivo, recalculado desde `bricks_recibidos` en cada visita.
- Exposición **archivada** → ranking **oficial**: lo que quedó registrado en `sets_insignias`
  al repartir las insignias (`rango` + `titulo_insignia`, inmutable). El recuento de bricks se
  muestra en gris como dato histórico, ya congelado — no reordena nada.
- El histórico oficial es fiable porque la migración
  `20260819110000_bloquear_votar_participar_exposicion_archivada.sql` (verificada en
  `pg_policies`) impide votar o participar tras archivar.
- Exposición archivada **sin fila en `sets_insignias`**: estado vacío honesto, no un ranking
  vacío confuso ni un recálculo en vivo.
  - `sin-participantes`: se cerró sin ninguna participación aprobada.
  - `anterior-al-registro`: tuvo participantes pero se archivó antes del reparto real de
    insignias (D3, ~10/08/2026).

## Mapa de superficies (estado tras H5)

| Superficie | Qué muestra | Enlaza a |
|---|---|---|
| `/` (home) | Hero de la exposición **activa** | `/exposicion/[activa]` |
| `/exposiciones` *(nuevo)* | Índice de todas (activas primero, luego archivadas) | `/exposicion/[id]` por tarjeta |
| `/exposicion/[id]` | **Fuente de verdad.** Ranking en vivo (activa) u oficial (archivada) | `/set/[id]` por participante |
| `/admin/exposiciones` | Gestión: crear, archivar (reparte insignias), reactivar. **+ H5:** resumen inline (participantes aprobados + bricks), filtro activas/archivadas | `/exposicion/[id]` ("Ver ficha pública") |
| `/dashboard` Hub — "Bricks Recibidos" | Total histórico | `/dashboard/insignias` (su casa detallada) |
| `/dashboard` Hub — "Más Eventos" | Descubrimiento | `/exposiciones` (siempre; antes solo a la 2ª expo activa) |
| `/dashboard` Hub — "Se Busca (Bounties)" | Descubrimiento | `/bounties` (antes iba a Participaciones) |
| `/dashboard` Hub — widget "Última Insignia" | El último sello obtenido | `/dashboard/insignias` |
| `/dashboard/insignias` → **Pasaporte de Exposiciones** | **Único hogar del histórico personal.** Un sello por insignia real (`sets_insignias`) | `/exposicion/[id]` por sello |
| `/dashboard/insignias` → Vitrina de Insignias | 46 insignias reales, calculadas contra los datos de la cuenta | ver [[sistema-de-insignias]] |
| `/dashboard/insignias` → Mosaico Comunitario | Un bloque por insignia desbloqueada por cualquiera (`insignias_usuario`) | ver [[sistema-de-insignias]] |
| `/dashboard/insignias` → En curso | Exposiciones **activas** con puesto en vivo (migrado de "Mi Progreso") | `/exposicion/[id]`, `/set/[id]` |
| `/dashboard/insignias` → Recompensas | Bricks ganados en retos y con qué set se reclamó cada uno | `/dashboard/insignias/bounty/[id]`, `/set/[id]` |
| ~~`/dashboard/participaciones`~~ | **Fusionada en "Mis Insignias" (08/09/2026).** Hoy solo redirige. Su contenido vive en las secciones *En curso* y *Recompensas*; "Dónde puedes participar" se mudó a `/dashboard/vitrinas` | — |

## Reparto de responsabilidades dentro de "Mis Insignias"

H5 separó el histórico (Pasaporte) de la actividad en curso ("Mi Progreso"), pero dejó **dos
pantallas** con la misma cabecera, el mismo avatar y las mismas estadísticas, y dos entradas de
navbar. El 08/09/2026 se fusionaron: `/dashboard/participaciones` redirige a
`/dashboard/insignias` y su contenido pasa a ser secciones de esa pantalla.

| Sección | Pregunta que responde | Fuente exclusiva |
|---|---|---|
| Vitrina de Insignias | ¿Qué he conseguido y qué me falta? | motor puro sobre agregados de la cuenta |
| En curso | ¿Qué tengo en juego ahora mismo? | `exposicion_sets` de exposiciones **activas** |
| Recompensas | ¿Qué he ganado y dónde ha ido a parar? | `bounties_reclamados` |
| Pasaporte | ¿Cuál es mi palmarés oficial? | `sets_insignias` |
| Mosaico | ¿Qué ha logrado la comunidad? | `insignias_usuario` de todos |

El eje es un zoom progresivo: **yo ahora → yo siempre → nosotros**. Ninguna sección re-pinta el
dato de otra, y ninguna nueva entra sin retirar su duplicado de otra pantalla.

Un matiz que la fusión corrigió: la lista antigua etiquetaba los bounties reclamados como
"Pendiente" y los contaba como actividad. No lo son — la recompensa se concede al instante, así
que un reclamo es un resultado, no algo en curso. Por eso viven en *Recompensas*.

Detalle completo del catálogo, la identidad visual, la mecánica del mosaico y el circuito de
recompensas en [[sistema-de-insignias]].

## Lógica compartida

Todo el cálculo no trivial está en `src/lib/exposiciones.ts` como funciones puras (probadas sin
mockear Supabase, mismo patrón que `src/lib/insignias.ts`):

| Función | Uso |
|---|---|
| `rankingEnVivo` | ranking de una exposición activa |
| `rankingOficial` | ranking oficial de una archivada, desde `sets_insignias` |
| `motivoHistoricoVacio` | por qué una archivada no tiene ranking que mostrar |
| `posicionEnRankingVivo` | "#N de M · X bricks" del set del usuario en el panel de Participaciones |
| `resumenExposiciones` | resumen inline de `/admin/exposiciones` |
| `rangoFechasExposicion` | texto de fechas (fin del "1/1/1970" con fechas null) |

## Nota de autenticación

`/exposicion` y `/exposiciones` están hoy tras la puerta de sesión (`src/lib/supabase/middleware.ts`,
`startsWith('/exposicion')`). Coherente con ADR-009 (demo = una cuenta de solo lectura, registro
cerrado). Hacerlas realmente anónimas es una decisión de ADR-009, fuera del alcance de H5.
