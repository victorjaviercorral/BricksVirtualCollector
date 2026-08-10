---
proyecto: lego-virtual-museum
tipo: seguimiento
alcance: Bloques A (datos mock), B (migraciones), C (autorización de servidor), D (EXIF, diferido)
estado: ejecutado, migraciones aplicadas, sin commitear
version: 2
fecha: 2026-08-10
autor: sesión de agente (Claude Code) sobre instrucción de Víctor Javier Corral
relacionada_con: [seguimiento-iteracion-2, ADR-010-reconciliacion-exif-rate-limiting, auditoria-arquitectura]
tags: [spec-vjc, seguimiento, trazabilidad]
---

# Seguimiento de ejecución — Iteración 3 (bloqueantes de Fase 1 restantes)

**Contexto de entrada:** al empezar, `v0.3.0-fase2-ronda1` estaba commiteado y empujado. Esta
ronda ataca los bloqueantes de la auditoría que quedaron explícitamente fuera de las dos
anteriores: datos mock en páginas públicas (R2/R3), migraciones incompletas (A1) y autorización
de servidor (S2/S3). El EXIF server-side (F2.2/S5) se revisó y se mantiene diferido — sin cambios
respecto a lo ya documentado en ADR-010.

**✅ Actualización 10/08/2026, tras la primera entrega de esta ronda:** las 3 migraciones han sido
aplicadas por el titular en el SQL Editor de Supabase (proyecto de producción), las tres con
resultado `Success. No rows returned`, en el orden en que están numeradas. **No se ha ejecutado
todavía la verificación positiva** (confirmar con consultas de `information_schema` que las
tablas/columnas/buckets existen con la forma esperada, y probar en la app real que crear un set y
editar el alias ya funcionan) — es el paso que cierra de verdad el hallazgo N1/N2 de la sección 3,
no solo que el `CREATE`/`ALTER` no diera error.

---

## 1. Resumen de cumplimiento

| Métrica | Valor |
|---|---|
| Bloques completados | **3 / 4** (A, B, C completos; D diferido con motivo ya documentado) |
| Suite de tests | **200/200 en verde, 40/40 ficheros** (partía de 169/169 — +31 tests, +4 ficheros) |
| Cobertura (4 métricas) | Statements 93,92% · Branches 86,52% · Functions 89,59% · Lines 95,09% — las 4 siguen por encima del 85% |
| `next build` | ✅ verde, 42 páginas |
| `tsc --noEmit` | ✅ verde |
| `eslint .` | 201 errores / 82 avisos (cierre Fase 2: 186/89) — producción **baja de 76 a 75**, tests sube por los ~50 tests nuevos (patrón ya establecido) |
| Migraciones SQL nuevas | 3, **las 3 aplicadas y confirmadas por el titular** (`Success. No rows returned`) |
| Hallazgos nuevos, no presentes en la auditoría original | **7** (ver §3) |
| Commits realizados | **0** — pendiente de tu revisión, con más motivo que nunca dado que hay migraciones de esquema |

**Lectura honesta:** esta es la ronda que más ha cambiado el veredicto real del proyecto, aunque
el veredicto formal de la auditoría (NO-GO) se mantiene hasta que las migraciones se apliquen y
se verifiquen contra Supabase real. El hallazgo más importante no estaba en la lista original:
**crear un set nuevo desde `/mesa-de-trabajo` probablemente falla hoy en producción** porque el
formulario inserta dos columnas (`num_set`, `notas`) que nunca existieron en la tabla `sets`.
Ninguna auditoría de código lo había detectado porque los tests mockean el cliente de Supabase
por completo — el mismo patrón de "el mock oculta el desajuste de esquema" que ya causó el bug
de `created_at`/`creado_en` en la Fase 1.

---

## 2. Bloques — estado detallado

### Bloque A — Retirada de datos mock en páginas públicas (hallazgos R2/R3)

