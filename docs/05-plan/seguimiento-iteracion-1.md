---
proyecto: lego-virtual-museum
tipo: seguimiento
alcance: docs/05-plan/plan-remediacion-quickwins.md — Iteración 1
estado: ejecutado y commiteado
version: 2
fecha: 2026-08-10
autor: sesión de agente (Claude Code) sobre instrucción de Víctor Javier Corral
relacionada_con: [auditoria-arquitectura, plan-remediacion-quickwins, ADR-009-entorno-demo-publico, analisis-titularidad-persona-fisica]
tags: [spec-vjc, seguimiento, trazabilidad]
---

# Seguimiento de ejecución — Iteración 1 (quick wins)

**Propósito de este documento:** responder qué se hizo, por qué, cuándo y con qué evidencia,
para que un tercero (incluido tu yo de dentro de tres meses) no tenga que reconstruirlo leyendo
el diff. Es el documento de trazabilidad que exige `AGENTS.md` §3.

**Cómo leerlo:** §1 es el resumen para decidir si aprobar el commit. §2 es la tabla tarea por
tarea. §3 son los riesgos activos. §4 son las lecciones aprendidas — la parte que más vale para
la próxima iteración. §5 es el estado exacto del repositorio ahora mismo.

---

## 1. Resumen de cumplimiento

**Cronología:** auditoría emitida el 2026-08-10 → decisión de entorno demo (ADR-009) el mismo
día → plan de 16 tareas diseñado y ejecutado el mismo día, en una sola sesión continua.

| Métrica | Valor |
|---|---|
| Tareas completadas | **14 / 16 (88%)** |
| Tareas parciales | **1 / 16 (6%)** — QW-16 (fila sí, tag pendiente de este mismo cierre) |
| Tareas pendientes de decisión externa | **1 / 16 (6%)** — QW-12 (retención de logs de Vercel) |
| Build (`next build`) | ✅ Verde |
| Type check (`tsc --noEmit`) | ✅ Verde |
| Lint (`eslint .`) | ⚠️ Se ejecuta (antes no podía), **152 errores, 94 avisos** |
| Suite de tests | ⚠️ 8 fallos / 123 (antes: 9/124) — reducción, no resolución |
| Documentos legales servidos sin `PENDIENTE` | ✅ 5 / 5 |
| Migración de escalada de privilegios (S1) | ✅ **Aplicada y verificada contra Supabase producción** — ver §3, R1 cerrado |
| Commits realizados | Ver §6 — commitado y tageado al cierre de este documento |

**Lectura honesta:** esta iteración no cierra el veredicto NO-GO de la auditoría. Lo que hace es
convertir bloqueantes de "no se puede ni verificar" (build roto) en bloqueantes acotados y
medibles (8 tests concretos, 152 errores de lint con desglose por regla). Es progreso real, pero
el proyecto sigue sin poder publicarse.

---

## 2. Tareas del plan — estado detallado

Leyenda: ✅ completada y verificada · ⚠️ completada parcialmente · ⏸️ pendiente de decisión o
acción externa a esta sesión.

### Bloque A — Desbloquear la verificación

| ID | Tarea | Estado | Qué se hizo | Evidencia |
|---|---|---|---|---|
| QW-01 | Corregir el error de tipos que impedía compilar | ✅ | `src/app/dashboard/participaciones/[id]/page.tsx` reescrito para usar el helper compartido `@/lib/supabase/server` en vez de un `createServerClient` local con el patrón `get`-only (deprecado en Next 16/Supabase SSR actual); `params` tipado como `Promise<{id:string}>`. Mismo tipado aplicado en `src/app/legal/[slug]/page.tsx`. | `npx tsc --noEmit` sin salida; `npx next build` exit 0, 42 páginas generadas |
| QW-02 | `eslint` ejecutable sin `ENOENT` | ✅ | Añadido `"coverage/**"` a `globalIgnores` en `eslint.config.mjs` | `npx eslint .` corre y produce salida (antes abortaba) |

### Bloque B — Defectos funcionales visibles

