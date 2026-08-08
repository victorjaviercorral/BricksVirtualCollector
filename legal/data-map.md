# Fase 0 — Inventario Real de Datos (Data Map)

Este documento contiene la auditoría de los tratamientos de datos realizados por Lego Virtual Museum, según el análisis del código fuente y su arquitectura técnica. 

## Datos del titular y del sitio
- **Titular / responsable del tratamiento**: ⚠️ PENDIENTE: Nombre o Razón Social completa
- **NIF/CIF y dirección de contacto**: ⚠️ PENDIENTE: NIF/CIF y dirección física completa
- **Email de contacto para privacidad y para ejercicio de derechos**: ⚠️ PENDIENTE: Dirección de correo electrónico
- **Hosting y ubicación de servidores**: 
  - Base de datos y Auth (Supabase): ⚠️ PENDIENTE: Ubicación del proyecto de Supabase (ej. Frankfurt, EU)
  - Hosting Web (Next.js): ⚠️ PENDIENTE: Proveedor de hosting (ej. Vercel, Netlify) y su ubicación
- **¿Hay cuentas de usuario, subida de contenido, newsletter, venta o donaciones?**: 
  - Cuentas de usuario: Sí (Supabase Auth).
  - Subida de contenido: Sí (Fotos de sets, nombres, descripciones).
  - Moderación/Reportes: Sí.
  - Newsletter / Ventas / Donaciones: ⚠️ PENDIENTE: Confirmar si existen o están previstos a futuro.
- **¿El público objetivo incluye menores de edad?**: ⚠️ PENDIENTE: Definir edad del público objetivo y si hay atracción infantil deliberada.
- **Idiomas del sitio**: ⚠️ PENDIENTE: Español (confirmar si habrá otros).

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
- **Logs del Servidor / Hosting**: ⚠️ PENDIENTE: Especificar si el proveedor (Vercel, etc.) recoge logs de acceso, direcciones IP, User-Agents y con qué periodo de retención.

---

## 3. Terceros que Reciben Datos (Proveedores / Encargados)

- **Supabase (BaaS)**: 
  - **Qué hace**: Gestiona la base de datos PostgreSQL, la autenticación y el almacenamiento de imágenes (Storage).
  - **Datos que ve**: Todos los datos de usuario, emails, hashes de contraseñas, imágenes subidas.
  - **Ubicación**: ⚠️ PENDIENTE (Es vital configurar el proyecto en la UE, ej. Frankfurt). Si está en EE.UU., requiere detallar transferencias internacionales (Data Privacy Framework).
- **Hosting de la Web (Next.js)**: 
  - ⚠️ PENDIENTE: Indicar proveedor (ej. Vercel). Recibe tráfico de red, IPs de visitantes.
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
| **Gamificación (Bricks/Visitas)** | Identificadores únicos (`hash_visitante`), contadores | Usuarios y Visitantes | Interés Legítimo (evitar fraude) / Consentimiento (si usa cookies) | ⚠️ PENDIENTE: ¿Cuánto dura el hash? | Hosting | Hash irreversible (idealmente salteado). |
| **Moderación y Reportes** | Motivos del reporte, IDs de contenido | Usuarios reportantes | Interés Legítimo / Obligación Legal (DSA) | Hasta resolución + bloqueo legal | Supabase | Acceso solo a administradores. |
| **Mantenimiento y Seguridad** | IPs, User-Agents, logs de error | Visitantes de la web | Interés Legítimo (seguridad de la red) | ⚠️ PENDIENTE: Retención de logs | Proveedor de Hosting | Borrado automático de logs. |
