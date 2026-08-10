---
proyecto: lego-virtual-museum
tipo: auditoria
subtipo: arquitectura-y-calidad
etapa: mvp
exposicion: X2
estado: emitida
version: 1.1
fecha: 2026-08-10
actualizado: 2026-08-10 — §3.10 añadida con la decisión ADR-009 y su efecto sobre las severidades
alcance: repositorio completo (working tree)
commit_base: 16b8908
tags: [spec-vjc, auditoria, pre-lanzamiento]
---

# Auditoría de Arquitectura, Estructura y Calidad — Lego Virtual Museum

**Motivo:** lanzamiento público del MVP a una audiencia profesional (LinkedIn).
**Naturaleza:** diagnóstico. No se ha modificado ningún fichero de producción.
**Base auditada:** working tree en `main` (commit `16b8908` + 9 ficheros modificados y 8 sin
versionar). Cuando un hallazgo difiere entre `HEAD` y el working tree se indica explícitamente.

---

## 1. Resumen ejecutivo

**Veredicto: NO-GO. El proyecto no está listo para exposición pública.**

1. `next build` **falla**: un error de tipos en `dashboard/participaciones/[id]/page.tsx:14`
   impide desplegar. No hay artefacto publicable hoy.
2. La suite está **en rojo**: 9 tests fallan de 124. Con la suite roja Vitest no emite informe de
   cobertura, así que el umbral del 85% **no es verificable ahora mismo**.
3. El gate de cobertura mide solo una **lista blanca** de rutas: el **52,4% del código de
   producción** (3.940 de 7.525 líneas) es invisible al umbral.
4. Páginas públicas sirven **datos mock hard-coded**: `/perfil/[id]` ignora el ID y muestra
   siempre "MasterBuilder_84"; `/moderacion` dice "Contenido simulado para verificar el flujo".
5. Los **textos legales publicados** en `/legal/*` contienen 19 marcadores `⚠️ PENDIENTE`
   (NIF, domicilio, titular) y falta el disclaimer visible de marca LEGO que exige la propia
   auditoría legal del proyecto.
6. Riesgo de seguridad real: la política RLS de `usuarios_perfil` permite a cualquier usuario
   **auto-asignarse `role = 'sysadmin'`**; las Server Actions de moderación no comprueban rol.
7. Las migraciones **no reproducen la base de datos**: 6 tablas usadas por el código no existen
   en `supabase/migrations/`. Quien clone el repo no puede levantarlo.
8. Lo bueno: `npm audit` limpio (0 vulnerabilidades), cabeceras de seguridad configuradas,
   estructura documental `docs/` seria y por encima de la media, RLS activado en todas las tablas.

**Estimación:** la Fase 1 (bloqueantes) es trabajo de días, no de semanas. El proyecto tiene buen
esqueleto; lo que falla es el acabado y la coherencia entre lo documentado y lo implementado.

> **Actualización (v1.1):** la arquitectura del entorno público ya está decidida —despliegue único
> con cuenta demo de solo lectura y registro cerrado, ADR-009— y reduce la superficie de ataque de
> forma sustancial. **El veredicto NO-GO se mantiene**: la decisión neutraliza cuatro hallazgos de
> seguridad en runtime, pero no corrige el build roto, la suite en rojo, los datos ficticios en
> páginas públicas ni los textos legales incompletos. Ver §3.10.

---

## 2. Cómo está construido (mapa previo)

| Capa | Tecnología | Evidencia |
|---|---|---|
| Framework | Next.js **16.3.0** (App Router, Turbopack), React 19.2.8 | `package.json:22` |
| Lenguaje | TypeScript 5, `strict: true` | `tsconfig.json:12` |
| Estilos | Tailwind CSS v4 (config CSS-first vía `@theme`), plugin typography | `src/app/globals.css:1-24` |
| Backend | Supabase (Postgres + Auth + Storage) vía `@supabase/ssr` | `src/lib/supabase/*` |
| Edge | `src/proxy.ts` (convención Next 16, sustituye a `middleware.ts`) | `src/proxy.ts:5` |
| Animación | framer-motion 13 (17 ficheros) | `grep framer-motion src/` |
| Notificaciones | sonner (20 ficheros) | `src/app/layout.tsx:9` |
| Tests unit | Vitest 4 + Testing Library + jsdom, umbral 85% | `vitest.config.ts:36-41` |
| Tests E2E | Playwright (1 fichero, 2 tests) | `e2e/auth.spec.ts` |
| CI | GitHub Actions: solo `npm run test:coverage` | `.github/workflows/test.yml:26` |

**Superficie:** 32 rutas de página, 4 API routes, ~7.500 líneas de producción, 27 ficheros de test.

**Flujo de una petición:**
`proxy.ts` (rate limit en memoria → `updateSession` → `auth.getUser()` → redirecciones) →
`app/layout.tsx` (segundo `auth.getUser()` + query de perfil) → página (tercera llamada Supabase).

---

## 3. Hallazgos por dimensión

Severidades: **🔴 Bloqueante** (impide publicar) · **🟠 Importante** (daña calidad percibida o
introduce riesgo) · **🟡 Mejora deseable**.

### 3.1 Arquitectura general y organización

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| A1 | 🔴 | **Las migraciones no reproducen la BD.** El código consulta `exposiciones_temporales`, `exposiciones`, `exposicion_sets`, `bounties_reclamados`, `sets_insignias` y el bucket `fotos_sets`; ninguna existe en `supabase/migrations/`. Un visitante que clone el repo no puede levantarlo, y las políticas RLS de esas tablas no son auditables. | `supabase/migrations/` define 10 tablas; el código referencia 16 orígenes distintos |
| A2 | 🔴 | **Rutas placeholder navegables en producción.** `/moderacion` renderiza literalmente "Pantalla Moderación / Contenido simulado para verificar el flujo." | `src/app/moderacion/page.tsx:1` |
| A3 | 🟠 | **Triple representación de la misma entidad "vitrina"** sin fuente única: `/vitrina/[id]` (cliente), `/v/[id]` (servidor, público, con OG metadata) y `/dashboard/vitrina/[id]` (servidor, privado). Viola la regla Zero-Duplication del propio `AGENTS.md` §2. | `src/app/vitrina/[id]/page.tsx`, `src/app/v/[id]/page.tsx:41`, `src/app/dashboard/vitrina/[id]/page.tsx` |
| A4 | 🟠 | **Dos rutas gemelas para "Mis Vitrinas"**: `/mis-vitrinas` y `/dashboard/vitrinas` montan el mismo `MisVitrinasClient` con queries casi idénticas. Solo `/dashboard/vitrinas` está enlazada desde el Navbar. | `src/app/mis-vitrinas/page.tsx:34`, `src/app/dashboard/vitrinas/page.tsx:33`, `src/components/Navbar.tsx:65` |
| A5 | 🔴 | **Bug de esquema derivado de A4**: `/mis-vitrinas` ordena por `created_at`, pero la columna real es `creado_en`. La query devuelve error de PostgREST y la página se renderiza vacía. | `src/app/mis-vitrinas/page.tsx:31` vs `supabase/migrations/20260805171025_init_schema.sql:25` |
| A6 | 🟠 | **Componente huérfano de 291 líneas**: `DashboardClient.tsx` ya no lo importa nadie (fue sustituido por `HubClient`), pero sigue en la lista blanca de cobertura y arrastra 158 líneas de tests que ya no validan nada en producción. | `src/components/DashboardClient.tsx`, `vitest.config.ts:47` |
| A7 | 🟡 | **Dos paneles de administración paralelos** sin criterio claro de separación: `/admin/status` (KPIs mock) y `/admin/system/health` (KPIs reales). | `src/app/admin/status/page.tsx:8-15` (`MOCK_KPIS`, `MOCK_LOGS`) |
| A8 | 🟡 | `src/lib/` mezcla tres responsabilidades sin subcarpetas: acceso a datos (`supabase/`), utilidades de servidor (`docs.ts`, `logger.ts`, `rate-limit.ts`) y **datos mock de demo** (`data.ts`). | `src/lib/data.ts` |

