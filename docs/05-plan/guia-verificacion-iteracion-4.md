---
proyecto: bricks-virtual-collector
tipo: guia
subtipo: verificacion-manual
estado: en-ejecucion
version: 1
fecha: 2026-08-18
alcance: tareas V1-V4 de la Iteración 4 (requieren accesos externos, no ejecutables desde el repo)
relacionada_con: [plan-intervencion-post-iteracion-3, seguimiento-iteracion-3, auditoria-arquitectura]
tags: [spec-vjc, verificacion, supabase, vercel]
---

# Guía de verificación manual — Iteración 4 (V1–V4)

Estas cuatro tareas no son ejecutables desde el repositorio: requieren acceso al panel de
Supabase, al de Vercel y a la aplicación levantada. Cada bloque indica **qué se espera**, no solo
qué comando lanzar — un resultado distinto al esperado es un hallazgo, no un fallo de la guía.

**Anota el resultado real de cada paso.** Al terminar, esta guía pasa a `estado: ejecutado` con
los resultados anexados, y es la evidencia que cierra el veredicto NO-GO de la auditoría.

---

## V1 — Verificación positiva de las migraciones aplicadas

**Por qué:** las 3 migraciones de la Iteración 3 se aplicaron con `Success. No rows returned`,
pero eso solo prueba que el SQL no dio error. No prueba que el esquema quedara con la forma
esperada, ni que la app funcione contra él. Es el **único ítem que sostiene el NO-GO formal**.

### V1.a — Columnas que faltaban (las que rompían crear un set y editar el alias)

En **Supabase → SQL Editor**, ejecuta:

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (
    ('sets', 'num_set'),
    ('sets', 'notas'),
    ('usuarios_perfil', 'alias'),
    ('bricks_recibidos', 'exposicion_id')
  )
order by table_name, column_name;
```

**Esperado: exactamente 4 filas.**

| table_name | column_name | data_type |
|---|---|---|
| bricks_recibidos | exposicion_id | uuid |
| sets | notas | text |
| sets | num_set | text |
| usuarios_perfil | alias | text |

> Si falta alguna, la migración `20260810160000` o `20260810140000` no se aplicó del todo.

### V1.b — Tablas que faltaban

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'exposiciones_temporales', 'exposicion_sets',
    'sets_insignias', 'bounties_reclamados'
  )
order by table_name;
```

**Esperado: exactamente 4 filas**, una por tabla.

### V1.c — RLS activada en las tablas nuevas

```sql
select relname as tabla, relrowsecurity as rls_activada
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'exposiciones_temporales', 'exposicion_sets',
    'sets_insignias', 'bounties_reclamados'
  )
order by relname;
```

**Esperado: las 4 con `rls_activada = true`.** Una tabla nueva sin RLS en un proyecto donde todo
lo demás la tiene es un agujero, no un descuido menor.

### V1.d — Buckets de Storage

```sql
select id, public, file_size_limit
from storage.buckets
where id in ('avatars', 'fotos_sets', 'exposiciones')
order by id;
```

**Esperado: 3 filas**, las tres con `public = true` y estos límites exactos:

| id | file_size_limit | equivale a |
|---|---|---|
| avatars | 2097152 | 2 MB |
| exposiciones | 5242880 | 5 MB |
| fotos_sets | 10485760 | 10 MB |

> **Ojo con esto:** la migración usa `on conflict (id) do nothing`. Si los buckets ya existían
> creados a mano desde el panel (hallazgo N6), **conservan la configuración vieja** y estos
> límites pueden no coincidir. Un `file_size_limit` distinto o `null` no es un error de la
> migración: es la prueba de que el bucket es anterior y de que el repo y la realidad divergen.
> Anótalo tal cual salga.

### V1.e — El `GRANT` sobre `alias` (hallazgo N3)

```sql
select column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'usuarios_perfil'
  and grantee = 'authenticated'
order by column_name;
```

**Esperado:** que aparezca `alias / UPDATE`. Sin esto, el formulario de alias pasa de "la columna
no existe" a "permiso denegado" — sigue roto, con otro mensaje.

