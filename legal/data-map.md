# Fase 0 — Inventario Real de Datos (Data Map)

Este documento contiene la auditoría de los tratamientos de datos realizados por BricksVirtualCollector, según el análisis del código fuente y su arquitectura técnica.

> **Estado (09/09/2026):** ADR-009 quedó **superado por ADR-011**. El proyecto se publica con el
> **registro abierto** y un **modo invitado** (sesión anónima de Supabase, sin email, purgada a
> las 48 h — ver la fila "Acceso de invitado" en la tabla del Art. 30). Las filas referidas a
> usuarios registrados y contenido subido describen ya un tratamiento activo.
>
> **Actualizado 22/09/2026** (E9 del preflight, `docs/09-lanzamiento/preflight-2026-09-21.md`): se
> corrigen las tres derivas señaladas más abajo — EXIF ya describe el Route Handler con `sharp`
> (ADR-010), `pg_cron` está realmente activo (dos jobs: purga de invitados y de `system_logs`,
> verificado el 22/09/2026) y el proyecto está desplegado en
> `bricks-virtual-collector.vercel.app`.
>
> **Segunda actualización, mismo día (E11 del preflight):** el titular confirmó la región real de
> Vercel — **Frankfurt (`eu-central-1`, `fra1`)**, la misma que Supabase. (La región por defecto de
> Vercel al crear el proyecto había quedado en Norteamérica sin que nadie la fijara
> explícitamente; el titular la corrigió a Frankfurt en el propio dashboard al hacer esta
> verificación, antes de que llegara a documentarse ninguna afirmación incorrecta.)

## Datos del titular y del sitio
- **Titular / responsable del tratamiento**: Víctor Javier Corral (persona física, sin actividad económica asociada al sitio).
- **NIF/CIF y dirección de contacto**: no procede publicarlos. Justificación en `legal/analisis-titularidad-persona-fisica.md` §2.
- **Canal de contacto para privacidad y ejercicio de derechos**: incidencias del repositorio de GitHub o perfil de LinkedIn del titular (decisión DEC-4). No se publica dirección de correo.
- **Hosting y ubicación de servidores**: 
  - Base de datos y Auth (Supabase): **Frankfurt (Alemania, UE)**.
  - Hosting Web (Next.js): **Vercel**, región confirmada el 22/09/2026: **Frankfurt (Alemania,
    `eu-central-1`, `fra1`)** — misma región que Supabase.
- **¿Hay cuentas de usuario, subida de contenido, newsletter, venta o donaciones?**: 
  - Cuentas de usuario: registro real abierto (ADR-011) más el modo invitado (sesión anónima, sin email — fila "Acceso de invitado" del Art. 30).
  - Subida de contenido: activa, vía `POST /api/sets/foto` (limpieza EXIF server-side, tope 10 MB en cuenta real / 3 MB e invitado).
  - Moderación/Reportes: la tabla `reportes` se retiró (19/08/2026, hallazgo S6) -- sin consumidor en el código, era una idea inicial sin desarrollar. La moderación real (aprobar/rechazar participaciones en exposiciones) sí es operativa vía `exposicion_sets`.
  - Newsletter / Ventas / Donaciones: **no existen ni están previstos**. Es lo que sostiene el encuadre de no-actividad-económica.
- **¿El público objetivo incluye menores de edad?**: no. Público adulto coleccionista. Para registrarse se declara ser mayor de 14 años (art. 7 LOPDGDD, `legal/terminos-condiciones.md` §1.2); el modo invitado no recoge ningún dato personal.
- **Idiomas del sitio**: español únicamente (`lang="es"` en `src/app/layout.tsx`).

---

## 1. Puntos de Recogida de Datos Activa

Según el código (formularios, interfaz y base de datos), el usuario entrega voluntariamente:

