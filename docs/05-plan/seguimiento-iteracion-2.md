---
proyecto: lego-virtual-museum
tipo: seguimiento
alcance: docs/auditoria-arquitectura.md §6 "Fase 2 — Calidad a medio plazo" (F2.1–F2.13), Ronda 1
estado: ejecutado, sin commitear
version: 1
fecha: 2026-08-10
autor: sesión de agente (Claude Code) sobre instrucción de Víctor Javier Corral
relacionada_con: [seguimiento-iteracion-1, ADR-010-reconciliacion-exif-rate-limiting, auditoria-arquitectura]
tags: [spec-vjc, seguimiento, trazabilidad]
---

# Seguimiento de ejecución — Fase 2, Ronda 1 (calidad a medio plazo)

**Contexto de entrada:** al empezar esta ronda, la Iteración 1 (quick wins de Fase 1) ya estaba
commiteada y tageada (`v0.2.0-quickwins-iteracion-1`). Pendientes de esa ronda: la migración de
seguridad `20260810120000_fix_role_privilege_escalation.sql` sin aplicar contra Supabase (el
usuario la aplicó y confirmó durante esta misma sesión, antes de empezar Fase 2), y el renombrado
del repositorio de GitHub (hecho por el usuario: `LegoVirtualMuseum` → `BricksVirtualCollector`,
detectado por redirect HTTP 301 y propagado a todas las referencias del repo).

---

## 1. Resumen de cumplimiento

| Métrica | Valor |
|---|---|
| Tareas F2.x completadas | **7 / 13** (F2.1, F2.4, F2.5, F2.7, F2.9, F2.10, F2.13) |
| Tareas F2.x parciales | **1 / 13** (F2.3) |
| Tareas F2.x diferidas con motivo documentado | **5 / 13** (F2.2, F2.6, F2.8 completo, F2.12, y la parte de F2.3 que exige Upstash) |
| Suite de tests | **169/169 en verde, 36/36 ficheros** (partía de 8 fallos / 123 tests) |
| Cobertura (4 métricas) | **Statements 94,20% · Branches 88,41% · Functions 91,97% · Lines 95,31%** — las 4 por encima del umbral del 85% por primera vez de forma verificable |
| `next build` | ✅ verde, 42 páginas |
| `tsc --noEmit` | ✅ verde |
| `eslint .` | 186 errores / 89 avisos (antes 152/94) — **desglosado**: 110 en tests nuevos (patrón `as any` ya establecido), **76 en producción, bajando de 78** |
| Commits realizados | **0** — pendiente de tu revisión, igual que en la Iteración 1 |

**Lectura honesta:** esta ronda resuelve el problema más profundo detectado en la auditoría —que
la suite estuviera en rojo y la cobertura fuera literalmente inmedible— y dos hallazgos de
seguridad de superficie (S4 test de regresión, S9 config real). No toca los tres bloqueantes que
siguen dejando el veredicto en NO-GO: datos mock en páginas públicas, migraciones incompletas
(A1), y autorización de servidor en `admin/moderacion`/`api/bounties/claim`. Esos, junto con
EXIF server-side (F2.2), siguen abiertos.

---

## 2. Tareas — estado detallado

### Completadas

