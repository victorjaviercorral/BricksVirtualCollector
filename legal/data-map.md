# Fase 0 — Inventario Real de Datos (Data Map)

Este documento contiene la auditoría de los tratamientos de datos realizados por BricksVirtualCollector, según el análisis del código fuente y su arquitectura técnica.

> **Estado (10/08/2026):** conforme a ADR-009, el proyecto se publicará con el **registro de
> usuarios cerrado** y una cuenta de demostración de solo lectura. Las filas de esta tabla
> referidas a usuarios registrados y contenido subido describen el diseño de la plataforma, no
> un tratamiento activo. 

## Datos del titular y del sitio
- **Titular / responsable del tratamiento**: Víctor Javier Corral (persona física, sin actividad económica asociada al sitio).
- **NIF/CIF y dirección de contacto**: no procede publicarlos. Justificación en `legal/analisis-titularidad-persona-fisica.md` §2.
- **Canal de contacto para privacidad y ejercicio de derechos**: incidencias del repositorio de GitHub o perfil de LinkedIn del titular (decisión DEC-4). No se publica dirección de correo.
- **Hosting y ubicación de servidores**: 
  - Base de datos y Auth (Supabase): **Frankfurt (Alemania, UE)**.
  - Hosting Web (Next.js): **Vercel**, servidores en la Unión Europea.
- **¿Hay cuentas de usuario, subida de contenido, newsletter, venta o donaciones?**: 
  - Cuentas de usuario: solo la cuenta de demostración. Registro público cerrado (ADR-009).
  - Subida de contenido: deshabilitada de facto (escritura revocada a nivel de BBDD, ADR-009).
  - Moderación/Reportes: no operativa. La tabla `reportes` tiene RLS activado sin políticas (hallazgo S7).
  - Newsletter / Ventas / Donaciones: **no existen ni están previstos**. Es lo que sostiene el encuadre de no-actividad-económica.
- **¿El público objetivo incluye menores de edad?**: no. Público adulto coleccionista. Sin registro abierto, no se recogen datos de ninguna persona.
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
- **Reportes de Moderación (`reportes`)**: Motivo del reporte sobre contenido de terceros.

---

## 2. Recogida Pasiva de Datos

- **Sesión de Usuario**: Tokens de autenticación de Supabase (JWT) almacenados vía cookies / localStorage para mantener la sesión abierta.
- **Gamificación / Sistema de "Bricks" (`bricks_recibidos`)**: Se recoge un `hash_visitante` para evitar que un usuario dé bricks ilimitados a un mismo set. Esto implica tratar identificadores únicos (probablemente un hash de la IP o token de sesión).
- **Logs del Servidor / Hosting**: Vercel registra IP, User-Agent y metadatos de petición.
  🔵 **Diferido a la fecha de despliegue (no verificable hoy).** El proyecto no está desplegado en
  Vercel todavía, así que no hay proyecto en cuyo panel comprobar la retención. **Acción cuando se
  despliegue:** entrar en Vercel → Project Settings → Log Drains / Data Retention, anotar aquí el
  plazo exacto y trasladarlo a `politica-privacidad.md` §3 si difiere de "según política del
  proveedor". No tratar este punto como resuelto hasta ese momento.
- **Logs propios (`system_logs`)**: la aplicación escribe nivel, mensaje, endpoint, `user_id` y
  contexto vía `src/lib/logger.ts`. Purga a 30 días **implementada** en
  `supabase/migrations/20260810130000_system_logs_purge.sql` mediante `pg_cron` (job diario que
  elimina registros con más de 30 días). Ver esa migración para instrucciones de verificación y
  activación en Supabase.

---

## 3. Terceros que Reciben Datos (Proveedores / Encargados)

- **Supabase (BaaS)**: 
  - **Qué hace**: Gestiona la base de datos PostgreSQL, la autenticación y el almacenamiento de imágenes (Storage).
  - **Datos que ve**: Todos los datos de usuario, emails, hashes de contraseñas, imágenes subidas.
  - **Ubicación**: **Frankfurt (Alemania, UE)**. No hay transferencias internacionales fuera del EEE, por lo que no procede invocar el Data Privacy Framework.
- **Hosting de la Web (Next.js)**: 
  - **Vercel**. Recibe tráfico de red e IPs de visitantes. Servidores en la UE.
- **Google Fonts (`next/font/google`)**:
  - 🟢 **Auditoría Positiva**: El proyecto utiliza `next/font` de Next.js. Esta herramienta descarga las fuentes durante el proceso de *build* y las auto-aloja. **No se envían peticiones a los servidores de Google durante la navegación del usuario**. No hay fuga de IPs hacia Google por este motivo.

---

## 4. Metadatos de Imágenes (EXIF)

- 🟢 **Auditoría Positiva**: En el componente `MesaTrabajoClient.tsx`, el proyecto cuenta con la función `processImageToStripExif` que pinta la imagen en un `<canvas>` y la exporta a WebP/JPEG antes de subirla. 
- **Conclusión**: Se eliminan de manera efectiva los metadatos EXIF (incluyendo geolocalización o modelo de cámara) en el cliente antes de enviar el archivo al servidor. Excelente medida de Privacidad desde el Diseño (Art. 25 RGPD).

---

## 5. Tabla de Tratamientos (Art. 30 RGPD - Registro de Actividades)

| Finalidad | Categorías de Datos | Interesados | Base Jurídica (Art. 6) | Conservación | Destinatarios | Medidas Seguridad |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gestión de Cuentas y Acceso** | Email, contraseña cifrada, username, avatar, tokens sesión | Usuarios registrados | Ejecución de contrato / Términos | Hasta eliminación de cuenta | Supabase, Hosting | Autenticación segura, RLS, cifrado en tránsito. |
| **Publicación de Colecciones** | Textos, imágenes (sin EXIF), visibilidad | Usuarios registrados | Ejecución de contrato (para publicarlo) y Consentimiento | Hasta eliminación o retirada | Supabase (Público si visibilidad=pública) | RLS por usuario, borrado de EXIF. |
| **Gamificación (Bricks/Visitas)** | `hash_visitante`, contadores | Usuarios | Interés Legítimo (evitar votos múltiples) | Mientras exista el set votado (borrado en cascada) | Supabase | ⚠️ **Discrepancia detectada:** pese al nombre de la columna, `src/app/api/bricks/route.ts:26` almacena el **UUID del usuario en claro**, no un hash. Debe renombrarse la columna o aplicarse un hash real. |
| **Moderación y Reportes** | Motivos del reporte, IDs de contenido | Usuarios reportantes | Interés Legítimo / Obligación Legal (DSA) | Hasta resolución + bloqueo legal | Supabase | Acceso solo a administradores. |
| **Mantenimiento y Seguridad** | IPs, User-Agents, logs de error | Visitantes de la web | Interés Legítimo (seguridad de la red) | Vercel: diferido a fecha de despliegue (🔵 sin proyecto desplegado, no verificable hoy). `system_logs`: 30 días, purga automática vía `pg_cron` | Vercel, Supabase | Acceso a `system_logs` restringido a rol sysadmin por RLS. Purga automática programada. |
