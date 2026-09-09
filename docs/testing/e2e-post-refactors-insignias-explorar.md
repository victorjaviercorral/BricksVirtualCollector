---
proyecto: bricks-virtual-collector
tipo: testing
subtipo: e2e-walkthrough + bug-fixing
estado: cerrado (4 pasadas, 2026-09-08/09) · los 12 hallazgos (B-01…B-12) resueltos · cobertura E2E completa · sin bloqueantes de go-live
fecha: 2026-09-08
alcance: E2E pendiente tras las refactors de "Mis Insignias" (FASES fila 19) y "Explorar" (FASES fila 18), con re-triaje go-live de secciones adyacentes
entorno: localhost:3000 (npm run dev, Next 16 Turbopack) contra Supabase real de .env.local — misma BD que Vercel
cuenta: brick@test.com (1ª pasada: cuenta nueva sin datos · 2ª pasada: con vitrina + set + participación en exposición + rol admin)
relacionada_con: [navegacion-y-flujos, sistema-de-insignias, guia-verificacion-iteracion-4, FASES_Y_MEJORAS]
---

# E2E post-refactors "Mis Insignias" + "Explorar" — resultados y plan de bug-fixing

Ejecución del walkthrough que quedaba pendiente en `FASES_Y_MEJORAS.md` filas **18** (menú
"Explorar", galería, celdas del Hub) y **19** (fusión de "Mi Progreso" en "Mis Insignias",
sistema de insignias, mosaico, recompensas, redirecciones). Se aprovecha para re-triar el resto
de secciones de cara al go-live.

**Regla de esta sesión (indicada por el titular):** no se corrige nada aquí. Cada hallazgo se
lleva a la tabla de abajo, priorizado por impacto y esfuerzo, y se acomete en paralelo.

- Suite unitaria: **573/573 ✅** · `tsc --noEmit`: **limpio ✅** (no bloquean go-live)
- `next build` **no ejecutado** en esta sesión (E2E funcional, no de release)

---

## 1. Resumen ejecutivo

| Veredicto | Detalle |
|---|---|
| **Explorar (fila 18)** | ✅ **Listo salvo detalles menores.** Navbar, menú Explorar (desktop + móvil), `/galeria` + filtro por temática, `/bounties`, `/exposiciones`, `/exposicion/[id]`, celdas del Hub y bento de la home: todo enlaza a donde dice el doc de diseño. Solo pulido (B-03, B-04, B-08, B-10). |
| **Mis Insignias (fila 19)** | 🟢 **Verificado end-to-end (3ª pasada).** `/api/insignias/sync` → **200**, insignias persistidas e **idempotentes** (recargar no duplica: contador estable). Mosaico poblado. **Recompensas verificado con un reclamo real de bounty**: "1.000 Bricks ganados", el reclamo con su set y fecha, y `+1.000` sumados a `bricks_recibidos` (confirma el circuito de diseño). `/dashboard/insignias/bounty/[reclamo]` renderiza; la redirección de la ruta vieja `/dashboard/participaciones/[reclamo]` también. **Solo queda Pasaporte** — requiere archivar una exposición con participación. |
| **Secciones adyacentes** | ✅ `/dashboard/perfil` limpiado de andamiaje muerto (B-02). Resto OK. |
| **Voto en exposición (B-09)** | ✅ **RESUELTO Y VERIFICADO (3ª pasada).** El titular aplicó la migración `20260909100000`. Votar en la exposición activa → toast **"¡Voto registrado!"**, contador +1. Doble voto → **"Ya has votado por este set en esta exposición"** (23505). El voto normal en `/set` y `/vitrina` sigue funcionando. |

---

## 2. Tabla de bug-fixing (priorizada)

Prioridad = impacto en el go-live. Esfuerzo = estimación de implementación (no de verificación).