| ID | Tarea | Estado | Qué se hizo | Evidencia |
|---|---|---|---|---|
| QW-03 | Eliminar ruta stub `/moderacion` | ✅ | `src/app/moderacion/page.tsx` borrado | `grep -r "Contenido simulado" src/` → sin resultados |
| QW-04 | Resolver duplicación `/mis-vitrinas` ↔ `/dashboard/vitrinas` | ✅ | `src/app/mis-vitrinas/` (página + test) eliminado. Referencias retiradas de `vitest.config.ts`. El bug `created_at` vs `creado_en` desaparece con la ruta. | Solo queda `/dashboard/vitrinas`; test eliminado y su ausencia justificada en `docs/testing/informe-cobertura.md` (ver §4 de este documento) |

### Bloque C — Seguridad latente

| ID | Tarea | Estado | Qué se hizo | Evidencia |
|---|---|---|---|---|
| QW-05 | Cerrar la escalada de privilegios (S1) | ✅ **Creada y aplicada** | Migración `supabase/migrations/20260810120000_fix_role_privilege_escalation.sql`: revoca `UPDATE` sobre toda la tabla `usuarios_perfil` a `authenticated`/`anon` y concede de vuelta solo las columnas no sensibles (`username`, `avatar_url`, `consentimiento_version`, `consentimiento_fecha`) | Ejecutada por el titular en el SQL Editor de Supabase (proyecto `main`/PRODUCTION) el 10/08/2026: `Success. No rows returned`. **Pendiente de verificación positiva**: confirmar que `update usuarios_perfil set role='sysadmin' where id=auth.uid()` devuelve `permission denied for column role`, criterio del ADR-009 |
| QW-06 | Cerrar el open redirect (S4) | ✅ | `src/app/auth/confirm/route.ts`: función `sanitizeNext()` que solo acepta una ruta interna con barra inicial única (rechaza `//evil.com`, `/\evil.com`) | Revisión de código; sin test automatizado nuevo (deuda anotada en §3) |

### Bloque D — Identidad, presentación y legales

| ID | Tarea | Estado | Qué se hizo | Evidencia |
|---|---|---|---|---|
| QW-07 | Unificar identidad de marca | ✅ | Nombre unificado a **BricksVirtualCollector** en `<title>` (`layout.tsx`), Navbar, Footer, metadatos de `/como-funciona` y `/v/[id]` | `grep -rn "Lego Virtual Museum" src/` → sin resultados |
| QW-08 | Renombrar `package.json` | ✅ | `"temp-app"` → `"bricks-virtual-collector"` | `package.json:2` |
| QW-09 | Disclaimer de marca visible | ✅ | Bloque nuevo en `Footer.tsx`, montado en el layout raíz → visible en todas las páginas sin scroll adicional | Lectura del componente; se monta globalmente |
| QW-10 | `<a href>` → `<Link>` en el Footer | ✅ | Los 5 enlaces legales del Footer ahora usan `next/link` | `Footer.tsx` reescrito |
| QW-11 | Cerrar los 19 `PENDIENTE` de los 5 documentos servidos | ✅ | Reescritos `aviso-legal.md`, `politica-privacidad.md`, `terminos-condiciones.md`, `politica-propiedad-intelectual.md`, `politica-cookies.md`: aviso de prototipo, titularidad como persona física sin NIF/domicilio, canal de contacto GitHub/LinkedIn, fecha 10/08/2026, jurisdicción Málaga | `grep -c "PENDIENTE\|REQUIERE VALIDACIÓN"` = 0 en los cinco |
| QW-12 | Actualizar `legal/data-map.md` (interno) | ⚠️ **Parcial** | 17 de 19 marcadores resueltos: titular, ubicación de Supabase (Frankfurt/UE), hosting (Vercel/UE), ausencia de newsletter/menores, idioma. **2 quedan abiertos**: retención exacta de logs de Vercel (requiere consultar el panel de Vercel) y confirmación de que la purga de `system_logs` a 30 días sigue sin implementarse (job de purga inexistente) | `grep -n "PENDIENTE" legal/data-map.md` → 2 líneas, ambas marcadas como pendientes de tu verificación |
| QW-13 | Reescribir el README | ✅ | Sustituida la plantilla de `create-next-app` por: qué es el proyecto, aviso de prototipo, stack, arquitectura de carpetas, puesta en marcha con `.env.example`, comandos, enlaces a `docs/`, marca y licencia | `README.md` completo; queda un comentario HTML marcando dónde insertar capturas (acción tuya) |
| QW-14 | Crear `.env.example` | ✅ | Fichero nuevo con las 3 variables documentadas y comentadas; excepción añadida en `.gitignore` (`!.env.example`) para que se versione pese a la regla `.env*` | `.env.example` existe; `git check-ignore -v .env.example` confirma que no está ignorado |

