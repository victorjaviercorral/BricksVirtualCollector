---
proyecto: bricks-virtual-collector
tipo: plan
subtipo: implementacion
estado: en ejecución (Fases 0-6 ✅ · Fase 7 en curso por el titular · Fase 8 entregada, capturas pendientes · S7 pendiente de aplicar)
fecha: 2026-09-09
decide_sobre: modelo de acceso público antes del go-live (evaluación A/B/C previa en la conversación)
reemplaza_a: ADR-009 (queda superado por el ADR-011 de la Fase 0)
relacionada_con: [ADR-009-entorno-demo-publico, guia-verificacion-iteracion-4, navegacion-y-flujos, e2e-post-refactors-insignias-explorar]
tags: [spec-vjc, plan, go-live, acceso-invitado, supabase-anonymous, seguridad]
---

# Plan de implementación — Opción C: acceso de invitado con sandbox aislado

## 0. Contexto y decisión

El objetivo del go-live es que **cualquiera pueda hacer un walkthrough completo de la app
(crear vitrina → subir set → publicar → votar → reclamar un bounty → desbloquear una insignia)
sin barrera de registro**, preservando seguridad y sin datos de terceros expuestos.

Se descartaron:
- **A (solo lectura):** deja inertes voto / reclamo / insignias, que son el núcleo de la app.
- **B (registro real abierto):** el email + verificación es la barrera que se quiere evitar, y
  reabre todo el bloque de seguridad "Iteración 8+" antes de anunciar.

**Se elige C:** modelo de **tres niveles** sobre un único proyecto de Supabase:

| Nivel | Quién | Qué puede hacer | Cómo |
|---|---|---|---|
| **Visitante** | Sin sesión | Navegar todo el contenido público en solo lectura | Ya funciona (`/galeria`, `/exposiciones`, `/bounties`, `/vitrina/[id]`, `/perfil/[id]`) |
| **Invitado** | Sesión anónima (`is_anonymous`) | Walkthrough completo en un **sandbox propio** sembrado; sus escrituras **no** aparecen en superficies públicas; la sesión y sus datos **expiran** | `supabase.auth.signInAnonymously()` + RLS de aislamiento + `pg_cron` de purga |
| **Coleccionista** | Cuenta real (email) | Todo, y su contenido **sí** entra en galería/mosaico/perfiles | Registro normal, o **upgrade** desde el modo invitado conservando lo creado |

La práctica de referencia para esto es **Supabase Anonymous Sign-Ins** (feature GA), pensada
exactamente para "try before signing up". El invitado obtiene un `auth.uid()` real, así que
**toda la RLS existente sigue aplicando**; solo se añade la distinción invitado/real.

---

## 1. Principios de esta implementación

1. **El aislamiento lo garantiza el motor, no la aplicación.** La distinción invitado/real vive
   en una columna de `usuarios_perfil` y se aplica en políticas RLS y en las consultas de las
   superficies públicas. Nada depende de un `if` en un componente.
2. **Esqueleto desplegado primero.** Fase 2 deja un flujo de invitado funcional aunque tosco;
   el endurecimiento (aislamiento fino, purga, abuso, semilla) viene después, sobre algo que ya
   se puede probar en producción.
3. **Cero mantenimiento recurrente.** Un único `pg_cron` barre invitados caducados; sus datos se
   van en cascada por las FK `on delete cascade` a `auth.users`. No hay reseteo manual ni
   moderación de contenido de invitados (nunca es público).
4. **Reversible.** Si el modelo no convence, desactivar el toggle de Anonymous Sign-Ins y ocultar
   el botón deja el sitio como B (registro real) sin tocar esquema.

---

## 2. Hechos del código que condicionan el plan (para no redescubrirlos)