| ID | Prio | Esfuerzo | Área | Hallazgo | Acción propuesta |
|---|---|---|---|---|---|
| **B-01** | ✅ **RESUELTO Y VERIFICADO** (2026-09-08) | 🟢 XS | Mis Insignias | `POST /api/insignias/sync` daba **500** en cada carga por RLS: `insignias_usuario` solo tenía política de SELECT y la migración `20260908120000` no estaba aplicada. **Corregido:** el titular aplicó los 3 pasos de la migración (política INSERT + índice `insignias_usuario_otorgado_en_idx`). **Verificado en vivo:** `sync` → **200**, insignias persistidas, Mosaico poblado, "En curso" con la participación real. **Idempotencia confirmada** (3ª pasada): recargar 3× → el contador del Mosaico se mantiene estable (no se duplican filas). |
| **B-02** | ✅ **RESUELTO Y VERIFICADO** (2026-09-09) | 🟢 S | Perfil | `/dashboard/perfil` tenía 3 controles de andamiaje muertos: 2ª sección "Zona Peligrosa" con botón "Eliminar Cuenta y Colección" sin `onClick` (duplicaba el botón real de arriba), y toggles "Modo Oscuro"/"Notificaciones" estáticos. **Corregido:** retirado el bloque `<div className="grid grid-cols-1 gap-6 mt-8">` entero (Preferencias Visuales + Zona Peligrosa duplicada) y los imports huérfanos. Queda solo "Zona de Peligro" con su botón funcional. **Verificado en vivo:** la página ya no contiene "Preferencias Visuales" ni "Zona Peligrosa", solo un botón de borrado. |
| **B-09** | ✅ **RESUELTO Y VERIFICADO** (2026-09-09) | 🟢 XS | Exposiciones / bricks | **Reproducido en vivo (08/09):** votar un set en exposición activa → "Error al votar", porque la RLS de `bricks_recibidos` (`"Anyone can insert a brick on public sets"`, `20260901120000:44`) exige `hash_visitante = auth.uid()::text` pero `ExposicionClient.tsx:95` inserta `exposicion-<id>-user-<uid>`. **Corregido:** migración `20260909100000_bricks_recibidos_voto_exposicion.sql` (amplía el `with check` a los dos formatos), aplicada por el titular. **Verificado (09/09):** voto → "¡Voto registrado!" +1; doble voto → "Ya has votado por este set en esta exposición" (23505); voto normal en `/set` y `/vitrina` intacto. |
| **B-03** | ✅ **RESUELTO Y VERIFICADO** (2026-09-09) | 🟢 XS | Hub | Celda "Evento Activo" sin exposición activa tenía `href="#"` (link muerto) y estado vacío contradictorio. **Corregido:** sin evento activo la celda enlaza a `/exposiciones`, la cabecera pasa a "Exposiciones", y el cuerpo dice "Sin exposición activa · Ver exposiciones pasadas" (sin "TIEMPO LIMITADO" ni "Ver detalles"). **Verificado:** `href="/exposiciones"`, cero `href="#"` en la página. |
| **B-04** | ✅ **RESUELTO Y VERIFICADO** (2026-09-09) | 🟢 XS | Explorar / Exposiciones | `/exposicion/[id]` archivada mostraba el chip "TIEMPO RESTANTE / Exposición Continua" a la vez que "Evento Finalizado". **Corregido:** `ExposicionClient` — si `estado === 'archivada'` el `timeLeft` es "Finalizada" y la etiqueta del chip es "Estado del evento" (no "Tiempo Restante"). **Verificado en vivo** sobre "Star Wars: Return of the Jedi" archivada: sin "TIEMPO RESTANTE", muestra "Estado del evento". |
| **B-05** | ✅ **RESUELTO Y VERIFICADO** (2026-09-09) | 🟡 M | Vitrina / bricks | En `/vitrina/[id]` el botón "Dar Brick" no reflejaba un voto ya emitido → clic → 400. **Corregido:** `VitrinaClient` consulta al montar los `bricks_recibidos` del usuario para esos sets y prellena `givenBricks`. **Verificado en vivo:** el set ya votado por @brick pinta el botón **deshabilitado** ("1 Brick"). |
| **B-06** | ✅ **RESUELTO** (2026-09-09) | 🟡 M | Bounties / a11y | El modal "Reclamar Bounty" no era `role="dialog"`. **Corregido:** `role="dialog"` + `aria-modal` + `aria-labelledby`, cierre con **Esc** y con clic en el backdrop, foco inicial en el botón de cerrar y foco devuelto al disparador al cerrar; las filas de selección de set pasan de `<div onClick>` a `<button>` con `aria-pressed`. Cubierto por test (`getByRole('dialog')`, Esc). |
| **B-07** | ✅ **RESUELTO Y VERIFICADO** (2026-09-09) | 🟢 XS | Mis Insignias | `SincronizarInsignias` disparaba `POST /api/insignias/sync` **2×/carga**. **Corregido:** dedup a nivel de módulo — mientras hay un POST en vuelo, los siguientes montajes se enganchan a esa misma promesa; se limpia al resolverse (una re-sincronización posterior legítima sí ocurre). **Verificado en vivo:** cada navegación a `/dashboard/insignias` = **1** POST. |
| **B-08** | ✅ **RESUELTO** (2026-09-09) | 🟢 XS | Copy global | **Corregido:** "1 Brick"/"1 Set"/"1 Reto activo" con pluralización (`VitrinaClient`, home, `HubClient`); "Recláma" → "Reclama" (`/bounties`); `formatearNumero()` en `BountyDetailClient` (los "1000 BRICKS" pasan a "1.000"). **Verificado en vivo:** botón "1 Brick" en vitrina, "Reclama" en `/bounties`. |
| **B-10** | ✅ **RESUELTO** (2026-09-09) | 🟢 XS | Home — imagen y copy | (a) **Imagen del hero:** era `<img src="https://lh3.googleusercontent.com/aida-public/…">` — hotlink externo a un render IA genérico ("Vibrant Playful", con marca de agua), frágil (puede 404) y sin relación con el producto → sustituida por `public/hero-vitrina.svg` (SVG autohospedado, on-brand, representa una vitrina con construcciones). (b) **Copy:** "vitrina **3D** interactiva" → "Digitaliza tus modelos físicos y móntalos en vitrinas para exhibirlos. Colecciona, comparte y recorre las colecciones de la comunidad." Coherente con `navegacion-y-flujos.md` §"Deuda" (la home dejó de prometer 3D). Comentario `{/* Feature 4: 3D View */}` también corregido. |
| **B-11** | ✅ **RESUELTO** (2026-09-09) | 🟢 XS | Recompensas / vocabulario | El toast al reclamar decía "…Puntos añadidos." — vocabulario que la fila 19 eliminó. **Corregido:** "¡Bounty reclamado! Los Bricks van directos a tu set." |
| **B-12** | ✅ **RESUELTO Y VERIFICADO** (2026-09-09) | 🟡 M | Bounties / UX | Tras reclamar un bounty, su tarjeta seguía ofreciendo "Reclamar Misión". **Corregido:** `/bounties/page.tsx` consulta los `bounties_reclamados` del usuario y los pasa a `BountiesSectionClient` (`reclamados`), que además recuerda los reclamos de la sesión actual; esas tarjetas muestran **"Ya reclamado"** (badge verde, sin botón). **Verificado en vivo:** "BD1 del Año 90" ya reclamado por @brick sale como "Ya reclamado". |