### Bloque E — Trazabilidad

| ID | Tarea | Estado | Qué se hizo | Evidencia |
|---|---|---|---|---|
| QW-15 | Corregir `informe-cobertura.md` | ✅ | Añadido aviso de estado real al inicio, tabla de errores de ESLint, registro del test eliminado con su justificación (regla `AGENTS.md` §1), "Resumen Global" reetiquetado como histórico | `docs/testing/informe-cobertura.md` |
| QW-16 | Fila en `FASES_Y_MEJORAS.md` + tag de checkpoint | ⚠️ **Parcial** | Fila añadida (fila 11). **Tag no creado**: `AGENTS.md` §4 pide crear el tag *al completar un hito*, y el hito no está commiteado todavía — crear un tag sobre un working tree sucio no tiene sentido | `git tag` sigue mostrando solo `v0.1.0-mvp-setup` |

---

## 3. Riesgos activos

Ordenados por a quién y cuándo afectan.

| # | Riesgo | Por qué importa | Mitigación / siguiente paso |
|---|---|---|---|
| R1 | ~~La migración QW-05 no está aplicada.~~ **CERRADO 10/08/2026.** Ejecutada por el titular en el SQL Editor de Supabase, proyecto `main` (PRODUCTION): `Success. No rows returned`. | Era el hallazgo de seguridad más grave de la auditoría (S1). | Queda una verificación positiva pendiente y de bajo esfuerzo: confirmar con una sesión de usuario normal que `update usuarios_perfil set role='sysadmin' where id=auth.uid()` devuelve `permission denied for column role`, tal como exige el criterio de activación del ADR-009. No bloquea el commit de esta iteración. |
| R2 | **8 tests siguen en rojo.** `dashboard/page.test.tsx` (2) y `ParticipacionesClient.test.tsx` (6) fallan porque el código de producción evolucionó (`HubClient`, rediseño de participaciones) y los mocks no se actualizaron. | Mientras la suite esté en rojo, Vitest no emite `coverage-summary.json`: el umbral del 85% de `AGENTS.md` §1 sigue sin ser verificable. Es deuda declarada, no oculta. | Iteración 2. Requiere reescribir los mocks de Supabase de esos dos ficheros contra las queries reales. |
| R3 | **152 errores de ESLint recién descubiertos, sin corregir.** 133 son `no-explicit-any`, concentrados en las fronteras de props entre Server y Client Components. | Estaban ahí desde antes de esta sesión; simplemente nadie los había visto porque la herramienta abortaba. No los introdujo esta iteración, pero tampoco los resuelve. | Iteración 2. El desglose por regla en `informe-cobertura.md` da el orden de ataque: `any` primero (mayor volumen), luego `no-img-element`. |
| R4 | **QW-06 (open redirect) no tiene test de regresión.** El fix de `sanitizeNext()` es correcto por revisión de código, pero nada impide que un cambio futuro lo rompa sin que ningún test lo detecte. | Es exactamente el patrón que causó el bug original: nadie lo cubrió con test la primera vez. | Añadir un test unitario a `src/app/auth/confirm/route.ts` en la iteración 2, antes de tocar ese fichero de nuevo. |
| R5 | **31 ficheros modificados sin commitear.** Todo el trabajo de esta iteración vive en el working tree. | Riesgo operativo estándar: sin commit no hay punto de recuperación, y `AGENTS.md` §4 exige tags de checkpoint que solo tienen sentido sobre commits reales. | Pendiente de tu aprobación explícita del diff antes de commitear (instrucción previa de la sesión: "no he hecho commit... prefiero que revises el diff"). |
| R6 | **Retención de logs de Vercel sin verificar.** Último dato abierto de `legal/data-map.md`, y por tanto de la política de privacidad implícita del proyecto. | Es información pública (panel de Vercel), pero requiere que tú la consultes; no es derivable del código. | Consultar Vercel → Project Settings → y trasladar el dato a `data-map.md`. |
| R7 | **El repositorio de GitHub sigue llamándose `LegoVirtualMuseum`** mientras la interfaz y los legales dicen BricksVirtualCollector. | Incoherencia visible para cualquiera que compare la URL del repo con lo que ve en pantalla o lee en los legales. Menor que R1–R3, pero es justo el tipo de detalle que se nota en una primera impresión de LinkedIn. | Decisión tuya: renombrar el repo (cambia la URL pública) o mantenerlo y explicar la razón histórica en el README si alguien pregunta. |