| ID | Tarea | Qué se hizo | Evidencia |
|---|---|---|---|
| — (prerrequisito) | Suite de tests en verde | Reescritos `dashboard/page.test.tsx` (builder de mock encadenable genérico, ver nota en §4) y `ParticipacionesClient.test.tsx` (la UI de pestañas que probaba ya no existe; nueva suite contra la UI real de 2 secciones) | `npx vitest run` → 169/169 |
| F2.1 | Reconciliar ADRs con la realidad | `docs/06-decisiones/ADR-010-reconciliacion-exif-rate-limiting.md`: ADR-003 y ADR-005 se mantienen `aceptada` (no se reescriben), enlazados a un ADR nuevo que documenta la distancia con el código y el plan para cerrarla | Fichero creado; ADR-003/ADR-005 sin modificar |
| F2.4 | Ampliar el gate de cobertura | `coverage.include` de `vitest.config.ts` ampliado con 6 entradas (`src/lib/queries/**`, `src/proxy.ts`, `src/lib/rate-limit.ts`, `src/app/auth/confirm/**`, `src/app/api/bricks/**`, `src/app/api/auth/delete-account/**`). **No es `src/**` completo** (criterio literal no cumplido al 100%: Navbar, Footer, landing, `admin/system/**` siguen fuera) | `npx vitest run --coverage` exit 0, 4 métricas ≥85% |
| F2.5 | Cubrir la superficie de seguridad | Tests nuevos para los 5 ficheros exactos que pedía la tarea: `proxy.test.ts` (6), `rate-limit.test.ts` (6), `auth/confirm/route.test.ts` (7, incluida regresión del open redirect S4), `api/bricks/route.test.ts` (6), `api/auth/delete-account/route.test.ts` (6) | 31 tests nuevos, los 5 ficheros al 100% de líneas y ramas |
| F2.7 | Retirar código muerto | `DashboardClient.tsx` + su test eliminados (huérfano, hallazgo A6); confirmado que `clsx` y `tailwind-merge` seguían sin uso (no se tocó `package.json` — es una decisión de una tarea aparte, no de esta); `eslint.config.mjs` ya se había corregido en Iteración 1 | `grep` sin resultados para `DashboardClient` fuera de su propia ausencia |
| F2.9 | Capa de acceso a datos | `src/lib/queries/vitrinas.ts`: `getVitrinaPublicaById`, envuelta en `cache()` de React, usada por `generateMetadata()` y el componente de página en `v/[id]/page.tsx` — antes hacían dos consultas idénticas a Supabase por cada visita pública. De paso, se eliminó una consulta duplicada y descartada en `dashboard/participaciones/page.tsx` (primer `misExposiciones` que nunca se usaba) | `src/lib/queries/vitrinas.test.ts` (2 tests); `v/[id]/page.tsx` reescrito |
| F2.10 | Accesibilidad de formularios | `htmlFor`/`id` añadidos a ~24 pares label↔input en 10 ficheros (login, forgot-password, update-password, dashboard/perfil, CrearVitrinaModal, EditVitrinaModal, MoveSetModal, admin/bounties, admin/exposiciones, admin/system/health, mesa-de-trabajo ×2, MesaTrabajoClient); grupos de botones no nativos (Privacidad, Visibilidad, Vitrina de destino) asociados con `role="group"` + `aria-labelledby` en vez de `htmlFor` (no aplica a un control único); `aria-label` en 7 botones de solo icono (cerrar modal ×2, avatar, tour anterior/siguiente/cerrar, dropdown de perfil, menú móvil); 6 `outline-none` genuinamente sin ningún reemplazo de foco (admin/bounties ×3, admin/exposiciones ×3) recibieron `focus:ring-2` | Los 169 tests existentes siguen en verde tras cada cambio (verificado incremental, no solo al final) |
| F2.13 | Actualizar la documentación | Doble `ADR-001` resuelto (frontend-hosting = vigente/Vercel; stack-tecnico = marcado `superada`, sin reescribir su contenido); `_index.md` corregido (ya no dice "Pendiente" de fases que llevan meses implementadas, hallazgo D6); `informe-cobertura.md` actualizado con el estado verde real y el delta de ESLint | `git diff` de los 3 ficheros |

### Parcial

| ID | Tarea | Qué se hizo | Qué falta y por qué |
|---|---|---|---|
| F2.3 | Rate limiting real | `src/lib/rate-limit.ts` reescrito: ahora **lee de verdad** `system_config` (límite y ventana configurables desde `/admin/system/health`, con caché de 60s tal como el runbook siempre prometió sin implementar — hallazgo S9 cerrado en su mitad "lectura"). Degrada a valores por defecto si Supabase no responde o faltan variables de entorno | El almacén sigue siendo un `Map` en memoria de proceso, no compartido entre instancias (S8 sigue abierto). Migrar a Upstash Redis (la decisión de ADR-003) requiere que **el titular cree una cuenta externa** — no es una tarea de código pendiente, es una decisión de infraestructura fuera del alcance de esta sesión |

