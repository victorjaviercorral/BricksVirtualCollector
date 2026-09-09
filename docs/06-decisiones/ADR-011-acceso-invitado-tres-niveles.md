---
proyecto: bricks-virtual-collector
tipo: adr
estado: aceptada
version: 1
fecha: 2026-09-09
decide: modelo de acceso público antes del go-live
supersede: [ADR-009-entorno-demo-publico]
relacionada_con: [ADR-002-backend-supabase, ADR-003-rate-limiting, ADR-005-limpieza-exif, ADR-010-reconciliacion-exif-rate-limiting, auditoria-arquitectura]
tags: [spec-vjc, decision, seguridad, lanzamiento, acceso-invitado, supabase-anonymous]
---

# ADR-011 — Acceso de invitado con sandbox aislado (modelo de tres niveles)

**Fecha:** 2026-09-09 · **Estado:** aceptada (implementación por fases, ver
`docs/05-plan/plan-acceso-invitado-opcion-c.md`)

> **Nota de activación:** la decisión queda tomada. La implementación se ejecuta por las 9 fases
> del plan; el criterio de activación (abajo) reemplaza al de ADR-009.

## Contexto

El objetivo del go-live es que **cualquiera pueda hacer un walkthrough completo de la app**
(crear vitrina → subir set → publicar → votar → reclamar un bounty → desbloquear una insignia)
**sin barrera de registro**, preservando la seguridad y sin exponer datos de terceros.

ADR-009 resolvió este problema con un despliegue único + cuenta demo de **solo lectura** +
registro cerrado, apoyándose en `revoke insert, update, delete ... from authenticated, anon`.
Esa decisión se tomó bajo dos restricciones que **ya no se cumplen**:

1. **"La Opción C está bloqueada" (A1: migraciones incompletas).** Desde la Iteración 3
   (fila 13 de `FASES_Y_MEJORAS.md`, 10/08/2026) las 4 tablas y 3 buckets que faltaban tienen
   migración aplicada y verificada contra Supabase real. El esquema ya es reproducible.
2. **"La frontera de seguridad es RLS y S1 sigue abierta".** S1 (escalada de privilegios en
   `usuarios_perfil.role`) se cerró con `20260810120000` + `20260819100000` (revoke de columna +
   check de valores válidos), ambas aplicadas y verificadas.

Con esas dos restricciones levantadas, la solución de solo lectura de ADR-009 deja **inertes el
voto, el reclamo de bounties y las insignias** — que son el núcleo de la app y justo lo que se
quiere enseñar. La alternativa B (registro real abierto) reintroduce la barrera de email +
verificación que el go-live quiere evitar y reabre el bloque de seguridad "Iteración 8+" antes
de anunciar.

La práctica de referencia para "try before signing up" es **Supabase Anonymous Sign-Ins**
(feature GA): el invitado obtiene un `auth.uid()` real, así que **toda la RLS existente sigue
aplicando**; solo se añade la distinción invitado/real.

## Decisión

**Modelo de tres niveles sobre un único proyecto de Supabase:**

| Nivel | Quién | Qué puede hacer | Cómo |
|---|---|---|---|
| **Visitante** | Sin sesión | Navegar todo el contenido público en solo lectura | Ya funciona (`/galeria`, `/exposiciones`, `/bounties`, `/vitrina/[id]`, `/perfil/[id]`) |
| **Invitado** | Sesión anónima (`is_anonymous`) | Walkthrough completo en un **sandbox propio** sembrado; sus escrituras **no** aparecen en superficies públicas; la sesión y sus datos **expiran** | `supabase.auth.signInAnonymously()` + RLS de aislamiento + `pg_cron` de purga |
| **Coleccionista** | Cuenta real (email) | Todo, y su contenido **sí** entra en galería/mosaico/perfiles | Registro normal, o **upgrade** desde el modo invitado conservando lo creado |

Principios de la implementación (detallados en el plan §1):

1. **El aislamiento lo garantiza el motor, no la aplicación.** La distinción invitado/real vive
   en `usuarios_perfil.es_invitado` y en el claim JWT `is_anonymous`, y se aplica en políticas
   RLS y en las consultas de las superficies públicas. Nada depende de un `if` en un componente.
2. **Esqueleto desplegado primero.** La Fase 2 deja un flujo de invitado funcional aunque tosco;
   el endurecimiento (aislamiento fino, purga, abuso, semilla) viene después, sobre algo que ya
   se puede probar en producción.
3. **Cero mantenimiento recurrente.** Un único `pg_cron` barre invitados caducados; sus datos se
   van en cascada por las FK `on delete cascade` a `auth.users`.
4. **Reversible.** Desactivar el toggle de Anonymous Sign-Ins y ocultar el botón deja el sitio
   como B (registro real) sin tocar esquema.

## Estado de ADR-009

**Superado por este ADR.** Se añade la nota de superación en su cabecera; no se borra. Sus
controles concretos (`revoke ... from authenticated, anon`, registro cerrado) **no se aplican**:
son incompatibles con un modelo en el que invitados y cuentas reales escriben datos reales.

## Alternativas descartadas

