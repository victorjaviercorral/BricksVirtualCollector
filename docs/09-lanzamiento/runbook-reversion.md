---
proyecto: bricks-virtual-collector
tipo: lanzamiento
subtipo: runbook
fecha: 2026-09-22
relacionada_con: [preflight-2026-09-21]
tags: [spec-vjc, operacion, runbook, reversion]
---

# Runbook — Reversión de un despliegue en menos de 10 minutos

Cierra el hallazgo **E5** del preflight (`docs/09-lanzamiento/preflight-2026-09-21.md`): había
capacidad técnica de revertir (Vercel guarda cada despliegue), pero **ningún procedimiento
escrito ni ejecutado**. Esto es el procedimiento. Falta ejecutarlo una vez de verdad — ver
§Pendiente al final; escribirlo ya reduce el riesgo de improvisar durante un incidente real.

## Cuándo usar esto

- Un despliegue a `main` rompe algo en producción (error 500 generalizado, build corrupto que
  Vercel sirvió parcialmente, una regresión visual o funcional grave).
- **No** es la vía para deshacer un cambio de esquema de base de datos: los rollbacks de código y
  de base de datos son independientes (ver §Cuándo NO basta con esto).

## Procedimiento (vía dashboard — la más rápida, sin CLI)

1. Ve a **vercel.com** → el proyecto `bricks-virtual-collector` → pestaña **Deployments**.
2. Localiza el **último despliegue bueno conocido** (el que precede al que falla). Vercel marca
   cada uno con el commit y el mensaje; para este repo eso es prácticamente el commit anterior a
   `main`.
3. Ábrelo → botón **"..."** (menú de tres puntos) → **"Promote to Production"**.
4. Confirma. Vercel apunta el dominio de producción (`bricks-virtual-collector.vercel.app`) a ese
   despliegue anterior **al instante** — no reconstruye nada, solo cambia qué build sirve.
5. Verifica: recarga `https://bricks-virtual-collector.vercel.app/` y confirma que el problema
   desapareció.

Con práctica, los pasos 1-4 se hacen en menos de 2 minutos. El límite de 10 minutos del preflight
es holgado incluso contando con encontrar el despliegue correcto bajo presión.

## Alternativa por CLI (si el dashboard no es accesible)

```bash
npx vercel login          # una vez, si no hay sesión activa
npx vercel ls             # lista despliegues recientes con su URL
npx vercel promote <url-del-despliegue-bueno>
```

## Cuándo NO basta con esto

- **Si el despliegue roto incluía una migración de base de datos ya aplicada** (por ejemplo, una
  columna renombrada o una política RLS más estricta), revertir el código NO deshace la
  migración — Vercel solo controla qué build de Next.js se sirve, nunca el estado de Supabase.
  En ese caso: revertir el código primero (para parar la sangría) y, aparte, escribir y aplicar
  una migración de vuelta atrás sobre Supabase, igual que cualquier otra migración de este
  proyecto (consulta previa a `pg_policy`, verificación, rollback documentado en la cabecera —
  patrón ya seguido en las migraciones de `supabase/migrations/`).
- **Si el problema es de datos, no de código** (p. ej. una purga que borró de más), la vía es la
  restauración de una copia de seguridad, no esto — ver el bloque 5 de
  `docs/09-lanzamiento/preflight-2026-09-21.md` para el procedimiento probado el 22/09/2026.

## Pendiente

Este procedimiento está escrito pero **no se ha ejecutado ni una vez** contra el proyecto real
(el preflight lo señala como excepción E5). Para cerrarlo del todo: en un momento sin tráfico,
hacer un "Promote to Production" de un despliegue anterior y luego promover de vuelta el actual,
cronometrando el proceso completo. No requiere que nada esté roto — es un simulacro.