- **Registro y Autenticación (Supabase Auth)**: Email y contraseña (o proveedor OAuth si se habilita).
- **Perfil de Usuario (`usuarios_perfil`)**: `username` (nombre de usuario), `avatar_url` (foto de perfil).
- **Gestión de Vitrinas y Colecciones (`vitrinas`, `sets`, `fotos`)**: 
  - Subida de imágenes de los sets.
  - Datos de texto: `nombre`, `descripcion`, `tematica`, `num_piezas`, `anio_lanzamiento`, `estado`, `notas`.
  - La configuración de visibilidad elegida por el usuario (pública, privada, privada con enlace).
- ~~Reportes de Moderación (`reportes`)~~: retirado (19/08/2026) -- tabla eliminada, nunca tuvo consumidor.

---

## 2. Recogida Pasiva de Datos

- **Sesión de Usuario**: Tokens de autenticación de Supabase (JWT) almacenados vía cookies / localStorage para mantener la sesión abierta.
- **Gamificación / Sistema de "Bricks" (`bricks_recibidos`)**: Se recoge un `hash_visitante` para evitar que un usuario dé bricks ilimitados a un mismo set. Esto implica tratar identificadores únicos (probablemente un hash de la IP o token de sesión).
- **Logs del Servidor / Hosting**: Vercel registra IP, User-Agent y metadatos de petición del
  proyecto desplegado en `bricks-virtual-collector.vercel.app`.
  🔵 **Pendiente (E11 del preflight):** confirmar en Vercel → Project Settings → Log Drains / Data
  Retention el plazo exacto de retención y trasladarlo a `politica-privacidad.md` §3 si difiere de
  "según política del proveedor".
- **Logs propios (`system_logs`)**: la aplicación escribe nivel, mensaje, endpoint, `user_id` y
  contexto vía `src/lib/logger.ts`. Purga a 30 días vía `pg_cron`
  (`supabase/migrations/20260810130000_system_logs_purge.sql`, job `purge-system-logs`) —
  **confirmada activa por el titular el 09/09/2026** (2 jobs en `cron.job`), junto con el job
  `purga-invitados` (48 h, Fase 3 del acceso de invitado, migración `20260909120000`) que la
  misma reprogramó de paso (hallazgo V4a: el job de logs nunca llegó a crearse hasta entonces
  porque `pg_cron` estaba deshabilitado).

---

## 3. Terceros que Reciben Datos (Proveedores / Encargados)