| Alternativa | Razón de descarte |
|---|---|
| **A — Solo lectura (ADR-009)** | Deja inertes voto / reclamo / insignias, que son el núcleo de la app y lo que se quiere enseñar. Sus dos bloqueos originales (A1, S1) ya no aplican, así que no hay razón para conservar la limitación. |
| **B — Registro real abierto** | El email + verificación es exactamente la barrera que el go-live quiere evitar. Reabre el bloque de seguridad "Iteración 8+" (moderación de terceros, coste de Storage, tratamiento de datos personales) antes de anunciar. |
| **Proyecto de Supabase separado para invitados** | Duplica infraestructura y configuración; el upgrade invitado → cuenta real cruzaría proyectos. Anonymous Sign-Ins da el aislamiento sobre un solo proyecto vía `auth.uid()` + RLS. |
| **Sandbox con reseteo total periódico (D de ADR-009)** | Borra también contenido semilla y cuentas reales de prueba; la purga selectiva por `is_anonymous` + antigüedad es más quirúrgica y no toca nada real. |

## Consecuencias

### Lo que sigue siendo obligatorio **aunque** haya invitados

Invitados y cuentas reales **escriben datos reales**, así que el "neutraliza no equivale a
corregir" de ADR-009 ya no basta: hay que corregir de verdad.

- **S1 — escalada de privilegios en RLS:** verificar en producción que está cerrada (el repo ya
  es público, cualquiera lee `supabase/migrations/`). Cubierto por `20260810120000` +
  `20260819100000`; el preflight de la Fase 9 lo re-comprueba en vivo.
- **S5 — cabecera `Content-Security-Policy`:** hoy solo `X-Frame-Options` / HSTS / `nosniff`.
  Queda como condición de anuncio (plan §4).
- **S3 — rate limiting con almacén compartido:** requiere cuenta Upstash (decisión del titular,
  ADR-010). Condición de anuncio.
- **S2 — test E2E de la limpieza EXIF con una foto con GPS real:** condición de anuncio
  (ADR-010 §Criterio de cierre, punto 2).

### Lo que deja de ser obligatorio

- **Moderación de contenido de terceros:** los invitados **nunca son públicos** (Fase 1 bloquea
  `visibilidad='pública'` para `is_anonymous`; Fase 5 los excluye de toda superficie pública).
  No hay contenido de invitado que moderar.
- **Coste variable de Storage sin techo:** acotado por la purga (`pg_cron`, 48 h) y por el tope
  de fotos de invitado (Fase 6).
- **Registro cerrado:** el registro real vuelve a estar abierto y explícito (Fase 2 retira el
  auto-registro implícito de `/login`, pero deja un alta deliberada).

### Otras

- Publicar `supabase/migrations/` expone el modelo RLS: es aceptable porque la seguridad de este
  proyecto está en las políticas, no en el secreto del esquema (ADR-009 §Contexto, punto 3),
  y S1 está cerrada.
- La cuenta semilla ("museo", Fase 7) es contenido real permanente: se documenta como tal para
  que la purga no la toque (`es_invitado = false`).

## Criterio de verificación de la activación

**Reemplaza al de ADR-009.** Antes de anunciar el enlace:

1. Desde `/login` o `/`, un clic entra al Hub con una sesión anónima
   (`is_anonymous: true` en el JWT / `usuarios_perfil.es_invitado = true`).
2. Un invitado completa el walkthrough: crear vitrina (privada), subir un set, votar en
   contenido público, reclamar un bounty, ver una insignia desbloquearse.
3. Con un invitado que ha desbloqueado insignias / subido sets: `/galeria`,
   `/perfil/<id-invitado>` (404), el Mosaico, el Hub y la home **no** muestran nada suyo.
   Un coleccionista real sigue apareciendo en todas ellas.
4. `insert into vitrinas (..., visibilidad) values (..., 'pública')` con sesión anónima → falla;
   con `'privada'` → OK.
5. `update usuarios_perfil set role='sysadmin' where id=auth.uid()` con sesión anónima → falla.
6. `/admin/*` no es accesible con una sesión de invitado (redirige a `/dashboard`).
7. `select jobname, active from cron.job` → `purga-invitados` y la purga de `system_logs`
   activos. Forzar `last_sign_in_at` a hace 3 días en un invitado de prueba y ejecutar
   `select public.purgar_invitados_expirados()` → su `auth.users` y todo lo suyo desaparece;
   ninguna cuenta real se toca.
8. Un invitado hace upgrade con un email real → tras confirmar, `es_invitado = false`, su
   vitrina y su set siguen ahí y ahora puede publicarla.
9. `spec-vjc-framework:preflight` contra el despliegue real → veredicto **GO** o
   **GO CON EXCEPCIONES** con las excepciones de "Iteración 8+" (S5, S3, S2) documentadas.

## Acciones manuales del titular (no automatizables desde el repo)

| Acción | Fase | Dónde |
|---|---|---|
| Habilitar **Anonymous Sign-Ins** | 1 | Supabase → Authentication → Providers |
| (Opcional) Activar **CAPTCHA** (hCaptcha/Turnstile) para anon sign-in | 1 / 6 | Supabase → Authentication → Settings |
| Aplicar la migración `..._acceso_invitado.sql` | 1 | Supabase → SQL Editor |
| Habilitar **`pg_cron`** | 3 | Supabase → Database → Extensions |
| Aplicar la migración `..._purga_invitados.sql` | 3 | Supabase → SQL Editor |
| Montar la **cuenta semilla "museo"** (vitrinas + sets + bounty + exposición) | 7 | App real, flujo normal |
| Ajustar `storage.buckets.file_size_limit` (S7) | 6 | Supabase → SQL Editor |

## Trazabilidad

- Plan de implementación: `docs/05-plan/plan-acceso-invitado-opcion-c.md` (9 fases).
- Fila en `docs/00-proyecto/FASES_Y_MEJORAS.md`.
- Cierra de paso el hallazgo **V4a** (`pg_cron` deshabilitado → retención de logs incumplida) en
  la Fase 3.
