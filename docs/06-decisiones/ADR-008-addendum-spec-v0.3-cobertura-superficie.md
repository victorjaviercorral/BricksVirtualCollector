---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-28
tags: [spec-vjc, decision]
---

# ADR-008 — Addendum spec v0.3: cobertura de superficie del MVP

**Fecha:** 2026-07-28 · **Estado:** aceptada

## Contexto

Al validar visualmente el prototipo v0.1 (`docs/04-prototipo/prototype.html`, 5 pantallas)
contra la spec v0.2, un diagnóstico externo (`diagnostico-y-addendum-spec-v0.3.md`, aportado
por el autor) encontró cuatro fallos concretos, no de acabado visual sino de cobertura:

- **F1 — Requisito must sin pantalla.** R-07 (vista resumen de perfil) está en la trazabilidad
  de la spec v0.2 como *must*, pero ningún flujo de §11 lo incluye, y el prototipo no tiene esa
  vista.
- **F2 — Flujos especificados sin pantalla.** El paso 2 del Flujo B (cola de revisión admin,
  R-06) y el Flujo C completo (borrado de cuenta, R-09/RC-04, obligación GDPR) ya estaban en
  §11 de la spec v0.2 y no existían en el prototipo.
- **F3 — Modelo de datos más rico que los flujos que expone.** `fotos.orden` implica N fotos
  por set y `vitrinas.usuario_id` implica N vitrinas por usuario; ningún flujo ni pantalla
  exponía ninguna de las dos cosas.
- **F4 — El MVP no podía probar su propia asunción más arriesgada.** El PRD-lite marca A2
  ("existe demanda real de un espacio de exhibición dedicado, no de un marketplace ni de una
  red social") como la asunción más arriesgada, y la capacidad que la sirve es C7/Explorar —
  marcada *should* en el PRD-lite v0.2 y excluida en spec v0.2 §12.11 si el presupuesto de
  4 semanas no alcanzaba. Un MVP cuyo alcance excluye la única capacidad que sirve a su asunción
  más arriesgada no es publicable para recoger la señal de mercado que el Go/No-Go del PRD exige.

F1-F3 son huecos de trazabilidad que ni el quality gate de la spec v0.2 ni `/prototype` podían
atrapar, porque el framework, hasta esta versión, no exigía mapear requisito → flujo → pantalla
de forma explícita. F4 es la razón de fondo de la sensación de "bajo valor" del prototipo v0.1:
no era un problema de diseño visual, era que el alcance definido no permitía validar la
hipótesis del proyecto.

## Decisión

1. **C7/Explorar pasa de *should* a *must*** en PRD-lite (§6) y spec (R-08). Se elimina la
   exclusión §12.11 de la spec. El alcance de C7 se acota para que quepa en el presupuesto de
   4 semanas de la etapa MVP: filtro por temática (multiselección) + orden + búsqueda de texto,
   **sin** "coincidencia con intereses guardados por el usuario" — ese añadido, que sí excedería
   el presupuesto, queda fuera de v1 sin afectar a si A2 es o no verificable.
2. Se añaden los requisitos **R-10 a R-16** a la spec para cerrar F1-F3: dashboard propio (R-10,
   cierra F1 junto con la promoción de R-08), gestión de mis vitrinas (R-11, cierra F3 para
   `vitrinas.usuario_id`), detalle de set con galería (R-12, cierra F3 para `fotos.orden`),
   perfil público anónimo (R-13), ajustes de cuenta con borrado GDPR (R-14, cierra F2 para el
   Flujo C), cola de moderación (R-15, cierra F2 para el Flujo B paso 2) y estados completos
   transversales — vacío/carga/error/sin-resultados — en toda superficie nueva (R-16).
3. Se añade una **matriz requisito → flujo → pantalla** (spec §2.1) como sección obligatoria
   desde esta versión, para que un hueco como F1 sea detectable en el propio artefacto en vez
   de solo al validar visualmente el prototipo.
4. El prototipo (`docs/04-prototipo/prototype.html`) se extiende de 5 a 12 pantallas: Explorar,
   Dashboard, Mis vitrinas, Detalle de set, Perfil público, Ajustes de cuenta y Cola de
   moderación, cada una con un selector de estado explícito (carga/vacío/error/con datos) para
   inspección visual de R-16.

## Alternativas descartadas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| Mantener C7 como *should* y recortarla si el presupuesto no alcanza (lo que decía la spec v0.2) | Es exactamente lo que produjo F4: sin C7, nada en el alcance permite verificar si A2 es cierta más allá del propio autor. El recorte "seguro" invalidaba el propósito del MVP. |
| Resolver F1-F3 ampliando el prototipo sin tocar la spec (parchear el prototipo directamente) | Habría dejado la spec con requisitos sin trazabilidad real a pantalla, que es la causa raíz (F1-F3), no el síntoma. Constitution: un cambio de requisito se tramita primero en la spec, luego en tareas, luego en código/prototipo — nunca al revés. |
| Tratar el hallazgo F4 como cambio de alcance del PRD y volver a ejecutar su quality gate completo | Desproporcionado: F4 no cuestiona el problema, los usuarios ni la hipótesis del PRD, solo corrige que el alcance elegido no la sirve. Se documenta como corrección de alcance con origen trazado (este ADR) en vez de repetir una revisión de fondo ya superada (CONDICIONAL 7,0/10). |
| Añadir "coincidencia con intereses guardados" al alcance must de R-08, tal como sugería el texto original de C7 | Habría reintroducido el riesgo de sobrepasar el presupuesto de 4 semanas que ya había motivado marcar C7 como *should* en el PRD-lite v0.2. Se separa: lo que sirve a A2 (descubrir vitrinas) es *must*; lo que la mejora pero no es indispensable para probar A2 (intereses guardados) queda fuera de v1. |

## Consecuencias

- La spec pasa de v0.2 a v0.3 y el PRD-lite de v0.2 a v0.3 (solo la fila C7, sin reabrir el
  resto del documento ni repetir su gate).
- El prototipo pasa de 5 a 12 pantallas — más superficie para construir en `/plan`/`/implement`
  de la que contemplaba el presupuesto de construcción original; a revisar en `/plan` si el
  plazo del 2026-08-24 sigue siendo realista con este alcance ampliado.
- Se elimina la entidad `intereses` prevista condicionalmente en el modelo de datos v0.2: al
  acotar R-08 sin "coincidencia con intereses guardados", no hace falta persistirlos. Sin
  cambios estructurales adicionales — R-10 y R-13 se resuelven con consultas agregadas sobre
  tablas ya existentes.
- La spec v0.3 requiere una revisión ciega de quality gate propia (misma rúbrica que v0.2, que
  ya incluye la matriz §2.1 como condición de FAIL automático si falta) antes de considerarse
  cerrada; no ejecutada todavía — pendiente de que el autor la solicite.