| Área | Hecho | Fichero |
|---|---|---|
| Trigger de alta | `handle_new_user()` se dispara en **cualquier** insert en `auth.users` → un invitado ya recibe fila en `usuarios_perfil` automáticamente. Hay que marcarla. | `supabase/migrations/20260808120000_user_signup_trigger.sql` |
| Cascada de borrado | `usuarios_perfil.id → auth.users on delete cascade`; `vitrinas.usuario_id → usuarios_perfil on delete cascade`; y así hasta `fotos`. Borrar el `auth.users` limpia casi todo. | `20260805171025_init_schema.sql:6,20` |
| `bricks_recibidos` | `hash_visitante` es `text` **sin FK** a `auth.users`. En voto normal vale `auth.uid()::text`. La purga debe borrar estas filas explícitamente. | `20260805171025_init_schema.sql`, `src/app/api/bricks/route.ts:33` |
| Vitrina nueva | `visibilidad default 'privada'`, `estado default 'borrador'` → una vitrina de invitado no entra en galería salvo que él la publique. Palanca: bloquear `visibilidad='pública'` para invitados. | `20260805171025_init_schema.sql:24` |
| Galería (dueño) | `perfil?.alias || perfil?.username || "Coleccionista anónimo"` — lee `usuarios_perfil` vía join, política `SELECT using(true)`. | `src/lib/galeria.ts:68`, `src/lib/queries/vitrinas.ts:27-39` |
| `/perfil/[id]` | Filtra vitrinas por `estado='publicada' AND visibilidad='pública'`. El perfil en sí es visible para cualquiera. | `src/app/perfil/[id]/page.tsx:23-37` |
| Mosaico | `getMosaicoComunitario` lee **todas** las filas de `insignias_usuario` por fecha, con join a `usuarios_perfil`. Un invitado que desbloquea aparecería. | `src/lib/queries/insignias-usuario.ts:206-224` |
| Hub | "Set destacado" y "sets de la comunidad" = `.from('sets').order('creado_en').limit(4)` sin filtro de dueño. Un set de invitado podría salir de destacado. | `src/app/dashboard/page.tsx:53-60` |
| Subida de fotos | Único camino: `POST /api/sets/foto` (Route Handler, `service_role`, verifica sesión, limpia EXIF con `sharp`, tope 10 MB server-side). | `src/app/api/sets/foto/route.ts` |
| Login | `handleLogin` intenta `signInWithPassword` y si falla con "Invalid login credentials" hace `signUp` implícito. El registro está **abierto**. | `src/app/login/page.tsx:38-58` |
| Middleware | Protege `/dashboard`, `/mesa-de-trabajo`, `/admin`, `/ajustes` (redirige a `/login` sin `user`). Solo `/admin/system` comprueba rol. Un invitado **pasa** todos los `!user`. | `src/lib/supabase/middleware.ts` |
| `/admin/exposiciones`, `/admin/bounties` | **No** tienen chequeo de rol a nivel de página (dependen de RLS para escritura). Un invitado podría *ver* estas pantallas. | `src/app/admin/exposiciones/page.tsx` |
| Tour | `src/components/tour/steps.ts:5` menciona "entorno de demostración de solo lectura (ADR-009)" → hay que actualizarlo. | `src/components/tour/steps.ts` |
| `pg_cron` | **No está habilitado** en el proyecto (hallazgo V4a: la política de privacidad promete retención de logs a 30 días y no se cumple). Esta implementación lo habilita y de paso cierra V4a. | `docs/05-plan/guia-verificacion-iteracion-4.md` §V4 |

**Distinguir invitado en RLS:** el JWT lleva el claim `is_anonymous`. En políticas:
`coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)`. Se materializa además en
`usuarios_perfil.es_invitado` para poder filtrar en consultas y en la purga.

---

## 3. Fases

Cada fase termina con criterios de aceptación verificables. Convención de commits semánticos y
un tag de checkpoint al cerrar el plan (regla 4 de `AGENTS.md`).

### Fase 0 — ADR-011 (decisión registrada) · ~30 min · ✅ COMPLETADA (2026-09-09)

> **Estado:** `docs/06-decisiones/ADR-011-acceso-invitado-tres-niveles.md` en `estado: aceptada`;
> ADR-009 pasa a `estado: superada` con nota de superación en cabecera; fila nueva (ID 22) en
> `docs/00-proyecto/FASES_Y_MEJORAS.md`. Entregado en la rama `feat/acceso-invitado-fase-1-cimientos`.

- Crear `docs/06-decisiones/ADR-011-acceso-invitado-tres-niveles.md`:
  - Contexto: evaluación A/B/C, por qué C.
  - Decisión: el modelo de tres niveles de la sección 0 de este plan.
  - Estado de ADR-009: **superado** (añadir nota "Superada por ADR-011" en su cabecera, sin
    borrarlo).
  - Consecuencias: qué del bloque "Iteración 8+" sigue siendo obligatorio **aunque** haya
    invitados (S1 escalada de privilegios, S5 CSP — se escriben datos reales por invitados y por
    cuentas), y qué deja de serlo (moderación de contenido de terceros: los invitados nunca son
    públicos; coste variable de Storage: acotado por la purga y por el tope de fotos de invitado).
  - Criterio de verificación de activación (reemplaza el de ADR-009).
- Actualizar `docs/00-proyecto/FASES_Y_MEJORAS.md` con una fila nueva.

**Aceptación:** ADR-011 en `estado: aceptada`; ADR-009 con la nota de superación; fila en FASES.

---

### Fase 1 — Cimientos de datos (migración SQL) · ~medio día · ✅ COMPLETADA Y VERIFICADA (2026-09-09)