**Esperado también:** que **NO** aparezca `role / UPDATE`. Esa es la migración de escalada de
privilegios de la Fase 1 (`20260810120000`); si `role` aparece aquí, la revocación no está
aplicada y el hallazgo S1 sigue abierto.

### V1.f — Diff completo esquema vs código (riesgo P1 del plan)

La Iteración 3 encontró 3 columnas faltantes leyendo el código. **Nadie ha comparado todavía el
esquema real contra *todas* las consultas.** Para descartar que queden más:

```sql
select table_name, string_agg(column_name, ', ' order by ordinal_position) as columnas
from information_schema.columns
where table_schema = 'public'
group by table_name
order by table_name;
```

Pega el resultado en el hilo de trabajo y lo contrasto contra cada `.select()`, `.insert()` y
`.update()` del código. Este es el paso que puede destapar más hallazgos de clase N1/N2.

---

## Decisión: hosting en Vercel (18/08/2026)

Confirmado con el titular: se despliega en **Vercel**, no Netlify. Coincide con `ADR-001-frontend-hosting.md` (ya aceptado) y con `legal/politica-privacidad.md:40` ("Alojamiento web: Vercel. Servidores en la Unión Europea"), así que no hace falta tocar ningún documento por el cambio de hosting en sí.

> ⚠️ **Antes de desplegar:** esto publica una URL real en internet con el registro de usuarios
> todavía abierto — ADR-009 (cierre de registro + revocación de escritura) no se activa hasta la
> Iteración 7 (L1). El plan Hobby de Vercel no ofrece protección por contraseña. No es indexable
> ni la vamos a enlazar desde ningún sitio, pero trátala como no-pública hasta cerrar esa
> iteración: no la compartas en LinkedIn ni en el README todavía.

### Paso a paso — primer despliegue en Vercel

**1. Crear la cuenta (lo haces tú, no yo — está en la lista de acciones que tengo prohibidas).**
   Ve a [vercel.com](https://vercel.com) → **Sign Up** → elige **Continue with GitHub** (recomendado:
   así Vercel ya tiene acceso al repo sin pasos extra). Plan **Hobby**, gratis, sin tarjeta.

**2. Importar el proyecto.**
   Dashboard de Vercel → **Add New… → Project** → busca `LegoVirtualMuseum` (o el nombre del repo
   en tu GitHub) → **Import**. Vercel detecta Next.js automáticamente; no toques el *Build Command*
   ni el *Output Directory*, déjalos en blanco/por defecto.

**3. Variables de entorno.**
   En la misma pantalla de importación (o luego en **Settings → Environment Variables**), añade
   las 3 de `.env.example`:

   | Variable | De dónde sacarla |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Ya la tienes en tu `.env.local` — es pública por diseño |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya la tienes en tu `.env.local` — es pública por diseño |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Esta es la que falta.** Panel de Supabase → *Project Settings → API → Project API keys* → copia la fila `service_role` (no la `anon`) |

   Marca las 3 para el entorno **Production** (y **Preview** también, si quieres que los PRs
   generen deploys de prueba funcionales).

   ⚠️ **Verificación crítica:** confirma que ninguna de las 3 lleva el prefijo `NEXT_PUBLIC_`
   añadido a `SUPABASE_SERVICE_ROLE_KEY` por error. Si esa clave saliera con `NEXT_PUBLIC_`,
   viajaría al navegador y cualquiera podría saltarse toda la RLS — sería un incidente de
   seguridad real, no una tarea pendiente.

**4. Deploy.** Un par de minutos. Al terminar te da una URL tipo
   `https://lego-virtual-museum-xxxx.vercel.app`.

**5. Verificación V2 (el motivo de todo esto):**
   - Entra con una cuenta de prueba (no la tuya).
   - `/dashboard/perfil` → botón de eliminar cuenta → confirmar.
   - **Esperado:** 200 y la cuenta desaparece. Si da 500, la variable no llegó bien o el valor es
     incorrecto (revisa que copiaste `service_role`, no `anon`, y que no sobra ni falta ningún
     espacio al pegarla).