### Diferidas (con motivo documentado, no abandonadas en silencio)

| ID | Tarea | Por qué se difiere | Dónde queda registrado |
|---|---|---|---|
| F2.2 | EXIF verificable server-side | Requiere decidir la técnica de limpieza (parseo de bytes a mano vs. librería con binarios nativos como `sharp`), revocar la subida directa del cliente al bucket de Storage, y **verificación contra un bucket de Supabase real que no está disponible en este entorno**. Implementarlo sin poder probarlo contra infraestructura real repite el patrón que ya causó el bug de `created_at`/`creado_en` (A5): código que parece correcto y rompe en producción | `ADR-010` §Decisión (EXIF), con el plan concreto: Route Handler de Next.js en vez de Supabase Edge Function |
| F2.6 | Consolidar vistas de vitrina | Cambio de arquitectura con implicaciones de URLs públicas/SEO (`/vitrina/[id]`, `/v/[id]`, `/dashboard/vitrina/[id]`); merece una revisión propia, no una decisión de paso mientras se ejecutan otras 12 tareas | Sigue como F2.6 en `docs/auditoria-arquitectura.md`, sin tocar |
| F2.8 (completo) | Tipar las 133 fronteras de `any` | Volumen grande (~30 ficheros); además el criterio original pedía `supabase gen types typescript`, que requiere el CLI autenticado contra el proyecto real, y de las 6 tablas que usa el código, ninguna migración las define (hallazgo A1) — no se pueden generar tipos completos y correctos hasta que eso se resuelva | Progreso parcial real: los 2 ficheros de producción nuevos de esta ronda (`rate-limit.ts`, `queries/vitrinas.ts`) tienen 0 `any`; el conteo de producción baja de 78 a 76 errores de ESLint |
| F2.12 | E2E de flujos de negocio | Escribir specs de Playwright que pasen requiere que los flujos funcionen de verdad contra datos reales. Con `/perfil/[id]`, `/set/[id]` y `/mesa-de-trabajo/[id]` sirviendo datos mock (hallazgos R2/R3, sin resolver) y las migraciones incompletas (A1), un E2E "verde" estaría probando el mock, no el producto — el mismo antipatrón que ya se corrigió una vez en `docs/testing/informe-cobertura.md` (test de placeholder) | Depende de que se resuelvan A1 y R2/R3 primero — son bloqueantes de Fase 1, no tareas de Fase 2 |

---

## 3. Riesgos activos

| # | Riesgo | Mitigación / siguiente paso |
|---|---|---|
| R1 | **31 ficheros nuevos/modificados sin commitear** (esta ronda se suma al trabajo ya revisado de la Iteración 1, que si se aprobó, ya está commiteado y tageado — este riesgo aplica solo al delta de Fase 2). | Pendiente de tu aprobación del diff antes de commitear, igual que en la Iteración 1. |
| R2 | **El almacén de rate limiting sigue sin ser compartido entre instancias** (S8). La mejora de esta ronda (leer `system_config`) hace el *límite* configurable, no el *contador* compartido. | Documentado explícitamente en ADR-010 como pendiente de decisión externa (cuenta Upstash). No confundir "mejorado" con "resuelto". |
| R3 | **El copy de la aplicación sigue prometiendo una garantía de anonimato más fuerte de la que el código sostiene.** "100% Anónimo" en `/login` y "Metadatos (EXIF) se eliminarán" en Mesa de Trabajo son ciertos en su *efecto* (el EXIF sí se borra), pero no en su *garantía* (un cliente modificado podría saltárselo) mientras F2.2 siga sin implementar. | Anotado en ADR-010 §Consecuencias como algo a tener en cuenta en cualquier comunicación pública del proyecto hasta que se cierre. |
| R4 | **La cobertura ampliada sigue siendo una lista blanca**, no `src/**`. Es fácil leer "88,41% de branches" y asumir que cubre el proyecto; cubre lo que está en `coverage.include`, que creció pero sigue dejando fuera `Navbar.tsx`, `Footer.tsx`, la landing y `admin/system/**`. | Declarado explícitamente en `informe-cobertura.md` y en la nota de actualización de `docs/auditoria-arquitectura.md` §6. |
| R5 | **Accesibilidad (F2.10) no tiene test de regresión propio.** Los cambios de `htmlFor`/`aria-label` se verificaron no rompiendo los tests existentes, pero ningún test nuevo afirma "este label está asociado a este input" — una regresión futura no la detectaría la suite. | Se aceptó el trade-off por volumen (≈24 pares en 10 ficheros); test de accesibilidad automatizado (axe) queda como tarea de una ronda futura, ya prevista como F2.10 en la auditoría original. |

