---
proyecto: bricks-virtual-collector
tipo: informe
subtipo: incidencia-de-test
estado: resuelto
fecha: 2026-09-12
relacionada_con: [05-plan/plan-acceso-invitado-opcion-c]
tags: [spec-vjc, testing, flaky, ci]
---

# Hallazgo — test intermitente en CI: `BountiesSectionClient > cierra el modal con la tecla Escape`

**Contexto:** detectado en el Quality Gate de la PR de la Fase 8 del plan de acceso de invitado
(PR #9), que no toca ni `BountiesSectionClient.tsx` ni su test. La ejecución local (8 pasadas
completas de la suite, más 5 aisladas del fichero) no reprodujo el fallo — es intermitente y
específico del runner de GitHub Actions.

## Qué falló

```
FAIL src/components/BountiesSectionClient.test.tsx > BountiesSectionClient > cierra el modal con la tecla Escape
expect(element).not.toBeInTheDocument()
```

608/609 tests en verde; el único fallo fue este.

## Por qué la expectativa era incorrecta (AGENTS.md, regla 1)

`handleOpenBounty` (`src/components/BountiesSectionClient.tsx:52-69`) hace **dos** llamadas
asíncronas al abrir el modal: `auth.getUser()` y, tras `setSelectedBounty(bounty)`, un
`.from('sets').select(...).eq(...)` para poblar `userSets`. El `waitFor` del test solo esperaba
a que apareciera el diálogo (la primera actualización de estado), no a que esa segunda petición
terminara.

La aserción de cierre se hacía **justo después** de `fireEvent.keyDown`, sin `await`, asumiendo
que React ya había confirmado (commit) la eliminación del diálogo del DOM de forma síncrona. En
local eso se cumple siempre; en el runner de CI, más lento y con la segunda petición todavía en
vuelo en ese instante, el commit puede no haber ocurrido aún cuando se lee `queryByRole`.

**La expectativa en sí (el modal se cierra con Escape) era y sigue siendo correcta** — lo
incorrecto era no esperar a que esa verdad se reflejara en el DOM antes de comprobarla.

## Corrección

`src/components/BountiesSectionClient.test.tsx`: la aserción final pasa a `await waitFor(() =>
expect(screen.queryByRole('dialog')).not.toBeInTheDocument())`. No cambia qué se verifica, solo
cuándo se verifica. Ningún cambio en `src/components/BountiesSectionClient.tsx`.

## Verificación

- 8 ejecuciones completas de la suite en local (antes del fix) no reprodujeron el fallo — no se
  pudo forzar la condición de carrera de forma determinista, consistente con ser un problema de
  scheduling bajo carga, no un defecto lógico del componente.
- Tras el fix, la aserción es correcta con independencia del scheduling: 609/609 en verde en
  local. El Quality Gate de la propia PR que introduce este cambio confirma si se mantiene verde
  en el runner real.