Las tres páginas que la auditoría original señaló por nombre, reescritas de Server Component +
Client Component, siguiendo el patrón ya establecido en el resto del proyecto.

| Ruta | Antes | Ahora |
|---|---|---|
| `/perfil/[id]` | Ignoraba el id de la URL; mostraba siempre "MasterBuilder_84" (`MOCK_USER`) | `page.tsx` consulta `usuarios_perfil` por id real + sus vitrinas públicas/publicadas; `PerfilPublicoClient.tsx` conserva la visita guiada con las fotos reales. Se retiran los campos ficticios sin respaldo de datos (`verified`, `featured`, `views` por set) en vez de inventar una fuente para ellos. |
| `/set/[id]` | Buscaba en `MOCK_SETS` y caía a `MOCK_SETS[0]` si no encontraba el id (mostraba un set falso para CUALQUIER id inexistente) | `page.tsx` consulta `sets` por id real; RLS decide visibilidad (si la vitrina es privada de otro usuario, la consulta no devuelve nada y se llama `notFound()`). El botón "Dar Brick" ahora llama de verdad a `POST /api/bricks` (antes solo cambiaba un contador local en el navegador) y respeta si el visitante ya votó. |
| `/mesa-de-trabajo/[id]` | "Editar" y "Borrar" eran `setTimeout` + redirección; no tocaban la base de datos | `page.tsx` exige sesión y ownership real (`.eq('usuario_id', user.id)`); `EditarSetClient.tsx` hace `update()`/`delete()` reales contra `sets`, con los mismos guardas (RLS ya cubría ambos casos desde la migración inicial). |

`src/lib/data.ts` (`MOCK_USER`, `MOCK_SETS`, `MOCK_BOUNTIES`) **eliminado**: verificado que no
quedaba ninguna referencia real tras las tres reescrituras (cierra también el hallazgo A8 de la
auditoría, que señalaba este fichero como mezcla de datos de demo dentro de `src/lib/`).

### Bloque B — Migraciones completas (hallazgo A1)

Tres migraciones nuevas, derivadas leyendo cada `.select()`/`.insert()`/`.update()` real del
código (no inventadas), con instrucciones de verificación previa incluidas en cada fichero:

| Fichero | Contenido |
|---|---|
| `20260810140000_missing_tables_exposiciones_bounties_insignias.sql` | 4 tablas (`exposiciones_temporales`, `exposicion_sets`, `sets_insignias`, `bounties_reclamados`) con RLS completa, más `alter table bricks_recibidos add column exposicion_id` |
| `20260810150000_storage_buckets.sql` | 3 buckets de Storage (`avatars`, `fotos_sets`, `exposiciones`) que nunca habían tenido migración, con políticas de lectura pública y escritura restringida por propietario/rol |
| `20260810160000_missing_columns_alias_num_set_notas.sql` | `usuarios_perfil.alias` (+ el `GRANT UPDATE` que la migración de seguridad de la Fase 1 no pudo conceder porque no sabía que la columna existía) y `sets.num_set` / `sets.notas` |

**Las 3 aplicadas** por el titular, en orden, todas con `Success. No rows returned`. Pendiente:
la verificación positiva (consultar `information_schema`/`storage.buckets` para confirmar que
todo quedó con la forma esperada, y probar en la app real que crear un set y editar el alias
funcionan) — un `CREATE`/`ALTER` sin error no garantiza por sí solo que el resto del sistema
(RLS, la propia app) se comporte como se espera.

De paso, se corrigió un bug de integridad de datos directamente relacionado con la tabla
`exposicion_sets` que se estaba versionando: `ExposicionClient.tsx` construía el hash de voto
como `user-${userId}-${Date.now()}`, lo que generaba un hash distinto en cada clic y anulaba por
completo la restricción `unique(set_id, hash_visitante)` — un visitante podía votar sin límite
por el mismo set. Corregido a un hash determinista por usuario+set+exposición.

### Bloque C — Autorización de servidor (hallazgos S2/S3)