**6. Cuando tengas la URL, pásamela** y sigo con V3 (allow-list de Redirect URLs en Supabase Auth
   — hay que añadir esa URL de Vercel a la lista) y, si quieres, dejo preparado `vercel.json` con
   `regions` fijado a Frankfurt para que la afirmación de "servidores en la UE" de la política de
   privacidad sea exacta también a nivel de ejecución del servidor, no solo de la base de datos.

---

## V2 — `SUPABASE_SERVICE_ROLE_KEY` en Vercel

**Por qué:** sin esa variable, el borrado de cuenta (derecho de supresión del RGPD) devuelve 500 y
`systemLogger` deja de escribir sin avisar. Es riesgo legal, no técnico.

**Dato confirmado hoy:** tu `.env.local` **no la tiene** (solo 143 bytes: URL + anon key). Así que
esto **no se puede probar en local** — la prueba real es en el entorno desplegado.

**Pasos:**

1. Vercel → proyecto → **Settings → Environment Variables**.
2. Busca `SUPABASE_SERVICE_ROLE_KEY`. Comprueba que existe y que está marcada para **Production**
   (y para Preview, si vas a probar ahí).
3. Comprueba que **no** tiene el prefijo `NEXT_PUBLIC_`. Si lo tuviera, la clave que salta toda la
   RLS estaría viajando al navegador: eso es un incidente de seguridad, no una tarea pendiente.
4. Si falta: Supabase → Project Settings → API → `service_role` → copiar y añadir en Vercel →
   redeploy.

**Criterio de cierre:** con la app desplegada, `/dashboard/perfil` → eliminar cuenta (con una
cuenta de prueba, no la tuya) responde 200 y la cuenta desaparece. Hoy, sin la variable, devuelve
500.

---

## V3 — Allow-list de Redirect URLs en Supabase Auth

**Por qué:** defensa en profundidad sobre el open redirect (S4) que ya está saneado en código.

**Pasos:** Supabase → **Authentication → URL Configuration**.

1. **Site URL:** debe ser el dominio real de producción. No `localhost`.
2. **Redirect URLs:** debe ser una lista explícita. Comprueba que **no** hay comodines amplios
   (`https://*`, `**`, o un `*` suelto). Un comodín amplio devuelve a S4 su severidad original.
3. Lo razonable aquí: el dominio de producción, y `http://localhost:3000/**` solo si lo necesitas
   para desarrollo.

**Anota** la lista tal cual esté, aunque te parezca correcta.

---

## V4 — Región del proyecto y retención de logs

1. **Región:** Supabase → Project Settings → General → *Region*. **Esperado: Frankfurt (UE)**, que
   es lo que afirma la Iteración 1 y lo que sostiene la política de privacidad publicada. Si
   saliera una región de EE.UU., hay una transferencia internacional que declarar y los textos
   legales servidos serían inexactos.
2. **Retención de logs:** comprueba que el job de purga a 30 días de `system_logs`
   (`20260810130000_system_logs_purge.sql`, vía `pg_cron`) está activo:

```sql
select jobname, schedule, active from cron.job;
```

**Esperado:** un job de purga con `active = true`. Si `cron.job` no existe o está vacío, la
extensión `pg_cron` no está habilitada y la promesa de retención del runbook no se cumple.

---

## Pruebas manuales en el entorno local

**El servidor ya está levantado en `http://localhost:3000`** (`npm run dev`, Next 16 + Turbopack,
contra tu Supabase real de `.env.local`).

> ⚠️ **`.env.local` apunta a tu Supabase real, no a una base de datos de pruebas.** Todo lo que
> crees o borres aquí se escribe en producción. Usa una cuenta de prueba, no la tuya, y sets que
> puedas borrar después.

### Prueba 1 — Crear un set (cierra N1, el hallazgo más grave de la Iteración 3)

1. Inicia sesión.
2. Ve a **`/mesa-de-trabajo`** y crea un set nuevo **rellenando `Número de set` y `Notas`** — son
   precisamente las dos columnas que no existían. Si dejas esos campos vacíos la prueba no vale.
