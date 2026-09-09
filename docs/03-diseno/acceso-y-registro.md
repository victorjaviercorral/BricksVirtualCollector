---
proyecto: bricks-virtual-collector
tipo: diseno
subtipo: flujo-de-usuario
estado: vigente
fecha: 2026-09-09
relacionada_con: [ADR-011-acceso-invitado-tres-niveles, plan-acceso-invitado-opcion-c, navegacion-y-flujos, legal-architecture]
tags: [spec-vjc, diseno, acceso-invitado, auth]
---

# Acceso y registro — los tres niveles

Documenta cómo entra un usuario a BricksVirtualCollector tras la Fase 2 del plan de acceso de
invitado (ADR-011). Sustituye al modelo de "cuenta demo de solo lectura + registro cerrado" de
ADR-009.

## 1. Los tres niveles

| Nivel | Cómo se entra | Sesión | Puede escribir | Su contenido es público | Caduca |
|---|---|---|---|---|---|
| **Visitante** | No hace nada | Ninguna | No | — | — |
| **Invitado** | Botón "Probar sin registrarme" / "prueba la demo" | Anónima (`is_anonymous`, Supabase) | Sí, en su **sandbox** | **Nunca** (RLS: `es_invitado` bloquea `visibilidad='pública'`; Fase 5 lo excluye de galería/mosaico/perfil/home) | **48 h** desde el último acceso (purga `pg_cron`, Fase 3) |
| **Coleccionista** | `/registro` con email + contraseña + checkbox | Real | Sí | Sí, si publica | No |

Un invitado puede **subir de nivel** a coleccionista conservando todo lo que creó (mismo
`auth.uid()`) — es la Fase 4 del plan.

## 2. Rutas y puntos de entrada

| Ruta / lugar | Qué ofrece |
|---|---|
| `/login` | **Solo entrar.** Email + contraseña. Sin checkbox (ya se aceptó al registrarse). Enlaces: `/registro`, `/forgot-password`, y "Probar sin registrarme". Si las credenciales son inválidas → mensaje + enlace a `/registro` (ya **no** auto-registra). |
| `/registro` | **Crear cuenta.** Email + contraseña + **checkbox** (Política de Privacidad + Términos). Maneja el caso "confirma tu email". Enlaces: `/login` y "Probar sin registrarme". |
| `/` (hero) | CTA "Empezar a Coleccionar" → `/registro`; debajo, enlace discreto "O prueba la demo sin registrarte" (invitado). |
| Navbar (desktop) | "Entrar" → `/login`. |
| Navbar (móvil) | "Entrar" → `/login` · "Crear cuenta" → `/registro`. |
| `/v/[id]` (vitrina compartida) | CTA "Crear mi Museo Gratis" → `/registro`. |
| Acciones que exigen sesión (votar, reclamar, crear vitrina) sin estar logueado | `router.push('/login')` — desde ahí el visitante puede entrar, registrarse o probar como invitado. |

Componentes: `src/components/auth/AuthCard.tsx` (shell compartido login/registro),
`src/components/EntrarComoInvitado.tsx` (toda la lógica de invitado, `variant` `panel`/`hero`),
`src/lib/legal.ts` (`TERMS_VERSION`, `GUEST_TERMS_VERSION`).

## 3. Dónde se registra cada aceptación

| Nivel | Consentimiento RGPD | Aceptación de Términos | Persistencia |
|---|---|---|---|
| Invitado | No procede (no hay PII; ver ADR-011 §"Consentimiento y aceptación") | Tácita, al pulsar el botón | `auth.users.raw_user_meta_data.guest_terms_version = 'invitado-v1'`. `usuarios_perfil.consentimiento_version` = `null` (lo fija el trigger `handle_new_user`). |
| Coleccionista | Checkbox explícito en `/registro` | Mismo checkbox | `raw_user_meta_data.terms_version = 'v1.0'` → trigger → `usuarios_perfil.consentimiento_version` + `consentimiento_fecha`. |

La migración `20260909110000_acceso_invitado.sql` (Fase 1) es la que marca `es_invitado`, da a
los invitados `username = 'Invitado_<hex>'` y bloquea su publicación.

## 3.1 Ciclo de vida del invitado