| Fichero | Antes | Ahora |
|---|---|---|
| `admin/moderacion/actions.ts` | Cualquier usuario con sesión podía invocar `approveAction`/`rejectAction` directamente (sin pasar por la UI) sin ninguna comprobación de rol | `isModerator()` consulta `usuarios_perfil.role` y exige `admin` o `admin_exposiciones` antes de mutar. Coincide deliberadamente con la comprobación ya existente en `moderacion/page.tsx`, no con la lista más amplia de `admin/layout.tsx` — ver hallazgo nuevo #7 en §3. |
| `api/bounties/claim/route.ts` | Sin verificar que el `setId` perteneciera a quien reclama; el `UPDATE` no era atómico (ventana de carrera entre comprobar `estado='pendiente'` y escribir); sin límite en el número de bricks insertados | Verificación de propiedad del set (403 si no es tuyo); `UPDATE` condicionado por `.eq('estado','pendiente')` + comprobación de filas afectadas (cierra la condición de carrera); `MAX_REWARD_BRICKS = 1000` como salvaguarda defensiva |

---

## 3. Hallazgos nuevos (no estaban en `docs/auditoria-arquitectura.md`)

Descubiertos al leer cada `.insert()`/`.update()` real contra el esquema real para escribir las
migraciones del Bloque B — la misma disciplina que ya había producido hallazgos en la Fase 1.

| # | Hallazgo | Severidad estimada | Estado |
|---|---|---|---|
| N1 | **`sets.num_set` y `sets.notas` no existen.** El formulario de "Añadir Set" de `MesaTrabajoClient.tsx` (código ya en producción, no un mock) inserta ambas columnas. Contra un Supabase con solo la migración inicial aplicada, cada intento de crear un set falla. | 🔴 Bloqueante — funcionalidad central rota | Migración escrita (`20260810160000`), sin aplicar |
| N2 | **`usuarios_perfil.alias` no existe.** El formulario "Alias (Opcional)" de `/dashboard/perfil` lee y escribe esta columna; también se usa en `/v/[id]` y `admin/moderacion`. | 🔴 Bloqueante — funcionalidad rota | Migración escrita, sin aplicar |
| N3 | **La migración de seguridad de la Fase 1 (`20260810120000`) no concede `UPDATE` sobre `alias`** porque la columna no se conocía en ese momento. Si N2 se corrige sin esto, el formulario de alias pasa de "columna no existe" a "permiso denegado" — sigue roto. | 🟠 Consecuencia de N2 | `GRANT` añadido en `20260810160000` |
| N4 | **`bricks_recibidos.exposicion_id` no existe** pero `ExposicionClient.tsx` y `exposicion/[id]/page.tsx` la leen/escriben para calcular el ranking por evento. | 🟠 | Migración escrita |
| N5 | **Voto sin límite en exposiciones** (hash con `Date.now()`, ver Bloque B). Cualquiera podía inflar el ranking votando repetidamente por el mismo set. | 🟠 Integridad de datos | Corregido en código |
| N6 | **Ningún bucket de Storage tenía migración.** `avatars`, `fotos_sets`, `exposiciones` se crearon (se asume) a mano desde el dashboard de Supabase en algún momento; sin ellos versionados, un entorno nuevo no puede reproducir la subida de imágenes. | 🟠 Reproducibilidad | Migración escrita |
| N7 | **Inconsistencia de roles entre tres puntos de decisión distintos**: `admin/layout.tsx` muestra el enlace a Moderación a `admin`, `admin_exposiciones` **y `sysadmin`**; `admin/moderacion/page.tsx` solo deja pasar a `admin`/`admin_exposiciones` (redirige a un sysadmin que hace clic en el enlace); las Server Actions nuevas de esta ronda replican la comprobación de `page.tsx`, no la de `layout.tsx`. No se ha "arreglado" en ninguna dirección porque cambiar el comportamiento de quién modera no era el objetivo de este cambio — se documenta para que sea una decisión consciente, no un efecto secundario. | 🟡 Inconsistencia de producto | Sin resolver, documentado |
| N8 | **`bounties_reclamados` no está poblada por el flujo real de reclamo.** `api/bounties/claim/route.ts` escribe en `bounties.reclamado_por`; `dashboard/participaciones/[id]/page.tsx` lee de `bounties_reclamados`, una tabla distinta que nada escribe. Es una discrepancia arquitectónica (¿modelo de un-solo-reclamante o de tabla-de-reclamos?), no un bug de una línea — no se resuelve en esta ronda, solo se documenta en el propio fichero de migración para que la decisión sea explícita cuando se tome. | 🟡 Decisión de arquitectura pendiente | Tabla creada (cumple A1), sin wiring |

