---
proyecto: bricks-virtual-collector
tipo: lanzamiento
subtipo: preflight
etapa: mvp
exposicion: X2
fecha: 2026-09-21
despliegue: https://bricks-virtual-collector.vercel.app
commit_desplegado: 162f41c (main tras la PR #9) — verificado ANTES de las PR #12 y #13
veredicto: NO-GO
relacionada_con: [ADR-011-acceso-invitado-tres-niveles, plan-acceso-invitado-opcion-c]
tags: [spec-vjc, preflight, lanzamiento]
---

# Preflight — 21/09/2026

**Veredicto: NO-GO.** Hay **un bloqueante** (ver §Veredicto). Todo lo demás es corregible o aceptable como
excepción, y dos de los fallos encontrados ya tienen corrección en PR.

Todo se verificó **ejecutando contra el despliegue real** (`bricks-virtual-collector.vercel.app`): `fetch`
sobre la URL publicada, Playwright + axe-core, Lighthouse móvil, `npm audit`, lecturas con la anon key y un
borrado de cuenta ejecutado de principio a fin con una cuenta desechable. Notas de método:

- `docs/modelo.md` (§3.2) y `docs/09-lanzamiento/endurecimiento.md` **no existen en este repositorio**; los bloques
  aplicables se derivaron de `project.md` (**X2**): 1-7 aplican; el bloque 8 (módulos X3) es **N/A** — no hay pagos,
  menores, IA ni datos de categoría especial.
- Prohibido `OK` sin evidencia: lo que no pude ejecutar figura como `PENDIENTE (autor)`, no como `OK`.

## 1 · Seguridad

| Ítem | Resultado | Evidencia |
|---|---|---|
| Cabeceras HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options | **OK** | `max-age=31536000; includeSubDomains; preload` · `nosniff` · `strict-origin-when-cross-origin` · `camera=(), microphone=(), geolocation=()` · `DENY` |
| **Content-Security-Policy** | **FALLO** | Cabecera ausente en `/` (hallazgo S5, ya declarado en ADR-011 como condición de anuncio) |
| TLS válido y http→https | **OK** | TLS 1.3, cert `*.vercel.app` (Google Trust Services) hasta 27/11/2026; `http://` → **308** a `https://` |
| Ningún secreto en el bundle servido | **OK** | 14 chunks descargados y revisados: ningún JWT con `role=service_role` ni valor de clave. Solo aparecen **referencias** a `process.env.SUPABASE_SERVICE_ROLE_KEY` (sin valor; en cliente es `undefined`). Observación: código de servidor arrastrado a chunks de cliente por un módulo compartido |
| Ningún secreto en el repo público | **OK** | `.env.local` no está versionado (solo `.env.example`); búsqueda de JWT y `sb_secret_` en **todo el historial** sin coincidencias |
| Rate limiting con ráfaga real | **OK con matiz** | 160 peticiones a `/api/health`: 91×`200` y 69×`429`. **Matiz (S3):** el almacén es un `Map` en memoria por instancia, no compartido |
| RLS: acceso a dato ajeno denegado | **OK** | Con la anon key: vitrinas no públicas → 0 filas · `PATCH usuarios_perfil.role='sysadmin'` → 42501 · `INSERT` de vitrina ajena → denegado |
| Errores sin trazas ni rutas internas | **OK** | 404 en `/api/no-existe`, `/set/x`, `/perfil/<uuid>`; `POST /api/bricks` malformado → `401` con JSON; sin stack ni rutas en ningún cuerpo. Observación: `/vitrina/<no-uuid>` devuelve `200` (soft-404) |
| `npm audit` sin altas/críticas | **FALLO → corregido en PR #12** | En el despliegue: **1 crítica** (`next` 16.0–16.3.2: RCE en la API de optimización de imágenes/AVIF y en servidores Windows), **2 altas** (`sharp <0.35.4`, libheif, procesa las fotos subidas; `nanoid`). PR #12 → `next 16.3.5`, `sharp 0.35.4`: `npm audit` = **0** |

**Observación (no bloqueante):** con la anon key se pueden leer de cualquier perfil las columnas `role`,
`consentimiento_version`, `consentimiento_fecha` y `total_visitas` (no hay email). Recomendable limitar las
columnas de la lectura pública.

## 2 · Privacidad y legal

| Ítem | Resultado | Evidencia |
|---|---|---|
| Privacidad, cookies, términos, aviso legal y propiedad intelectual publicados | **OK** | Las 5 URLs `/legal/*` → `200` |
| Política coherente con el mapa de datos **real** | **OK (política) / FALLO menor (`data-map.md`)** | La política describe correctamente los tres niveles, las 48 h y la retención de logs. Pero el registro Art. 30 `legal/data-map.md` sigue diciendo "registro cerrado", limpieza EXIF en el navegador y proyecto "no desplegado" |
| Ningún script no esencial antes del consentimiento | **OK** | Carga limpia de `/`, `/login`, `/galeria`: solo 2 hosts (el propio y Storage de Supabase), **0 cookies, 0 `localStorage`** |
| Borrado de cuenta ejecutado de principio a fin | **OK** | Cuenta desechable con vitrina + set → login → *Eliminar cuenta* en `/dashboard/perfil`: `auth.users`, `usuarios_perfil`, `vitrinas` y `sets` pasan de 1/1/1/1 a **0/0/0/0**; `/dashboard` redirige a `/login` |
| Exportación de datos | **FALLO menor** | No existe exportación self-service; el derecho de portabilidad se atiende por el canal manual (GitHub/LinkedIn) que declara la política |
| Procesadores con DPA y región anotada | **PENDIENTE (autor)** | Supabase Frankfurt (UE) documentado; región de Vercel sin confirmar (`project.md` la marca `[PENDIENTE]`); aceptación de DPA no verificable por mí |
| Logs sin datos personales | **OK** | `system_logs`: 0 filas (nada que contenga PII) |

## 3 · Accesibilidad

| Ítem | Resultado | Evidencia |
|---|---|---|
| Scan axe (WCAG 2.0/2.1 A y AA), 9 vistas × claro/oscuro | **FALLO → corregido en PR #13** | **Nivel A:** `link-name` en `/vitrina/[id]` (enlace de volver, solo icono, sin nombre). **AA:** `color-contrast` en pie (2,55:1), hero de la home (4,05:1), fechas de `/exposiciones` (3,98:1) y enlaces `text-brand-blue` en tarjetas oscuras (2,65:1) |
| Flujo principal solo con teclado | **PENDIENTE (autor)** | Verificado solo `/login`: 12 tabulaciones con foco visible en todas. El flujo completo (crear vitrina, subir set, votar) no se puede dar por bueno sin una pasada manual |
| Contraste en estados reales | **PARCIAL** | axe cubre el estado normal en claro y oscuro; hover y foco no verificados |
| Zoom 200 % sin pérdida | **OK** | Viewport 640 px (equivale a 1280 px al 200 %): sin desbordamiento horizontal en `/`, `/login`, `/galeria`, `/bounties`, `/como-funciona` |
| Formularios con etiqueta programática | **OK** | axe sin violaciones de `label` |

## 4 · Performance (spec: Lighthouse ≥ 90, LCP < 2,5 s, peso < 1 MB)

| Ítem | Resultado | Evidencia |
|---|---|---|
| Lighthouse móvil (throttling 4G lento simulado por defecto) | **FALLO** | `/`: **77** · `/galeria`: **85** · `/login`: **86** (rendimiento); accesibilidad 94-96, buenas prácticas 100, SEO 100 |
| LCP < 2,5 s | **FALLO** | 5,4 s / 4,2 s / 3,7 s |
| CLS < 0,1 | **OK** | 0 en las tres |
| INP < 200 ms | **NO MEDIBLE** en laboratorio | TBT como proxy: 130-220 ms |
| Peso de la vista principal < 1 MB | **FALLO** | vitrina pública **1.416 KB**, home **1.556 KB**, galería **5.220 KB** (fotos de 0,9 y 2,5 MB servidas sin redimensionar con `<img>` crudo) |
| Conexión lenta simulada | **OK** | Es el perfil por defecto de Lighthouse móvil (arriba) |

Causa común: las fotos se guardan a calidad 90 sin **redimensionar** en `api/sets/foto` y se sirven en bruto.

## 5 · Operación — el bloque que bloquea

| Ítem | Resultado | Evidencia |
|---|---|---|
| Seguimiento de errores recibiendo eventos | **FALLO** | No hay herramienta (sin Sentry o equivalente en `package.json`); `system_logs` vacía |
| Alerta con destinatario real | **FALLO** | No configurada |
| Comprobación de disponibilidad activa | **FALLO** | Existe `/api/health` (responde `200`) pero ningún monitor externo lo consulta |
| **Copia de seguridad restaurada al menos una vez** | **FALLO — BLOQUEANTE** | Sin evidencia de copia ni de restauración. El plan gratuito de Supabase **no incluye copias automáticas** y no se ha hecho ninguna manual. En X2+ es bloqueante por definición |
| Reversión escrita y ejecutada en < 10 min [X2+] | **FALLO** | No hay procedimiento escrito ni ejecutado (Vercel permite *instant rollback*, pero no se ha probado) |
| Alerta de facturación | **PENDIENTE (autor)** | No verificable desde fuera |

## 6 · Contenido

| Ítem | Resultado | Evidencia |
|---|---|---|
| Sin placeholder ni lorem | **OK** | Home limpia. Copy obsoleto "gana **puntos** masivos" → corregido en PR #13 |
| Mensajes de error comprensibles | **PARCIAL** | Revisados los de API (JSON en español); no auditados todos los de UI |
| Metadatos, Open Graph y favicon | **FALLO menor** | `title`, `description`, `lang="es"` y favicon OK; **sin `og:*` ni `twitter:card`** |
| Sitemap y robots | **FALLO menor** | `/robots.txt` y `/sitemap.xml` → `404` (decidir si se quiere indexar) |
| Dominio correcto en enlaces | **OK** | Ningún enlace a `localhost` ni a previews |

## 7 · Medición

| Ítem | Resultado | Evidencia |
|---|---|---|
| Cada métrica del Go/No-Go dispara de verdad | **FALLO** | El Go/No-Go del PRD-lite pide vitrinas, usuarios, **visitas** y **enlaces compartidos** (`enlace_generado` / `enlace_visitado`). Vitrinas y usuarios se cuentan con SQL, pero **no existe ninguna analítica de visitas ni esos eventos** (y la política de privacidad declara que no hay analítica). Sin decidirlo, la revisión a 3 meses no tendrá datos |

## 8 · Módulo específico [X3] — **N/A** (exposición X2, sin módulos activados)

## Observación sobre la suite de tests

Durante el preflight `PerfilPublicoClient > muestra el alias…` falló **una vez** en una ejecución con cobertura y no
se reprodujo en 7 ejecuciones posteriores (aislada y completa). Causa **no determinada** (hipótesis: tiempo bajo
carga de instrumentación). Es la segunda intermitencia de la suite tras `BountiesSectionClient` (corregida el 12/09).
Queda anotada; si reaparece se investiga antes de relanzar CI.

---

## Veredicto

### **NO-GO**

**Bloqueante (1):** no hay copia de seguridad de la base de datos **restaurada al menos una vez** (bloque 5). En X2
es bloqueante siempre. Hoy, si la base de datos se corrompe o alguien borra datos, **no hay forma de recuperarlos**.

**Resueltos durante el preflight (pendientes de merge y re-verificación):**
- PR **#12** — vulnerabilidades de dependencias (`next` crítica, `sharp` alta, `nanoid`).
- PR **#13** — accesibilidad nivel A (`link-name`), contraste AA y copy obsoleto.

### Camino a GO CON EXCEPCIONES

1. Mergear #12 y #13 y **repetir** `npm audit` y axe sobre el despliegue (deben dar 0 y sin violaciones).
2. **Resolver el bloqueante**, con cualquiera de estas dos vías:
   - **(a)** Hacer una copia manual con `pg_dump` y **restaurarla en un Postgres local** (Docker) para demostrar que
     sirve. No requiere un proyecto nuevo de Supabase. Los ficheros de Storage no van en la copia de BD.
   - **(b)** Pasar Supabase a **Pro** (copias diarias) y probar una restauración.
3. Aceptar por escrito las excepciones de abajo.

### Excepciones propuestas (requieren aceptación escrita del autor)

| # | Fallo | Riesgo aceptado | Responsable | Fecha de corrección |
|---|---|---|---|---|
| E1 | Sin CSP (S5) | XSS sin segunda barrera; mitigado por el escapado de React y por no renderizar HTML de usuario | Claude / autor | _a fijar_ |
| E2 | Rate limiting en memoria por instancia (S3) | Límite eludible repartiendo peticiones entre instancias | autor (cuenta Upstash) | _a fijar_ |
| E3 | Performance: Lighthouse 77-86, LCP 3,7-5,4 s, vitrina y home > 1 MB | Carga lenta en móvil; sin efecto de seguridad | Claude (redimensionar en la subida + `next/image`) | _a fijar_ |
| E4 | Sin seguimiento de errores, alertas ni monitor de disponibilidad | Caídas o errores no detectados hasta que alguien avise | autor | _a fijar_ |
| E5 | Sin procedimiento de reversión probado | Recuperación lenta ante un despliegue malo | autor | _a fijar_ |
| E6 | Sin exportación de datos self-service | Portabilidad atendida a mano | autor | _a fijar_ |
| E7 | Sin analítica de visitas ni eventos de enlaces (Go/No-Go) | La revisión a 3 meses sin datos de visitas | autor (decisión) | _a fijar_ |
| E8 | Sin OG/Twitter Cards, `robots.txt` ni `sitemap.xml` | Peor presentación al compartir; SEO | Claude | _a fijar_ |
| E9 | `legal/data-map.md` desactualizado | Registro Art. 30 impreciso (la política pública sí es correcta) | Claude | _a fijar_ |
| E10 | Perfiles públicos exponen `role`, `consentimiento_*` y `total_visitas` | Fuga menor de metadatos (sin email) | Claude | _a fijar_ |
| E11 | Pendientes del autor: teclado en el flujo completo, DPA y región de Vercel, alerta de facturación | Sin evidencia | autor | _a fijar_ |

**Aceptación del autor** (obligatoria para GO CON EXCEPCIONES): _pendiente — se anota aquí con nombre y fecha_.