---

### 3.2 Calidad y consistencia del código

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| C1 | 🔴 | **`next build` falla el type check.** `cookies()` es asíncrono en Next 16 y se usa sin `await`. Un único error, pero bloquea el despliegue completo. | `src/app/dashboard/participaciones/[id]/page.tsx:14` → `TS2339: Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'` |
| C2 | 🟠 | **43 usos de `any` en producción**, concentrados en las fronteras de datos: todos los props de `HubClient`, `ParticipacionesClient`, `DashboardClient`, `MisVitrinasClient`, `Navbar` y `EditVitrinaModal` son `any`. El `strict: true` del tsconfig queda anulado justo donde más valdría. | `src/app/dashboard/HubClient.tsx:15-20`, `src/components/Navbar.tsx:10`, `src/components/MisVitrinasClient.tsx:9` |
| C3 | 🟠 | **`params` tipado como no-Promise** en dos rutas, contra la convención de Next 16 (que sí se respeta en el resto del repo). En `legal/[slug]` funciona por accidente porque se hace `await` sobre un tipo síncrono. | `src/app/legal/[slug]/page.tsx:19-21`, `src/app/dashboard/participaciones/[id]/page.tsx:6` |
| C4 | 🟠 | **Tres nombres de marca distintos en la misma pantalla**: el `<title>` dice "Lego Virtual Museum", el Navbar "Lego Virtual / Collector Community" y el Footer "VirtualCollector". | `src/app/layout.tsx:29`, `src/components/Navbar.tsx:45-49`, `src/components/Footer.tsx:13` |
| C5 | 🟠 | **`package.json` sigue llamándose `"temp-app"`.** Es lo primero que ve quien abre el repo desde LinkedIn. | `package.json:2` |
| C6 | 🟠 | **Enlaces internos con `<a href>` en vez de `<Link>`** en el Footer: los 5 enlaces legales fuerzan recarga completa. `Link` está importado pero sin usar. | `src/components/Footer.tsx:1,17-21` |
| C7 | 🟡 | **`window.location.href` para navegar tras el login** en lugar del router, descartando el SPA. | `src/app/login/page.tsx:50,63` |
| C8 | 🟡 | **`import * as motion from "framer-motion/client"`** dentro de ficheros ya marcados `"use client"`: el export `/client` está pensado para el borde RSC, aquí es redundante. | `src/app/login/page.tsx:4`, `src/app/perfil/[id]/page.tsx:4`, `src/app/set/[id]/page.tsx:5` |
| C9 | 🟡 | **Variable calculada y nunca usada**: `resolvedParams` se resuelve y se descarta. Síntoma de la mock-data de D3.1. | `src/app/perfil/[id]/page.tsx:10` |
| C10 | 🟡 | **16 `console.*` en código de producción**, en paralelo al `systemLogger` que el propio proyecto construyó para eso. | `src/app/api/bricks/route.ts:34,38`, `src/app/api/bounties/claim/route.ts:63,66`, `src/lib/logger.ts` |
| C11 | 🟡 | **`clsx` y `tailwind-merge` declaradas como dependencias y con 0 usos** en `src/`. `date-fns` se usa en 1 solo fichero. | `package.json:14,25` |
| C12 | 🟡 | **ESLint no se puede ejecutar limpio**: `npx eslint .` aborta con `ENOENT` sobre `coverage/` si el directorio no existe. Falta `coverage` en `globalIgnores`. | `eslint.config.mjs:10-15` |

---

### 3.3 Gestión de estado y flujo de datos

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| E1 | 🟠 | **Toda la app es dinámica (ƒ) — cero páginas estáticas.** El root layout hace `auth.getUser()` + query de perfil en cada request, lo que arrastra a dinámico incluso a `/legal/[slug]` y `/como-funciona/[seccion]`, que declaran `generateStaticParams` y `dynamicParams = false`. | `src/app/layout.tsx:33-43`; salida de `next build`: las 38 rutas marcadas `ƒ (Dynamic)` |
| E2 | 🟠 | **Mínimo 2-3 round trips a Supabase antes de pintar nada**: `proxy.ts` valida sesión, el layout la vuelve a validar y consulta el perfil, y la página hace su propia query. | `src/proxy.ts:33` → `src/lib/supabase/middleware.ts:32`; `src/app/layout.tsx:34` |
| E3 | 🟠 | **Sin capa de datos: las queries viven inline en los componentes de página.** El mismo `select` de vitrinas está escrito tres veces con formas distintas, lo que ya produjo el bug A5. | `src/app/dashboard/vitrinas/page.tsx:15-30`, `src/app/mis-vitrinas/page.tsx:15-31`, `src/app/dashboard/page.tsx:20-23` |
| E4 | 🟠 | **Sin invalidación de caché tras mutaciones** salvo en `moderacion/actions.ts`. Los flujos cliente escriben en Supabase y navegan con `router.push`, confiando en el render dinámico. | `src/components/MesaTrabajoClient.tsx:181` vs `src/app/admin/moderacion/actions.ts:12` |
| E5 | 🟡 | **Estado optimista sin reconciliación con el servidor**: `/set/[id]` incrementa un contador local de bricks que nunca se persiste. | `src/app/set/[id]/page.tsx:15-23` |

---

### 3.4 Testing