---

## 4. Lecciones aprendidas

**1. Una herramienta que no se puede ejecutar es peor que una herramienta que da malos
resultados.** `eslint` llevaba abortando con `ENOENT` desde antes de esta sesión — probablemente
desde que se creó `coverage/` por primera vez y se excluyó del repo. Nadie lo notó porque un
comando que falla con un error de infraestructura se ignora más fácilmente que uno que reporta
152 problemas. La lección operativa: cuando una verificación de calidad no corre, tratarlo como
un hallazgo en sí mismo, no como ruido a silenciar.

**2. Eliminar código puede ser la corrección correcta, y hay que justificarlo explícitamente
cuando la regla del proyecto lo restringe.** `AGENTS.md` §1 prohíbe borrar tests que fallan. La
tentación fácil habría sido "arreglar" el test de `/mis-vitrinas` para que siguiera pasando. Pero
el test validaba un placeholder de andamiaje ("Contenido simulado"): arreglarlo habría sido
maquillar deuda, no pagarla. La decisión correcta fue eliminar la ruta duplicada y, con ella, su
test — documentando el porqué en `informe-cobertura.md` en vez de simplemente hacerlo. La regla
no prohíbe eliminar tests sin sujeto; prohíbe ocultar tests que fallan sobre código que se
mantiene.

**3. Una decisión de arquitectura (ADR-009) reduce superficie de ataque, no reemplaza corregir el
código.** Quedó explícito en la actualización de la auditoría (§3.10): la revocación de
escrituras en runtime neutraliza S1/S2/S3/S6 para un visitante externo, pero **publicar el
repositorio publica igualmente el fallo de RLS** para quien lea el código. QW-05 se hizo de todas
formas, con esa justificación. Vale la pena repetir el principio en la iteración 2: mitigación
operativa y corrección de código son cosas distintas, y una no excusa aplazar la otra
indefinidamente.

**4. Las decisiones de negocio bloquean más trabajo técnico del que parece a primera vista.** Las
4 decisiones que pediste (DEC-1 a DEC-4) desbloquearon 9 de las 16 tareas del plan — más de la
mitad. El renombrado en particular (DEC-1) tocó 8 ficheros distintos, desde metadatos SEO hasta
los 5 documentos legales. Cuando una decisión de nombre/identidad está pendiente, más vale
resolverla antes de tocar los textos legales que después: reescribir dos veces el mismo documento
por un cambio de nombre es trabajo perdido.

**5. La ejecución destapó una categoría de deuda que la auditoría original no vio: los React
Hooks.** `react-hooks/immutability`, `react-hooks/set-state-in-effect` y `react-hooks/purity` no
aparecían en `docs/auditoria-arquitectura.md` porque esa auditoría se basó en lectura de código y
greps dirigidos, no en ejecutar el linter (que no corría). Es la evidencia más concreta de por
qué "leer el código" y "ejecutar las herramientas sobre el código" no son intercambiables — ambas
son necesarias, y donde una falla, hay que arreglar la herramienta antes de fiarse del análisis
manual.

---

## 5. ADRs y decisiones formales — qué se creó, qué se modificó