---

## 4. Riesgos activos

| # | Riesgo | Mitigación / siguiente paso |
|---|---|---|
| R1 | ~~Las 3 migraciones nuevas no están aplicadas~~ **APLICADAS** por el titular, las 3 con éxito. Queda la verificación positiva (comprobar que quedaron con la forma exacta esperada y que la app funciona de verdad contra ellas), no solo que el `CREATE`/`ALTER` no diera error. | Ejecutar las consultas de verificación de cada fichero (`information_schema`, `storage.buckets`) y probar en la app real: crear un set desde `/mesa-de-trabajo`, editar el alias desde `/dashboard/perfil`. |
| R2 | ~~N1 y N2 implican que dos funcionalidades centrales pueden estar rotas~~ La migración que las corrige (`20260810160000`) está aplicada. Falta confirmar en la app real que crear un set y editar el alias ya funcionan de extremo a extremo (RLS + UI), no solo que la columna exista. | Prueba manual en la app real: crear un set nuevo, editar el alias del perfil. |
| R3 | **`/dashboard/insignias` (InsigniasClient.tsx) sigue mostrando datos simulados** ("Datos simulados por ahora (hasta implementar BD)", contador de bounties e insignias hardcodeados). No estaba en el alcance original de R2/R3 (que señalaba `/perfil/[id]`, `/set/[id]`, `/mesa-de-trabajo/[id]` por nombre) y no se ha tocado: no existe ninguna lógica real de reparto de insignias en el proyecto (el propio `admin/exposiciones/page.tsx:106` lo marca con un `TODO`), así que "conectar a datos reales" significaría diseñar esa lógica desde cero, no una reescritura acotada como las tres de esta ronda. | Queda como hallazgo nuevo para una decisión de producto explícita, no una tarea de código de esta iteración. |
| R4 | **N7 y N8 son inconsistencias documentadas, no resueltas.** Dejarlas así es una decisión deliberada (no forzar una dirección sin que sea pedida), pero siguen siendo comportamiento real del producto que alguien podría notar. | Documentadas en el código (comentarios) y aquí; a la espera de que se decida qué hacer con cada una. |
| R5 | **EXIF (Bloque D) sigue sin resolver (S5).** La postura de ADR-010 se reafirma sin cambios: implementarlo sin poder verificarlo contra un Storage real es más riesgo que beneficio en esta fase. | Sin cambios respecto al plan ya documentado en ADR-010. |

---

## 5. Lecciones aprendidas