Esta es la dimensión con mayor distancia entre lo documentado y lo real.

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| T1 | 🔴 | **Suite en rojo: 9 tests fallan de 124** (3 ficheros de 27). Con la suite roja Vitest **no emite informe de cobertura** — verificado: tras la ejecución no se genera `coverage/coverage-summary.json`. El umbral del 85% no es medible hoy. | `vitest run --coverage` → `Test Files 3 failed \| 24 passed`, `Tests 9 failed \| 115 passed` |
| T2 | 🔴 | **Causa raíz: el código evolucionó y los tests no.** `dashboard/page.tsx` pasó de `DashboardClient` a `HubClient` con nuevas queries, y su test sigue con el mock antiguo → `supabase.from(...).select(...).eq is not a function`. Igual en `ParticipacionesClient` (6 fallos). | `src/app/dashboard/page.test.tsx:69`, `src/app/dashboard/participaciones/ParticipacionesClient.test.tsx:225` |
| T3 | 🔴 | **Un test valida un placeholder.** `mis-vitrinas/page.test.tsx` afirma que la página muestra "Pantalla Mis Vitrinas / Contenido simulado para verificar el flujo". Cuando la página se implementó de verdad, el test se rompió — porque medía el stub, no el comportamiento. | `src/app/mis-vitrinas/page.test.tsx:8-9` |
| T4 | 🔴 | **El gate de cobertura solo mide el 47,6% del código.** El `include` de `vitest.config.ts` es una lista blanca. Fuera del gate: **3.940 de 7.525 líneas de producción (52,4%)**. | `vitest.config.ts:44-64`. Fuera del gate quedan, entre otros: `src/app/page.tsx` (208), `exposicion/[id]/ExposicionClient.tsx` (272), `v/[id]/page.tsx` (191), `Navbar.tsx` (248), `CrearVitrinaModal.tsx` (187), `proxy.ts`, `rate-limit.ts`, `logger.ts`, `api/bricks`, `api/health`, `api/auth/delete-account`, `auth/confirm` y todo `admin/system/**` |
| T5 | 🟠 | **Las rutas críticas de seguridad están fuera del gate**: `proxy.ts`, `rate-limit.ts`, `auth/confirm/route.ts` y `api/auth/delete-account/route.ts` no tienen ningún test. Son exactamente los ficheros donde viven los hallazgos S2, S4 y S5. | `vitest.config.ts:44-64` |
| T6 | 🟠 | **Cobertura alta ≠ garantía.** `api/bounties/claim/route.ts` tiene 95,83% de líneas y tests para 400/401/404/500, pero **ningún test cubre la autorización ausente** (S3): que un usuario pueda premiar el set de otro no lo detecta ninguna aserción. | `src/app/api/bounties/claim/route.test.ts` |
| T7 | 🟠 | **`docs/testing/informe-cobertura.md` afirma "94,45% en líneas […] Muy por encima del umbral del 85%"** y marca las 5 fases como ✅ Aprobado. Ese número procede de un `coverage-summary.json` obsoleto, calculado solo sobre la lista blanca y con la suite verde. Hoy es falso por partida doble. | `docs/testing/informe-cobertura.md:44` |
| T8 | 🟠 | **CI no protege lo que importa**: el workflow solo ejecuta `test:coverage`. No hay `next build`, ni `eslint`, ni `tsc --noEmit`, ni Playwright. Por eso C1 (build roto) llegó a `main` sin resistencia. | `.github/workflows/test.yml:26` |
| T9 | 🟡 | **E2E testimonial**: 1 fichero, 2 tests, ambos sobre `/login`, y el segundo solo comprueba que la URL no cambia. Ningún flujo de negocio (crear vitrina, subir set, publicar) está cubierto end-to-end. | `e2e/auth.spec.ts` |
| T10 | 🟡 | **`/* istanbul ignore next */` con provider v8**: la directiva de Istanbul no la interpreta el provider v8 (usa `/* v8 ignore */`), así que probablemente no hace nada. Está declarada en el informe de cobertura, lo cual es correcto por transparencia. | `src/components/MesaTrabajoClient.tsx:95`, `docs/testing/informe-cobertura.md:14` |

> **Nota de método:** la lista blanca de cobertura no es, en sí, una violación del `AGENTS.md`.
> El problema es que la documentación presenta el 94,45% resultante como cobertura **global**
> del proyecto, cuando cubre menos de la mitad del código.

---

### 3.5 Seguridad