| Documento | Acción | Detalle |
|---|---|---|
| `docs/06-decisiones/ADR-009-entorno-demo-publico.md` | **Creado** | Decisión de arquitectura del entorno de demostración pública: despliegue único, cuenta de solo lectura, registro cerrado. Estado: *aceptada, pendiente de activación*. |
| `legal/analisis-titularidad-persona-fisica.md` | **Creado** | No es un ADR de arquitectura sino un análisis legal, pero cumple la misma función de registro de decisión: documenta por qué el titular puede figurar como persona física sin NIF ni domicilio, y recomienda el renombrado (DEC-1) con su justificación de marca. |
| `docs/auditoria-arquitectura.md` | **Actualizado** (v1.0 → v1.1) | Añadida §3.10 con el efecto de ADR-009 sobre las severidades de los hallazgos de seguridad. El veredicto NO-GO se mantiene explícitamente. |
| `docs/05-plan/plan-remediacion-quickwins.md` | **Actualizado** (v1 → v2) | De "propuesto" a "ejecutado". Añadida §5 con el resultado real de cada criterio de aceptación, incluida la salvedad de ESLint. |
| ADR-001 a ADR-008 (`docs/06-decisiones/`) | **Sin modificar** | Se conservan con el nombre original del proyecto por ser registros históricos de decisiones ya tomadas en su momento — reescribirlos falsificaría la fecha en que se tomó cada decisión. Es coherente con la lección 4 de `docs/auditoria-arquitectura.md` §3.8 (D4): los ADRs no se tocan retroactivamente, se superan con un ADR nuevo si hace falta. |
| `docs/00-proyecto/FASES_Y_MEJORAS.md` | **Actualizado** | Filas 10 (auditoría + ADR-009) y 11 (esta iteración) añadidas a la tabla de trazabilidad, conforme a `AGENTS.md` §3. |
| `docs/testing/informe-cobertura.md` | **Actualizado** | Aviso de estado real al inicio; el "Resumen Global" con el 94,45% se reetiqueta como histórico, no como estado actual. |

**Nota sobre por qué esto no son "8 ADRs modificados":** de los 9 ADRs previos al de hoy, ninguno
se ha tocado. Solo se ha creado uno nuevo (ADR-009). Lo que sí se ha modificado son documentos de
seguimiento y auditoría, que por diseño del framework spec-vjc se actualizan in situ en vez de
versionarse como los ADRs (que son inmutables una vez aceptados).

---

## 6. Estado exacto del repositorio al cierre de esta iteración

```
Build:        ✅ next build exit 0 (42 páginas)
Type check:   ✅ tsc --noEmit sin errores
Lint:         ⚠️ eslint . → 152 errores, 94 avisos (antes: no ejecutable; deuda para iteración 2)
Tests:        ⚠️ 8 fallos / 123 (Test Files: 2 failed | 24 passed; deuda para iteración 2)
Migración S1: ✅ aplicada contra Supabase producción, confirmada por el titular
Commits:      ver tabla siguiente
Tag:          ver tabla siguiente
```

Los 46 caminos que estaban pendientes al empezar esta ronda se agruparon en commits temáticos en
vez de uno solo, siguiendo `AGENTS.md` §"Commits Estructurados y Semánticos". Parte de ese
contenido —el rediseño del Hub de dashboard, la migración de `middleware.ts` a `proxy.ts`, y dos
carpetas de documentación/skills— corresponde a una **sesión de trabajo anterior a esta
iteración**, no a las 16 tareas del plan. Se checkpointa junto con el resto porque compartía el
mismo working tree sin commitear, y dejarlo fuera habría impedido crear un punto de rollback
limpio. Cada commit está etiquetado por su origen real.