**1. Escribir migraciones para tablas que "ya deberían existir" es, en la práctica, una auditoría
de esquema completa.** No bastaba con crear las 4 tablas que la auditoría original nombraba (A1);
leer cada `.insert()`/`.update()` real contra el esquema real destapó 3 columnas adicionales
faltantes (`alias`, `num_set`, `notas`) y una relación (`bricks_recibidos.exposicion_id`) que
nadie había detectado, porque ningún test las ejercita contra un esquema real — todos mockean el
cliente de Supabase. La auditoría original ya señalaba esto como limitación (A1: "no verificable
desde el código"); esta ronda demuestra hasta qué punto: **dos funcionalidades centrales del
producto (crear set, editar alias) probablemente están rotas en producción** y nadie lo sabía.

**2. Un mock de Supabase que nunca fallidamente rechaza una columna inexistente es un mock
peligroso.** Los tests de `MesaTrabajoClient.tsx` llevan meses en verde insertando `num_set` y
`notas` porque el mock de `.insert()` simplemente devuelve `{error: null}` sin validar nada
contra un esquema. Esto no es un defecto de los tests en sí (mockear Supabase es la única opción
razonable en un test unitario), es un recordatorio de que **la suite verde no sustituye a
verificar contra el esquema real** — es exactamente la brecha que las migraciones completas y,
más adelante, un entorno de verificación real, deberían cerrar.

**3. Corregir una migración de seguridad ya aplicada exige una migración nueva, no editar la
vieja.** El hallazgo N3 (el `GRANT` de la Fase 1 no cubre `alias` porque la columna no se conocía
entonces) se resolvió con un fichero nuevo que añade el permiso que faltaba, en vez de reabrir
`20260810120000_fix_role_privilege_escalation.sql`. Es el mismo principio que ya se aplicó con los
ADRs (inmutables una vez aceptados/aplicados): una migración que el titular ya ejecutó contra
producción no se reescribe con el beneficio de información que no se tenía en su momento — se
corrige hacia delante, con la corrección documentando explícitamente qué faltaba y por qué.

**4. No todo lo que "parece resolverse fácil" merece resolverse en la misma pasada.** N7
(inconsistencia de roles) y N8 (`bounties_reclamados` sin poblar) se detectaron con la misma
facilidad que N1/N2, pero arreglarlas habría significado tomar una decisión de producto
(¿quién modera exactamente? ¿qué modelo de reclamo de bounties es el correcto?) sin que nadie la
pidiera. Documentarlas explícitamente en vez de "arreglarlas" en la dirección que pareciera más
obvia es la aplicación directa de no inventar alcance no solicitado, incluso cuando el código ya
está abierto delante y la tentación de "ya que estoy" es alta.

**5. El botón de voto de `ExposicionClient.tsx` (N5) es un recordatorio de por qué "hash único
para evitar duplicados" necesita ser determinista, no aleatorio.** `api/bricks/route.ts` (la ruta
correcta, ya existente) usa `user.id` solo — determinista, la restricción de unicidad funciona.
`ExposicionClient.tsx` añadía `Date.now()` "para que no colisione", exactamente al revés de lo que
la restricción `unique(set_id, hash_visitante)` necesita para funcionar. El patrón correcto ya
existía en el mismo código base a dos ficheros de distancia; el bug es una inconsistencia entre
dos implementaciones del mismo concepto, no un error de diseño de la restricción.

---

## 6. Qué sigue sin resolverse tras esta ronda

- El veredicto de `docs/auditoria-arquitectura.md` sigue siendo **NO-GO** hasta que las
  migraciones se apliquen y verifiquen contra Supabase real.
- EXIF server-side (S5): diferido, sin cambios respecto a ADR-010.
- Rate limiting compartido entre instancias (S8): diferido, bloqueado por decisión externa
  (cuenta Upstash) — sin cambios respecto a la Fase 2.
- `/dashboard/insignias` con datos simulados (R3 de esta tabla): nuevo hallazgo, sin lógica real
  de reparto de insignias que conectar.
- N7 (inconsistencia de roles) y N8 (`bounties_reclamados` sin poblar): documentadas, no
  resueltas — decisiones de producto pendientes.
- Consolidación de vistas de vitrina (F2.6), tipado completo (F2.8), E2E de negocio (F2.12):
  siguen diferidas desde la Fase 2, sin cambios.
- ~~Ninguna de las 3 migraciones de esta ronda está aplicada.~~ **Las 3 están aplicadas** (titular,
  10/08/2026). Queda la verificación positiva: comprobar contra `information_schema`/
  `storage.buckets` que quedaron con la forma exacta esperada, y probar en la app real que crear
  un set y editar el alias funcionan de extremo a extremo.
