# TTFB de producción — reintentos de Upstash en el proxy (25/10/2026)

La home de https://bricks-virtual-collector.vercel.app/ superaba los 5 s hasta el primer
byte en dos comprobaciones diarias seguidas (7,2 s el 24/10 y 7,2 s el 25/10). No había
despliegue desde el 19/10 (`620f542`). Supabase REST, medido desde fuera, respondía en
~0,05 s.

## Qué se midió

`curl -w '%{time_starttransfer}'` desde esta investigación, el 25/10/2026 ~07:46–07:50 UTC.
Todas las respuestas dinámicas llevaban `x-vercel-cache: MISS` y, en HTML,
`cache-control: private, no-cache, no-store`. `x-vercel-id` de las dinámicas incluye `fra1`
(la región de la función). Los estáticos no pasan por esa función.

| Petición | TTFB | Notas |
| :--- | ---: | :--- |
| `GET /` (primera) | 7,39 s | 200 |
| `GET /` ×3 en caliente, justo después | 5,08 s / 4,68 s / 4,66 s | el arranque en frío explica el pico, no el suelo |
| `GET /this-route-does-not-exist-ttfb` | 4,55 s | 404, misma cabecera `no-store` |
| `GET /login` | 4,52 s | 200 |
| `GET /api/health` ×5 seguidas | 4,75 / 4,58 / 4,59 / 4,61 / 4,55 s | el JSON decía `database.latency_ms` 112, 59, 82, 67 y 59 |
| `GET /hero-vitrina.svg` | 0,13 s | el matcher del proxy ya excluye svg |
| `GET /favicon.ico` | 0,16 s | excluido del matcher |
| `GET /robots.txt` | 0,07 s | `x-vercel-cache: HIT`, `age` ~4,8 días |

Un cold start no explica que cinco `GET /api/health` seguidos sigan en ~4,6 s con la
consulta a `usuarios_perfil` en menos de 120 ms. Esa ruta no usa el layout (no hay un
segundo `getUser()` de React) y el `curl` no envía cookie de sesión, así que
`auth.getUser()` no sale a la red. El tramo común es `src/proxy.ts`: rate limit y, solo
si hay sesión, refresco de auth.

## Causa

`checkRateLimit` construía `new Redis({ url, token })` sin `retry`. En `@upstash/redis`
1.39.0 el defecto es 5 reintentos y `backoff = (n) => Math.exp(n) * 50` ms. El bucle
espera en los fallos de `fetch` (no en un HTTP 4xx, que rechaza a la primera):

`50 * (e^0 + e^1 + e^2 + e^3 + e^4) ≈ 4290 ms`.

El `catch` de `checkRateLimitRedis` ya degradaba al permiso (falla abierto, ADR-003),
pero solo después de esa espera. Reproducido con el mismo paquete contra `127.0.0.1:9`
(conexión rechazada al momento): cliente por defecto **4317 ms**, `retry: { retries: 0 }`
**0–1 ms**.

El suelo de producción (~4,5 s de TTFB menos ~60–110 ms de Supabase) cae encima de esos
4,3 s más unos pocos intentos de red que fallan rápido. La base Redis está en
`us-east-1` (ADR-003) y la función en `fra1`; un salto de región sano son ~100–200 ms,
no 4,5 s. El patrón encaja con un `fetch` que lanza (host caído, DNS o URL que no
conecta), no con un Redis lento. No se pudo leer el valor de `UPSTASH_REDIS_REST_URL`
desde aquí (la API de Vercel lo devolvió sin descifrar), así que no se comprobó el host
en sí. El código deja de convertir ese fallo en 4,3 s de espera.

## Qué cambia

`src/lib/rate-limit.ts` recorta URL y token y construye el cliente con
`retry: { retries: 0 }` y `signal: () => AbortSignal.timeout(1500)`. Un intento por
petición: si Redis responde, `INCR`/`EXPIRE` siguen igual; si no, el `catch` existente
usa el `Map` en memoria. El matcher del proxy y `updateSession` no se tocan: la sesión,
las rutas protegidas y el invitado se resuelven como antes.

## Después (preview del mismo commit, región fra1)

El preview tiene las mismas variables `UPSTASH_*` (target preview) y la misma región.
Medido el 25/10/2026 ~07:59 UTC, con la protección de despliegue ya resuelta (la primera
petición sin sesión de Vercel era un 302 y no cuenta). Producción, en el mismo minuto,
seguía en el suelo anterior.

| Petición | Producción | Preview |
| :--- | ---: | ---: |
| `GET /` en caliente | 4,66–7,39 s (7,17 s en el control de este minuto) | 0,46 / 0,49 / 0,46 s |
| `GET` de una ruta inexistente | 4,55 s | 0,31 s (404) |
| `GET /login` | 4,52 s | 0,30 s |
| `GET /api/health` | 4,55–5,31 s (db 59–112 ms) | 0,55 / 0,44 / 0,34 s (db 91 / 42 / 58 ms) |
| `GET /hero-vitrina.svg` | 0,13 s | 0,09 s |
| `GET /dashboard` sin sesión | — | 0,14 s, 307 a `/login` |
| `GET /admin/moderacion` sin sesión | — | 0,17 s, 307 a `/login` |

El HTML del preview sigue en `no-store` y `x-vercel-cache: MISS`: no se ha cacheado la
home. Baja el tiempo de la función, no el de un HIT de CDN.

## Qué mirar si el límite compartido importa

Con Redis inalcanzable el límite vuelve a ser por instancia, que es el degradado que
ADR-003 ya aceptaba. En el dashboard de Upstash (base de `us-east-1` creada el
22/09/2026) comprobar que la base sigue existiendo y que la URL REST de Vercel apunta a
ella. Eso no se cambia desde este repositorio.