| Commit | Tipo | Contenido | Origen |
|---|---|---|---|
| 1 | `feat(proxy)` | `middleware.ts` → `proxy.ts` (convención Next 16) | Sesión anterior |
| 2 | `feat(dashboard)` | Rediseño del Hub, vitrinas, insignias, participaciones | Sesión anterior (incluye la corrección de tipos QW-01 sobre `participaciones/[id]/page.tsx`, por ser fichero nuevo no divisible en el historial) |
| 3 | `docs(skills)` | Skill `prompt-architect` y guía `getting-started` | Sesión anterior |
| 4 | `fix(build)` | `await cookies()` y `params` como `Promise` en `legal/[slug]` (QW-01) | Esta iteración |
| 5 | `fix(security)` | Saneado de `next` en `auth/confirm` contra open redirect (QW-06) | Esta iteración |
| 6 | `chore` | ESLint, nombre de paquete, `.env.example` (QW-02, QW-08, QW-14) | Esta iteración |
| 7 | `refactor` | Eliminación de `/moderacion` y `/mis-vitrinas` (QW-03, QW-04) | Esta iteración |
| 8 | `feat(security)` | Migración SQL de cierre de la escalada de privilegios (QW-05) | Esta iteración |
| 9 | `feat(brand)` | Renombrado a BricksVirtualCollector y disclaimer de marca (QW-07, QW-09) | Esta iteración |
| 10 | `docs(legal)` | Los 5 documentos legales servidos + `data-map.md` + análisis de titularidad (QW-11, QW-12) | Esta iteración |
| 11 | `docs` | Auditoría, ADR-009, plan de remediación, seguimiento, README, `FASES_Y_MEJORAS.md`, `informe-cobertura.md` (QW-13, QW-15, QW-16) | Esta iteración + `AGENTS.md` regla nueva de sesión anterior |

**Tag de checkpoint:** ver hash y nombre en el propio historial de git — se crea sobre el commit
11, una vez cerrado todo lo anterior, conforme a `AGENTS.md` §4.

### Ficheros pendientes de tu revisión antes de commit

**Eliminados** (3): `src/middleware.ts` (ya sustituido por `src/proxy.ts` en una sesión anterior a
esta), `src/app/mis-vitrinas/page.tsx`, `src/app/mis-vitrinas/page.test.tsx`.

**Modificados** (16): `.gitignore`, `AGENTS.md`, `README.md`, `docs/00-proyecto/FASES_Y_MEJORAS.md`,
`docs/testing/informe-cobertura.md`, `eslint.config.mjs`, los 5 documentos de `legal/`,
`package.json` + `package-lock.json`, `src/app/auth/confirm/route.ts`,
`src/app/como-funciona/[seccion]/page.tsx`, `src/app/como-funciona/layout.tsx`,
`src/app/dashboard/page.tsx`, `src/app/dashboard/participaciones/ParticipacionesClient.tsx`,
`src/app/globals.css`, `src/app/layout.tsx`, `src/app/legal/[slug]/page.tsx`,
`src/app/v/[id]/page.tsx`, `src/components/Footer.tsx`, `src/components/Navbar.tsx`,
`vitest.config.ts`.

**Nuevos, no rastreados** (12): incluye tanto el trabajo de esta iteración
(`.env.example`, `docs/05-plan/`, `docs/06-decisiones/ADR-009-...`, `docs/auditoria-arquitectura.md`,
`legal/analisis-titularidad-persona-fisica.md`,
`supabase/migrations/20260810120000_fix_role_privilege_escalation.sql`) como ficheros **de una
sesión anterior a esta**, ajenos a esta iteración (`src/proxy.ts`, `src/app/dashboard/HubClient.tsx`,
`src/components/CrearVitrinaModal.tsx`, `src/components/MisVitrinasClient.tsx`,
`src/components/badges/`, `src/app/dashboard/insignias/`, `src/app/dashboard/vitrinas/`,
`src/app/dashboard/participaciones/[id]/`, `.agents/skills/prompt-architect/`,
`docs/getting-started/`) — no tocados por esta iteración, se listan para que al commitear separes
con claridad qué corresponde a cada trabajo.

**Recomendación de agrupación de commits**, cuando decidas commitear (no ejecutado, a la espera de
tu aprobación):

1. `fix:` — QW-01, QW-06 (build y open redirect)
2. `chore:` — QW-02, QW-08, QW-14 (config de lint, package.json, .env.example)
3. `refactor:` — QW-03, QW-04 (eliminación de rutas de andamiaje/duplicadas)
4. `feat:` — QW-05 (migración SQL, aunque no esté aplicada)
5. `docs:` — QW-07, QW-09, QW-10, QW-11, QW-12, QW-13, QW-15, QW-16 + los 4 documentos nuevos de
   esta conversación
