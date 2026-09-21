---
proyecto: bricks-virtual-collector
tipo: plan
subtipo: estado-y-proximos-pasos
fecha: 2026-09-20
actualiza_a: plan-acceso-invitado-opcion-c
relacionada_con: [ADR-011-acceso-invitado-tres-niveles, acceso-y-registro, plan-acceso-invitado-opcion-c]
tags: [spec-vjc, plan, go-live, acceso-invitado, estado]
---

# Acceso de invitado (Opción C) — Estado a 20/09/2026 y próximos pasos

> **Actualización 21/09/2026:** **Fase 7 completada y S7 aplicada** (A1 y A7 hechas; D1 resuelta:
> cuenta "museo" + vitrinas de pruebas renombradas). Verificado con una sesión de invitado nueva
> contra producción: 8 vitrinas, 3 temáticas, 8/8 con portada, 1 bounty, 1 exposición activa.
> Queda **la Fase 9** (necesita la decisión D2), las verificaciones A2-A6 y A9 (capturas). Las
> secciones 1-8 de abajo reflejan el estado del 20/09: donde hablan de Fase 7/S7 como pendientes,
> ya no lo están.

> **Para qué sirve este documento:** foto única y honesta de dónde estamos, qué falta, qué te toca
> a ti, qué hay que decidir y en qué orden abordar lo que queda. El plan de diseño sigue siendo
> [`plan-acceso-invitado-opcion-c.md`](plan-acceso-invitado-opcion-c.md); este documento es su
> **cuadro de mando**. Los datos de producción se comprobaron contra Supabase real el 20/09/2026.

---

## 1. Resumen en 30 segundos

