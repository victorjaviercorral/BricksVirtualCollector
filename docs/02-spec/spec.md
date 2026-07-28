# Spec — Lego Virtual Museum

**Basada en:** PRD-lite v0.1 (CONDICIONAL 7.0/10, corregido) · **Fecha:** 2026-07-27 · **Version:** 0.1
**Tier:** Medio (reclasificado en esta fase — ver `docs/00-proyecto/project.md`) · **Stack:** Next.js + Supabase + Netlify ([[06-decisiones/ADR-001-stack-tecnico]])

## 0. Alcance de v1 (contexto para leer esta spec)

Beta controlada, multi-usuario. El autor invita a coleccionistas reales (beta-testers) que
se registran con cuenta propia, crean su vitrina, catalogan sus piezas y publican via enlace
compartible. Visitantes ven sin necesidad de cuenta. Sin apertura publica de registro en v1.

## 1. Trazabilidad

| Req ID | Requisito | Origen | Criterio de verificacion |
|--------|-----------|--------|---------------------------|
| RF-01 | Registro/autenticacion de coleccionista solo por invitacion (beta) | PRD 3.3 must-have; project.md (beta controlada) | Test: un email no invitado no puede completar registro; uno invitado si |
| RF-02 | Perfil con alias elegido libremente y avatar de una lista preset (sin foto personal) | RC-01 | Test: el formulario de perfil no ofrece campo de subida de foto de avatar, solo seleccion de presets |
| RF-03 | Crear/editar vitrina en estado borrador o publicada | PRD 3.3 must-have | Test CRUD: due~o crea, edita y cambia estado; otro usuario no puede |
| RF-04 | Catalogar piezas/sets dentro de una vitrina (nombre, num. de set, tema/linea, piezas, ano) | PRD 3.3 must-have (catalogacion basica) | Test: alta/edicion/borrado de pieza, campos persistidos |
| RF-05 | Subida de fotos de pieza con limpieza de metadatos EXIF/GPS en servidor | RC-01 | Test: subir imagen con GPS/EXIF real, verificar su ausencia total en el archivo servido desde Storage |
| RF-06 | Publicar vitrina genera un enlace compartible con slug no secuencial/no enumerable | RC-01 (anonimato: evitar enumeracion) | Test: dos vitrinas consecutivas no tienen slugs predecibles entre si (no incremental) |
| RF-07 | Visitante ve una vitrina publicada sin necesidad de cuenta | PRD 3.3 must-have (acceso sin friccion) | Test: request sin sesion a una vitrina publicada devuelve 200 con el contenido |
| RF-08 | Reportar contenido inapropiado sin cuenta y sin almacenar identidad del reportante | RC-03 | Test: se puede reportar sin sesion; inspeccion de la fila creada en `reports` no contiene IP/user\_id del reportante |
| RF-09 | Cola de moderacion solo-admin: listar reportes pendientes y actuar (ocultar/descartar) | RC-03 | Test: usuario no-admin recibe 403 al intentar acceder a la cola; admin puede listar y actuar |
| RF-10 | Borrado de cuenta con cascada inmediata (DB + Storage) | RC-04 | Test: tras borrar cuenta, ninguna fila ni objeto de Storage asociado sigue accesible |
| RF-11 | Admin invita beta-testers por email | RF-01 (habilitador) | Test: invitacion genera registro utilizable una sola vez |
| RNF-PRIV-01 | **No existe ningun endpoint, tabla ni affordance de UI para mensajeria o contacto directo 1:1 entre usuarios**, en ningun flujo | RC-02 | Auditoria de rutas y esquema: no existe tabla `messages`/`conversations`, ningun endpoint `/api/messages*` ni `/api/dm*`, ninguna pantalla expone chat o contacto directo |
| RNF-PRIV-02 | El modelo de datos y los formularios no incluyen campo de direccion postal ni exigen dato de contacto mas alla del email de autenticacion (gestionado por Supabase Auth) | RC-01 | Auditoria de esquema y de formularios: cero columnas `address`/`phone`/similares en `profiles`; unico dato de contacto es el email de Supabase Auth, no expuesto a otros usuarios |
| RNF-GDPR-06 | Sin venta ni cesion de datos personales a terceros en v1 (sin integraciones de terceros que reciban PII; el futurible de subastas queda excluido, ver Fuera de alcance #6) | RC-04 | Revision de politica de privacidad + auditoria de integraciones de terceros: ninguna recibe PII de usuarios en v1 |
| RNF-SEC-01 | Secretos/API keys solo en variables de entorno | checklist security.md #1 | Revision: `.env*` en `.gitignore` desde el primer commit; grep de claves en codigo = 0 resultados |
| RNF-SEC-02 | Rate limiting en `/api/reports`, `/api/photos/upload`, `/api/admin/reports*` y `/api/account/delete` | checklist security.md #2 | Test: N+1 requests en 1 minuto desde la misma IP/usuario devuelve 429 en cada uno de los 4 endpoints |
| RNF-SEC-03 | Validacion/sanitizacion de todo input (cliente y servidor) | checklist security.md #3 | Test: input con HTML/script en alias o nombre de pieza se guarda escapado, no se ejecuta |
| RNF-SEC-04 | Validacion de tipo/tamano de fotos subidas | checklist security.md #4 | Test: archivo no-imagen o >tamano maximo es rechazado con error explicito |
| RNF-SEC-05 | RLS activo en TODAS las tablas, politicas explicitas por operacion | checklist security.md #5 | Revision: cada tabla en Supabase tiene RLS enabled + al menos 1 policy por operacion (select/insert/update/delete) |
| RNF-SEC-06 | Autenticacion solo via Supabase Auth | checklist security.md #6 | Revision de codigo: no existe tabla ni logica propia de contrasenas |
| RNF-SEC-07 | HTTPS + cabeceras de seguridad basicas | checklist security.md #7 | Test: respuesta HTTP incluye CSP, X-Content-Type-Options, Referrer-Policy |
| RNF-SEC-08 | Dependencias auditadas | checklist security.md #8 | `npm audit` sin vulnerabilidades criticas/altas en fase 0 y antes de cada release |
| RNF-SEC-09 | Errores sin fuga de detalles internos | checklist security.md #9 | Test: forzar un error 500 y confirmar que la respuesta no incluye stack trace ni SQL |
| RNF-SEC-10 | Mecanismo minimo de reporte/moderacion no pospuesto | checklist security.md #10 = RF-08+RF-09 | Ver RF-08/RF-09 |
| RNF-PERF-01 | Lighthouse >= 90 (performance + accessibility, movil) | checklist performance.md #1 | Medicion Lighthouse CI en `/plan` |
| RNF-PERF-02 | LCP < 2.5s en 4G simulado | checklist performance.md #2 | Medicion Lighthouse/WebPageTest |
| RNF-PERF-03 | Bundle JS inicial < 200KB gzip | checklist performance.md #3 | `next build` + analisis de bundle |
| RNF-PERF-04 | Imagenes webp/avif + lazy loading fuera de viewport | checklist performance.md #4 | Revision: `next/image` configurado con formatos modernos |
| RNF-PERF-05 | `font-display: swap` en las fuentes de la identidad | checklist performance.md #5 | Revision de `@font-face` |
| RNF-PERF-06 | Paginacion/carga incremental en galeria de vitrinas y listado de piezas (24/pagina, cursor) | checklist performance.md #6 | Test: mas de 24 items pagina correctamente |
| RNF-PERF-07 | Animaciones solo transform/opacity, 60fps, `prefers-reduced-motion` respetado | checklist performance.md #7; design-identity v4 | Ya validado en el mockup v4; revision de codigo en implementacion real |
| RNF-PERF-08 | Medicion real en Netlify (no solo local) | checklist performance.md #8 | Tarea explicita en `/plan` |
| RNF-GDPR-01 | Borrado con cascada inmediata en DB+Storage; purga de backups <= 30 dias | RC-04 | Ver RF-10 |
| RNF-GDPR-02 | Minimizacion de datos: sin foto personal obligatoria, sin direccion | RC-01/RC-04 | Ver RF-02 |
| RNF-GDPR-03 | Base legal = consentimiento explicito al registrarse (Art. 6.1.a) | RC-04 | Revision: checkbox de consentimiento no premarcado en el registro |
| RNF-GDPR-04 | Banner de consentimiento/cookies antes de cargar analitica | RC-04 | Test: analitica no se carga hasta aceptar el banner |
| RNF-GDPR-05 | Confirmar que la herramienta de analitica elegida no usa cookies ni PII | RC-04 | `[PENDIENTE: confirmar contra politica de privacidad vigente de Plausible antes de integrar]` |

## 2. Modelo de datos

Postgres (Supabase). Todas las tablas con RLS activo (RNF-SEC-05). `owner_id` se denormaliza
en `pieces` y `piece_photos` para simplificar las policies (evita joins en cada check de RLS).

```
profiles
  id            uuid PK, FK -> auth.users.id, on delete cascade
  display_name  text, not null, 3-40 caracteres, sanitizado
  avatar_key    text, not null, default 'preset-01' (uno de un enum cerrado de presets)
  role          text, not null, default 'user', check in ('user','admin')
  created_at    timestamptz, not null, default now()

vitrinas
  id            uuid PK, default gen_random_uuid()
  owner_id      uuid, FK -> profiles.id, on delete cascade, not null
  slug          text, unique, not null (nanoid 12 chars, no secuencial)
  title         text, not null
  theme         text, nullable (tematica principal, ej. "Star Wars" -- insumo para ranking de v2)
  status        text, not null, default 'draft', check in ('draft','published')
  created_at    timestamptz, not null, default now()
  updated_at    timestamptz, not null, default now()
  index: (slug) unique -- ya cubierto por UNIQUE
  index: (owner_id)

pieces
  id            uuid PK, default gen_random_uuid()
  vitrina_id    uuid, FK -> vitrinas.id, on delete cascade, not null
  owner_id      uuid, FK -> profiles.id, not null (denormalizado de vitrinas.owner_id)
  name          text, not null
  set_number    text, nullable
  theme         text, nullable (linea/tematica de la pieza, ej. "Star Wars")
  piece_count   int, nullable
  year          int, nullable
  order_index   int, not null, default 0 (orden de visualizacion dentro de la vitrina)
  created_at    timestamptz, not null, default now()
  index: (vitrina_id, order_index)

piece_photos
  id            uuid PK, default gen_random_uuid()
  piece_id      uuid, FK -> pieces.id, on delete cascade, not null
  owner_id      uuid, FK -> profiles.id, not null (denormalizado)
  storage_path  text, not null (objeto en Supabase Storage, bucket privado hasta publicar)
  width         int, not null
  height        int, not null
  created_at    timestamptz, not null, default now()
  index: (piece_id)

reports
  id                  uuid PK, default gen_random_uuid()
  reported_piece_id    uuid, FK -> pieces.id, nullable, on delete cascade
  reported_vitrina_id  uuid, FK -> vitrinas.id, nullable, on delete cascade
  reason              text, not null
  status              text, not null, default 'pending', check in ('pending','reviewed','actioned','dismissed')
  reviewed_by         uuid, FK -> profiles.id, nullable (solo admin)
  reviewed_at         timestamptz, nullable
  created_at          timestamptz, not null, default now()
  -- SIN columna de reportante (ni user_id ni ip): requisito RC-03/RF-08 explicito
  index: (status)

admin_audit_log
  id            uuid PK, default gen_random_uuid()
  actor_id      uuid, FK -> profiles.id, not null (siempre admin)
  action        text, not null (ej. "report.actioned", "vitrina.hidden")
  target_type   text, not null
  target_id     uuid, not null
  created_at    timestamptz, not null, default now()
```

`[PENDIENTE: modelo Mermaid ER opcional -- no critico para v1, se puede anadir en /plan si aporta claridad al implementar]`

## 3. Contratos de API / interfaz

La mayoria de operaciones CRUD van directas via Supabase client + RLS (no necesitan ruta
propia). Se documentan aqui las operaciones que requieren logica de servidor (Next.js route
handlers) por seguridad o efectos secundarios que RLS no puede cubrir.

### POST /api/photos/upload
- **Input:** multipart/form-data — `file` (imagen), `piece_id` (uuid, del due~o autenticado)
- **Proceso:** valida tipo (jpeg/png/webp) y tamano (<=10MB) -> elimina EXIF/GPS y cualquier
  metadato -> sube a Supabase Storage -> crea fila en `piece_photos`
- **Output 201:** `{ photo_id, storage_path, width, height }`
- **Errores:**
  - 400 `INVALID_FILE_TYPE` — tipo no soportado
  - 413 `FILE_TOO_LARGE` — excede tamano maximo
  - 401 `UNAUTHENTICATED` — sin sesion
  - 403 `NOT_OWNER` — `piece_id` no pertenece al usuario autenticado
  - 429 `RATE_LIMITED` — excede limite de subidas por minuto
  - 500 `UPLOAD_FAILED` — error generico, sin detalle interno expuesto (RNF-SEC-09)

### POST /api/reports
- **Input:** `{ reported_piece_id? , reported_vitrina_id?, reason }` — sin autenticacion requerida
- **Proceso:** valida que exactamente uno de los dos IDs este presente y exista -> inserta en
  `reports` SIN registrar identidad del solicitante -> rate-limit por IP a nivel de edge
  (efimero, no persistido en la tabla)
- **Output 201:** `{ report_id }`
- **Errores:**
  - 400 `INVALID_TARGET` — ninguno o ambos IDs presentes, o no existen
  - 429 `RATE_LIMITED` — limite de reportes por IP/minuto excedido

### GET /api/admin/reports (solo admin)
- **Input:** query `?status=pending` (default) — valores permitidos: `pending|reviewed|actioned|dismissed`
- **Output 200:** lista de reportes con datos del contenido reportado (para que el admin decida)
- **Errores:** 401 `UNAUTHENTICATED`, 403 `NOT_ADMIN`, 400 `INVALID_STATUS_FILTER` (valor de `status` fuera del enum — nunca se devuelve una lista vacia silenciosa por un typo en el filtro), 429 `RATE_LIMITED`

### POST /api/admin/reports/:id/action
- **Input:** `{ action: 'hide' | 'dismiss' }`
- **Proceso:** si `hide`, oculta la pieza/vitrina reportada (soft: `status` o flag `hidden`)
  y registra en `admin_audit_log`; si `dismiss`, marca el reporte como descartado
- **Output 200:** `{ report_id, status }`
- **Errores:** 401/403 igual que arriba; 404 `REPORT_NOT_FOUND`; 400 `INVALID_ACTION` (valor de `action` fuera de `{hide, dismiss}`); 429 `RATE_LIMITED`

### POST /api/account/delete
- **Input:** ninguno (usa la sesion del usuario autenticado); confirmacion ya hecha en el cliente
- **Proceso:** borra `auth.users` via Supabase Admin API (service role) -> cascada automatica
  sobre `profiles`/`vitrinas`/`pieces`/`piece_photos` (ON DELETE CASCADE) -> borra objetos de
  Storage asociados en la misma operacion -> los backups se purgan por rotacion natural,
  maximo 30 dias (RNF-GDPR-01)
- **Output 200:** `{ deleted: true }`
- **Errores:** 401 `UNAUTHENTICATED`; 500 `DELETE_FAILED` (sin detalle interno); 429 `RATE_LIMITED`

### Lectura publica de vitrina (via Supabase client, RLS, sin ruta propia)
- `select * from vitrinas where slug = :slug and status = 'published'` — RLS permite lectura
  publica solo si `status = 'published'`; borradores solo visibles por su due~o.

## 4. Seguridad y privacidad

Checklist `security.md` aplicada item a item (ver tabla de trazabilidad, RNF-SEC-01 a 10):
todos los items son aplicables a este proyecto, ninguno se marca N/A. Los 4 requisitos
criticos del PRD-lite (RC-01 a RC-04) estan cubiertos al 100% como requisito tecnico
verificable: RC-01 -> RF-02, RF-05, RF-06, RNF-PRIV-02; RC-02 -> RNF-PRIV-01; RC-03 -> RF-08,
RF-09; RC-04 -> RF-10, RNF-GDPR-01 a 06.

### STRIDE-lite

| Amenaza | Mitigacion | Req ID |
|---------|-----------|--------|
| **Spoofing** — un usuario se hace pasar por otro | Autenticacion via Supabase Auth (gestionado), ownership verificado en cada RLS policy y en cada route handler | RNF-SEC-05, RNF-SEC-06 |
| **Tampering** — modificar piezas/fotos de otro usuario | RLS: update/delete solo donde `owner_id = auth.uid()` | RNF-SEC-05 |
| **Repudiation** — admin niega haber tomado una accion de moderacion | `admin_audit_log` inmutable (sin update/delete via cliente) | RF-09 |
| **Information Disclosure** — fuga de identidad/ubicacion via EXIF/GPS, direccion/contacto, o IP correlacionada en reportes | Limpieza de metadatos server-side (RF-05); sin campo de direccion/contacto (RNF-PRIV-02); `reports` sin columna de reportante (RF-08) | RC-01, RC-03, RF-05, RF-08, RNF-PRIV-02 |
| **Denial of Service** — spam de reportes, subida masiva de fotos, o abuso de endpoints admin/borrado | Rate limiting en `/api/reports`, `/api/photos/upload`, `/api/admin/reports*` y `/api/account/delete` | RNF-SEC-02 |
| **Elevation of Privilege** — usuario normal accede a la cola de admin | Chequeo de `role = 'admin'` en servidor (route handler), no solo ocultar boton en UI | RF-09 |

## 5. Performance

Ver tabla de trazabilidad (RNF-PERF-01 a 08). Presupuestos concretos:
- Lighthouse >= 90 (performance + accessibility, movil).
- LCP < 2.5s en 4G simulado.
- Bundle JS inicial < 200KB gzip.
- Galeria de vitrinas y listado de piezas: paginacion por cursor, 24 items por pagina.
- Imagenes de piezas servidas via `next/image` (webp/avif, tamanos responsivos, lazy loading).
- Animaciones (identidad v4: arrastre de tokens, carrusel con inercia) ya construidas solo con
  `transform`/`opacity`, con `prefers-reduced-motion` respetado -- ver `identity-mockup-v4.html`.

## 6. Flujos de usuario

**Principal:**
1. Admin invita a un coleccionista por email (RF-11).
2. El coleccionista completa el registro (RF-01) y elige alias + avatar preset (RF-02).
3. Crea una vitrina en borrador (RF-03), le da titulo y tematica.
4. Cataloga piezas (RF-04): nombre, num. de set, tema, piezas, ano.
5. Sube fotos por pieza (RF-05) -- limpieza EXIF/GPS automatica, sin que el usuario lo note.
6. Publica la vitrina (RF-06) y obtiene el enlace compartible.
7. Comparte el enlace donde quiera.
8. Un visitante abre el enlace y ve la vitrina sin necesidad de cuenta (RF-07), con la
   interaccion de la identidad v4 (arrastre de tokens/galeria con inercia donde aplique al
   contenido real).

**Alternativo 1 -- reporte y moderacion:**
1. Un visitante ve contenido inapropiado y lo reporta sin necesidad de cuenta (RF-08).
2. El admin revisa la cola de reportes pendientes (RF-09) y decide ocultar o descartar.

**Alternativo 2 -- borrado de cuenta:**
1. El usuario solicita borrar su cuenta desde su perfil.
2. Confirma la accion (irreversible, se le advierte explicitamente).
3. Se ejecuta el borrado en cascada inmediato (RF-10): perfil, vitrinas, piezas, fotos y
   objetos de Storage. Los backups rotan y purgan la copia en un maximo de 30 dias.

**Alternativo 3 -- invitacion fuera de banda:**
1. El admin gestiona la lista de invitados (fuera del alcance de UI compleja en v1 -- puede
   ser un panel simple o incluso un proceso manual via Supabase Auth Admin API en v1).
   `[PENDIENTE: decidir en /plan si esto necesita UI propia o basta con el dashboard de Supabase para el volumen de una beta]`

## 7. Fuera de alcance

Hereda las 6 exclusiones del PRD-lite, mas las siguientes especificas de esta spec:
1. Sin marketplace de compra/venta (PRD-lite #1).
2. Sin verificacion de autenticidad ni tasacion de piezas (PRD-lite #2).
3. Sin app movil nativa (PRD-lite #3).
4. Sin mensajeria/chat directo entre usuarios (PRD-lite #4).
5. Sin comentarios, votos/recomendaciones ni gamificacion con rankings (PRD-lite #5).
6. Sin sistema de subastas/pujas (PRD-lite #6).
7. Sin clasificacion automatica de contenido (ML/IA) en v1 -- la cola de moderacion es
   solo-admin (candidato (b) del PRD-lite RC-03); se reevalua si el volumen de la beta lo exige.
8. Sin panel de administracion completo para gestion de invitados -- v1 puede apoyarse en
   herramientas nativas de Supabase para el volumen reducido de una beta.
9. Sin subida de foto de perfil personal -- solo avatares preset (RF-02), refuerza RC-01.

## Quality Gate

**Ronda 1 — Fecha:** 2026-07-27 · **Revisor:** sub-agente ciego · **Veredicto: FAIL** (D1=4.0 fallo automatico por RC-02 sin requisito tecnico, D2=6.5, D3=7.5).

**Hallazgos ronda 1 y resolucion:**
1. [Critico] RC-02 sin requisito tecnico (solo narrativa en Fuera de alcance) → **Corregido**: RNF-PRIV-01 anadido.
2. [Alto] RC-01 ("sin direccion"/"sin contacto obligatorio") solo verificable por omision → **Corregido**: RNF-PRIV-02 anadido.
3. [Alto] RC-04 ("sin venta de datos a terceros") sin Req ID → **Corregido**: RNF-GDPR-06 anadido.
4. [Medio] `GET /api/admin/reports` y `POST /api/admin/reports/:id/action` sin error explicito para valores invalidos (riesgo de perdida silenciosa, constitution C.10) → **Corregido**: 400 `INVALID_STATUS_FILTER` y 400 `INVALID_ACTION` anadidos.
5. [Medio] Rate limiting no cubria endpoints de admin ni borrado de cuenta → **Corregido**: RNF-SEC-02 extendido a los 4 endpoints mutables; 429 anadido a los 3 contratos afectados.

**Decision del autor:** corregir los 5 hallazgos en la misma ronda y solicitar una ronda 2 de verificacion (constitution B.5: rondas extra solo si el usuario las pide explicitamente).
