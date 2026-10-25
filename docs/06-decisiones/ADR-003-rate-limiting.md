---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-003 — Rate limiting

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
`checklists/seguridad.md` ítem 13 exige rate limiting en todo endpoint público, más estricto
en autenticación, registro, recuperación de contraseña y subida de archivos. Supabase no trae
esto nativo.

## Decisión
Upstash Redis (tier gratuito) para contadores de rate limiting por IP/usuario, invocado desde
las Edge Functions en los endpoints sensibles.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Tabla de contadores propia en Postgres | Añade carga de escritura a la BD principal y latencia extra en cada petición sensible. |
| Cloudflare delante de Vercel | Capa de infraestructura adicional no justificada al tamaño de este MVP. |

## Consecuencias
Dependencia de un proveedor más en el stack. Su tier gratuito está documentado públicamente
como suficiente (del orden de miles de comandos/día sin tarjeta) para el volumen esperado
(100 usuarios, 1.500 visitas en 3 meses), pero la vigencia exacta de ese pricing se confirma
al integrarlo, no en esta spec (constitution A.3: no se afirma una verificación no ejecutada).

## Implementada (22/09/2026)

ADR-010 había reafirmado esta decisión como pendiente de una cuenta Upstash (bloqueo externo,
hallazgo S8 / E2 del preflight de 21/09/2026). El titular creó la cuenta y la base de datos Redis
(tier gratuito, región `us-east-1`) el 22/09/2026; `src/lib/rate-limit.ts` usa el cliente REST de
`@upstash/redis` (`INCR` + `EXPIRE`, ventana fija) cuando `UPSTASH_REDIS_REST_URL` y
`UPSTASH_REDIS_REST_TOKEN` están presentes, y degrada al `Map` en memoria anterior si no lo están
(local sin configurar, o un fallo de red hacia Upstash — falla abierto, nunca bloquea tráfico).

Verificado contra la API REST real de Upstash (`INCR`/`EXPIRE`/`DEL` sobre una clave de prueba,
no solo mocks) antes de dar el cambio por probado. Detalle completo en ADR-010 §Rate limiting y
en `docs/09-lanzamiento/preflight-2026-09-21.md` (E2).

## Ajuste (25/10/2026) — el fallo abierto no puede costar los reintentos del SDK

La decisión de degradar al `Map` si Upstash no responde sigue vigente. Lo que no estaba
acotado era el tiempo de esa degradación: `@upstash/redis` reintenta los errores de red
cinco veces con backoff exponencial (~4,3 s) antes de rechazar la promesa, y `proxy.ts`
espera a `checkRateLimit` en cada ruta dinámica. Un Redis inalcanzable retenía la home,
los 404 y las API unos 4,5 s (más el arranque en frío), con Supabase respondiendo en
decenas de milisegundos. El cliente se construye con `retry: { retries: 0 }` y un
`AbortSignal.timeout` de 1,5 s por intento. Si Redis responde, el contador compartido
sigue igual (`INCR` + `EXPIRE`). Si no, se falla abierto en un solo intento. Detalle y
mediciones en `docs/09-lanzamiento/ttfb-rate-limit-2026-10-25.md`.