3. Sube una foto (ejercita también el bucket `fotos_sets`).

**Esperado:** el set se guarda y aparece en la vitrina. **Si falla**, mira el error exacto: si
dice `column "num_set" does not exist`, la migración `20260810160000` no está aplicada; si dice
`permission denied`, es un problema de `GRANT`/RLS, no de esquema. Son dos hallazgos distintos.

### Prueba 2 — Editar el alias (cierra N2 y N3)

1. **`/dashboard/perfil`** → cambia el campo **Alias** → guarda.
2. Recarga la página.

**Esperado:** el alias persiste tras recargar. Un alias que "se guarda" pero vuelve al valor
anterior al recargar es el síntoma de que falta el `GRANT UPDATE (alias)` de V1.e.

### Prueba 3 — Editar y borrar un set

1. **`/mesa-de-trabajo/[id]`** del set que acabas de crear → edítalo → guarda → recarga.
2. Bórralo y comprueba que desaparece de verdad.

**Por qué importa:** estas dos acciones eran `setTimeout` + redirección hasta la Iteración 3 (no
tocaban la base de datos). Es la primera vez que se prueban contra Supabase real.

### Prueba 4 — Voto único en exposiciones (cierra N5)

1. Entra en una exposición (**`/exposicion/[id]`**) y vota un set.
2. **Vuelve a votar el mismo set.**

**Esperado:** el segundo voto se rechaza o no incrementa el contador. Antes de la corrección del
hash determinista, se podía votar sin límite.

### Prueba 5 — `/admin/status` ya no existe

Abre **`http://localhost:3000/admin/status`**.

**Esperado: 404** (o redirección al login si no tienes sesión de admin). Era una ruta navegable
con KPIs y logs inventados que duplicaba `/admin/system/health` y `/admin/system/logs`.

### Prueba 6 — Confirmar el mock que sigue vivo (H1, no corregido todavía)

Esta prueba **debe fallar**: sirve para que veas de primera mano el hallazgo que la Iteración 5
va a corregir.

1. Abre **`/dashboard/participaciones/[id]`** con cualquier id, incluso uno inventado.

**Esperado hoy:** siempre aparece "Modular Master", 500 de recompensa, 66% de progreso y tres
tareas fijas (`Set #10297`, `#10260`, `#10326`). Confírmalo y anótalo: es la prueba de que F1.4
se dio por cerrada sin estarlo.

### Prueba 7 — Los tres focos de datos simulados restantes

- **`/dashboard/insignias`** → contadores de insignias y bounties fijos, no vienen de la BD (H3).
- **`/perfil/[id]`** con dos ids distintos → **deben** mostrar datos distintos. Si mostraran lo
  mismo, la corrección R2 de la Iteración 3 no funcionó contra datos reales.
- **`/set/[id]`** con un id inexistente → **debe** dar 404. Antes caía al primer set de la lista
  de mocks y enseñaba un set falso para cualquier id.

---

## Resultados (ejecutado 18/08/2026, verificado contra el código en la misma sesión)

| ID | Comprobación | Resultado esperado | Resultado real | ✅/❌ |
|---|---|---|---|---|
| V1.a | 4 columnas | 4 filas | 4 filas, coinciden exactamente | ✅ |
| V1.b | 4 tablas | 4 filas | 4 filas, coinciden exactamente | ✅ |
| V1.c | RLS activada | 4 × true | 4 × true | ✅ |
| V1.d | 3 buckets | 3 filas, límites exactos | 3 filas, `public=true`, pero **`file_size_limit = null` en las 3** | ⚠️ ver nota |
| V1.e | GRANT alias sí / role no | alias UPDATE presente, role ausente | alias/UPDATE presente; role sin UPDATE (solo INSERT/REFERENCES/SELECT) | ✅ |
| V1.f | Volcado de esquema | diff contra el código | diff completo hecho, sin discrepancias nuevas de clase N1/N2 — ver nota | ✅ |
| V4 (parcial) | pg_cron activo | job de purga activo | `ERROR 42P01: relation "cron.job" does not exist` — **extensión no habilitada** | ❌ |