`npm audit`: **0 vulnerabilidades** (0 críticas / 0 altas / 0 moderadas / 0 bajas). Buen punto de partida.

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| S1 | 🔴 | **Escalada de privilegios vía RLS.** La política de UPDATE de `usuarios_perfil` restringe *qué fila* se puede editar, pero no *qué columnas*. Cualquier usuario registrado puede ejecutar `update usuarios_perfil set role='sysadmin' where id=auth.uid()` desde el navegador con la anon key, y con ello superar el gate de `/admin/system`. | `supabase/migrations/20260805171025_init_schema.sql:106-107` (`for update using (auth.uid() = id)`, sin `with check` de columna) → gate en `src/lib/supabase/middleware.ts:52-58` |
| S2 | 🔴 | **Server Actions sin comprobación de autorización.** `approveAction`/`rejectAction` son endpoints invocables por cualquiera con sesión: no leen el rol. La única barrera es `admin/layout.tsx`, que es **cliente** (`"use client"` + `useEffect`) y no protege nada del lado servidor. `proxy.ts` solo exige rol para `/admin/system`, no para `/admin/moderacion`. | `src/app/admin/moderacion/actions.ts:6-21`, `src/app/admin/layout.tsx:1,22-40`, `src/lib/supabase/middleware.ts:41` |
| S3 | 🔴 | **`/api/bounties/claim` sin verificación de propiedad ni transacción.** No comprueba que `setId` pertenezca al llamante → cualquier usuario autenticado puede otorgar la recompensa al set de otro. Además hay TOCTOU (lee `estado` y luego hace `update` sin condición) y el número de filas insertadas lo dicta `bounty.recompensa` sin cota. El propio código lo reconoce: *"In a real app we would rollback the bounty update"*. | `src/app/api/bounties/claim/route.ts:20-58` |
| S4 | 🔴 | **Open redirect en la confirmación de email.** La única validación de `next` es `startsWith('/')`; un valor `//evil.com` la pasa y `new URL('//evil.com', request.url)` resuelve a host externo. Es la URL que llega por correo: vector de phishing directo. | `src/app/auth/confirm/route.ts:8,15-16` |
| S5 | 🔴 | **RC-01 (anonimato) implementado con la alternativa que su propio ADR descartó.** ADR-005 decide limpiar EXIF en una Edge Function y descarta explícitamente la limpieza en cliente por *"no verificable ni garantizable server-side"*. La implementación real es un `canvas.toBlob()` en el navegador seguido de subida directa a Supabase Storage con la anon key. No existe Edge Function. Mientras tanto el login promete "100% Anónimo". | `src/components/MesaTrabajoClient.tsx:56-77` y `:117-125` vs `docs/06-decisiones/ADR-005-limpieza-exif.md` (§Decisión y §Alternativas descartadas) |
| S6 | 🟠 | **Voto anónimo sin restricción efectiva.** La política `"Anyone can insert a brick" for insert with check (true)` permite a cualquiera insertar filas en `bricks_recibidos` directamente contra PostgREST con `hash_visitante` arbitrario, saltándose `/api/bricks` y su `unique(set_id, hash_visitante)`. | `supabase/migrations/20260805171025_init_schema.sql:174-175` |
| S7 | 🟠 | **La tabla `reportes` tiene RLS activado y cero políticas** → deny-all. El flujo de denuncia documentado en la guía de usuario (`10-reportar.md`) no puede funcionar. | `init_schema.sql:98` (enable) sin ningún `create policy ... on public.reportes` |
| S8 | 🟠 | **Rate limiting no funcional en serverless.** Es un `Map` en memoria del proceso; cada instancia edge/lambda tiene el suyo y se pierde en cada arranque en frío. La propia doc de Next 16 advierte para Proxy: *"you should not attempt relying on shared modules or globals"*. La spec (§1) y ADR-003 decidieron **Upstash Redis**, que no está instalado. | `src/lib/rate-limit.ts:11`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`, `docs/06-decisiones/ADR-003-rate-limiting.md` §Decisión |
| S9 | 🟠 | **El panel de Health escribe un límite que nadie lee.** `admin/system/health` persiste la config en `system_config`, pero `rate-limit.ts` usa constantes hard-coded y nunca consulta esa tabla. El runbook interno documenta el ajuste como operativo. | `src/lib/rate-limit.ts:17-18` vs `src/app/admin/system/health/page.tsx:30,51` y `src/app/admin/system/docs/page.tsx` §1 |
| S10 | 🟠 | **Mensajes de error internos expuestos al usuario final**, incluyendo instrucciones de configuración de Supabase: *"¡Aún tienes activado el 'Confirm email' en Supabase!"*. Además se propaga `error.message` crudo del backend. | `src/app/login/page.tsx:53,61` |
| S11 | 🟠 | **Auto-registro silencioso al fallar el login**: si las credenciales son inválidas se intenta un `signUp` con el mismo email/password. Un usuario que se equivoca de contraseña recibe un mensaje de "cuenta creada". Facilita además enumeración de usuarios. | `src/app/login/page.tsx:35-58` |
| S12 | 🟡 | **Sin `Content-Security-Policy`.** El resto de cabeceras está bien (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy), pero falta la que más aporta con contenido subido por usuarios. | `next.config.ts:5-32` |
| S13 | 🟡 | **Sin validación de esquema en las entradas de API.** `api/bricks` y `api/bounties/claim` hacen `await request.json()` y comprueban solo presencia. No hay Zod ni equivalente en el repo. | `src/app/api/bricks/route.ts:12-18`, `src/app/api/bounties/claim/route.ts:6-9` |
| S14 | 🟡 | **Sin `.env.example`.** El repo público no indica qué variables hay que configurar. | raíz del repo |

**Gestión de secretos — correcta.** `.gitignore:36` cubre `.env*`; `.env.local` no está versionado ni
aparece en el historial; no hay claves hard-coded en `src/`, `docs/`, `legal/` ni `supabase/`; el
`SUPABASE_SERVICE_ROLE_KEY` solo se lee en servidor (`logger.ts:8`, `delete-account/route.ts:17`)
y ambos degradan sin filtrar si falta.

---

### 3.6 Rendimiento

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| P1 | 🟠 | **Cero uso de `next/image`: 30 etiquetas `<img>` crudas.** Sin redimensionado, sin AVIF/WebP, sin `width`/`height` (→ CLS), sin lazy loading. Muchas apuntan a Unsplash a resolución completa. La regla `@next/next/no-img-element` de `eslint-config-next` está activa y no se está atendiendo. | 30 coincidencias en 24 ficheros; p. ej. `src/app/page.tsx:54,83,183`, `src/components/DashboardClient.tsx:161`, `src/app/v/[id]/page.tsx:142` |
| P2 | 🟠 | **Ninguna ruta se sirve estática** (ver E1). Todo se renderiza bajo demanda con round trip a Supabase, incluidas las páginas legales y la guía "Cómo funciona", que son contenido inmutable en disco. | salida de `next build`: 38 rutas `ƒ (Dynamic)`, 0 estáticas |
| P3 | 🟠 | **~1,5 MB de JS en `.next/static/chunks`**, con dos chunks de ~229 KB y uno de 151 KB. `framer-motion` (17 ficheros) y `sonner` (montado global en el layout) contribuyen a todas las páginas. | `du -sh .next/static/chunks` = 1.5M; top chunks: 229,5 / 228,8 / 151,0 / 133,4 / 110,0 KB |
| P4 | 🟠 | **`proxy.ts` corre en prácticamente todas las rutas** (el matcher solo excluye estáticos e imágenes) y cada ejecución hace `auth.getUser()`, que es una llamada de red a Supabase. Para `/admin/system` añade una segunda query. | `src/proxy.ts:37-47`, `src/lib/supabase/middleware.ts:32` |
| P5 | 🟡 | **3 familias tipográficas de Google Fonts** (Inter, Space Grotesk, IBM Plex Mono con 3 pesos) cargadas globalmente. | `src/app/layout.tsx:10-25` |
| P6 | 🟡 | **Purga de la caché de rate limit probabilística** (`Math.random() < 0.1`): funciona, pero introduce no determinismo difícil de testear. | `src/lib/rate-limit.ts:29` |

> **Limitación:** Next 16 con Turbopack no imprime la tabla de *First Load JS* por ruta, así que
> el reparto por página no se ha podido medir. Las cifras de P3 son del total de chunks en disco.

---

### 3.7 Accesibilidad

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| X1 | 🟠 | **32 de 41 `<label>` no están asociados a su input** (solo 9 `htmlFor` en todo el repo). Afecta al formulario más visible del producto. | `src/app/login/page.tsx:89,104`; también `admin/bounties/page.tsx:139,143,147`, `forgot-password/page.tsx:55`, `dashboard/perfil/page.tsx:183` |
| X2 | 🟠 | **32 usos de `outline-none` sin `focus-visible` de reemplazo**: se elimina el indicador de foco del teclado en inputs y botones. | `src/app/admin/bounties/page.tsx:140,144,148` y 29 más |
| X3 | 🟠 | **Animaciones sin respetar `prefers-reduced-motion`.** framer-motion se usa en 17 ficheros y hay transiciones/`animate-in` por todas partes; la única consulta al media query está en el índice de la documentación. | única coincidencia: `src/components/docs/TableOfContents.tsx:50` |
| X4 | 🟡 | **Un `<img>` sin `alt`** en la parrilla de sets de la comunidad. | `src/app/dashboard/HubClient.tsx:191` |
| X5 | 🟡 | **Controles interactivos sin nombre accesible**: solo 9 `aria-label` y 1 `role=` en todo el repo. Botones que son puro icono (cerrar, flechas del tour) quedan sin etiqueta. | `src/app/perfil/[id]/page.tsx:31,37` (botones `<X>`, `<ChevronLeft>`) |
| X6 | 🟡 | **Contraste dudoso en texto secundario**: `text-black/40`, `text-[10px]` y `text-white/60` sobre paneles claros/oscuros probablemente no llegan a 4.5:1. No verificado con herramienta. | `src/components/MisVitrinasClient.tsx:105`, `src/components/Navbar.tsx:48` |

**Correcto:** `lang="es"` en el `<html>` (`layout.tsx:48`), 29 de 30 `<img>` con `alt`, uso de
elementos semánticos (`<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`).

---

### 3.8 Documentación técnica existente

La base documental es el activo más fuerte del proyecto: ~2.100 líneas en `docs/`, 8 ADRs con
frontmatter consistente, guía de usuario de 12 secciones renderizada en la propia web, y
arquitectura legal completa. El problema no es la cantidad, es la **deriva respecto al código**.

| # | Sev | Hallazgo | Evidencia |
|---|---|---|---|
| D1 | 🔴 | **README = plantilla de `create-next-app` sin tocar.** Es la carta de presentación del repo para la audiencia de LinkedIn: no dice qué es el producto, cómo levantarlo, ni qué variables necesita. Solo el último párrafo es propio. | `README.md:1-30` |
| D2 | 🔴 | **Los documentos legales publicados contienen 19 marcadores `⚠️ PENDIENTE`** visibles para cualquier visitante en `/legal/*`: titular, NIF, domicilio, email de contacto y fechas. Además, `aviso-legal.md` incluye notas internas del tipo *"[REQUIERE VALIDACIÓN JURÍDICA: …]"*. | `legal/aviso-legal.md:3,7-10` (6), `politica-privacidad.md` (7), `politica-propiedad-intelectual.md` (3), `terminos-condiciones.md` (2), `politica-cookies.md` (1) — servidos por `src/app/legal/[slug]/page.tsx` |
| D3 | 🔴 | **Falta el disclaimer visible de marca.** `legal/auditoria_legal.md:11` exige *"incluir de forma visible que el proyecto es una iniciativa no oficial, no afiliada ni respaldada por el Grupo LEGO"*. El texto existe en `politica-propiedad-intelectual.md:6` pero no aparece en el Footer, el Navbar ni la landing. | `src/components/Footer.tsx` (sin disclaimer), `src/app/page.tsx` |
| D4 | 🟠 | **Tres ADRs contradichos por el código sin registro de cambio**: ADR-005 (EXIF en Edge Function → es cliente), ADR-003 (Upstash Redis → es `Map` en memoria), ADR-002/spec §1 (Edge Functions para lógica de servidor → no hay ninguna). Ninguno está marcado como superado ni tiene ADR de reemplazo. | ADR-005, ADR-003, `docs/02-spec/spec.md:20-23` |
| D5 | 🟠 | **`informe-cobertura.md` documenta un estado que ya no existe** (ver T7): 5 fases ✅ Aprobado y 94,45% global, con la suite en rojo. | `docs/testing/informe-cobertura.md:41-47` |
| D6 | 🟠 | **`_index.md` describe el proyecto como pre-implementación**: PRD, Spec, Prototipo y Plan figuran como "Pendiente" y la carpeta `docs/05-plan/` no existe, cuando hay 7.500 líneas de app funcionando. | `_index.md` tabla de Fases |
| D7 | 🟠 | **Doble ADR-001**: `ADR-001-frontend-hosting.md` y `ADR-001-stack-tecnico.md` comparten identificador. | `docs/06-decisiones/` |
| D8 | 🟡 | **Dos copias idénticas de las skills** en `.agents/skills/` y `.claude/skills/` (9 ficheros cada una) versionadas en el repo público. Ruido para el visitante. | `git ls-files .agents .claude` |
| D9 | 🟡 | **`update_docs.py` sin documentar**: script Python en la raíz de un proyecto TypeScript, sin mención en README ni en `docs/`. | `update_docs.py` |
| D10 | 🟡 | **Regla de trazabilidad §3 pendiente para esta auditoría**: falta la fila correspondiente en `docs/00-proyecto/FASES_Y_MEJORAS.md`. No se ha añadido por la instrucción explícita de no modificar nada en esta fase. | `docs/00-proyecto/FASES_Y_MEJORAS.md` |

---

### 3.9 Deuda técnica y riesgos de la exposición pública

Ordenados por daño a la reputación profesional si un contacto de LinkedIn abre el enlace.

| # | Sev | Riesgo | Evidencia |
|---|---|---|---|
| R1 | 🔴 | **La app no compila.** Si alguien clona y ejecuta `npm run build`, falla. Con el README boilerplate y `"temp-app"` como nombre, la primera impresión es de proyecto abandonado. | C1, D1, C5 |
| R2 | 🔴 | **Datos falsos en páginas públicas.** `/perfil/[id]` ignora el ID de la URL y muestra siempre "MasterBuilder_84 · 142 sets · 125.430 piezas" con fotos de stock de Unsplash. Un visitante que abra dos perfiles distintos ve exactamente lo mismo. Igual en `/set/[id]` y `/mesa-de-trabajo/[id]`. | `src/app/perfil/[id]/page.tsx:2,11`, `src/app/set/[id]/page.tsx:2,10`, `src/app/mesa-de-trabajo/[id]/page.tsx:16` |
| R3 | 🔴 | **Comentarios de andamiaje en producción**: `/dashboard/participaciones/[id]` contiene `estado: 'pendiente', // Mocked para el ejemplo visual` y *"mockeamos un 'Modular Master' genérico"* para cualquier ID inexistente. | `src/app/dashboard/participaciones/[id]/page.tsx:44,60-62` |
| R4 | 🔴 | **Exposición legal real**: publicar bajo el nombre "Lego Virtual Museum", con el logo, sin disclaimer visible y con el aviso legal LSSI-CE incompleto, ante una audiencia profesional que puede incluir a gente del sector. | D2, D3 |
| R5 | 🟠 | **El repo se lee como una auditoría en contra si alguien mira dentro**: `AGENTS.md` proclama reglas innegociables de testing y Zero-Duplication, y el árbol muestra suite roja, tests de placeholders, dos rutas gemelas de vitrinas y un componente huérfano de 291 líneas. La distancia entre norma declarada y práctica es más dañina que no haber declarado nada. | T1, T3, A4, A6 |
| R6 | 🟠 | **Menciones a la herramienta de construcción dentro del producto**: el runbook de `/admin/system/docs` incluye un "Protocolo de Escalado y Reporte (Antigravity)" con prompts literales para la IA. Está tras el gate de sysadmin, pero es código versionado en un repo público. | `src/app/admin/system/docs/page.tsx` §3 |
| R7 | 🟠 | **Un solo tag y 13 commits en `main`**, sin ramas ni PRs, pese a que la regla §4 de `AGENTS.md` exige tags de checkpoint por hito. Además hay 9 ficheros modificados y 8 sin versionar sin commitear. | `git tag` = 1, `git log --oneline` = 13, `git status` |
| R8 | 🟡 | **Ficheros generados versionados o presentes**: `tsconfig.tsbuildinfo` (257 KB) está en el árbol de trabajo (aunque ignorado), y `coverage/` se genera y borra entre ejecuciones rompiendo ESLint (C12). | raíz del repo |

---

## 3.10 Decisión de entorno de demostración (ADR-009) y su efecto sobre los hallazgos

**Actualización 2026-08-10.** Tras esta auditoría se ha tomado y documentado la decisión de
arquitectura del entorno público: **despliegue único sobre la infraestructura existente, con una
cuenta de demostración de solo lectura y el registro de nuevos usuarios cerrado**
(`docs/06-decisiones/ADR-009-entorno-demo-publico.md`). La decisión está **aceptada pero no
activada**: el proyecto sigue sin despliegue público.

El control central es una revocación de privilegios en el motor de base de datos, no una política
de aplicación:

```sql
revoke insert, update, delete on all tables in schema public from authenticated, anon;
```

Esto cambia el encuadre de varios hallazgos, pero **no los corrige**. La distinción importa:

| Hallazgo | Severidad original | Efecto de ADR-009 | Severidad efectiva |
|---|---|---|---|
| S1 escalada de privilegios | 🔴 | Neutralizado en runtime. **Pero publicar el repo publica `supabase/migrations/` y con ello el fallo.** Corregirlo es requisito de publicar el código, no solo de abrir la app. | 🔴 (sin cambio) |
| S2 Server Actions sin authz | 🔴 | Neutralizado: sin permiso de UPDATE la acción falla. Reaparece íntegro al abrir la escritura. | 🟠 diferido |
| S3 claim sin verificación de propiedad | 🔴 | Neutralizado por la misma vía. | 🟠 diferido |
| S6 inserción libre de bricks | 🟠 | Neutralizado por la misma vía. | 🟡 diferido |
| S4 open redirect | 🔴 | **No neutralizado.** El flujo de recuperación de contraseña sigue generando códigos válidos aunque el registro esté cerrado. | 🔴 (sin cambio) |
| S7 `reportes` deny-all | 🟠 | Irrelevante en solo lectura, pero la UI de denuncia queda visiblemente rota si no se oculta. | 🟠 (ocultar UI) |
| S5 EXIF en cliente | 🔴 | No se ejercita: no hay subidas. Pero el login sigue prometiendo "100% Anónimo" y la guía de usuario lo documenta como garantía. | 🟠 diferido, **revisar el copy** |
| A1 migraciones incompletas | 🔴 | La demo no depende de recrear la BD, pero el objetivo del lanzamiento es que un tercero mire el repositorio. Un repo que no se puede levantar sigue siendo un bloqueante de credibilidad. | 🔴 (sin cambio) |
| R2/R3 mock data pública | 🔴 | **Agravado.** Si la demo es de solo lectura, lo único que hace el visitante es mirar contenido — y `/perfil/[id]` muestra siempre el mismo perfil ficticio. | 🔴 (prioridad ↑) |

**Consecuencia de planificación:** la decisión reduce la superficie de ataque, no la deuda. Los
hallazgos marcados como "diferido" deben corregirse antes de habilitar cualquier escritura, y
quedan registrados como tales en la Fase 2.

### Encuadre legal derivado

Cerrar el registro elimina los usuarios reales y, con ellos, el contenido subido por terceros, el
deber de moderación y el tratamiento de datos personales ajenos. Eso sostiene el encuadre de
**prototipo demostrativo no comercial**, analizado en
`legal/analisis-titularidad-persona-fisica.md`. Conclusiones que afectan a D2 y D3:

- El titular es **persona física sin actividad económica**: puede figurar a título individual y
  **no está obligado a publicar NIF ni domicilio**. Los `⚠️ PENDIENTE` correspondientes se
  resuelven **eliminando esos campos**, no rellenándolos.
- Los documentos deben incorporar un **aviso de prototipo** explícito, que es lo que hace que
  "queden completos" siendo honestos sobre su naturaleza.
- `politica-cookies.md` es correcta y no requiere cambios de fondo: solo cookies técnicas, exentas
  de consentimiento, sin banner. Verificado además que su afirmación sobre no usar Google Fonts es
  cierta — `next/font/google` autoaloja las tipografías en build.
- **Riesgo de marca escalado:** el proyecto lleva la marca LEGO en el nombre, conviven tres
  identidades distintas en la interfaz (C4) y falta el disclaimer visible (D3). Se recomienda
  **renombrar ahora**; la decisión bloquea las tareas de legales, README e identidad.
- **Pendiente de verificación externa:** la región del proyecto de Supabase (UE o EE.UU.)
  condiciona si hay transferencia internacional que declarar. No es comprobable desde el
  repositorio.

### Plan de ejecución derivado

El cuadrante "HACER YA" de §5 se ha desarrollado en tareas ejecutables con dependencias y criterio
de verificación en `docs/05-plan/plan-remediacion-quickwins.md` (16 tareas, estado *propuesto*).
Esa iteración **no habilita el lanzamiento**: deja fuera la suite roja, la mock data pública, las
migraciones y la autorización en servidor.

---

## 4. Qué no se ha podido inspeccionar

Declarado explícitamente para no inducir conclusiones falsas:

1. **Base de datos real de Supabase.** No hay acceso al proyecto. Las políticas RLS de
   `exposiciones_temporales`, `exposicion_sets`, `bounties_reclamados`, `sets_insignias` y
   `exposiciones` **no existen en el repo** (A1), así que S2 y S3 podrían estar mitigadas por
   políticas aplicadas manualmente en el panel de Supabase — o no estarlo en absoluto.
   **No es verificable desde el código.** Lo mismo aplica a las políticas del bucket `fotos_sets`.
2. **Variables de entorno de producción (Vercel).** `.env.local` solo define
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **No hay
   `SUPABASE_SERVICE_ROLE_KEY` en local**, por lo que el borrado de cuenta (derecho de supresión
   RGPD) y el `systemLogger` degradan silenciosamente. No se ha podido comprobar si esa variable
   sí está configurada en Vercel.
3. **Comportamiento en runtime.** No se ha levantado la app contra la BD real: los hallazgos son
   estáticos más la ejecución de `next build`, `vitest run --coverage`, `npm audit` y `tsc --noEmit`.
   S1 y S4 se derivan de la lectura de la política SQL y del código, **no de una explotación**.
4. **Configuración de Supabase Auth** (confirmación de email, plantillas, URLs de redirección
   permitidas). Esto último importa: una *allow-list* de redirect URLs en Supabase reduciría el
   impacto de S4, pero no lo elimina, porque la ruta `/auth/confirm` construye el destino final.
5. **Métricas reales de Core Web Vitals** y *First Load JS* por ruta (ver limitación en §3.6).
6. **Contraste de color medido** (X6): estimado por inspección de clases, no con herramienta.
7. **Estado de `HEAD` vs working tree.** La suite se ejecutó sobre el working tree. Los 9 fallos
   están en ficheros con cambios sin commitear, así que es posible que `HEAD` estuviera verde; no
   se ha ejecutado la suite sobre `HEAD` para no manipular el árbol de trabajo del usuario. Esto
   **no cambia el veredicto**: lo que se va a publicar es el working tree.

---

## 5. Priorización: impacto vs esfuerzo

Impacto = riesgo real + calidad percibida por una audiencia profesional.

```
              ESFUERZO BAJO                    ESFUERZO ALTO
           ┌────────────────────────┬────────────────────────┐
   IMPACTO │ HACER YA               │ PLANIFICAR             │
     ALTO  │ C1 build · D1 README   │ A1 migraciones         │
           │ D2 legal · A2 stub     │ T1/T2 suite roja       │
           │ S1 RLS role · S4 redir │ R2 mock data pública   │
           │ C5 nombre · D3 marca   │ S5 EXIF server-side    │
           │ A5 created_at          │ S2/S3 authz servidor   │
           ├────────────────────────┼────────────────────────┤
   IMPACTO │ RELLENO                │ APLAZAR                │
    MEDIO  │ C6 Link · X4 alt       │ P1 next/image (30)     │
     /BAJO │ C11 deps · C12 eslint  │ E1/P2 estrategia render│
           │ A6 huérfano · X1 label │ T4 ampliar gate        │
           │ S12 CSP · S14 env.ex   │ T9 E2E de negocio      │
           └────────────────────────┴────────────────────────┘
```

---

## 6. Plan de mejora por fases

Esfuerzo: **S** ≤ 2 h · **M** ≤ 1 día · **L** > 1 día.

### Fase 1 — Bloqueantes antes de publicar

| ID | Tarea | Qué hacer | Esf. | Criterio de aceptación verificable |
|---|---|---|---|---|
| F1.1 | Arreglar el build | `await cookies()` en `dashboard/participaciones/[id]/page.tsx:14` y tipar `params` como `Promise<{id:string}>` (también en `legal/[slug]/page.tsx:19`) | S | `npx next build` termina con exit 0 sin `ignoreBuildErrors`; `npx tsc --noEmit` sin salida |
| F1.2 | Suite en verde | Actualizar los mocks de `dashboard/page.test.tsx` a las queries de `HubClient`; reescribir `ParticipacionesClient.test.tsx` contra la UI actual; **sustituir** `mis-vitrinas/page.test.tsx` por un test de la página real (no borrarlo) | M | `npm run test:coverage` exit 0; `coverage/coverage-summary.json` se genera y los 4 umbrales ≥ 85 |
| F1.3 | Eliminar mock data de rutas públicas | `/perfil/[id]` debe consultar por el ID de la URL; `/set/[id]` y `/mesa-de-trabajo/[id]` idem. Retirar `src/lib/data.ts` del árbol de producción | L | `grep -r "MOCK_" src/app src/components` no devuelve nada; abrir dos perfiles distintos muestra datos distintos |
| F1.4 | Eliminar rutas de andamiaje | Borrar `src/app/moderacion/page.tsx` (duplica `/admin/moderacion`); quitar el fallback "Modular Master" de `participaciones/[id]` | S | `grep -r "Contenido simulado\|Mocked para el ejemplo\|mockeamos" src/` sin resultados |
| F1.5 | Cerrar la escalada de privilegios | Migración que impida al usuario modificar `role`: revocar UPDATE sobre la columna (`revoke update (role) on public.usuarios_perfil from authenticated`) o mover `role` a tabla aparte | S | Con sesión de usuario normal, `update usuarios_perfil set role='sysadmin'` devuelve error de permisos |
| F1.6 | Autorización server-side en admin | Comprobar el rol dentro de `approveAction`/`rejectAction`; extender el gate de rol de `proxy.ts` a todo `/admin`, no solo `/admin/system` | M | Test que invoca `approveAction` con un usuario sin rol y espera rechazo; `GET /admin/moderacion` con usuario normal redirige |
| F1.7 | Cerrar el open redirect | Validar `next` contra allow-list de rutas internas, o rechazar todo lo que no case `^\/(?!\/)` | S | Test: `/auth/confirm?code=x&next=//evil.com` no produce `Location` con host externo |
| F1.8 | Autorización y atomicidad en `claim` | Verificar que `setId` pertenece al usuario; hacer el update condicional (`.eq('estado','pendiente')`) y comprobar filas afectadas; acotar `recompensa` | M | Test: usuario A reclamando con un `setId` de B → 403. Test: dos claims concurrentes → una 200 y una 400 |
| F1.9 | Publicar migraciones completas | Añadir migraciones de `exposiciones_temporales`, `exposiciones`, `exposicion_sets`, `bounties_reclamados`, `sets_insignias`, políticas del bucket `fotos_sets` y políticas de `reportes` | L | `supabase db reset` en limpio levanta el esquema y la app arranca sin errores de PostgREST |
| F1.10 | Corregir `/mis-vitrinas` y consolidar | Eliminar `/mis-vitrinas` (no está enlazada) dejando `/dashboard/vitrinas` como única ruta, o corregir `created_at` → `creado_en` | S | Solo existe una ruta de listado de vitrinas; la página carga con datos reales |
| F1.11 | README de producto | Qué es, capturas, stack, `.env.example`, cómo levantarlo, cómo correr tests, licencia | M | El README no contiene ninguna frase de `create-next-app`; un tercero levanta el proyecto siguiendo solo el README |
| F1.12 | Cerrar los textos legales | Rellenar los 19 `⚠️ PENDIENTE`, quitar las notas `[REQUIERE VALIDACIÓN JURÍDICA]`, fijar fechas | S | `grep -c "PENDIENTE\|REQUIERE VALIDACIÓN" legal/*.md` = 0 |
| F1.13 | Disclaimer de marca visible | Línea permanente en el Footer: *"Proyecto no oficial. No afiliado ni respaldado por The LEGO Group. LEGO® es marca de The LEGO Group."* | S | El disclaimer es visible sin scroll adicional en todas las páginas |
| F1.14 | Renombrar el paquete | `"temp-app"` → `"lego-virtual-museum"` | S | `package.json:2` actualizado |
| F1.15 | Sanear mensajes de error del login | Sustituir mensajes de configuración de Supabase por texto de usuario; separar login de registro (o hacer el auto-registro explícito) | S | `grep -r "Supabase" src/app/login` sin resultados; contraseña errónea en cuenta existente devuelve "credenciales incorrectas" |
| F1.16 | Endurecer el CI | Añadir `tsc --noEmit`, `eslint` y `next build` al workflow | S | Un PR con el error de F1.1 falla en CI antes de mezclar |

**Salida de Fase 1:** build verde, suite verde con cobertura emitida, cero mock data pública,
cero placeholders legales, y los 4 hallazgos de seguridad bloqueantes cerrados o documentados
como riesgo aceptado con justificación.

---

### Fase 2 — Calidad a medio plazo

> **Actualización (10/08/2026 — Ronda 1 ejecutada):** F2.1, F2.4, F2.5, F2.7, F2.9, F2.10 y F2.13
> completadas; F2.3 parcial (config real de `system_config`, Upstash pendiente de cuenta externa).
> F2.2, F2.6, F2.8 (completo) y F2.12 diferidas explícitamente — motivo y plan en
> `docs/06-decisiones/ADR-010-reconciliacion-exif-rate-limiting.md` y
> `docs/05-plan/seguimiento-iteracion-2.md`. La tabla de abajo es el plan original; el estado real
> de cada fila está en el documento de seguimiento, no aquí.

| ID | Tarea | Qué hacer | Esf. | Criterio de aceptación verificable |
|---|---|---|---|---|
| F2.1 | Reconciliar ADRs con la realidad | ADR de reemplazo para EXIF (S5) y rate limiting (S8): o se implementa lo decidido, o se emite ADR nuevo que documente el cambio y sus consecuencias | M | Ningún ADR en estado `aceptada` contradice el código; `sync-check` no reporta divergencias |
| F2.2 | EXIF verificable server-side | Mover la limpieza a Edge Function / route handler y cerrar la subida directa del cliente al bucket | L | Test automatizado: subir JPEG con GPS y comprobar su ausencia en el fichero servido (el propio criterio de ADR-005 §Consecuencias) |
| F2.3 | Rate limiting real | Sustituir el `Map` por almacén compartido (Upstash, per ADR-003) y leer la config de `system_config` | M | Dos instancias comparten contador; cambiar el límite en `/admin/system/health` surte efecto ≤ 60 s |
| F2.4 | Ampliar el gate de cobertura | Pasar `coverage.include` de lista blanca a `src/**` con exclusiones justificadas una a una, escalando el umbral por tramos hasta llegar al 85% global | L | `include: ['src/**']`; ≥ 85% en las 4 métricas; ningún fichero excluido sin comentario que lo justifique |
| F2.5 | Cubrir la superficie de seguridad | Tests de `proxy.ts`, `rate-limit.ts`, `auth/confirm`, `api/bricks`, `api/auth/delete-account` | M | Los 5 ficheros ≥ 85% de líneas y con al menos un test de camino de rechazo cada uno |
| F2.6 | Consolidar vistas de vitrina | Una sola implementación con variante pública/privada, en vez de `/vitrina/[id]` + `/v/[id]` + `/dashboard/vitrina/[id]` | L | Una única ruta canónica por caso de uso; el resto redirige (301) |
| F2.7 | Retirar código muerto | Eliminar `DashboardClient.tsx` y su test; quitar `clsx` y `tailwind-merge` si siguen sin uso; arreglar `globalIgnores` de ESLint | S | `npx eslint .` termina limpio; `npx depcheck` sin dependencias no usadas |
| F2.8 | Tipar las fronteras de datos | Generar tipos con `supabase gen types typescript` y sustituir los 43 `any` de producción | L | `grep -c ": any\|as any" src --include=*.tsx --include=*.ts` (excluyendo tests) ≤ 5, cada uno comentado |
| F2.9 | Capa de acceso a datos | `src/lib/queries/` con las queries reutilizables (vitrinas, sets, perfil) | M | Ninguna query de Supabase duplicada en más de un fichero de página |
| F2.10 | Accesibilidad de formularios | `htmlFor`/`id` en los 32 labels sueltos; anillo de foco donde hoy hay `outline-none`; `aria-label` en botones de icono | M | Auditoría axe sobre `/login`, `/dashboard/vitrinas` y `/` sin violaciones serias o críticas |
| F2.11 | Unificar identidad de marca | Un solo nombre en `<title>`, Navbar y Footer | S | El mismo nombre en las tres ubicaciones |
| F2.12 | E2E de los flujos de negocio | Playwright: registro → crear vitrina → subir set → publicar → ver vitrina pública | L | ≥ 4 specs pasando en CI |
| F2.13 | Actualizar la documentación | Corregir `informe-cobertura.md`, `_index.md` (fases reales), resolver el doble ADR-001, añadir la fila de esta auditoría en `FASES_Y_MEJORAS.md` | S | Ningún documento de `docs/` afirma un estado contradicho por el repo |

---

### Fase 3 — Deuda técnica y optimización a largo plazo

| ID | Tarea | Qué hacer | Esf. | Criterio de aceptación verificable |
|---|---|---|---|---|
| F3.1 | Migrar a `next/image` | Las 30 `<img>`, con `remotePatterns` para Supabase Storage y Unsplash | L | `grep -c "<img" src --include=*.tsx` = 0; regla `no-img-element` sin desactivar |
| F3.2 | Estrategia de renderizado | Sacar la sesión del root layout (`Navbar` como componente cliente o segmento propio) para permitir estático en landing, legal y guía | M | `next build` muestra ≥ 8 rutas estáticas (`○`), incluidas `/legal/[slug]` y `/como-funciona/[seccion]` |
| F3.3 | Reducir el bundle | Import dinámico de framer-motion en vistas pesadas; evaluar sustituir animaciones simples por CSS; revisar el `Toaster` global | M | Ningún chunk > 150 KB; total de `.next/static/chunks` < 1 MB |
| F3.4 | Reducir round trips de auth | Cachear el perfil por request; evitar la doble llamada `getUser()` proxy + layout | M | ≤ 1 llamada de auth por navegación, medida en logs |
| F3.5 | Validación de esquema en API | Zod en los handlers de `api/bricks` y `api/bounties/claim` | S | Payload malformado → 400 con error tipado; test por endpoint |
| F3.6 | CSP | Cabecera `Content-Security-Policy` con nonce para scripts | M | securityheaders.com ≥ A; sin errores de CSP en consola |
| F3.7 | Movimiento reducido | Respetar `prefers-reduced-motion` globalmente (`MotionConfig` de framer-motion + media query en `globals.css`) | S | Con "reducir movimiento" activo no hay transiciones de entrada |
| F3.8 | Observabilidad real | Sustituir los 16 `console.*` por `systemLogger`; purga de logs > 30 días como el runbook promete | M | `grep -c "console\." src` (sin tests) = 0; job de purga documentado |
| F3.9 | Higiene del repo público | Sacar `.agents/`+`.claude/` duplicados y `update_docs.py` sin documentar; retirar del código las referencias a la herramienta de construcción (R6) | S | `git ls-files` sin duplicados de skills; README explica todo script de la raíz |
| F3.10 | Disciplina de versionado | Aplicar la regla §4 de `AGENTS.md`: tags de checkpoint por hito, ramas + PR en vez de commits directos a `main` | S | ≥ 1 tag nuevo por fase completada; `main` protegido |
| F3.11 | Enriquecer la unicidad de bricks | Restringir la política `insert with check (true)` de `bricks_recibidos` a inserciones autenticadas y con `hash_visitante = auth.uid()` | M | Inserción directa vía PostgREST con hash arbitrario rechazada |

---

## 7. Nota de reutilización (framework spec-vjc)

Estructura de este informe reutilizable como plantilla de `/audit`:

1. **Frontmatter** con `proyecto / tipo / etapa / exposicion / estado / version / fecha / commit_base`
   — igual que el resto de artefactos del framework.
2. **Veredicto binario en el resumen** (GO / NO-GO), coherente con la salida de `/preflight`.
3. **Mapa previo antes de juzgar** (§2): sin él los hallazgos no son auditables por un tercero.
4. **Tabla por dimensión** con columnas fijas `# | Sev | Hallazgo | Evidencia`, y **cita obligatoria
   de `fichero:línea` o comando ejecutado** en cada fila. Sin evidencia, la fila no entra.
5. **Sección "Qué no se ha podido inspeccionar"** (§4) — obligatoria. Distingue "no cumple" de
   "no verificable", que es la diferencia entre una auditoría y una opinión.
6. **Matriz impacto/esfuerzo** (§5) antes del plan, para que la priorización sea trazable.
7. **Fases con `esfuerzo S/M/L` y criterio de aceptación ejecutable** — cada criterio debe ser un
   comando o una comprobación observable, nunca "mejorar X".
8. **Comprobaciones mínimas a ejecutar siempre** antes de escribir nada: `next build` (o
   equivalente), la suite de tests con cobertura, `tsc --noEmit`, `npm audit`, y comparación entre
   tablas del esquema y tablas referenciadas en el código. Cinco comandos que en este caso
   produjeron 6 de los 11 bloqueantes.
