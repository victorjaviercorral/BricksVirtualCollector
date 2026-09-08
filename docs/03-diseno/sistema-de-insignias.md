---
proyecto: bricks-virtual-collector
tipo: diseno
subtipo: sistema-de-gamificacion
estado: implementado
version: 1
fecha: 2026-09-08
relacionada_con: [navegacion-y-flujos, exposiciones-y-logros-flujo, plan-intervencion-post-iteracion-3, ADR-010-reconciliacion-exif-rate-limiting]
tags: [spec-vjc, diseno, insignias, gamificacion, zero-duplication, recompensas]
---

# Sistema de insignias, mosaico y recompensas

**Origen:** cierre de la fila 08 de `FASES_Y_MEJORAS.md` ("Gamificación: Sección Mis
Insignias"), en progreso desde el inicio del proyecto, y de la deuda que dejó abierta la
decisión **D3** (Iteración 4). D3 retiró la "Vitrina de Insignias" y el "Mosaico Comunitario"
porque mostraban datos inventados — *"2/24 Desbloqueadas"* sobre cuatro logros ficticios y un
mural de 40 casillas simuladas — y los dejó como estados vacíos honestos (`ProximamentePanel`) a
la espera de que existiera un sistema real detrás. Este documento es ese sistema.

---

## 1. Las tres reglas que lo gobiernan

1. **Cero datos inventados.** Cada insignia se calcula desde un dato que la aplicación ya tiene,
   con una consulta concreta. Un estado vacío honesto siempre gana a un dato simulado.
2. **Una pantalla por concepto.** Cada sección de "Mis Insignias" responde a una pregunta
   distinta y ninguna re-pinta el dato de otra. **Ninguna sección nueva entra aquí sin retirar su
   duplicado de otra pantalla.**
3. **La fuente de verdad es el cálculo, no la tabla.** `insignias_usuario` guarda *cuándo* se
   consiguió algo; *si* se tiene lo decide siempre el motor contra los datos reales.

---

## 2. Arquitectura

| Fichero | Responsabilidad |
|---|---|
| `src/lib/insignias-usuario.ts` | **Función pura.** Catálogo de 46 insignias, `evaluarInsignias()`, derivación de agregados y bloques del mosaico. Sin Supabase dentro: probable de forma exhaustiva sin mockear la base de datos (mismo patrón que `insignias.ts`, `exposiciones.ts`, `galeria.ts`). |
| `src/lib/queries/insignias-usuario.ts` | Capa de acceso a datos: `getDatosInsignias`, `getAgregadosUsuario`, `getMosaicoComunitario`, `getActividadEnCurso`. Solo consulta y ensambla. |
| `src/lib/bounties.ts` | Fuente única de `MAX_REWARD_BRICKS` y `recompensaEfectiva()`. |
| `src/components/badges/BadgeMedal.tsx` | La medalla y el mapa nombre-de-icono → componente. |
| `src/components/badges/*` | Vitrina, Actividad, Recompensas, Pasaporte, Mosaico, Sincronizador. |
| `src/app/api/insignias/sync/route.ts` | Persistencia idempotente. Recalcula en servidor. |

> **Por qué `insignias-usuario.ts` y no `insignias.ts`:** `src/lib/insignias.ts` ya existía y
> reparte el podio de una **exposición** (tabla `sets_insignias`). Son dos conceptos distintos
> que comparten palabra. Cada fichero se llama como su tabla.

---

## 3. Catálogo

### Agregados y su consulta exacta

| Campo | De dónde sale |
|---|---|
| `piezasTotales` / `setsConPiezas` | `sum(num_piezas)` y cuántos la tienen informada, sobre `sets` del usuario |
| `numSets` | número de filas de `sets` del usuario |
| `numVitrinasPublicadas` | `count(vitrinas)` con `estado='publicada'` y `visibilidad='pública'` |
| `bricksRecibidos` | `count(bricks_recibidos)` sobre sus `set_id` |
| `maxBricksUnSet` | máximo de `sets.bricks_recibidos`, acotado al total contado |
| `bricksDados` | `count(bricks_recibidos)` con `hash_visitante = <uid>` **o** `like 'exposicion-%-user-<uid>'` |
| `numFotos` | `count(fotos)` sobre sus `set_id` |
| `exposicionesAprobadas` | `exposicion_id` **distintos** en `exposicion_sets` con `estado='aprobado'` |
| `oros`/`platas`/`bronces` | `sets_insignias.rango` 1 / 2 / 3 |
| `bountiesReclamados` / `bricksDeBounties` | número y `sum(recompensa)` de `bounties_reclamados` |
| `tematicas` | `tematica` distintas no vacías (normalizadas a minúsculas) |
| `setAntiguo` | existe un set con `anio_lanzamiento < 2000` |
| `diasDesdeRegistro` | `usuarios_perfil.creado_en` |

**`usuarios_perfil.total_visitas` no se usa.** Ningún fichero de `src/` la escribe: es una
columna muerta, y una insignia basada en ella sería exactamente el tipo de ficción que D3 retiró.

### 11 familias escalonadas (40 niveles)

| Familia | Métrica | Tramos |
|---|---|---|
| **Cantera** | piezas totales | 1.000 · 5.000 · 15.000 · 50.000 · 150.000 |
| **Coleccionista** | sets | 1 · 5 · 15 · 40 · 100 |
| **Ecléctico** | temáticas distintas | 3 · 6 · 12 |
| **Aplauso** | bricks recibidos | 1 · 10 · 50 · 250 · 1.000 |
| **Mecenas** | bricks dados | 1 · 10 · 50 · 200 |
| **Comisario** | vitrinas públicas | 1 · 3 · 8 |
| **Retratista** | fotos | 5 · 25 · 100 |
| **Trotamundos** | exposiciones aprobadas | 1 · 3 · 10 |
| **Cazarrecompensas** | retos reclamados | 1 · 5 · 15 |
| **Botín** | Bricks ganados en retos | 1.000 · 5.000 · 20.000 |
| **Veteranía** | días desde el registro | 30 · 180 · 365 |

*Cazarrecompensas mide **cuántos** retos y Botín **cuánto** volumen: ejes distintos, no se
solapan.* El primer tramo de cada familia es deliberadamente alcanzable — una insignia que nadie
desbloquea nunca no motiva a nadie.

### 6 insignias únicas

**Oro / Plata / Bronce** (un podio de ese metal) · **Triple Corona** (los tres) · **Pieza
Estrella** (un solo set con ≥ 25 bricks) · **Arqueólogo** (un set anterior al 2000).

### Slugs

Cada insignia tiene un slug estable (`cantera-3`, `oro`, `triple-corona`) que se guarda en
`insignias_usuario.insignia`. **Los slugs no se renombran nunca** una vez publicados: son la
clave de `unique(usuario_id, insignia)`. Retirar una insignia del catálogo es seguro — el
Mosaico descarta las filas cuyo slug ya no exista en vez de pintarlas sin nombre.

### Las insignias no se revocan

Si alguien borra sets y baja de umbral, conserva lo que ya consiguió (la fila persistida sigue
ahí) y es la barra de progreso la que refleja el estado real. Por eso la migración concede
**solo INSERT**: sin UPDATE ni DELETE.

---

## 4. Identidad visual

Tres capas de significado, en `BadgeMedal.tsx`:

1. **Icono = familia.** Fijo, nunca cambia entre tramos. 17 iconos de `lucide-react`.
2. **Color = eje de juego.** Con 11 familias y 6 tokens de marca, el color agrupa por significado
   y el icono identifica:

| Eje | Color | Familias |
|---|---|---|
| Lo que tengo | `brand-red` | Cantera · Coleccionista · Ecléctico |
| Lo que doy y recibo | `brand-yellow` | Aplauso · Mecenas |
| Lo que muestro | `brand-blue` | Comisario · Retratista |
| Donde compito | `brand-green` | Trotamundos · Cazarrecompensas · Botín |
| Tiempo y rareza | `brand-purple` | Veteranía · Arqueólogo · Pieza Estrella |
| Podio | `brand-teal` | Oro · Plata · Bronce · Triple Corona |

3. **Aro = nivel.** I Bronce · II Plata · III Oro · IV Platino · V Diamante, con un chip de texto
   con el número romano. Las únicas no llevan aro.

**Bloqueada:** el mismo icono al 30%, borde discontinuo y **siempre** la barra `valor / umbral`.
Nunca un cuadrado gris vacío.

**Accesibilidad:** el icono va `aria-hidden`; la medalla lleva `aria-label` con nombre, estado y
progreso. Nada se codifica solo por color — el nivel también es texto.

### Dos trampas técnicas, documentadas porque volverán a aparecer

- **Las clases de Tailwind no se pueden interpolar.** `bg-${color}` nunca llega a la hoja de
  estilos: el JIT escanea literales en el código fuente. Por eso `COLOR_POR_EJE` (el token) vive
  en el módulo puro para tests y documentación, y las clases reales están escritas completas en
  un mapa dentro del componente.
- **`toLocaleString("es-ES")` no es fiable.** Un Node compilado con `small-icu` devuelve `2480`
  en vez de `2.480` sin avisar (detectado al ejecutar la suite). `formatearNumero()` agrupa con
  una expresión regular: el formato de un contador no puede depender de cómo esté compilado el
  runtime.

---

## 5. Cómo se conceden (modelo híbrido)

**El motor calcula en cada carga** → siempre coherente con los datos reales, cero deriva
posible. Lo que el cálculo no puede dar por sí solo es la **fecha** de obtención ni el momento
de *"acabas de desbloquear"*; eso lo aporta `insignias_usuario`.

Flujo: la página pinta la Vitrina con el cálculo → `SincronizarInsignias` (cliente, tras montar)
hace `POST /api/insignias/sync` → el handler **recalcula en servidor** y hace upsert con
`ignoreDuplicates` → devuelve **solo** las filas recién insertadas → un `toast` por cada una.

**El servidor no se fía del cliente.** El cuerpo de la petición se ignora por completo; `POST()`
ni siquiera recibe `Request`. Si la ruta insertara la lista que le mandan, cualquiera podría
concederse la Triple Corona con un `fetch`.

**Escribir desde el cliente y no al renderizar** es deliberado: pintar una página no debe tener
efectos de escritura. Si la llamada falla, la página sigue siendo correcta — se pierde la fecha
y el aviso, nunca la insignia.

---

## 6. Mosaico Comunitario

La pregunta que D3 dejó sin responder era *"qué es un bloque, cómo se gana, quién lo coloca"*.

> **Un bloque = una insignia desbloqueada por cualquier miembro de la comunidad. Lo coloca quien
> la consigue.**

Sin curación, sin esquema nuevo y sin datos inventados: es la capa comunitaria del sistema de
insignias, no un mural aparte. Se lee **solo** de `insignias_usuario` (los podios de exposición
llegan ahí por el mismo sync, así que no hay dos fuentes que puedan divergir). Los bloques
propios se destacan; se pintan los 120 más recientes y se dice cuántos hay en total.

**Alternativa descartada:** un mural con los sets públicos de la comunidad. Habría sido
`/galeria` otra vez — regla 2 de `AGENTS.md`.

**Mural vacío → estado vacío honesto** (*"serás el primero"*), no casillas de relleno.

---

## 7. El circuito de recompensas

Estaba roto por tres sitios a la vez y esta entrega lo cierra:

| Problema | Corrección |
|---|---|
| **Sin hogar.** Se reclamaba un reto, se concedía la recompensa, y no existía ninguna pantalla donde verla, agruparla ni acceder a ella. | Sección **Recompensas** en Mis Insignias: total ganado, cada reclamo con su set y su fecha, enlace al detalle. |
| **Vocabulario doble.** "pts" en la tarjeta, la home y el admin; "Bricks" en el detalle. Para el mismo dato. | Todo a **Bricks**. Es lo que de verdad se concede: filas reales de `bricks_recibidos`. No existe ninguna moneda de puntos en el esquema, así que la interfaz no la nombra. |
| **Sobrepromesa.** `/admin/bounties` creaba retos de 5.000 por defecto; `claim/route.ts` concedía `min(recompensa, 1000)`. El usuario veía 5.000 y recibía 1.000. | `src/lib/bounties.ts` es la fuente única del tope. Lo leen los cuatro puntos: conceder (API), crear (admin, con `max` y clamp), anunciar (tarjeta y modal) y resumir (home). |

`bounties_reclamados.recompensa` siempre guardó el valor **ya concedido**, así que el registro
nunca mintió — quien mentía era la tarjeta.

**La frase que cierra el círculo**, en la propia sección: *"Cada reto se cobra en Bricks que van
directos al set con el que lo reclamaste — por eso también suman en tus bricks recibidos."* Es
literalmente lo que hace `api/bounties/claim/route.ts`, y sin decirlo el usuario no puede cuadrar
sus totales.

Un reclamo **no** es actividad pendiente: la recompensa se concede al instante. Por eso vive en
Recompensas y no en "En curso" — la lista antigua los etiquetaba como "Pendiente", lo cual era
falso.

---

## 8. La fuente única de bricks

`count(bricks_recibidos)`, en todas las pantallas.

El trigger `increment_bricks` (`20260806000000`) **solo incrementa**: no hay `AFTER DELETE`.
Borrar un set cascadea sus filas de `bricks_recibidos` pero deja
`usuarios_perfil.total_bricks_recibidos` inflado. Esa columna **no se usa en ninguna parte**;
`/perfil/[id]`, que era la última que la leía, pasa a contar (antes mostraba un número distinto
del que su propio dueño veía en el Hub).

`sets.bricks_recibidos` **por set** sí es fiable (no hay camino de borrado de bricks, y borrar el
set se lleva la fila entera), y es lo que alimenta `maxBricksUnSet` — acotado además al total
contado, para que la interfaz no pueda mostrar un máximo por encima del total.

---

## 9. Exactitud de las consultas

- **Los totales que pueden crecer se piden con `count: 'exact', head: true`**, no con `.length`
  sobre las filas: PostgREST corta a 1.000 filas por respuesta y el total saldría silenciosamente
  truncado.
- **`exposicionesAprobadas` cuenta exposiciones distintas**, no participaciones: dos sets en la
  misma exposición son una sola exposición.
- **`bricksDados` cubre los dos formatos reales de `hash_visitante`** (voto normal y voto en
  exposición). Los hashes `bounty-*` quedan fuera, y es correcto: son recompensa que inserta el
  servidor, no un voto que haya dado nadie.
