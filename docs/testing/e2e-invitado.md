---
proyecto: bricks-virtual-collector
tipo: guia
subtipo: e2e
fecha: 2026-09-21
relacionada_con: [ADR-011-acceso-invitado-tres-niveles, plan-acceso-invitado-opcion-c]
tags: [spec-vjc, testing, e2e, acceso-invitado]
---

# E2E de invitado (Fase 9)

Recorre el walkthrough completo de un invitado y comprueba el aislamiento, **contra un Supabase de
pruebas, nunca contra producción**.

## Qué prueba (`e2e/invitado.spec.ts`, 10 pasos secuenciales con una sola sesión)

1. Un clic en "prueba la demo" → Hub con sesión anónima y banner de modo demo; perfil `Invitado_*`.
2. Sin hacer nada ve la semilla: galería, bounty y exposición.
3. Crea una vitrina: "Pública" está bloqueada y en BD queda `privada`.
4. Sube un set con una foto **con GPS real** (`e2e/fixtures/set-gps.jpg`) y el fichero servido **no
   conserva EXIF** (cierra **S2** de ADR-010).
5. Vota en contenido público.
6. Reclama un bounty con su set.
7. Desbloquea una insignia y queda persistida en `insignias_usuario`.
8. Aislamiento: un visitante no ve su vitrina en `/galeria` y `/perfil/<id>` da 404.
9. `/admin/exposiciones` y `/admin/bounties` redirigen a `/dashboard`.
10. Una foto de 4 MB se rechaza en modo demo (tope de 3 MB).

Su primera ejecución ya sirvió para **detectar un fallo real**: el modal "Crear vitrina" ofrecía
"Pública" por defecto y a un invitado la RLS se lo rechazaba. Corregido con `useEsInvitado`
(`src/lib/use-es-invitado.ts`), con tests unitarios.

## Por qué un proyecto Supabase aparte

- El E2E escribe (invitados, votos, reclamos); en producción los votos quedarían 48 h sobre los sets de
  la semilla y cada ejecución nocturna ensuciaría datos reales.
- Necesita la `service_role` para sembrar y limpiar: no debe estar en GitHub Actions apuntando a producción.
- Parte de un estado conocido y reproducible (`scripts/e2e-seed.mjs`), cosa que producción no garantiza.
- Al aplicarle las migraciones desde cero **demuestra que el esquema es reproducible** (hallazgo A1).

## Puesta en marcha (una vez, ~15 min)

1. Crea un proyecto en Supabase (plan gratuito, región UE).
2. **Authentication → Providers → Anonymous Sign-Ins: ON.** CAPTCHA: OFF. Confirmación de email: da igual.
3. Aplica **todas** las migraciones de `supabase/migrations/` en orden (SQL Editor, de la más antigua a la más
   nueva). Si alguna falla al partir de cero, es un hallazgo: anótalo.
4. Habilita `pg_cron` solo si quieres probar la purga; el E2E no lo necesita.
5. En GitHub → Settings → Secrets → Actions añade: `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`,
   `E2E_SUPABASE_SERVICE_ROLE_KEY`.

## Ejecución

Local (PowerShell/bash, con las tres variables `E2E_*` definidas):

```bash
npm run e2e:seed            # siembra: museo, 3 vitrinas públicas, 1 bounty, 1 exposición activa
npm run test:e2e:invitado   # arranca la app en :3100 apuntando al Supabase de pruebas
```

CI: workflow `E2E invitado` (`.github/workflows/e2e-invitado.yml`), nocturno (04:30 UTC) y manual
(`workflow_dispatch`). No forma parte del Quality Gate.

## Salvaguardas

- `playwright.invitado.config.ts` y `scripts/e2e-seed.mjs` **se niegan a ejecutarse** si faltan las variables
  `E2E_*` o si `E2E_SUPABASE_URL` coincide con la URL de producción de `.env.local`.
- `retries: 0`: es un flujo con estado; reintentar enmascararía fallos reales.
- `npm run test:e2e` (config por defecto) ignora este spec.

## Hallazgos al montar el proyecto de pruebas desde cero (`bvc-e2e`, 08/10/2026)

Al aplicar todas las migraciones en orden sobre el proyecto de pruebas nuevo salieron dos migraciones que
solo funcionaban sobre el estado de producción, más dos hallazgos de la purga de invitados:

1. **`20260901120000` fallaba desde cero** — `ERROR 42704: policy "Anyone can insert a brick on public sets"
   for table "bricks_recibidos" does not exist`. Ese nombre solo existe en producción (renombrada a mano);
   desde cero la política se llama `"Anyone can insert a brick"`. **Corregido:** bloque `do` que renombra la
   política antigua solo si existe y la nueva no (consulta `pg_policies`). En producción es un no-op.
2. **`20260909120000` fallaba desde cero** — `ERROR 2BP01: dependent privileges exist`. Repetir
   `create extension if not exists pg_cron` vuelve a disparar el event trigger de Supabase, que hace
   `revoke all on table cron.job from postgres` y choca con el `grant all privileges on all tables in schema
   cron to postgres` de `20260810130000`. **Corregido:** la extensión solo se crea si no está en
   `pg_extension`. En producción (pg_cron ya instalada) es un no-op.
3. **Seguridad:** `purgar_invitados_expirados` (security definer) es ejecutable por `anon` y `authenticated`
   vía `/rest/v1/rpc` (lint de Supabase 0028/0029). Se corrige en una PR aparte, con una migración nueva
   (rama `fix/revocar-rpc-purga-invitados`).
4. **Pendiente, sin arreglar:** `purgar_invitados_expirados` borra directamente de `storage.objects`, y
   Supabase lo bloquea con el trigger `protect_objects_delete`; la purga fallará en cuanto haya invitados
   caducados con objetos en Storage. Hay que pasar el borrado de ficheros a la Storage API (p. ej. Edge
   Function o `pg_net`).
