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
| `/dashboard` Hub — widget "Última Insignia" | El último sello obtenido | `/dashboard/insignias` |
| `/dashboard/insignias` → **Pasaporte de Exposiciones** | **Único hogar del histórico personal.** Un sello por insignia real (`sets_insignias`) | `/exposicion/[id]` por sello |
| `/dashboard/insignias` → Vitrina de Insignias / Mosaico | "Próximamente" (sistemas de logros por diseñar, decisión D3) | — |
| `/dashboard/participaciones` | **Panel de actividad EN CURSO.** Exposiciones activas donde participo (estado de moderación + puesto en vivo + tiempo restante), bounties en curso, "Dónde puedes participar" | `/exposicion/[id]`, `/set/[id]`, `/bounties`, `/dashboard/insignias` (Pasaporte) |

## Reparto de responsabilidades entre "Participaciones" y "Mis Insignias"

Antes de H5 los dos mostraban "mi resultado en exposiciones cerradas" — duplicación sin
jerarquía. Ahora:

- **Participaciones = lo que tengo en juego ahora.** Requiere acción o seguimiento: ¿me han
  aprobado el set?, ¿voy ganando?, ¿cuánto queda?, ¿dónde más puedo apuntarme? No muestra nada
  finalizado.
- **Mis Insignias / Pasaporte = el trofeo.** El palmarés personal, permanente, con cada sello
  enlazando a la ficha de su exposición.

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