### V1.d — nota: los buckets no tienen el límite de tamaño de la migración

`file_size_limit = null` en `avatars`, `fotos_sets` y `exposiciones` confirma la hipótesis que ya
recogía la propia migración: **los 3 buckets existían creados a mano desde antes**, y
`on conflict (id) do nothing` no toca una fila que ya existe — ni siquiera para completar el
límite que le faltaba. No es un fallo de la migración, es la migración documentando un límite que
nunca se aplicó. **Consecuencia real:** el límite de 2/10/5 MB solo se aplica hoy en el cliente
(`perfil/page.tsx:63`, `MesaTrabajoClient.tsx:80`); una subida directa a la API de Storage sin
pasar por la UI no tiene tope en el servidor. Menor que un hallazgo de seguridad (no hay
escritura pública sin sesión — RLS decide quién sube), pero si se abre el registro es una tarea de
un `update storage.buckets set file_size_limit = ... where id = '...'` de 5 minutos. Añadido al
plan como **S7 (nuevo)**.

### V1.f — nota: diff completo hecho, tres tablas de solo lectura confirmadas

Se ha contrastado cada `.from()`/`.select()`/`.insert()`/`.update()` de `src/` contra el volcado.
Todas las columnas usadas existen en el esquema — **no hay ningún hallazgo nuevo de clase N1/N2**.
Sí se confirma y se amplía un patrón ya conocido: además de `bounties_reclamados` (N8, documentado
en la Iteración 3), **`sets_insignias` tampoco la escribe ningún flujo real** — se lee en 3 sitios
(`dashboard/page.tsx`, `dashboard/participaciones/page.tsx`, y de ahí `InsigniasClient`) pero
ningún `.insert()` en todo `src/` apunta a esa tabla. Es la misma causa raíz que el `TODO` de
`admin/exposiciones/page.tsx:106` ("Aquí deberemos calcular y repartir las insignias"): **no
existe lógica de reparto**, así que tanto `/dashboard/insignias` (H3) como el widget "última
insignia" de la home del dashboard muestran siempre vacío o dato simulado, no solo la página que
ya estaba señalada. Refuerza D3 tal cual está en el plan — no cambia la decisión, la hace más
concreta. Además, `insignias_usuario` no aparece en ningún fichero de `src/`: es esquema muerto,
igual que `reportes` (S6).

### V4 — pg_cron no está habilitado: la purga de logs no se ejecuta