---

## 4. Lecciones aprendidas

**1. Los mocks de Supabase que fijan la forma exacta de la cadena (`.select().eq().single()`)
son frágiles frente a refactors legítimos.** El fallo de `dashboard/page.test.tsx` no era un bug
de producto: el componente pasó de 2 consultas a 5, y el mock antiguo asumía una forma fija por
tabla. La solución no fue "arreglar el mock una vez más" sino escribir un **builder genérico**
donde cada método encadenable (`select`, `eq`, `order`, `limit`, `in`, `single`) devuelve el
propio objeto y ese objeto es a la vez `then`-able — exactamente cómo se comporta el builder real
de PostgREST. Este patrón (documentado en el propio test) es reutilizable para cualquier página
que añada o reordene consultas sin volver a romper el test.

**2. Una lista blanca de cobertura que crece file-by-file oculta cuánto queda fuera si no se dice
explícitamente cuánto.** Pasar de "94,45% aparente sobre lista blanca" a "88,41% real verificado
sobre una lista blanca más grande" es progreso genuino, pero solo si se sigue diciendo, en cada
actualización, qué queda fuera y por qué — si no, la siguiente persona que lea el número asumirá
que es cobertura del proyecto completo, el mismo problema que motivó T7 en la auditoría original.

**3. "Mitigar" y "resolver" son estados distintos y hay que nombrarlos distinto.** F2.3 (rate
limiting) y las cuatro tareas neutralizadas por ADR-009 en la Iteración 1 comparten el mismo
patrón: una mejora real que reduce el problema sin cerrarlo. La tentación es marcar la tarea como
"hecha" porque el código cambió; el criterio correcto es preguntar si el hallazgo original (S8,
S9) sigue siendo cierto — y en el caso de S8, sigue siéndolo.

**4. Cuando una tarea de una lista de "quality" (Fase 2) en realidad depende de un bloqueante de
Fase 1 sin resolver (mock data, migraciones incompletas), ejecutarla de todos modos produce un
resultado peor que no ejecutarla.** F2.12 (E2E) es el ejemplo: un test E2E que pasa contra datos
mock no prueba nada del producto real, y encima queda como una falsa señal de calidad. Diferirla
con la dependencia explícita es más honesto que forzarla a "estar hecha".

**5. Ejecutar la herramienta y leer su salida completa sigue revelando más de lo que la lectura
manual encuentra.** El ESLint que se desbloqueó en la Iteración 1 mostró en esta ronda un patrón
nuevo: los 34 errores adicionales de `no-explicit-any` no son deuda nueva, son la firma normal de
escribir 30+ tests con mocks de Supabase. Sin desglosar producción vs. test, el número crudo
(152→186) cuenta una historia falsa de regresión cuando la realidad es una mejora (78→76 en
producción). La lección no es "no mirar el número crudo", es "nunca reportar un agregado sin el
desglose que lo hace interpretable".

---

## 5. ADRs — qué se creó, qué se modificó