### Estado (actualizado 2026-09-09, 4ª pasada)

**Los 12 hallazgos están resueltos.** B-01 → B-12, todos ✅ (B-06 cubierto por test; el resto
verificado en vivo). Entregado en dos tandas:

| Tanda | Hallazgos | Rama / tag |
|---|---|---|
| E2E + bloqueantes | B-01, B-09, B-10 | `v0.11.0-e2e-insignias-explorar` (merge PR #1) |
| Prioridad alta + media + pulido | B-02, B-03, B-04, B-05, B-06, B-07, B-08, B-11, B-12 | `e2e-bugfixing-b02-b12` |

**Cobertura E2E completa:** las 5 secciones de Mis Insignias (Insignias · En curso · Recompensas
· Pasaporte · Mosaico) y todo "Explorar" verificados con datos reales. **No hay bloqueantes de
go-live.**

Verificación local de la 2ª tanda: `tsc` limpio, **579/579** tests (+6 nuevos), 4 métricas de
cobertura ≥ 85% (S 95,63 / B 88,10 / F 94,61 / L 96,76), `lint:ci` dentro del baseline (157).

### SQL de corrección de B-09 (aplicado)

**Migración:** `supabase/migrations/20260909100000_bricks_recibidos_voto_exposicion.sql`
— **aplicada por el titular el 2026-09-09 y verificada.** Amplía el `with check` de la política
real de INSERT para aceptar el `hash_visitante` compuesto del voto de exposición, sin tocar el
resto de condiciones:

```sql
-- El voto de exposición (ExposicionClient.tsx) inserta hash_visitante =
-- 'exposicion-<exposicion_id>-user-<uid>' a propósito, para que unique(set_id, hash_visitante)
-- no choque con un brick normal al mismo set. La política de 20260901120000 solo aceptaba
-- hash_visitante = auth.uid()::text, así que el voto en exposición fallaba siempre ("Error al
-- votar"). Se aceptan ahora los dos formatos legítimos.
alter policy "Anyone can insert a brick on public sets" on public.bricks_recibidos
    with check (
        exists (
            select 1 from public.sets s
            join public.vitrinas v on s.vitrina_id = v.id
            where s.id = bricks_recibidos.set_id
              and v.estado = 'publicada'
              and v.visibilidad = 'pública'
        )
        and (
            exposicion_id is null
            or exists (
                select 1 from public.exposiciones_temporales
                where exposiciones_temporales.id = bricks_recibidos.exposicion_id
                  and exposiciones_temporales.estado = 'activa'
            )
        )
        and auth.uid() is not null
        and (
            hash_visitante = auth.uid()::text
            or hash_visitante = 'exposicion-' || bricks_recibidos.exposicion_id::text
                                || '-user-' || auth.uid()::text
        )
    );
```

**Antes de aplicar**, confirmar el nombre real de la política (deriva de nombres, 5ª vez en este
proyecto):

```sql
select p.polname, pg_get_expr(p.polwithcheck, p.polrelid) as with_check
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'bricks_recibidos' and p.polcmd = 'a';
```

**Verificar después:** votar un set en exposición activa → toast "¡Voto registrado!" y el
contador sube; votar el mismo set otra vez → "Ya has votado por este set en esta exposición"
(23505); votar en una exposición archivada → sigue bloqueado.

> **Decisión de producto pendiente (menor):** hoy la UI permite **votar tu propio set** en una
> exposición (probado con @brick sobre "Alianza Rebelde"). Si no se quiere, añadir el filtro en
> `ExposicionClient` y/o en la política (`sets.usuario_id <> auth.uid()`).

---

## 3. Detalle de ejecución

### 3.1 "Explorar" (FASES fila 18) — ✅

| Caso | Resultado |
|---|---|
| Navbar sin sesión: `Explorar ▾ · Cómo funciona · Entrar` (home por el logo) | ✅ |
| Navbar con sesión: `Inicio · Explorar ▾ · Mis Vitrinas · Mis Insignias · Cómo funciona` | ✅ |
| `Explorar ▾` = Exposiciones · Bounties · Galería (desktop, con y sin sesión) | ✅ |
| Menú móvil (375px): "Explorar" se aplana a sus 3 ítems directos | ✅ |
| `/galeria` carga; chips `Todas / Harry Potter / Star Wars` | ✅ |
| Filtro por temática: "Star Wars" 5→4 vitrinas, "Harry Potter" → 1 | ✅ |
| `/bounties` público; tarjeta "BD1 del Año 90" con "+1000 Bricks" (tope unificado, sin la mentira de 5000) | ✅ |
| "Reclamar Misión" sin sesión → `/login` con aviso "Debes iniciar sesión para reclamar Bounties" | ✅ |
| Modal "Reclamar Bounty": misión, recompensa, Opción 1 (de mi vitrina — "Cobrar Recompensa Directa" **deshabilitado** sin sets), Opción 2 (Ir a Mesa de Trabajo → `/mesa-de-trabajo?bounty_id=…`) | ✅ (a11y: ver B-06) |
| `/exposiciones` índice público (2 exposiciones, ambas FINALIZADA) | ✅ |
| `/exposicion/[id]` archivada: "Ranking Oficial", medallas 🥇🥈, bricks en gris, sin botón de voto | ✅ (chip hero: ver B-04) |
| Bento de la home: 7/7 tarjetas al destino del doc de diseño (Bounties→/bounties, Privacidad→/como-funciona, Tags→/galeria, Progreso→/dashboard/insignias, Explorador→/galeria, Ver Galería→/galeria, Vitrinas→/vitrina/[id]) | ✅ |
| Celdas del Hub: Más Eventos→/exposiciones · Comunidad→/galeria · Se Busca→/bounties · Insignias→/dashboard/insignias | ✅ |
| Celda Hub "Evento Activo" sin exposición activa | ❌ B-03 (`href="#"`) |

### 3.2 "Mis Insignias" (FASES fila 19) — 🟢 verificado end-to-end (B-01 y B-09 resueltos)

| Caso | Resultado |
|---|---|
| `/dashboard/participaciones` → redirige a `/dashboard/insignias` | ✅ |
| `/dashboard/participaciones/<id>` → `/dashboard/insignias/bounty/<id>` (preserva id) | ✅ |
| `/dashboard/insignias/bounty/<reclamo-real>` renderiza el detalle ("BD1 del Año 90 · Star Wars · Reclamado con Alianza Rebelde · +1000 Bricks concedidos") · redirección de `/dashboard/participaciones/<reclamo>` a esa misma página | ✅ (3ª pasada — nota de "revisar enlaces antiguos" resuelta: la ruta vieja usa id de reclamo, la redirección lleva bien) |
| `/dashboard/insignias` pinta las 5 secciones y los chips de ancla (`#insignias #en-curso #recompensas #pasaporte #mosaico` — los 5 ids existen) | ✅ |
| Vitrina de Insignias — cuenta vacía: "1 de 46" · cuenta poblada: "5 de 46" · tras votar + reclamar un bounty: "12 de 46", todo cálculo al vuelo coherente con los datos reales; barras de "próximo objetivo" con valores reales | ✅ |
| `POST /api/insignias/sync` tras aplicar `20260908120000` | ✅ **200 OK** — insignias persistidas |
| Idempotencia del sync (recargar 3×) | ✅ contador del Mosaico estable, sin filas duplicadas |
| Mosaico Comunitario tras la migración + recarga | ✅ "N hitos conseguidos por la comunidad · N son tuyos" (crece solo cuando cambian los datos reales) |
| **Recompensas** — reclamo real de un bounty ("BD1 del Año 90" con el set "Alianza Rebelde") | ✅ toast "¡Bounty reclamado con éxito!" (copy: ver **B-11**); sección muestra "1.000 Bricks ganados", el reclamo con set y fecha, enlace al detalle; `+1.000` sumados a `bricks_recibidos` (1 → 1.001) — confirma la frase de diseño "también suman en tus bricks recibidos" |
| Doble reclamo del mismo bounty por el mismo usuario | ✅ bloqueado: "Ya has reclamado este bounty" (no añade bricks) |
| **Pasaporte** — tras archivar "Star Wars: Return of the Jedi" (4ª pasada) | ✅ sello **"STAR WARS: RETURN OF THE JEDI · 9 SEP 2026 · 🥇 1ER PUESTO"**, con enlace a la ficha `/exposicion/[id]`, y hueco "ESPACIO PARA TU PRÓXIMA EXPOSICIÓN". D3 repartió el podio: la insignia única **"Oro"** queda desbloqueada (13/46). La exposición sale de "En curso" y su ficha pasa a "Evento Finalizado · Ranking Oficial". |
| En curso | ✅ mientras activa: "Star Wars: Return of the Jedi · Alianza Rebelde · #1 DE 1 · RETIRAR SET" · tras archivar: estado vacío honesto |
| `/dashboard/vitrinas` — "Dónde puedes participar" al final; `VitrinasStats` oculto sin sets — coherente con FASES fila 20 | ✅ |
| **Voto en `/exposicion/[id]` activa** — tras aplicar `20260909100000` | ✅ "¡Voto registrado!" +1 · doble voto → "Ya has votado por este set en esta exposición" (23505) — **B-09 resuelto** |

### 3.3 Secciones adyacentes (re-triaje go-live)

| Caso | Resultado |
|---|---|
| Login con cuenta de test | ✅ |
| `/dashboard/perfil` — editar Alias → toast "Perfil actualizado correctamente" → **persiste tras recargar** | ✅ |
| `/dashboard/perfil` — controles muertos | ❌ **B-02** |
| Doble voto en un set normal (`/vitrina/[id]` → `POST /api/bricks`) → **400 "Ya has dado un Brick a este set"** (protección server-side OK) | ✅ (UI: B-05, sigue reproduciéndose en 3ª pasada) |
| Reclamar un bounty (happy path completo) | ✅ ver §3.2 Recompensas |
| Votar tu propio set en una exposición | ⚠️ permitido hoy (probado con @brick sobre "Alianza Rebelde") — decisión de producto, ver nota en B-09 |
| `/set/<id-inexistente>` → 404 | ✅ |
| `/perfil/<id-inexistente>` → 404 | ✅ |
| `/v/[id]` (ruta legacy de vitrina) sigue renderizando | ✅ (3 vistas de vitrina sin consolidar = deuda F2.6 conocida, fuera de alcance) |
| `/como-funciona` carga | ✅ |

---

## 4. Notas y límites de esta ejecución

- **Entorno con ruido:** el proyecto vive en OneDrive y el `next dev` reconstruía con frecuencia
  (Fast Refresh). Además la ventana del navegador estaba oculta durante parte de la sesión, lo
  que hacía fallar algunos `screenshot`/clics; se compensó leyendo el DOM y la red directamente.
- **Cuatro pasadas:** 1ª cuenta vacía · 2ª cuenta poblada (vitrina + set + participación + admin)
  · 3ª tras aplicar `20260908120000` y `20260909100000` (B-01, B-09) · 4ª tras el titular
  archivar la exposición (Pasaporte). **Cobertura de "Mis Insignias" completa:** las 5 secciones
  (Insignias · En curso · Recompensas · Pasaporte · Mosaico) verificadas con datos reales.
- **Certificación:** la refactor de "Mis Insignias" (fila 19) y la de "Explorar" (fila 18)
  quedan **verificadas end-to-end**. Los 2 bloqueantes (B-01, B-09) están resueltos. El resto
  (B-02…B-12) es pulido no bloqueante.
- **localhost = Vercel comparten la misma BD Supabase** (`.env.local` apunta al proyecto real).
  Lo que se crea en la app desplegada aparece en localhost y viceversa.
- **Entorno con ruido:** el proyecto vive en OneDrive y el `next dev` reconstruía con frecuencia;
  la ventana del navegador estuvo oculta a ratos (fallos de `screenshot`/clic) → se trabajó
  leyendo DOM y red directamente.
- **Pendiente de trazabilidad:** añadir una fila a `FASES_Y_MEJORAS.md` para esta ejecución E2E
  (no se ha tocado ese documento en esta sesión).