**Caducidad (Fase 3).** `supabase/migrations/20260909120000_purga_invitados.sql`:
`public.purgar_invitados_expirados(ventana interval default '48 hours')` borra los `auth.users`
con `is_anonymous` sin actividad en la ventana (`coalesce(last_sign_in_at, created_at)`). Al
borrar el usuario, la cascada de FK se lleva `usuarios_perfil`, `vitrinas`, `sets`, `fotos`,
`insignias_usuario`, `bounties_reclamados`, `exposicion_sets` y los `bricks_recibidos` de sus
propios sets. La función borra **a mano** dos cosas que no cascadan: los `bricks_recibidos` que
el invitado emitió sobre sets ajenos (hash = su uid, o `exposicion-…-user-<uid>`) y sus filas de
`storage.objects` (por prefijo de carpeta `<uid>/`). El blob físico de Storage queda huérfano
(limitación de Supabase) — gap conocido y acotado. Job `pg_cron` `purga-invitados` diario a las
03:17 UTC. La misma migración reactiva `purge-system-logs` (hallazgo V4a).

**Upgrade a cuenta real (Fase 4).** El banner `BannerInvitado` (layout raíz, si
`user.is_anonymous`) abre `UpgradeCuentaModal` → `supabase.auth.updateUser({ email, password,
data: { terms_version } })`. Cuando Supabase marca `is_anonymous = false` (al confirmar el email,
o de inmediato si la confirmación está desactivada), el trigger `on_auth_user_upgraded`
(`20260909130000`) pone `es_invitado = false`, cambia el `username` `Invitado_*` por
`Coleccionista_*` y fija `consentimiento_version`/`consentimiento_fecha` reales. **El `auth.uid()`
no cambia**, así que todo el contenido creado como invitado se conserva y pasa a ser publicable.

## 4. Qué ajustar para un lanzamiento oficial

Si el proyecto pasa de "prototipo de portfolio / early adopters" a producto con usuarios reales
declarados, revisar en este orden:

1. **CAPTCHA con widget** (Fase 6). Hoy el CAPTCHA está **desactivado**: activarlo en Supabase
   sin montar el widget de hCaptcha en `/login`, `/registro` y el botón de invitado deja caído
   todo el login (`captcha_failed: no captcha_token found`). Requiere: cuenta hCaptcha (site key
   + secret) y `@hcaptcha/react-hcaptcha` en los tres formularios pasando el token.
2. **Purga de invitados activa** (Fase 3). El modo invitado **no se anuncia** hasta que el job
   `pg_cron` de purga a 48 h esté activo y verificado — la Política de Privacidad y los Términos
   ya prometen ese plazo.
3. **Verificación de email obligatoria.** Decidir si `/registro` exige confirmar el email antes
   de dar acceso (hoy depende de la config de Supabase Auth). Afecta al copy del formulario.
4. **Rate limit de altas.** Revisar los límites de Supabase para `signUp` y `signInAnonymously`;
   documentar el elegido. Ligado a S3 (rate limiting compartido, ADR-010 — cuenta Upstash).
5. **Aislamiento de superficies públicas** (Fase 5) verificado end-to-end: galería, mosaico,
   `/perfil/[id]`, home y Hub no muestran nada de invitados.
6. **`/admin/*` cerrado a invitados y no-admin** (Fase 6): hoy `/admin/exposiciones` y
   `/admin/bounties` no comprueban rol a nivel de página.
7. **Términos §6** (notificación de cambios): hoy dice "con 15 días de antelación por email" —
   coherente para cuentas; para invitados no aplica (no hay email). Revisar redacción.
8. **Barrido legal completo** (Fase 8): README, `src/components/tour/steps.ts:5` (menciona
   "solo lectura (ADR-009)"), `legal/legal-architecture.md` §2.3 (EXIF en canvas → Route
   Handler), deriva de `legal/data-map.md` (§4 EXIF, `pg_cron`, despliegue Vercel).
9. **Preflight** (`spec-vjc-framework:preflight`, Fase 9) contra el despliegue real → veredicto
   GO / GO CON EXCEPCIONES (listando S5 CSP, S3 rate limiting, S2 EXIF E2E si no se abordan).