> **Estado:** migración `supabase/migrations/20260909110000_acceso_invitado.sql` aplicada por el
> titular contra Supabase real, y *Anonymous Sign-Ins* habilitado. **Verificación funcional
> end-to-end pasada** (script sobre el proyecto real, invitado de prueba creado y purgado):
>
> | Criterio | Resultado |
> |---|---|
> | `signInAnonymously()` → sesión con `is_anonymous: true` (user y claim JWT) | ✅ |
> | Trigger crea perfil: `es_invitado=true`, `username='Invitado_<hex>'`, `consentimiento_version=null`, `consentimiento_fecha=null` | ✅ |
> | `insert vitrinas … visibilidad='pública'` con sesión anónima → rechazado (42501) | ✅ |
> | `insert vitrinas … visibilidad='privada'` con sesión anónima → OK | ✅ |
> | `update` de vitrina propia a `visibilidad='pública'` → rechazado (42501) | ✅ |
> | `insert sets` en vitrina propia (sandbox) → OK | ✅ |
> | `update usuarios_perfil set role='sysadmin'` con sesión anónima → rechazado (42501) | ✅ |
> | `deleteUser` del invitado → cascada limpia perfil/vitrina/set (0 filas restantes) | ✅ |
>
> **Incidencia resuelta durante la activación:** el titular activó también hCaptcha, lo que dejó
> caído todo el login de producción (`captcha_failed: no captcha_token found` en
> `signInWithPassword` y `signInAnonymously` — el front no monta widget de captcha). Se desactivó
> el CAPTCHA; queda para la Fase 6 hacerlo bien (cuenta hCaptcha + widget). Supabase ya limita
> por IP los `signInAnonymously`.
>
> Entregado en la rama `feat/acceso-invitado-fase-1-cimientos` (PR #4).

Una única migración `supabase/migrations/AAAAMMDDHHMMSS_acceso_invitado.sql` (ejecutada por el
titular contra Supabase real, con la consulta previa a `pg_policy` en la cabecera, patrón de las
migraciones existentes — deriva de nombres detectada 5 veces).

1. **Columna y flag:**
   ```sql
   alter table public.usuarios_perfil
     add column if not exists es_invitado boolean not null default false;
   create index if not exists usuarios_perfil_es_invitado_idx
     on public.usuarios_perfil (es_invitado) where es_invitado;
   ```
2. **Trigger:** `handle_new_user()` pasa a leer `new.is_anonymous` y a fijar
   `es_invitado = coalesce(new.is_anonymous, false)`; para invitados, `username =
   'Invitado_' || substr(new.id::text,1,8)` y `consentimiento_version = null` (no aceptan
   términos; el modo invitado no trata datos personales — ver Fase 7 legal).
3. **Bloqueo de publicación para invitados** (política `with check` de INSERT y UPDATE de
   `vitrinas`, con el nombre real confirmado por `pg_policy`):
   añadir a la condición existente
   `and (not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
         or visibilidad <> 'pública')`.
   Un invitado puede crear/editar vitrinas, pero no ponerlas `pública`.
4. **(Opcional, defensa en profundidad) exclusión en la lectura pública de `vitrinas`:** la
   política "Public vitrinas are viewable by everyone" ya exige `estado='publicada' and
   visibilidad='pública'`; con el punto 3 basta, pero puede añadirse
   `and not exists (select 1 from usuarios_perfil p where p.id = vitrinas.usuario_id and p.es_invitado)`.
5. **`bricks_recibidos` / `bounties_reclamados` / `insignias_usuario` / `exposicion_sets`:** no
   se tocan las políticas (el aislamiento por `auth.uid()` ya está); la purga (Fase 3) se
   encarga de que no queden restos.

**Acción manual del titular (documentada en el ADR y en la guía):** Supabase → Authentication →
Providers → **habilitar "Anonymous Sign-Ins"**. Opcional pero recomendado: activar **CAPTCHA**
(hCaptcha/Turnstile) para el endpoint de anon sign-in.

**Aceptación:**
- `select column_name from information_schema.columns where table_name='usuarios_perfil' and column_name='es_invitado'` → 1 fila.
- Con una sesión anónima de prueba, `insert into vitrinas (..., visibilidad) values (..., 'pública')` → **falla**; con `'privada'` → OK.
- Un `insert` de vitrina/set/brick/reclamo con sesión anónima **funciona** (sandbox).
- El toggle de Anonymous Sign-Ins está activo (probar `supabase.auth.signInAnonymously()` desde la consola del navegador en producción).

---

### Fase 2 — Entrada de invitado + separación Login/Registro · ~1 día · 🟡 ENTREGADA — PENDIENTE DE VERIFICACIÓN VISUAL (2026-09-09)

> **Alcance ampliado tras el análisis del titular (2026-09-09).** Además de la entrada de
> invitado, esta fase separa login y registro en dos rutas y alinea el mínimo legal. Tres
> decisiones tomadas:
>
> | Decisión | Elegido |
> |---|---|
> | Consentimiento del invitado | **Tácito por acción** (sin checkbox); rastro en `raw_user_meta_data.guest_terms_version` |
> | Estructura | **Rutas separadas** `/login` (solo entrar) y `/registro` (crear cuenta, con checkbox) |
> | Legal | **Mínimo imprescindible en Fase 2**; barrido completo en Fase 8 |
>
> Detalle en `docs/03-diseno/acceso-y-registro.md` y ADR-011 §"Consentimiento y aceptación".

1. **`src/lib/legal.ts`** — constantes `TERMS_VERSION` / `GUEST_TERMS_VERSION` (retira el `'v1.0'`
   hard-coded).
2. **`src/components/auth/AuthCard.tsx`** — shell visual compartido por login y registro
   (Zero-Duplication).
3. **`src/components/EntrarComoInvitado.tsx`** (client) — `signInAnonymously({ options: { data:
   { guest_terms_version } } })` → `window.location.href = '/dashboard'`; error con `toast`.
   `variant` `panel` (cards de auth, con nota de aceptación tácita) / `hero` (home).
4. **`/login` reescrito a "solo entrar"** — sin checkbox, sin auto-`signUp`; credenciales
   inválidas → mensaje + enlace a `/registro`.
5. **`/registro` nuevo** — email + password + checkbox obligatorio → `signUp` con
   `terms_version: TERMS_VERSION`; maneja "confirma tu email".
6. **CTAs** — hero `/` → `/registro` + botón invitado; Navbar móvil "Entrar" + "Crear cuenta";
   `/v/[id]` → `/registro`.
7. **Legal (mínimo)** — `politica-privacidad.md` (aviso de prototipo + sección "Modo invitado" +
   tabla §2 + §4/§6), `terminos-condiciones.md` (aviso + §1.4 modo invitado), `data-map.md`
   (banner + fila Art. 30).
8. **Documentación** — ADR-011 §"Consentimiento y aceptación"; `docs/03-diseno/acceso-y-registro.md`
   (nuevo, con el checklist "Qué ajustar para un lanzamiento oficial");
   `docs/testing/fase2-login-registro.md` (por qué cambian las expectativas de `login/page.test.tsx`).

**Verificación local (Quality Gate):** `tsc` limpio · suite 579 → **589** (73 ficheros) ·
cobertura S 95,74 / B 88,28 / F 94,71 / L 96,84 (los 5 ficheros nuevos + `login` al 100×4) ·
`lint:ci` 157 → **154** (baseline actualizado; la reescritura del test retira `any` preexistente) ·
`next build` verde (`/registro` presente).

**Aceptación (pendiente de verificación visual del titular en el preview de Vercel):**
- Desde `/login`, `/registro` o `/`, un clic entra al Hub con sesión anónima
  (`is_anonymous: true`, `usuarios_perfil.es_invitado = true`,
  `raw_user_meta_data.guest_terms_version = 'invitado-v1'`).
- El invitado completa el walkthrough: crear vitrina (privada), subir un set, votar en contenido
  público, reclamar un bounty, ver una insignia desbloquearse.
- Un email nuevo en `/login` ya **no** crea cuenta; deriva a `/registro`.
- `/registro` sin checkbox → error; con checkbox y email nuevo → crea cuenta.

**Nota:** Fase 2 se despliega para pruebas pero **no se anuncia** — la purga de invitados (Fase 3)
es requisito antes de cualquier exposición pública, y la Política de Privacidad ya promete las
48 h.

---

### Fase 3 — Purga automática (`pg_cron`) · ~2 h · cierra también V4a · 🟡 ENTREGADA — PENDIENTE DE APLICAR (2026-09-09)

> **Estado:** migración `supabase/migrations/20260909120000_purga_invitados.sql` escrita —
> función `purgar_invitados_expirados(ventana interval)` + job `purga-invitados` (03:17 UTC) +
> reprogramación de `purge-system-logs` (V4a). Cabecera con acción manual, bloque de verificación
> y rollback.
> **Decisión sobre Storage:** la función borra las filas de `storage.objects` del invitado (por
> prefijo de carpeta `<uid>/`, porque las fotos se suben vía service_role y `owner` puede ser
> null). Deja el blob físico huérfano — limitación conocida de Supabase; volumen acotado (tope de
> fotos de invitado en Fase 6, que además puede bloquear la subida) y un GC real del blob queda
> como follow-up. `bounties_reclamados` / `insignias_usuario` / `exposicion_sets` van en cascada
> al borrar el `auth.users`; los bricks del invitado sobre sets **ajenos** se borran a mano.
> **Acción manual del titular:** habilitar `pg_cron` (Supabase → Database → Extensions) y aplicar
> la migración. Entregado en la rama `feat/acceso-invitado-fase-3-4` (PR).

1. **Habilitar `pg_cron`:** Supabase → Database → Extensions → `pg_cron` (acción del titular).
2. **Función `public.purgar_invitados_expirados()`** (`security definer`):
   - Selecciona `auth.users` con `is_anonymous` y
     `coalesce(last_sign_in_at, created_at) < now() - interval '48 hours'` (ventana configurable).
   - Borra sus filas de `bricks_recibidos` (`where hash_visitante = ANY(...)` y
     `where hash_visitante like 'exposicion-%-user-<id>'`).
   - `delete from auth.users where id = ANY(...)` → cascada a `usuarios_perfil`, `vitrinas`,
     `sets`, `fotos`, `insignias_usuario`, `bounties_reclamados`, `exposicion_sets`.
   - Borra los objetos de Storage de esos sets (bucket `fotos_sets`) — vía
     `storage.delete_object` o registrando un listado para un `service_role` job; documentar la
     opción elegida.
3. **Job:** `select cron.schedule('purga-invitados', '17 3 * * *', 'select public.purgar_invitados_expirados()');`
4. **Migración `AAAAMMDDHHMMSS_purga_invitados.sql`** con función + job + verificación.
5. **De paso — V4a:** ejecutar también la sección 2 de
   `20260810130000_system_logs_purge.sql` (el job de purga de `system_logs`, hoy inactivo por
   `pg_cron` deshabilitado) y confirmar `select jobname, active from cron.job`.

**Aceptación:**
- `select jobname, schedule, active from cron.job` → 2 jobs activos (`purga-invitados` y el de
  logs).
- Crear un invitado, forzar `last_sign_in_at` a hace 3 días, ejecutar
  `select purgar_invitados_expirados()` manualmente → el `auth.users`, su `usuarios_perfil`, sus
  vitrinas/sets/fotos, sus `bricks_recibidos` e `insignias_usuario` desaparecen; ninguna cuenta
  real se toca.

---

### Fase 4 — Upgrade invitado → cuenta real · ~medio día · 🟡 ENTREGADA — PENDIENTE DE APLICAR + VERIFICACIÓN (2026-09-09)

> **Estado:** código en la rama `feat/acceso-invitado-fase-3-4` (mismo PR que la Fase 3).
> - Migración `supabase/migrations/20260909130000_upgrade_invitado_cuenta.sql` — trigger
>   `on_auth_user_upgraded` (`after update on auth.users`): cuando `is_anonymous` pasa true→false,
>   pone `es_invitado=false`, cambia el `username` `Invitado_*` por `Coleccionista_*` (o el
>   elegido) y fija `consentimiento_version`/`fecha` reales.
> - `src/components/BannerInvitado.tsx` (montado en el **layout raíz** cuando `user.is_anonymous`
>   — no hay `dashboard/layout.tsx`; así el invitado lo ve en toda la app) + `UpgradeCuentaModal`
>   (`updateUser({ email, password, data: { terms_version } })`; maneja confirmación inmediata y
>   pendiente de email).
> - **Acción manual del titular:** aplicar `20260909130000_upgrade_invitado_cuenta.sql`.
>
> Verificación local: `tsc` limpio · suite 589 → **598** (75 ficheros) · cobertura
> S 95,9 / B 88,5 / F 94,62 / L 96,98 (componentes nuevos 97,7 / 94,4 / 91,7 / 97,5) ·
> `lint:ci` 154 (sin cambios) · `next build` verde.

1. **Banner persistente de modo invitado** (`src/components/BannerInvitado.tsx`, montado en el
   layout raíz cuando `is_anonymous`): "Estás en **modo demo** — tu colección se borra
   en 48 h. **Guárdala creando una cuenta.**" con botón.
2. **Flujo de upgrade:** un modal con email + contraseña + aceptación de términos →
   `supabase.auth.updateUser({ email, password })` y `updateUser({ data: { terms_version } })`.
   Al confirmar el email, un trigger/al recargar: `es_invitado = false`,
   `consentimiento_version`/`fecha` a valores reales. Los datos creados como invitado **se
   conservan** (mismo `auth.uid()`).
   - Trigger o función: `on update of auth.users` cuando `is_anonymous` pasa a `false` →
     `update usuarios_perfil set es_invitado = false where id = new.id`. (O comprobarlo en el
     `getUser` del servidor y sincronizar.)
3. **Copy del banner y del modal:** dejar claro qué se guarda y que a partir de ahí sí se tratan
   datos personales (enlace a la política).

**Aceptación:**
- Un invitado con una vitrina y un set hace upgrade con un email real → tras confirmar,
  `es_invitado = false`, la vitrina y el set siguen ahí, y ahora **puede** publicarla y aparece
  en galería.
- El invitado sin upgrade sigue viendo el banner en cada carga del dashboard.

---

### Fase 5 — Aislamiento de las superficies públicas (frontend + tests) · ~medio día · ✅ ENTREGADA — PENDIENTE DE VERIFICACIÓN VISUAL (2026-09-09)

> **Estado:** código en la rama `feat/acceso-invitado-fase-5-aislamiento` (PR). Sin migración.
> - **Mosaico** (`getMosaicoComunitario`): es la **única** superficie que la RLS no filtra
>   (`insignias_usuario` tiene política `using(true)`) — filtro `!inner` + `es_invitado=false` en
>   la consulta de hitos **y** en el `count` del total.
> - **`/perfil/[id]`**: `notFound()` si `profile.es_invitado` (responde 404, no un perfil vacío).
> - **Galería** (`getVitrinasPublicas`), **Home** (`page.tsx`), **Hub** (`dashboard/page.tsx`
>   sets): filtro `!inner` + `es_invitado=false` como **defensa en profundidad** — la RLS ya lo
>   cubre (un invitado no puede publicar, Fase 1) pero se repite explícito, mismo criterio que
>   `/perfil/[id]`.
> - **`/set/[id]` y `/vitrina/[id]` por URL directa**: ya cubierto por RLS (la vitrina de un
>   invitado es `privada`; solo su dueño la lee) + el manejo de `null` existente (`set/[id]`
>   `notFound()`, `VitrinaClient` estado "no encontrada"). Sin cambios.
>
> Tests: `getMosaicoComunitario` excluye invitados (hitos + total), `getVitrinasPublicas` con el
> filtro, `/perfil/[id]` → 404 para invitado. Suite 598 → **601** (+3), cobertura
> S 96,06 / B 88,58 / F 94,86 / L 97,16 · `lint:ci` 154 · `tsc` limpio · `next build` verde.

Excluir `es_invitado` de todo lo que se muestra a terceros. En cada consulta, añadir el filtro
por el flag (join a `usuarios_perfil` o `.eq`/`.not`).

| Superficie | Fichero | Cambio |
|---|---|---|
| Galería | `src/lib/queries/vitrinas.ts` (la consulta pública) | filtrar vitrinas cuyo dueño tenga `es_invitado` |
| `/perfil/[id]` | `src/app/perfil/[id]/page.tsx` | si el perfil es `es_invitado` → `notFound()` |
| Mosaico | `src/lib/queries/insignias-usuario.ts:206` (`getMosaicoComunitario`) | filtrar `insignias_usuario` de dueños `es_invitado` en `bloques` y en `total` |
| Hub — set destacado y "comunidad" | `src/app/dashboard/page.tsx:53-60` | `.from('sets')` con join/filtro que excluya sets de invitados |
| Home — vitrinas destacadas y últimos sets | `src/app/page.tsx` (consultas SSR) | mismo filtro |
| `/set/[id]`, `/vitrina/[id]` de un invitado accedidos por URL directa | páginas correspondientes | un set/vitrina de invitado solo lo ve su dueño (ya lo hace la RLS de `vitrinas` para no-públicas; verificar `sets` y `set/[id]`) |

Tests: cada consulta pura o de query afectada gana un caso "excluye invitados". Suite verde,
cobertura ≥ 85%.

**Aceptación:**
- Con un invitado que ha publicado (si se le permitiera) / desbloqueado insignias / subido sets:
  `/galeria`, `/perfil/<id-invitado>` (404), el Mosaico, el Hub y la home **no** muestran nada
  suyo.
- Un coleccionista real sigue apareciendo en todas ellas.

---

### Fase 6 — Contención de abuso · ~medio día · 🟡 ENTREGADA — PENDIENTE DE APLICAR S7 + VERIFICACIÓN (2026-09-09)

> **Estado:** código en la rama `feat/acceso-invitado-fase-6-abuso` (PR).
> - **`/admin/*` cerrado** (`src/lib/supabase/middleware.ts`): el chequeo de rol se extiende a
>   todo `/admin`. `/admin/system` mantiene `isSystemRole`; el resto admite además
>   `admin_exposiciones` (`isModeratorRole`) — coherente con el gate propio de `/admin/moderacion`.
>   Un invitado (`role='user'`, o sin perfil) → redirigido a `/dashboard`.
> - **Fotos de invitado — tope reducido** (decisión del titular, 2026-09-09):
>   `POST /api/sets/foto` aplica 3 MB (vs 10) y máx **6** fotos por invitado (`user.is_anonymous`),
>   contando su carpeta `<uid>/` en el bucket. Mensajes que empujan al upgrade.
> - **S7** — migración `supabase/migrations/20260909140000_storage_file_size_limits.sql`:
>   `update storage.buckets set file_size_limit` para los 3 buckets (por si el proyecto real los
>   tenía a null). **Acción manual del titular:** aplicar esta migración.
> - **Rate-limit de anon sign-in:** Supabase ya limita por IP (~30/h por defecto). Documentado en
>   `docs/03-diseno/acceso-y-registro.md`; CAPTCHA con widget sigue diferido a cuando el volumen
>   lo justifique.
>
> Verificación local: `tsc` limpio · suite 601 → **609** (+8) · cobertura
> S 96,03 / B 88,55 / F 94,86 / L 97,12 · `lint:ci` 154 · `next build` verde.

1. **`/admin/*` cerrado a invitados y no-admins en el middleware** (`src/lib/supabase/middleware.ts`):
   extender el chequeo de rol de `/admin/system` a **todo** `/admin` (un invitado tiene
   `role='user'` → fuera).
2. **Subida de fotos para invitados** — decidir y aplicar en `POST /api/sets/foto`:
   - **Recomendado:** permitirla pero con tope reducido (p. ej. 3 MB) y máximo N fotos por
     invitado; la purga se lleva los ficheros. Alternativa más conservadora: bloquear la subida
     para `is_anonymous` y que el invitado use una imagen de marcador de posición.
3. **Rate-limit de creación de sesiones anónimas:** Supabase ya limita; documentar el límite y
   activar CAPTCHA si el volumen lo justifica.
4. **S7 (tope de bucket server-side):** ejecutar
   `update storage.buckets set file_size_limit = ... where id in ('avatars','fotos_sets','exposiciones')`
   — 5 min, cierra un hallazgo abierto y protege la subida de invitados.

**Aceptación:**
- Un invitado que navega a `/admin/exposiciones` → redirigido a `/dashboard`.
- La subida de foto respeta el tope de invitado (probar con un fichero por encima).
- `select id, file_size_limit from storage.buckets` → los 3 con límite no nulo.

---

### Fase 7 — Contenido semilla · ~medio día

Para que el invitado tenga con qué interactuar desde el primer segundo:

1. **Cuenta "museo"** (real, `es_invitado=false`, `role='user'`), con:
   - 3–4 **vitrinas publicadas** con 2–3 sets cada una y fotos reales (temáticas variadas para
     ejercitar el filtro de galería).
   - Fotos limpias de EXIF (subidas por el flujo normal).
2. **Un bounty abierto** de ejemplo (`estado='pendiente'`), reclamable.
3. **Una exposición activa continua** de ejemplo, con 1–2 sets aprobados, para que el invitado
   pueda votar y ver el ranking en vivo. (Opcional pero cierra el bucle completo.)
4. Documentar en el ADR/README qué es contenido semilla y que no se borra.

**Aceptación:** un invitado recién creado ve, sin haber hecho nada, ≥ 3 vitrinas en `/galeria`,
≥ 1 bounty en `/bounties`, y (si se hace el punto 3) una exposición activa donde votar.

---

### Fase 8 — Copy, legal y documentación · ~medio día · 🟡 ENTREGADA — PENDIENTE DE CAPTURAS (2026-09-12)

> **Estado:** rama `feat/acceso-invitado-fase-8-docs` (PR). Sin código de producción ni
> migraciones — solo `docs/`, `legal/`, `README.md` y un comentario en `steps.ts`.
> 1. **Política de privacidad y Términos:** ya quedaron correctos en la Fase 2 (sección "Modo
>    invitado" con las 48 h, sin email, sin datos de terceros); revisados de nuevo ahora que las
>    Fases 3-6 están operativas — el texto sigue siendo exacto, sin cambios.
> 2. **README:** el aviso de "prototipo" describía un registro cerrado y contenido ficticio —
>    **falso** desde la Fase 2. Reescrito con los tres niveles de acceso y enlace a ADR-011.
>    Recuento de ADRs corregido (9 → 12). **Capturas/GIF siguen pendientes** — necesitan una
>    sesión real del titular con el flujo de invitado ya desplegado.
> 3. **`tour/steps.ts`:** ya no menciona el entorno de solo lectura de ADR-009 (superado); explica
>    que el modo invitado sí ejecuta los flujos del tour.
> 4. **`navegacion-y-flujos.md`:** sección nueva "Los tres niveles de acceso" (tabla
>    visitante/invitado/coleccionista + puntos de entrada), enlazada a
>    [[03-diseno/acceso-y-registro]]; retirada la nota obsoleta sobre revertir `/exposiciones`
>    público si ADR-009 cerraba el contenido.
> 5. **`auditoria-arquitectura.md`:** nota en el resumen ejecutivo y en §3.10 — ADR-009 superado
>    por ADR-011, el veredicto GO/NO-GO se re-emite en la Fase 9 (preflight), no en este
>    documento histórico.
> 6. **`FASES_Y_MEJORAS.md`:** fila 22 actualizada (no se "cierra": quedan las Fases 7 y 9).
>
> Verificación local: `tsc` limpio, `lint:ci` 154 (sin cambios — ningún fichero de `src/` toca
> lógica, solo un comentario). Sin migraciones que aplicar.

1. **Política de privacidad:** sección nueva sobre el modo invitado — no se pide email, qué se
   guarda (contenido creado en la sesión), cuánto (48 h), que se borra por completo, y que no
   hay tratamiento de datos personales de terceros para invitados. Revisar que el resto del
   texto sigue siendo exacto tras la Fase 3 (retención de logs ya real).
2. **README (H4):** capturas/GIF del flujo — "Prueba la demo" y el walkthrough.
3. **`src/components/tour/steps.ts`:** quitar la mención a "solo lectura (ADR-009)"; el tour
   ahora describe un modo invitado con escritura.
4. **`docs/03-diseno/navegacion-y-flujos.md`:** documentar los tres niveles y los puntos de
   entrada.
5. **`docs/auditoria-arquitectura.md`:** nota de que ADR-009 queda superado y el veredicto NO-GO
   se reevalúa en la Fase 9.
6. **`FASES_Y_MEJORAS.md`:** cerrar la fila del plan.

**Aceptación:** ningún documento de `docs/` ni copy de la app afirma un estado contradicho por
el comportamiento real (solo lectura, "puntos", retención de logs no cumplida).

---

### Fase 9 — E2E automatizado + preflight · ~1 día

1. **Spec de Playwright** `e2e/invitado.spec.ts` contra un Supabase de pruebas (no producción):
   entrar como invitado → crear vitrina → subir set → votar → reclamar bounty → ver insignia →
   comprobar que **no** aparece en `/galeria`. Añadir al `Quality Gate` (workflow) o a un job
   nocturno (cierra parte de T2).
2. **`spec-vjc-framework:preflight`** contra el despliegue real → veredicto
   **GO / GO CON EXCEPCIONES / NO-GO**. Documentar las excepciones si las hay (p. ej. S3 rate
   limiting compartido, S5 CSP si no entran en este plan).
3. **Tag `v1.0.0-acceso-invitado`** al cerrar, con push de commits y tags.

**Aceptación:** spec de invitado pasando; preflight con veredicto GO o GO CON EXCEPCIONES
documentadas; tag publicado.

---

## 4. Fuera de este plan (pero condición de anuncio, del bloque "Iteración 8+")

Estos siguen siendo obligatorios antes de **anunciar** el enlace, porque los invitados y las
cuentas reales escriben datos reales:

- **S1** — verificar en producción que la escalada de privilegios en RLS está cerrada (el repo
  ya es público).
- **S5** — cabecera `Content-Security-Policy` (hoy solo X-Frame/HSTS/nosniff).
- **S3** — rate limiting con almacén compartido (requiere cuenta Upstash — decisión del titular).
- **S2** — test extremo a extremo de la limpieza EXIF con una foto con GPS real.

El preflight de la Fase 9 debe listarlos explícitamente como excepciones si no se abordan antes.

---

## 5. Dependencias

```
Fase 0 (ADR) ──> todo lo demás
Fase 1 (esquema + toggle) ──> Fase 2, 3, 4, 5, 6
Fase 2 (entrada) ──> Fase 4 (upgrade), Fase 9 (E2E)
Fase 3 (purga) ──> requiere pg_cron (compartido con V4a)
Fase 5 (aislamiento) ──> Fase 9 (E2E lo verifica)
Fase 7 (semilla) ──> Fase 9 (el E2E necesita contenido con el que interactuar)
Fase 8, 9 ──> go-live
```

## 6. Estimación

~4–5 días de trabajo efectivo, más las acciones manuales del titular (toggle de Anonymous
Sign-Ins, `pg_cron`, aplicar 2 migraciones, montar la cuenta semilla).