- **El desarrollo está prácticamente terminado.** Las Fases 0-6 y 8 están en `main`
  (PR #4 a #9), con el Quality Gate en verde: **609 tests**, cobertura ≥ 85 % en las 4 métricas
  (S 96,03 / B 88,41 / F 94,86 / L 97,12), ESLint en baseline (154), `next build` verde.
- **Faltan 2 fases**: la **7** (contenido semilla — trabajo manual tuyo) y la **9** (E2E de
  invitado + `preflight` + tag). Nada de código nuevo bloquea el camino salvo lo que dependa de tus
  decisiones.
- **Hay una migración sin aplicar** (S7, límites de tamaño de los buckets): verificado hoy, los 3
  buckets siguen con `file_size_limit = null`.
- **Hay 3 verificaciones visuales/funcionales tuyas sin hacer** (Fases 2, 5-6 y las pruebas de
  purga/upgrade de las Fases 3-4).
- **El modo invitado NO se anuncia** hasta cerrar la Fase 9 y sus condiciones de anuncio (§7).

**Semáforo**

| Área | Estado |
|---|---|
| Código y tests | 🟢 completo (Fases 0-6, 8) |
| Base de datos | 🟡 3 de 4 migraciones aplicadas; falta S7 |
| Verificación en producción | 🟡 pendiente de ti |
| Contenido semilla (Fase 7) | 🔴 sin hacer — el contenido actual es de pruebas |
| E2E + preflight (Fase 9) | 🔴 sin empezar; necesita una decisión y un recurso tuyo |
| Condiciones de anuncio (S1, S2, S3, S5) | 🟠 abiertas; deciden si el veredicto es GO o GO con excepciones |

---

## 2. Dónde estamos: fase por fase

| Fase | Qué es | Estado | Entregado en |
|---|---|---|---|
| **0** | ADR-011 (decisión registrada; ADR-009 superada) | ✅ | PR #4 |
| **1** | Cimientos de datos: `es_invitado`, trigger, bloqueo de publicación para invitados | ✅ aplicada y verificada end-to-end contra Supabase real | PR #4 · migración `20260909110000` |
| **2** | Entrada de invitado + `/login` separado de `/registro` + legal mínimo | ✅ en `main` · 🟡 falta tu verificación visual | PR #5 |
| **3** | Purga automática a 48 h (`pg_cron`) + cierre del hallazgo V4a | ✅ migración aplicada (2 jobs) · 🟡 falta prueba funcional de la purga | PR #6 · migración `20260909120000` |
| **4** | Upgrade invitado → cuenta real (banner + modal + trigger) | ✅ migración aplicada · 🟡 falta prueba funcional con email real | PR #6 · migración `20260909130000` |
| **5** | Aislamiento de las superficies públicas | ✅ en `main` · 🟡 falta tu verificación visual | PR #7 |
| **6** | Contención de abuso: `/admin/*`, tope de fotos de invitado, S7 | ✅ en `main` · 🔴 **migración S7 sin aplicar** · 🟡 falta verificación | PR #8 · migración `20260909140000` |
| **7** | Contenido semilla | 🔴 **pendiente (tuya)** | — |
| **8** | Copy, legal y documentación | ✅ en `main` · 🟡 faltan capturas/GIF del README | PR #9 |
| **9** | E2E de invitado + `preflight` + tag | 🔴 **pendiente** | — |

### Qué hace hoy la aplicación (ya en producción tras el despliegue de `main`)

- `/login` solo entra; **ya no auto-registra** con un email desconocido. `/registro` crea la
  cuenta (con checkbox de Privacidad + Términos).
- Botón **"Probar sin registrarme"** en `/login`, `/registro` y el hero de `/` → sesión anónima de
  Supabase con un sandbox propio.
- El invitado puede crear vitrinas (siempre privadas — la RLS le impide publicar), subir sets
  (fotos con tope de **3 MB y máx. 6**), votar, reclamar bounties y desbloquear insignias.
- Nada del invitado aparece ante terceros: ni en galería, ni en el Mosaico, ni en `/perfil/[id]`
  (404), ni en el Hub o la home.
- Un banner permanente le recuerda que está en modo demo (se borra a las 48 h) y le deja hacer
  **upgrade** a cuenta real conservando todo lo creado.
- `/admin/*` está cerrado a cualquiera sin rol de administración (antes solo `/admin/system`).
- Cada noche a las 03:17 UTC un job borra los invitados con más de 48 h sin actividad.

### Qué hay en producción hoy (comprobado el 20/09/2026)

| Elemento | Valor | Lectura |
|---|---|---|
| Vitrinas públicas y publicadas | 6 | cumple el mínimo numérico de la Fase 7… |
| …de ellas, temática Star Wars | 5 de 6 | …pero **no ejercita el filtro por temática** |
| Bounties pendientes | 1 ("BD1 del Año 90") | cumple el mínimo |
| Exposiciones activas | 1 ("Star Wars: Return of the Jedi", continua) | cumple el mínimo |
| Dueños visibles | `test`, `test2`, `ejemploprueba`, `brick`, `victorjaviercorral` | nombres de pruebas de cara al público |
| Buckets con `file_size_limit` | **los 3 a `null`** | **S7 sin aplicar** |
| Invitados vivos ahora mismo | 1 | esperado (la purga lo retirará a las 48 h) |

---

## 3. Acciones pendientes (las que te tocan a ti)

Ordenadas por prioridad. Ninguna requiere código mío salvo que se indique.

| # | Acción | Dónde | Cómo se comprueba | Bloquea |
|---|---|---|---|---|
| A1 | **Aplicar la migración S7** `20260909140000_storage_file_size_limits.sql` | Supabase → SQL Editor | `select id, file_size_limit from storage.buckets where id in ('avatars','fotos_sets','exposiciones');` → 3 filas con valor (2097152 / 10485760 / 5242880) | Cierra S7 y la Fase 6 |
| A2 | **Verificación visual de la Fase 2** | Producción, ventana de incógnito | `/` → "Probar sin registrarme" entra al Hub con el banner de modo demo · `/login` con un email inexistente **no** crea cuenta y deriva a `/registro` · `/registro` exige el checkbox | Fase 9 |
| A3 | **Verificación de la Fase 5** (aislamiento) | Producción | Como invitado: crea una vitrina y visita `/dashboard/insignias` (dispara la sincronización de insignias). Desde **otra** sesión: `/galeria`, el Mosaico de Mis Insignias, el Hub y la home no muestran nada suyo, y `/perfil/<uid-del-invitado>` da 404. Una cuenta real sí aparece | Fase 9 |
| A4 | **Verificación de la Fase 6** | Producción | Como invitado: `/admin/exposiciones` y `/admin/bounties` → redirige a `/dashboard` · subir una foto > 3 MB → rechazada con el mensaje de modo demo · la 7.ª foto → rechazada. Como `admin_exposiciones`/`admin`: el panel sigue accesible | Fase 9 |
| A5 | **Prueba funcional de la purga (Fase 3)** | Supabase → SQL Editor | Crea un invitado, envejécelo y ejecútala; instrucciones exactas en la cabecera de `20260909120000_purga_invitados.sql` (§4.2). Debe desaparecer todo lo suyo y **nada** de una cuenta real | Fase 9 |
| A6 | **Prueba funcional del upgrade (Fase 4)** | Producción + tu correo | Invitado con vitrina + set → banner → "Guardar mi colección" con un email real → confirmar → `es_invitado = false`, el contenido sigue y ahora puede publicar y aparecer en `/galeria` (consulta en la cabecera de `20260909130000_upgrade_invitado_cuenta.sql`) | Fase 9 |
| A7 | **Hacer la Fase 7** (contenido semilla) — ver §5.1 | Producción | Ver criterio de aceptación de la Fase 7 | Fase 9 |
| A8 | **Aprovisionar el Supabase de pruebas** para el E2E — ver §5.2 y decisión D2 | Supabase (proyecto nuevo) | El E2E corre verde contra él | Fase 9 |
| A9 | **Capturas / GIF del README** | Producción, tras A2 | 2-3 imágenes o un GIF en `public/screenshots/` y enlazadas donde hoy hay un comentario HTML en `README.md` | No bloquea; sí la presentación |

> **Ojo con A5/A6:** son pruebas funcionales que yo **no** puedo hacer por ti sin tu proyecto
> real y tu correo. Las Fases 1 (la verifiqué yo con un script) y 3-4 (migraciones aplicadas) se
> dieron por buenas al confirmar tú que las migraciones se aplicaron, pero la *conducta* de la
> purga y del upgrade en producción todavía no la ha visto nadie.

---

## 4. Decisiones pendientes

Cada una con mi recomendación. Las marcadas ⛔ bloquean el siguiente paso.

| # | Decisión | Opciones | Recomendación | Bloquea |
|---|---|---|---|---|
| **D1** ⛔ | **¿Cómo montamos la Fase 7?** El contenido actual es de pruebas (5/6 vitrinas Star Wars, vitrinas sin fotos, dueños `test2`/`ejemploprueba`, nombres como "Prueba de Fase 2") | **(a)** Pulir lo existente: poner `alias` presentable a las cuentas de prueba (la galería muestra `alias` antes que `username`), renombrar vitrinas, añadir fotos y diversificar temáticas · **(b)** Crear **una cuenta "museo" nueva** con contenido curado y dejar lo viejo tal cual · **(c)** (b) + **ocultar** lo viejo poniéndolo en `privada` (reversible, no se borra nada) | **(c)**. Una sola cuenta con nombre presentable da control total de la primera impresión y no depende de arrastrar restos de E2E. Ocultar ≠ borrar | Fase 7 |
| **D2** ⛔ | **¿Contra qué Supabase corre el E2E de la Fase 9?** | **(a)** Proyecto Supabase **nuevo** (plan gratuito), aplicándole las migraciones del repo · **(b)** Producción, confiando en la purga | **(a)**. Aísla el E2E de datos reales y, de paso, **demuestra que las migraciones reproducen el esquema desde cero** (era el hallazgo A1 de la auditoría). Requiere un rato tuyo para crearlo | Fase 9 |
| D3 | **¿Activamos CAPTCHA (hCaptcha) antes de anunciar?** Hoy está desactivado (se desactivó porque, sin widget en el front, rompía **todo** el login) | **(a)** Sí: cuenta hCaptcha + widget en `/login`, `/registro` y el botón de invitado (trabajo mío, ~medio día, más tus claves) · **(b)** No: confiar en el límite por IP de Supabase para `signInAnonymously` | **(a) si esperas tráfico real** (un post en LinkedIn lo es); **(b)** si es solo para enseñarlo | Anuncio |
| D4 | **S5 — cabecera `Content-Security-Policy`**: hoy solo hay `X-Frame-Options`, HSTS y `nosniff` | **(a)** Implementarla antes de anunciar (yo; empezaría en modo *report-only* para no romper nada) · **(b)** Anunciar con la excepción documentada | **(a)**: es trabajo de código acotado y quita una excepción del `preflight` | Veredicto |
| D5 | **S3 — rate limiting compartido** (hoy un `Map` en memoria por instancia; Upstash está decidido en ADR-003/010 pero no hay cuenta) | **(a)** Crear la cuenta Upstash y que yo lo implemente · **(b)** Excepción documentada en el `preflight` | **(b)** salvo que D3 sea (b) y quieras una segunda barrera | Veredicto |
| D6 | **S2 — test E2E de la limpieza EXIF con una foto con GPS real** | Incluirlo en el spec de la Fase 9 (necesita una foto con GPS como *fixture*) o dejarlo como excepción | Incluirlo: cuesta poco una vez que el E2E existe | Veredicto |
| D7 | **Confirmación de email en Supabase Auth**: ¿activada o no? Cambia el copy de `/registro` y el tramo final del upgrade (con confirmación, `is_anonymous` no se pone a `false` hasta pinchar el enlace) | Activada / desactivada | **Activada** si vas a abrir el registro al público (evita altas con correos ajenos) | Anuncio |
| D8 | **Blob físico de Storage tras la purga**: borrar la fila de `storage.objects` no borra el fichero (limitación de Supabase). Hoy es un gap acotado por el tope de 6 fotos × 3 MB | **(a)** Aceptarlo · **(b)** Añadir un GC real (Edge Function programada o `pg_net` + API de Storage) | **(a)** ahora; revisar si el volumen crece | — |
| D9 | **Higiene de datos de prueba**: hay dos cuentas distintas con `username = 'test'` y varias con nombres de QA | Limpiar / dejar | Se resuelve con D1(c); no es un bloqueo | — |
| D10 | **¿E2E dentro del Quality Gate o en un workflow nocturno?** | Gate (bloquea cada PR) / nocturno + manual | **Nocturno + `workflow_dispatch`**: necesita secretos del Supabase de pruebas, tarda más y un fallo de infraestructura no debería bloquear PRs | Fase 9 |

---

## 5. Fases pendientes, con descripción

### 5.1 Fase 7 — Contenido semilla (tuya) · ~medio día

**Objetivo:** que un invitado recién llegado tenga con qué interactuar **desde el primer
segundo** y que lo que vea parezca un museo, no un banco de pruebas. Es la primera impresión de un
demo pensado para una audiencia profesional.

**Qué implica** (adaptar según D1):

1. **Una cuenta "museo"**: se registra por `/registro` como cualquier usuario (queda con
   `role='user'` y `es_invitado=false` automáticamente — no hay que tocar ningún flag). Ponle un
   `alias` presentable en *Mi Perfil*.
2. **3-4 vitrinas publicadas y públicas**, con **2-3 sets cada una**, de **temáticas variadas**
   (p. ej. Star Wars, Technic, Harry Potter, City/Icons) para que el filtro de `/galeria` tenga
   algo que filtrar. Cada set con **foto real**, subida por el flujo normal de `/mesa-de-trabajo`
   (así pasa por la limpieza EXIF con `sharp`) — sin vitrinas ni sets sin foto.
3. **Un bounty abierto** y reclamable (ya existe "BD1 del Año 90"; revisa el nombre y que apunte
   a una temática presente en la semilla). Se gestiona desde `/admin/bounties` con una cuenta
   admin.
4. **Una exposición activa continua con 1-2 sets aprobados**, para que el invitado pueda votar y
   ver el ranking en vivo (ya existe "Star Wars: Return of the Jedi"; hay que enviar y aprobar
   sets de la semilla desde `/admin/moderacion`).
5. Si eliges D1(c): poner en `privada` las vitrinas de las cuentas de prueba.

**Qué hago yo después:** documentar en ADR-011 y README que es contenido semilla permanente (no lo
toca la purga, porque `es_invitado = false`) y actualizar el plan.

**Criterio de aceptación** (con una sesión de invitado **recién creada**, en incógnito, sin hacer
nada): ≥ 3 vitrinas en `/galeria` con más de una temática y con portada real · ≥ 1 bounty en
`/bounties` · una exposición activa donde votar.

### 5.2 Fase 9 — E2E de invitado + `preflight` + tag · ~1 día

**Objetivo:** cerrar el plan con evidencia automatizada y un veredicto formal de lanzamiento.

**Piezas:**

1. **Proyecto Supabase de pruebas** (D2/A8): crearlo, activar *Anonymous Sign-Ins*, aplicar en
   orden todas las migraciones de `supabase/migrations/` y sembrar el mínimo (una cuenta con
   vitrina pública, un bounty, una exposición activa). Cualquier hueco que aflore al reproducir el
   esquema desde cero es un hallazgo valioso, no un fallo.
2. **`e2e/invitado.spec.ts`** (Playwright — ya existe `playwright.config.ts` y
   `e2e/auth.spec.ts`): entrar como invitado → crear vitrina (privada) → subir un set con foto →
   votar en contenido público → reclamar el bounty → ver una insignia → comprobar que **no**
   aparece en `/galeria`. Ampliable con: `/admin/*` redirige, foto > 3 MB rechazada, y (D6) una foto
   con GPS real sin GPS en el fichero servido.
3. **Integración en CI** (D10): workflow nocturno + manual con los secretos del Supabase de
   pruebas en GitHub.
4. **`spec-vjc-framework:preflight`** contra el despliegue real → veredicto **GO / GO CON
   EXCEPCIONES / NO-GO**. Las excepciones que queden abiertas de S1/S2/S3/S5 se documentan ahí,
   y ese veredicto **sustituye** al "NO-GO" histórico de `auditoria-arquitectura.md`.
5. **Cierre:** fila 22 de `FASES_Y_MEJORAS.md` a "Completado", checklist del criterio de
   activación de ADR-011 marcado, y **tag `v1.0.0-acceso-invitado`** con `git push --tags`.

**Criterio de aceptación:** spec de invitado pasando · `preflight` con GO o GO con excepciones
documentadas · tag publicado.

### 5.3 Trabajo transversal (no son fases, pero condicionan el anuncio)

Vienen del bloque "Iteración 8+" que ADR-011 mantiene obligatorio **aunque haya invitados**,
porque invitados y cuentas reales escriben datos reales:

| Ítem | Qué es | Estado | Quién |
|---|---|---|---|
| **S1** | Escalada de privilegios en RLS cerrada (el repo es público) | Cerrada por `20260810120000` + `20260819100000`; el `preflight` la re-comprueba en vivo | Automático en Fase 9 |
| **S5** | Cabecera CSP | Abierta → D4 | Yo |
| **S3** | Rate limiting compartido | Abierta → D5 | Tú (cuenta) + yo |
| **S2** | E2E de EXIF con GPS real | Abierta → D6 | Yo, dentro del E2E |
| CAPTCHA | hCaptcha con widget | Diferido → D3 | Tú (claves) + yo |

---

## 6. Ruta recomendada (orden y paralelismo)

```
AHORA (tú, 15-30 min)
  A1  aplicar S7 ─────────────────────────────┐
  A2-A4  verificaciones visuales (Fases 2/5/6) │
  D1  decidir cómo montar la Fase 7            │
  D2  decidir/crear el Supabase de pruebas     │
                                               ▼
EN PARALELO
  Tú:   Fase 7 (semilla) ·  A5/A6 (pruebas de purga y upgrade) · A8 (proyecto de pruebas)
  Yo:   S5/CSP (D4) · higiene de docs legales (§7) · escribir el spec E2E de invitado
        (puedo redactarlo antes de que exista el Supabase de pruebas; no puedo ejecutarlo)
                                               │
                                               ▼
Fase 9 (yo, con lo de arriba listo)
  E2E verde → workflow nocturno → preflight → veredicto → tag v1.0.0-acceso-invitado
                                               │
                                               ▼
ANUNCIO (tú): A9 capturas · decisión sobre CAPTCHA (D3) · publicar
```

**Camino crítico:** D1 → Fase 7 → Fase 9. Lo demás se hace en paralelo o son excepciones
documentables.

---

## 7. Riesgos y deudas conocidas

| Riesgo / deuda | Impacto | Cómo se trata |
|---|---|---|
| Ninguno de los flujos de las Fases 3-4 en producción lo ha ejercitado un humano | Bajo-medio: la lógica está verificada por script (Fase 1) y por tests, pero el trigger de upgrade y la purga corren en el motor | A5/A6 |
| Blob de Storage huérfano tras la purga | Bajo, acotado (≤ 6 fotos × 3 MB por invitado) | D8 |
| `legal/legal-architecture.md` §2.3 aún describe la limpieza EXIF en el navegador (canvas), reconciliada en ADR-010 | Doc obsoleta, no afecta a la app | Limpieza aparte (puedo hacerla en una PR pequeña) |
| `legal/data-map.md` desactualizado en varios puntos (EXIF, `pg_cron` "implementada", "no desplegado") | Doc obsoleta; es el registro Art. 30 RGPD | Limpieza aparte |
| Test intermitente de CI (`BountiesSectionClient`, ya corregido) | Ruido en el Quality Gate | Resuelto en PR #9; si reaparece otro, investigar antes de relanzar |
| Dos cuentas con `username = 'test'` y datos de QA en la galería pública | Presentación | D1(c) / D9 |
| Un solo administrador (`brick` y `victorjaviercorral` son `admin`) | Operativo | Aceptado (decisión D2 de la Iteración 4) |

---

## 8. Qué puedo hacer yo ya, sin esperarte

Si me das luz verde, sin depender de nada tuyo:

1. **S5 / CSP** (D4) en modo *report-only*, con tests y documentación.
2. **Limpieza de `legal-architecture.md` y `data-map.md`** (PR de docs pequeña).
3. **Redactar `e2e/invitado.spec.ts`** y el workflow nocturno, listos para enchufar cuando exista
   el Supabase de pruebas.
4. **Script de siembra reproducible** para el Supabase de pruebas (cuenta, vitrina, bounty,
   exposición), para que la Fase 9 no dependa de pasos manuales.
5. **Widget de hCaptcha** (D3) — solo el código; necesito tus claves para activarlo.

## 9. Referencias

- Plan de diseño: [`plan-acceso-invitado-opcion-c.md`](plan-acceso-invitado-opcion-c.md)
- Decisión: [`ADR-011`](../06-decisiones/ADR-011-acceso-invitado-tres-niveles.md) (y su criterio
  de verificación de la activación, que es la checklist final de la Fase 9)
- Modelo de acceso, consentimiento y "qué ajustar para un lanzamiento oficial":
  [`acceso-y-registro.md`](../03-diseno/acceso-y-registro.md)
- Registro maestro: fila 22 de [`FASES_Y_MEJORAS.md`](../00-proyecto/FASES_Y_MEJORAS.md)
- Incidencia de test: [`hallazgo-flaky-bountiessectionclient-escape.md`](../testing/hallazgo-flaky-bountiessectionclient-escape.md)
- Migraciones del plan: `20260909110000_acceso_invitado` · `20260909120000_purga_invitados` ·
  `20260909130000_upgrade_invitado_cuenta` · `20260909140000_storage_file_size_limits` (**sin
  aplicar**)