| Documento | Acción |
|---|---|
| `docs/06-decisiones/ADR-010-reconciliacion-exif-rate-limiting.md` | **Creado.** Reconcilia ADR-003 y ADR-005 con la implementación real (F2.1). Ninguno de los dos ADRs originales se reescribe. |
| `docs/06-decisiones/ADR-001-stack-tecnico.md` | **Actualizado** (frontmatter + aviso): `estado: superada`, enlazado a `ADR-001-frontend-hosting.md`. Contenido original sin tocar. |
| `docs/06-decisiones/ADR-001-frontend-hosting.md` | **Actualizado**: nota añadida al inicio aclarando que es la decisión vigente sobre hosting (Vercel). |
| `docs/06-decisiones/ADR-003-rate-limiting.md`, `ADR-005-limpieza-exif.md` | **Sin modificar**, tal como exige la disciplina de ADRs inmutables del framework — su estado de implementación real vive en ADR-010, no en ellos. |
| `docs/auditoria-arquitectura.md` | Nota de actualización añadida sobre la tabla de Fase 2 (no se reescribe la tabla del plan original). |
| `docs/testing/informe-cobertura.md` | Estado real actualizado: suite verde, cobertura verde con desglose, delta de ESLint. |
| `_index.md` | Tabla de fases corregida (hallazgo D6). |

---

## 6. Estado exacto del repositorio al cierre de esta ronda

```
Build:        ✅ next build exit 0 (42 páginas)
Type check:   ✅ tsc --noEmit sin errores
Lint:         186 errores / 89 avisos (110 en tests nuevos, 76 en producción — bajando de 78)
Tests:        ✅ 169/169 (36/36 ficheros) — partía de 8 fallos / 123
Cobertura:    ✅ Statements 94,20% · Branches 88,41% · Functions 91,97% · Lines 95,31%
Migración S1: ✅ aplicada y confirmada por el titular contra Supabase producción (previo a esta ronda)
Commits:      0 — pendiente de revisión del diff, igual que la Iteración 1
```

### Agrupación de commits propuesta (no ejecutada, a la espera de aprobación)

1. `fix:` — suite de tests en verde (`dashboard/page.test.tsx`, `ParticipacionesClient.test.tsx` reescritos)
2. `feat(security):` — F2.5, tests de la superficie de seguridad (proxy, rate-limit, auth/confirm, api/bricks, delete-account)
3. `feat:` — F2.3 parcial, `rate-limit.ts` lee `system_config` con caché
4. `feat:` — F2.9, capa de acceso a datos (`lib/queries/vitrinas.ts`) + dedupe de query en participaciones
5. `refactor:` — F2.7, retirada de `DashboardClient.tsx` huérfano
6. `feat(a11y):` — F2.10, accesibilidad de formularios y botones de icono
7. `docs:` — F2.1, F2.4, F2.13: ADR-010, resolución del doble ADR-001, `_index.md`, `informe-cobertura.md`, `vitest.config.ts` (ampliación del gate), este documento de seguimiento

---

## 7. Qué sigue sin resolverse tras esta ronda

Para que no se lea como cierre de la auditoría:

- El veredicto de `docs/auditoria-arquitectura.md` sigue siendo **NO-GO**.
- Datos mock hard-coded en `/perfil/[id]`, `/set/[id]`, `/mesa-de-trabajo/[id]` (R2/R3): sin tocar.
- Migraciones incompletas (A1, 6 tablas sin definir): sin tocar.
- Autorización de servidor en `admin/moderacion` y `api/bounties/claim` (S2/S3): sin tocar —
  mitigadas en runtime por ADR-009 si se activa el entorno demo, no corregidas en código.
- EXIF server-side (F2.2 / S5): diferido con plan concreto en ADR-010.
- Rate limiting compartido (F2.3 completo / S8): diferido, bloqueado por decisión externa.
- Consolidación de vistas de vitrina (F2.6): diferido.
- Tipado completo de fronteras (F2.8): progreso parcial, grueso pendiente.
- E2E de negocio (F2.12): diferido, depende de resolver R2/R3 y A1 primero.
