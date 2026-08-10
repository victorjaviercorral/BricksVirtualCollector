---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-08-10
relacionada_con: [ADR-003-rate-limiting, ADR-005-limpieza-exif, auditoria-arquitectura]
supersede_parcialmente: [ADR-003-rate-limiting]
tags: [spec-vjc, decision, seguridad, deuda-tecnica]
---

# ADR-010 — Reconciliación de ADR-003 (rate limiting) y ADR-005 (EXIF) con la implementación real

**Fecha:** 2026-08-10 · **Estado:** aceptada

> Ejecuta la tarea F2.1 de `docs/auditoria-arquitectura.md` §6 (Fase 2). Su función no es tomar
> una decisión nueva, sino **hacer explícito que dos ADRs previos ya no describen el sistema
> real**, y fijar qué hacer al respecto en cada caso — que no es lo mismo para los dos.

## Contexto

La auditoría de arquitectura (2026-08-10) detectó que dos decisiones en estado `aceptada`
contradecían el código:

- **ADR-005** decide limpiar EXIF/GPS en una Edge Function server-side, y descarta explícitamente
  la limpieza en cliente por "no verificable ni garantizable server-side". La implementación real
  (`src/components/MesaTrabajoClient.tsx`) hace exactamente eso: `canvas.toBlob()` en el
  navegador, seguido de subida directa a Supabase Storage con la anon key. No existe Edge
  Function.
- **ADR-003** decide Upstash Redis como almacén de rate limiting compartido. La implementación
  real (`src/lib/rate-limit.ts`) es un `Map` en memoria del proceso, sin persistencia entre
  instancias ni arranques en frío.

Un ADR en estado `aceptada` que contradice el código socava la utilidad de tener ADRs: nadie
puede confiar en que describen el sistema sin verificarlo contra el código cada vez.

## Decisión

**Trato distinto para cada caso**, porque el coste y el riesgo de implementar lo originalmente
decidido son distintos:

### Rate limiting (ADR-003): reafirmada con una mitigación intermedia documentada

Se **reafirma** Upstash Redis como el almacén correcto y pendiente de implementar. No se emite
una alternativa: sigue siendo la decisión vigente. Lo que cambia es que ahora hay una mitigación
intermedia real entre "nada" y "Upstash":

`src/lib/rate-limit.ts` lee el límite y la ventana desde `system_config` (tabla que ya existía,
cuyo panel de administración —`/admin/system/health`— ya permitía editarla, pero cuyo valor nadie
leía: era una promesa sin implementar, hallazgo S9). Ahora sí se lee, con caché de 60 segundos
para no convertir cada petición en una consulta a Supabase. Esto cierra la mitad de S9: el panel
de administración ahora tiene efecto real.

**Lo que sigue sin resolver:** el almacén sigue siendo un `Map` en memoria, no compartido entre
instancias (S8 sigue abierto). Migrar a Upstash requiere que el titular cree una cuenta y
provisione las variables de entorno correspondientes — es una decisión externa fuera del alcance
de esta iteración de código. Queda como tarea pendiente explícita.

### EXIF (ADR-005): mantenida en su forma, con plan de migración concreto pendiente de ejecutar

Se **mantiene** la decisión de ADR-005 (limpieza verificable server-side) sin cambiarla, pero se
precisa el mecanismo: en vez de una Supabase Edge Function (un segundo objetivo de despliegue,
con su propia autenticación de CLI), la limpieza server-side se implementará como un **Route
Handler de Next.js** (`src/app/api/...`), que ya es el patrón que usa el resto del proyecto para
lógica de servidor (`api/bricks`, `api/bounties/claim`, `api/auth/delete-account`). Logra la
misma propiedad de verificabilidad que exige ADR-005 §Decisión sin añadir una plataforma de
despliegue nueva.

**No implementada en esta iteración.** Se evaluó implementarla directamente (F2.2 de la
auditoría), pero requiere: (a) decidir la técnica de limpieza (parseo de bytes JPEG/PNG/WebP a
mano, sin dependencias nuevas, frente a una librería de procesamiento de imágenes con binarios
nativos como `sharp`), (b) revocar el permiso de subida directa del cliente al bucket
`fotos_sets` vía política de Storage, y (c) verificación contra un bucket de Supabase real, que no
está disponible en este entorno de desarrollo. Implementar esto sin poder probarlo contra
infraestructura real arriesga con dejar el flujo de subida de fotos roto en producción — el
mismo tipo de riesgo que este proyecto ya sufrió una vez (bug de `created_at` vs `creado_en`,
hallazgo A5). Queda como tarea de la iteración 3, con el titular disponible para verificar contra
Supabase real antes de mezclar.

## Alternativas descartadas

| Alternativa | Razón de descarte |
|---|---|
| Reescribir ADR-003/ADR-005 para que coincidan con el código actual (aceptar el `Map` en memoria y la limpieza en cliente como decisión final) | Contradice la razón original de ambas decisiones (S8: un `Map` no es un límite compartido; S5/RC-01: el propio ADR-005 explica por qué el cliente no es verificable). Sería documentar la regresión como si fuera la decisión, no corregirla. |
| Implementar Upstash y el Route Handler de EXIF ahora mismo, sin verificación contra infraestructura real | Alto riesgo de romper flujos en producción sin poder probarlos; Upstash además requiere una cuenta que no existe todavía. |
| Dejar los ADR-003/ADR-005 en `aceptada` sin ninguna nota | Es la situación detectada como defecto por la propia auditoría (T7, D4): documentación que afirma un estado que el código no sostiene. |

## Consecuencias

- ADR-003 y ADR-005 **permanecen `aceptada`** sin reescribirse — sus decisiones originales siguen
  siendo las correctas — pero ambas quedan enlazadas a este documento, que es la fuente de verdad
  sobre su estado de implementación real.
- Queda un backlog explícito de dos tareas de infraestructura, cada una con su bloqueo declarado:
  1. **Rate limiting → Upstash**: bloqueado por decisión externa del titular (crear cuenta).
  2. **EXIF → Route Handler server-side**: bloqueado por necesitar verificación contra Supabase
     real; no bloqueado por ninguna decisión pendiente del titular, es trabajo de código que debe
     hacerse con acceso de prueba a la infraestructura.
- Mientras el punto 2 no se resuelva, el copy de la aplicación que promete anonimato
  ("100% Anónimo" en `/login`, "Metadatos (EXIF) se eliminarán" en Mesa de Trabajo) sigue siendo
  cierto en su efecto para el usuario (los metadatos SÍ se eliminan antes de guardar), pero la
  garantía es más débil de lo que ADR-005 exige (un cliente modificado podría saltársela). Esto
  debe quedar reflejado en cualquier comunicación pública del proyecto hasta que se cierre.

## Criterio de cierre de este ADR

Este documento deja de ser necesario (puede marcarse `estado: resuelta`) cuando:
1. `src/lib/rate-limit.ts` usa un almacén compartido entre instancias, y
2. Existe un test automatizado que sube una imagen con GPS y verifica su ausencia en el fichero
   servido — el criterio literal de ADR-005 §Consecuencias.