La migración `20260810130000_system_logs_purge.sql` anticipaba este fallo exacto en sus propios
comentarios ("en algunos proyectos, `CREATE EXTENSION` puede fallar por permisos si nunca se ha
habilitado antes"). El error confirma que ni la extensión ni el job existen hoy. **Esto contradice
directamente `legal/politica-privacidad.md` §2**, que promete retención de 30 días para
`system_logs`. Es un hallazgo nuevo — llamémoslo **V4a**: riesgo bajo (son logs técnicos propios,
no datos de terceros) pero es una promesa legal publicada que hoy no se cumple.

**Cómo resolverlo:** Supabase → **Database → Extensions** → busca `pg_cron` → actívala con el
interruptor. Después, vuelve al SQL Editor y ejecuta solo la sección 2 del fichero de migración
(el bloque `select cron.schedule(...)`, líneas 27–34). Verifica con:

```sql
select jobname, schedule, active from cron.job;
```

Repite V3 y la región (V4b) cuando tengas un minuto — no las has enviado todavía.

---

## Resultados de las pruebas manuales P1–P7 (18/08/2026)

| ID | Comprobación | Resultado esperado | Resultado real | ✅/❌ |
|---|---|---|---|---|
| V2 | service_role key | existe, sin `NEXT_PUBLIC_` | **N/A todavía** — despliegue en curso (Vercel) | — |
| V3 | Redirect URLs | lista explícita, sin comodines | pendiente | |
| V4b | Región del proyecto | Frankfurt (UE) | pendiente | |
| P1 | Crear set con num_set y notas | se guarda | ✅ confirmado por el titular | ✅ |
| P2 | Editar alias | persiste al recargar | ✅ toast "Perfil actualizado correctamente", confirmado por el titular | ✅ |
| P3 | Editar/borrar set | efecto real en BD | ❌ **2 bugs reales encontrados y corregidos** — ver B1/B2 abajo | ❌→✅ |
| P4 | Voto doble (bricks) | segundo rechazado | ✅ correcto — el botón se autodeshabilita tras el primer voto, ver nota | ✅ |
| P5 | `/admin/status` | 404 | ✅ confirmado | ✅ |
| P6 | Participaciones | "Modular Master" (fallo esperado) | ✅ confirmado, es el hallazgo H1 ya conocido, sin cambios todavía | ✅ (fallo esperado) |
| P7a | Insignias hardcodeadas | datos simulados | ✅ confirmado, y **más grave de lo documentado** — ver nota | ✅ (fallo esperado) |
| P7b | Perfil con id inexistente | 404 | ✅ correcto — ver nota, no es un bug | ✅ |

### B1 y B2 — dos bugs reales de `/dashboard/vitrina/[id]` (encontrados en P3, corregidos)

El botón "Editar" (lápiz) de un set dentro de una vitrina apuntaba a
`/mesa-de-trabajo?set_id=${set.id}` — la ruta de **crear** un set, no de editarlo.
`MesaTrabajoClient.tsx` solo lee `vitrina_id` y `bounty_id` de la URL, nunca `set_id`, así que:
la pantalla que aparecía era literalmente el formulario "Añadir Set" (exactamente lo que
reportaste), y si se hubiera enviado, habría **creado un set duplicado** en vez de editar el
existente — el bug era más serio que solo la etiqueta del botón.

El botón "Eliminar" (papelera) de la misma tarjeta era un `<button>` sin `onClick`, dentro de un
Server Component (`dashboard/vitrina/[id]/page.tsx`, sin `"use client"`). Estructuralmente no
podía hacer nada al pulsarlo — de ahí el "no acciona nada".

**Corregido en [`src/app/dashboard/vitrina/[id]/page.tsx`](../../src/app/dashboard/vitrina/%5Bid%5D/page.tsx):**
el enlace "Editar" ahora apunta a `/mesa-de-trabajo/${set.id}` — la ruta que ya existía, ya
probada y ya funcionando (`EditarSetClient.tsx`, con "Guardar Cambios" y "Borrar Set" reales
contra Supabase, RLS incluida). El botón "Eliminar" muerto se ha retirado en vez de
reimplementarlo: duplicar la lógica de borrado en dos sitios habría violado la regla
Zero-Duplication (`AGENTS.md` §2) cuando ya existe un punto único que funciona.

**Verificado:** `tsc --noEmit` ✅, suite 200/200 ✅ (cobertura sin bajar). **Pendiente de que tú
confirmes visualmente** en tu sesión — no tengo tus credenciales para probarlo logueado.

### Nota P4 — el voto doble de bricks funciona, pero por una razón distinta a la que preguntas

No hay bug: el botón "Dar Brick" se autodeshabilita (`disabled={hasLiked || submitting}`) en
cuanto se registra el primer voto, así que el segundo clic no llega a disparar ninguna petición —
por eso no ves ni error ni cambio. Es el comportamiento correcto. **Esto no es lo mismo que P4 de
la guía original**, que pedía probar el voto en una **exposición** (`/exposicion/[id]`), el flujo
que tenía el bug real del hash no determinista (N5, ya corregido). Si tienes una exposición activa
con la que probar, esa es la que de verdad ejercita la corrección — la del botón "Dar Brick" en
`/set/[id]` nunca tuvo ese bug.

### Nota P6 — qué hace falta para que Participaciones deje de ser mock

Es exactamente el hallazgo **D1** del plan: `api/bounties/claim` escribe el reclamo en
`bounties.reclamado_por`, pero `/dashboard/participaciones/[id]` lee de `bounties_reclamados`,
una tabla que ese flujo nunca escribe. Antes de tocar código hay que decidir el modelo (¿un
bounty solo puede reclamarlo una persona, o puede haber varios reclamos con estados por
separado?). En cuanto lo decidas, la implementación (H1) es acotada: cambiar esa página para leer
de `bounties` con el join real, igual que ya hace `/dashboard/participaciones` (la lista, que sí
está bien conectada — la comprobé línea por línea en V1.f).

### Nota P7a — las insignias están más rotas de lo que documentaba el plan

Confirmado con la lectura del código: `InsigniasClient.tsx` tiene *"Bounties 12"*, *"Insignias 8"*
y *"Mosaico 3 Blocks"* como literales sueltos (uno de ellos ni siquiera en una constante,
directamente el número `8` en el JSX). `BadgeShowcase.tsx`, un componente hijo del mismo árbol,
tiene por su cuenta *"2 / 24 Desbloqueadas"*. **Son dos mocks distintos que nunca se han
sincronizado entre sí** — de ahí que "los datos no cuadren", que es justo lo que notaste. Y hay
una tercera pieza con el mismo problema de raíz que el plan no había señalado: el widget "última
insignia" de la portada del dashboard (`dashboard/page.tsx`) consulta de verdad `sets_insignias`,
pero **ningún flujo del código escribe nunca en esa tabla** (el `TODO` de
`admin/exposiciones/page.tsx:106` es la prueba: el reparto de insignias no está implementado en
ningún sitio). Los tres — la página, el widget de la home y el contador de la cabecera — dependen
de la misma pieza que falta: decidir e implementar D3.

### Nota P7b — el 404 de `/perfil/1` y `/perfil/12` es correcto, no es un bug

`usuarios_perfil.id` es `uuid` (referencia a `auth.users`). `1` y `12` no son UUIDs válidos, así
que la consulta no devuelve fila y la página llama a `notFound()` — es exactamente el
comportamiento que R2 debía tener (antes de la Iteración 3, *cualquier* id, válido o no, mostraba
siempre "MasterBuilder_84"). Para probar un perfil real: en la página de un set
(`/set/[id]`), la tarjeta "Expuesto por" ya es un enlace a `/perfil/<uuid real del dueño>` —
haz clic ahí en vez de escribir un id a mano.

---

## Plantilla de resultados — pendiente

| ID | Comprobación | Resultado esperado | Resultado real | ✅/❌ |
|---|---|---|---|---|
| V3 | Redirect URLs | lista explícita, sin comodines | | |
| V4b | Región del proyecto | Frankfurt (UE) | | |
| B1/B2 | Fix de Editar/Eliminar en vitrina | funcionan de extremo a extremo | pendiente de tu confirmación visual | |
| P4-bis | Voto doble en una **exposición** real | segundo voto rechazado | pendiente | |

---

## Verificación de las migraciones D1/D3 (19/08/2026)

Ambas migraciones aplicadas por el titular contra Supabase real.

- **`20260818120000`**: el `ERROR 42P07 relation already exists` en el segundo bloque era ruido,
  no un fallo de estado — Postgres lanza `duplicate_table` (42P07), no `duplicate_object` (42710),
  cuando un `UNIQUE` con nombre ya existe (crea un índice internamente). El manejador de
  excepción del fichero solo capturaba 42710; corregido para capturar ambos. Constraint y
  columna confirmados en su sitio.
- **`20260818130000`**: aplicada sin error. Se detectó que `sets_insignias` ya tenía 2 políticas
  no rastreadas en ninguna migración (`"Only admins can manage insignias"` ALL, `"Public can view
  insignias"` SELECT) — creadas a mano antes de que existiera migración para esta tabla, mismo
  patrón que el hallazgo N6 (buckets sin migrar). Verificadas sus definiciones (`qual`/`with_check`):
  la de escritura restringe correctamente a `role = 'admin'` vía `auth.uid()`, sin permisividad de
  más. **No es un hallazgo de seguridad**, solo redundancia inofensiva (RLS se combina con OR) —
  limpieza opcional, no urgente: se podrían retirar las 2 políticas viejas dejando solo las 4
  rastreadas en el repo, pero el efecto neto ya es el correcto tal como está.