- **Supabase (BaaS)**: 
  - **Qué hace**: Gestiona la base de datos PostgreSQL, la autenticación y el almacenamiento de imágenes (Storage).
  - **Datos que ve**: Todos los datos de usuario, emails, hashes de contraseñas, imágenes subidas.
  - **Ubicación**: **Frankfurt (Alemania, UE)**. No hay transferencias internacionales fuera del EEE, por lo que no procede invocar el Data Privacy Framework.
  - **DPA (Art. 28 RGPD)**: [supabase.com/dashboard/org/.../documents](https://supabase.com/dashboard/org/ejzrdgacrtmiqentvmsd/documents) — revisado por el titular el 22/09/2026. Sin botón de aceptación explícita en el tier gratuito: se aplica automáticamente al usar el servicio bajo sus Términos.
- **Hosting de la Web (Next.js)**: 
  - **Vercel**. Recibe tráfico de red e IPs de visitantes. Región de ejecución confirmada:
    Frankfurt (Alemania, `eu-central-1`, `fra1`) — misma región que Supabase, dentro de la UE.
  - **DPA (Art. 28 RGPD)**: [vercel.com/legal/dpa](https://vercel.com/legal/dpa) — revisado por el
    titular el 22/09/2026. Se incorpora automáticamente a los Términos de Servicio, sin acción de
    aceptación separada en el tier gratuito.
- **Google Fonts (`next/font/google`)**:
  - 🟢 **Auditoría Positiva**: El proyecto utiliza `next/font` de Next.js. Esta herramienta descarga las fuentes durante el proceso de *build* y las auto-aloja. **No se envían peticiones a los servidores de Google durante la navegación del usuario**. No hay fuga de IPs hacia Google por este motivo.

---

## 4. Metadatos de Imágenes (EXIF)

- 🟢 **Auditoría positiva (server-side, ADR-010).** `POST /api/sets/foto` (Route Handler, runtime
  Node.js) recibe la foto en crudo y la reencodifica con `sharp` — `.rotate()` aplica la
  orientación EXIF a los píxeles y la propia reencodificación a JPEG descarta EXIF/GPS/ICC/XMP
  (no se llama a `.withMetadata()`). El bucket `fotos_sets` no acepta subida directa del cliente
  desde `20260901100000`, así que este Route Handler es el único camino posible: un cliente
  modificado no puede saltarse la limpieza.
- **Conclusión**: se eliminan de manera efectiva los metadatos EXIF (incluida la geolocalización)
  **antes** de que el fichero llegue a Storage, no en el navegador — la garantía que exigía
  ADR-005 y que la versión anterior de este documento (limpieza en `<canvas>`) todavía no
  cumplía. También redimensiona a un máximo de 1600px de lado (hallazgo E3 del preflight,
  rendimiento) sin efecto sobre esta garantía.

---

## 5. Tabla de Tratamientos (Art. 30 RGPD - Registro de Actividades)

| Finalidad | Categorías de Datos | Interesados | Base Jurídica (Art. 6) | Conservación | Destinatarios | Medidas Seguridad |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gestión de Cuentas y Acceso** | Email, contraseña cifrada, username, avatar, tokens sesión | Usuarios registrados | Ejecución de contrato / Términos | Hasta eliminación de cuenta | Supabase, Hosting | Autenticación segura, RLS, cifrado en tránsito. |
| **Acceso de invitado (sesión anónima)** | Identificador de sesión anónimo (sin email), contenido creado durante la sesión (vitrinas, sets, imágenes sin EXIF, votos) | Invitados (early adopters de prueba) | Ejecución de la interacción solicitada al entrar (art. 6.1.b analógico); aceptación tácita de los Términos | **48 h** desde el último acceso — cascada a `auth.users`. La automatización de la purga (`pg_cron`) es la **Fase 3** del plan de acceso de invitado; el modo invitado **no se anuncia públicamente hasta que esté activa**. | Supabase | RLS por `auth.uid()`, `es_invitado` bloquea publicación, contenido nunca público. |
| **Publicación de Colecciones** | Textos, imágenes (sin EXIF), visibilidad | Usuarios registrados | Ejecución de contrato (para publicarlo) y Consentimiento | Hasta eliminación o retirada | Supabase (Público si visibilidad=pública) | RLS por usuario, borrado de EXIF. |
| **Gamificación (Bricks/Visitas)** | `hash_visitante`, contadores | Usuarios | Interés Legítimo (evitar votos múltiples) | Mientras exista el set votado (borrado en cascada) | Supabase | ⚠️ **Discrepancia detectada:** pese al nombre de la columna, `src/app/api/bricks/route.ts:26` almacena el **UUID del usuario en claro**, no un hash. Debe renombrarse la columna o aplicarse un hash real. |
| **Moderación y Reportes** | Motivos del reporte, IDs de contenido | Usuarios reportantes | Interés Legítimo / Obligación Legal (DSA) | Hasta resolución + bloqueo legal | Supabase | Acceso solo a administradores. |
| **Mantenimiento y Seguridad** | IPs, User-Agents, logs de error | Visitantes de la web | Interés Legítimo (seguridad de la red) | Vercel: 🔵 pendiente confirmar el plazo exacto (E11 del preflight). `system_logs`: 30 días, purga automática vía `pg_cron` (confirmada activa) | Vercel, Supabase | Acceso a `system_logs` restringido a rol sysadmin por RLS. Purga automática programada. |
