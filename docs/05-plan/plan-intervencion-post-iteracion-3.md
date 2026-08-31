---
proyecto: bricks-virtual-collector
tipo: plan
subtipo: intervencion-priorizada
etapa: mvp
exposicion: X2
estado: propuesto
version: 1
fecha: 2026-08-18
commit_base: eebd7c3
alcance: backlog completo pendiente de la auditoría de arquitectura tras la Iteración 3
relacionada_con: [auditoria-arquitectura, seguimiento-iteracion-3, ADR-009-entorno-demo-publico, ADR-010-reconciliacion-exif-rate-limiting]
tags: [spec-vjc, plan, priorizacion, lanzamiento]
---

# Plan de intervención — siguientes pasos tras la Iteración 3

**Propósito:** convertir lo que queda abierto de `docs/auditoria-arquitectura.md` en una lista
cerrada, clasificada por impacto y coste, y agrupada en iteraciones ejecutables.

**Método:** antes de escribir nada se ha reejecutado el estado real del repositorio. Este plan no
se apoya en lo que los documentos de seguimiento afirman, sino en lo medido hoy.

---

## 0. Estado real medido (18/08/2026, `eebd7c3`, árbol limpio)

| Comprobación | Resultado | Lectura |
|---|---|---|
| `npx next build` | ✅ exit 0, 42 rutas | Hay artefacto desplegable |
| `npx tsc --noEmit` | ✅ exit 0 | Sin errores de tipos |
| `npm run test:coverage` | ✅ verde — S 93,81% · B 86,37% · F 89,59% · L 94,97% | Las 4 métricas sobre el umbral |
| `npx eslint .` | ❌ 283 problemas (201 errores, 82 avisos) | No es gate; nunca lo ha sido |
| Rutas estáticas en el build | **0 de 42** (todas `ƒ`) | F3.2 intacta |
| Líneas de producción medidas por el gate | 4.267 de 8.101 | **47,3% invisible al umbral** |
| `<img>` en producción | 27 | F3.1 intacta |
| `: any` / `as any` en producción | 40 | F2.8 intacta |
| `console.*` en producción | 16 | F3.8 intacta |
| Disclaimer de marca en Footer | ✅ presente | F1.13 cerrada |
| `.env.example` | ✅ completo y comentado | Cerrada |
| README de producto | ✅ salvo capturas (hay un `<!-- CAPTURAS -->` sin rellenar) | F1.11 casi cerrada |
| Marcadores `PENDIENTE` en legales servidos | 0 | F1.12 cerrada |
| Specs E2E | 1 (`e2e/auth.spec.ts`) | F2.12 intacta |
| CI | solo `npm run test:coverage` | **F1.16 nunca ejecutada** |
| Rutas de vitrina | 3 vivas (`/vitrina/[id]`, `/v/[id]`, `/dashboard/vitrina/[id]`) | F2.6 intacta |
| ADR-009 | aceptada, **no activada** | No hay despliegue público |

### Tres hechos que corrigen el relato de los seguimientos

1. **F1.4 se dio por cerrada y no lo está.** `dashboard/participaciones/[id]/page.tsx` conserva
   el fallback "Modular Master" (línea 49) y, además, los campos `estado`, `progreso`,
   `requisitos` y `tareas` están hardcodeados **también en la rama que sí encuentra datos**
   (líneas 33-46). Como la tabla que consulta (`bounties_reclamados`) no la escribe nadie
   —hallazgo N8—, la página muestra hoy datos ficticios a cualquier visitante.
2. **Quedan dos focos más de datos simulados** que ningún seguimiento contabilizó como abiertos:
   `components/badges/InsigniasClient.tsx:18` y `app/admin/status/page.tsx:7-15`.
3. **La tabla `reportes` no la usa ningún fichero de `src/`.** El hallazgo S7 de la auditoría
   ("`reportes` deny-all") es hoy irrelevante por una razón distinta a la que decía: no hay
   consumidor, ni UI de denuncia. Es esquema sin producto.

---

## 1. Inventario completo de lo que queda abierto (31 ítems)

Impacto: **5** = cambia el veredicto o el riesgo legal/seguridad real · **3** = calidad percibida
por una audiencia profesional · **1** = higiene interna.
Coste: **XS** ≤ 30 min · **S** ≤ 2 h · **M** ≤ 1 día · **L** > 1 día.
Ratio = impacto / coste, criterio de orden dentro de cada bloque.

### Bloque V — Verificación externa (cierra el veredicto NO-GO)

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| V1 | **Verificación positiva de las 3 migraciones aplicadas.** Consultar `information_schema.columns` y `storage.buckets`, y probar en la app real crear un set y editar el alias. Es el **único ítem que hoy sostiene el NO-GO formal**. | 5 | XS | ★★★★★ |
| V2 | **Confirmar `SUPABASE_SERVICE_ROLE_KEY` en Vercel.** Sin ella el borrado de cuenta (derecho de supresión RGPD) devuelve 500 y `systemLogger` degrada en silencio. Riesgo legal, no técnico. | 5 | XS | ★★★★★ |
| V3 | **Revisar la allow-list de Redirect URLs en Supabase Auth.** Defensa en profundidad sobre el open redirect ya saneado en código (S4). | 4 | XS | ★★★★ |
| V4 | **Confirmar retención de logs y región del proyecto.** Frankfurt (UE) está afirmado en la Iteración 1 pero no reverificado en este ciclo. | 3 | XS | ★★★★ |

### Bloque C — Blindaje del CI (impide que lo ganado se pierda)

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| C1 | **F1.16: añadir `tsc --noEmit`, `next build` y `eslint` al workflow.** Hoy el CI dejaría pasar exactamente el error de tipos que rompió el build en la auditoría original. | 5 | XS | ★★★★★ |
| C2 | **ESLint como gate con baseline congelado** (201 errores hoy; el gate falla si sube, no si no baja). Convierte una deuda estática en una deuda que no crece. **Adelantada a la Iteración 4**: resultó más barata que dejar ESLint como paso informativo, y un gate no bloqueante no es un gate. | 3 | S | ★★★ |
| C3 | **F3.10: proteger `main`, trabajar con ramas + PR.** Sin esto C1 y C2 son decorativos: se puede empujar directo. | 4 | XS | ★★★★★ |

### Bloque H — Honestidad del producto (cero datos ficticios)

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| H1 | **`/dashboard/participaciones/[id]`: retirar el fallback "Modular Master" y los campos hardcodeados.** Depende de la decisión D1. | 5 | S | ★★★★ |
| H2 | **`/admin/status`: eliminar la ruta.** Duplica `/admin/system/health` y `/admin/system/logs`, que sí leen datos reales. No está enlazada desde ningún sitio. Zero-Duplication, coste de borrado. | 3 | XS | ★★★★★ |
| H3 | **`/dashboard/insignias`: resolver los datos simulados.** Depende de la decisión D3. Si la decisión es "no hay lógica de reparto todavía", el coste baja a S (estado vacío honesto). | 4 | S–L | ★★ |
| H4 | **Capturas en el README.** El bloque `<!-- CAPTURAS -->` sigue vacío y el README es la primera pantalla de un visitante que llega desde LinkedIn. | 4 | S | ★★★★ |

### Bloque D — Decisiones de producto que bloquean código

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| D1 | **N8: modelo de reclamo de bounties.** `api/bounties/claim` escribe en `bounties.reclamado_por`; `participaciones/[id]` lee de `bounties_reclamados`. Un solo reclamante o tabla de reclamos: hay que elegir. **Bloquea H1.** | 5 | XS (decisión) + M (impl.) | ★★★ |
| D2 | **N7: quién modera.** `admin/layout.tsx` enseña el enlace a `sysadmin`; `admin/moderacion/page.tsx` lo rechaza. Un sysadmin que hace clic es expulsado. | 3 | XS + XS | ★★★★★ |
| D3 | **Insignias: ¿hay reparto real o se retira del MVP?** `admin/exposiciones/page.tsx:106` lleva un `TODO` para calcular y repartir. **Bloquea H3.** | 4 | XS (decisión) + L (impl.) | ★★ |

### Bloque T — Red de seguridad de tests (cierra la brecha que causó N1/N2)

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| T1 | **F2.4: `coverage.include` de lista blanca a `src/**`,** por tramos, con exclusiones justificadas una a una. Hoy el 47,3% del código no cuenta para el umbral. | 4 | L | ★★ |
| T2 | **F2.12: E2E de negocio contra Supabase real** (registro → vitrina → set → publicar → ver). Es la **única defensa contra el fallo de clase N1/N2**: los tests unitarios mockean Supabase y por eso llevaban meses en verde insertando columnas que no existían. | 5 | L | ★★★ |

### Bloque S — Seguridad diferida (obligatoria antes de abrir escritura)

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| S1 | **F3.5: validación Zod en `api/bricks` y `api/bounties/claim`.** El más barato del bloque. | 3 | S | ★★★★ |
| S2 | **F2.2 / S5: limpieza EXIF verificable en servidor.** Hoy es canvas en el navegador y **la UI promete la garantía en dos sitios** (`MesaTrabajoClient.tsx:199`, `EditarSetClient.tsx:84`), igual que el README. Mientras no se implemente, o se implementa o se ajusta el copy: la promesa incumplida es el riesgo, no el EXIF. | 5 | L | ★★ |
| S3 | **F2.3 / S8: rate limiting compartido entre instancias.** Bloqueado por una cuenta Upstash externa. | 3 | M | ★★★ |
| S4 | **F3.11: restringir el `insert with check (true)` de `bricks_recibidos`** a inserciones autenticadas con `hash_visitante = auth.uid()`. | 3 | M | ★★★ |
| S5 | **F3.6: cabecera CSP con nonce.** | 3 | M | ★★★ |
| S6 | **Decidir sobre la tabla `reportes`**: sin consumidor en `src/`. O se construye la denuncia, o se retira el esquema muerto. | 2 | XS | ★★★★ |

### Bloque E — Deuda estructural y rendimiento

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| E1 | **F3.8: sustituir los 16 `console.*` por `systemLogger`.** | 2 | S | ★★★ |
| E2 | **F3.7: respetar `prefers-reduced-motion` globalmente** (`MotionConfig` + media query). Accesibilidad barata. | 3 | S | ★★★★ |
| E3 | **F3.9: higiene del repo público** (`.agents/`+`.claude/` duplicados, `update_docs.py` sin documentar). | 2 | S | ★★★ |
| E4 | **F3.2: estrategia de renderizado.** 0 rutas estáticas de 42; sacar la sesión del root layout permitiría estático en landing, legal y guía. | 3 | M | ★★★ |
| E5 | **F3.3: reducir bundle** (import dinámico de framer-motion, `Toaster` global). | 3 | M | ★★★ |
| E6 | **F3.4: reducir round trips de auth** (hoy 3 llamadas por navegación: proxy + layout + página). | 3 | M | ★★★ |
| E7 | **F2.8: tipar las fronteras de datos** con `supabase gen types typescript`; 40 `any` en producción. Habría detectado N1/N2 en tiempo de compilación. | 4 | L | ★★ |
| E8 | **F2.6: consolidar las 3 vistas de vitrina** en una implementación con variante pública/privada. | 3 | L | ★★ |
| E9 | **F3.1: migrar las 27 `<img>` a `next/image`.** | 2 | L | ★ |

### Bloque L — Lanzamiento

| ID | Ítem | Imp. | Coste | Ratio |
|---|---|---|---|---|
| L1 | **Activar ADR-009**: `revoke insert, update, delete`, cuenta demo de solo lectura, registro cerrado, y desplegar. | 5 | M | ★★★ |
| L2 | **`/preflight` contra el despliegue real** y actualización del veredicto de la auditoría a v1.3. | 5 | S | ★★★★ |
| L3 | **Tag de checkpoint por iteración** (`v0.5.0-…`), regla §4 de `AGENTS.md`. | 2 | XS | ★★★★ |

---

## 2. Matriz impacto / coste

```
                 COSTE BAJO (XS–S)                COSTE ALTO (M–L)
              ┌──────────────────────────────┬──────────────────────────────┐
              │ HACER YA                     │ PLANIFICAR                   │
     IMPACTO  │ V1 verificar migraciones     │ T2 E2E de negocio            │
      ALTO    │ V2 service_role key (RGPD)   │ S2 EXIF server-side          │
              │ C1 CI endurecido             │ L1 activar ADR-009           │
              │ C3 main protegido            │ D1 modelo de bounties (impl) │
              │ H1 mock de participaciones   │ T1 cobertura a src/**        │
              │ H4 capturas README           │ E7 tipado de fronteras       │
              │ V3 redirect allow-list       │ D3/H3 lógica de insignias    │
              │ L2 preflight                 │                              │
              ├──────────────────────────────┼──────────────────────────────┤
     IMPACTO  │ RELLENO                      │ APLAZAR                      │
     MEDIO    │ H2 borrar /admin/status      │ S3 rate limiting (Upstash)   │
     / BAJO   │ D2 roles de moderación       │ S4 bricks RLS · S5 CSP       │
              │ S1 Zod · S6 reportes         │ E4 render · E5 bundle        │
              │ E1 logger · E2 motion        │ E6 auth · E8 vitrinas        │
              │ E3 higiene · L3 tags         │ E9 next/image                │
              └──────────────────────────────┴──────────────────────────────┘
```

**Las cinco de mejor ratio del backlog entero:** V1, V2, C1, C3, H2. Suman menos de dos horas y
entre las cinco cambian el veredicto de la auditoría, cierran un riesgo de RGPD, impiden que
vuelva a mezclarse un build roto y retiran una ruta ficticia navegable.

---

## 3. Plan de intervención por iteraciones

### Iteración 4 — "Cerrar el veredicto" · medio día · sin escribir casi código

Objetivo: llevar la auditoría de **NO-GO** a **GO condicionado**.

| Orden | ID | Criterio de aceptación verificable |
|---|---|---|
| 1 | V1 | `information_schema.columns` devuelve `sets.num_set`, `sets.notas`, `usuarios_perfil.alias`; `storage.buckets` devuelve los 3 buckets; crear un set y editar el alias funcionan en la app real |
| 2 | V2 | El borrado de cuenta devuelve 200 en el entorno desplegado, no 500 |
| 3 | V3 / V4 | Captura de la allow-list de Supabase Auth y de la región, anexadas al seguimiento |
| 4 | C1 + C2 | Un PR con un error de tipos falla en CI antes de mezclar; el gate de ESLint falla si los errores suben de 201 |
| 5 | C3 | `main` rechaza push directo |
| 6 | H2 | `src/app/admin/status/` no existe; `next build` no lista la ruta |
| 7 | L3 | Tag `v0.5.0-verificacion` |

**Ejecutado el 18/08/2026 en la rama `iteracion-4-verificacion`:** C1, C2 y H2 cerradas
(`.github/workflows/test.yml` con 4 gates, `scripts/eslint-baseline.mjs`, ruta `/admin/status`
eliminada — el build baja de 42 a 41 rutas). V1.a–V1.f y V1.d verificados por el titular contra
Supabase real; hosting decidido (Vercel, coincide con ADR-001). V3, V4b y C3 siguen pendientes.
Detalle completo, incluidos 2 hallazgos nuevos (B1/B2, ver abajo) y sus correcciones, en
`guia-verificacion-iteracion-4.md`.

**Dos bugs nuevos encontrados y corregidos durante las pruebas manuales (no estaban en ningún
documento anterior):** en `/dashboard/vitrina/[id]`, el enlace "Editar" de un set apuntaba a la
ruta de *crear* un set (`/mesa-de-trabajo?set_id=...`, parámetro que `MesaTrabajoClient` nunca
lee), y el botón "Eliminar" era un `<button>` sin `onClick` dentro de un Server Component —
estructuralmente inerte. Corregido apuntando "Editar" a la ruta ya existente y probada
(`/mesa-de-trabajo/[id]`) y retirando el botón muerto en vez de duplicar la lógica de borrado
(Zero-Duplication). También se confirmó con evidencia de código que **D3 es más urgente de lo
documentado**: además de `/dashboard/insignias`, el widget "última insignia" de la portada del
dashboard depende de `sets_insignias`, tabla que ningún flujo real escribe todavía.

**Salida:** el veredicto formal deja de depender de una verificación externa. Es el desbloqueo de
mayor palanca del proyecto y no requiere prácticamente escribir código.

### Iteración 5 — "Honestidad del producto" · 1–2 días

Objetivo: que ninguna ruta accesible muestre datos inventados. Es el requisito real de un
lanzamiento en LinkedIn: en una demo de solo lectura, lo único que hace el visitante es mirar.

| Orden | ID | Criterio de aceptación verificable |
|---|---|---|
| 1 | D1, D2, D3 | Tres decisiones tomadas y registradas como ADR-011 (modelo de bounties), ADR-012 (roles de moderación) y una nota de producto sobre insignias |
| 2 | H1 | `grep -rn "Modular Master\|Mocked para el ejemplo" src/` sin resultados; la página o muestra datos reales o un estado vacío honesto |
| 3 | H3 | `grep -rn "Datos simulados" src/` sin resultados |
| 4 | S1, S6, E1, E2, E3 | Payload malformado → 400 tipado; cero `console.*` en producción; sin transiciones con "reducir movimiento" activo |
| 5 | H4 | README con 2–3 capturas reales del recorrido |
| 6 | L3 | Tag `v0.6.0-producto-honesto` |

**Salida:** cero datos ficticios en rutas de usuario. Cierra de verdad F1.4, que se dio por
cerrada sin estarlo.

### H5 (nuevo, 19/08/2026) — Vista de detalle/histórico de una exposición

**Origen:** al probar D3 en real, el titular archivó una exposición y confirmó "Insignias
entregadas a 2 participante(s)" — pero no hay forma de ver **a quién**, ni el ranking, ni
volver a consultarlo después. Petición: una vista con los datos esenciales de cada exposición
(número de participantes, ranking, quién ganó qué) accesible tanto al cerrar como después, a
modo de histórico.

**Evaluación de viabilidad — más barato de lo que parece:**

La pieza más cara (calcular el ranking con dueño de cada set, foto, nombre y recuento de
bricks) **ya existe y funciona**: `src/app/exposicion/[id]/page.tsx` la calcula entera para la
vista pública de la exposición (incluye `usuarios_perfil.username` por participante, aunque
`ExposicionClient.tsx` no lo esté pintando todavía). El panel de admin simplemente no enlaza
ahí ni añade una capa de resumen. Esto es una extensión, no una función nueva desde cero.

**Dos matices que si no se resuelven, la vista "histórica" puede mentir:**
1. `/exposicion/[id]` **recalcula el ranking en vivo** a partir de `bricks_recibidos` cada vez
   que se visita — correcto mientras la exposición está activa, pero una vez archivada el
   registro *oficial* debería ser lo que se guardó en `sets_insignias` en el momento del cierre
   (`rango`/`titulo_insignia`), no un recálculo que podría divergir si alguien vota después de
   archivarse. Hay que comprobar si hoy es posible votar en una exposición ya archivada (no se
   ha verificado); si lo es, es un hallazgo aparte a cerrar antes de fiarse del histórico.
2. La respuesta a "quién ganó" para exposiciones **ya archivadas antes de esta implementación**
   (si las hay) no tiene fila en `sets_insignias` — el histórico solo puede ser completo desde
   la primera vez que se cierre una exposición con este código ya desplegado.

**Propuesta de alcance (Zero-Duplication: reutilizar, no duplicar la vista pública):**

| Pieza | Qué hace | Coste |
|---|---|---|
| Enlace desde `/admin/exposiciones` a `/exposicion/[id]` | Cada tarjeta de exposición enlaza a su vista pública ya existente — acceso inmediato al ranking sin construir nada nuevo | XS |
| Resumen inline en `/admin/exposiciones` | Nº de participantes aprobados y total de bricks, junto a cada tarjeta, sin tener que entrar | S |
| Vista "oficial" post-cierre | Cuando `estado='archivada'`, `/exposicion/[id]` deja de recalcular en vivo y muestra el ranking guardado en `sets_insignias` (rango + titulo_insignia reales, inmutable) — requiere decidir primero si hoy se puede votar tras archivar (matiz 1) | M |
| Índice histórico | Filtro/pestaña en `/admin/exposiciones` para separar activas de archivadas con acceso directo a cada detalle | S |

**Coste total estimado: S–M**, casi todo reutilización. No se implementa en este turno — queda
registrado aquí para entrar en la Iteración 5 cuando el titular lo confirme.

### Iteración 6 — "Red de seguridad" · 2–3 días

Objetivo: cerrar estructuralmente la brecha que produjo N1/N2 — no volver a depender de que
alguien lea las migraciones a mano para descubrir que una funcionalidad central está rota.

| Orden | ID | Criterio de aceptación verificable |
|---|---|---|
| 1 | T2 | ≥ 4 specs de Playwright pasando en CI contra un Supabase de pruebas real, no mockeado |
| 2 | T1 | `include: ['src/**']` con exclusiones comentadas una a una; las 4 métricas ≥ 85% |
| 3 | C2 | El CI falla si el recuento de errores de ESLint sube por encima del baseline |
| 4 | L3 | Tag `v0.7.0-red-de-seguridad` |

**Nota de secuencia:** T2 va antes que T1 deliberadamente. Ampliar la cobertura de tests que
mockean Supabase sube un porcentaje sin reducir el riesgo real; un E2E contra esquema real sí.

### Iteración 7 — "Lanzamiento" · 1 día

| Orden | ID | Criterio de aceptación verificable |
|---|---|---|
| 1 | E4, E5 | ≥ 8 rutas estáticas en el build; ningún chunk > 150 KB |
| 2 | L1 | Escritura revocada verificada con la cuenta demo; registro cerrado; despliegue accesible |
| 3 | L2 | `/preflight` emite **GO** o **GO CON EXCEPCIONES** documentadas |
| 4 | — | `docs/auditoria-arquitectura.md` v1.3 con el veredicto actualizado |
| 5 | L3 | Tag `v1.0.0-demo-publica` |

### Iteración 8+ — "Apertura de escritura" · solo si se decide abrir el registro

Todo lo que ADR-009 neutralizó por revocación de privilegios reaparece íntegro en cuanto se
conceda `insert/update/delete`. **Este bloque es condición de apertura, no deuda opcional.**

S2 (EXIF, o el ajuste del copy que hoy lo promete) · S3 (rate limiting compartido) ·
S4 (RLS de bricks) · S5 (CSP) · E7 (tipado de fronteras) · E8 (consolidación de vitrinas) ·
E6 (round trips de auth) · E9 (`next/image`).

---

## 4. Dependencias que condicionan el orden

```
V1 ──> (cierra el NO-GO formal)
V2 ──> (cierra el riesgo RGPD)
C3 ──> C1, C2        (sin main protegido, los gates son opcionales)
D1 ──> H1            (no se puede arreglar la página sin decidir el modelo)
D3 ──> H3            (no se puede conectar lo que no existe)
T2 ──> T1            (cobertura real antes que porcentaje de cobertura)
H1,H3 ──> L1         (no se lanza una demo de mirar con datos inventados)
L1 ──> L2            (no hay preflight sin despliegue)
S2..S5, E7 ──> apertura de registro (no antes, pero tampoco después)
```

---

## 5. Riesgos de este plan

| # | Riesgo | Mitigación |
|---|---|---|
| P1 | **V1 puede destapar más columnas faltantes.** La Iteración 3 encontró 3 leyendo el código; nadie ha comprobado todavía el esquema real contra *todos* los `.select()`. | Ejecutar V1 como diff completo esquema-vs-código, no solo como comprobación de las 3 migraciones nuevas |
| P2 | **D1 y D3 son decisiones de producto, no técnicas.** Si se posponen, H1 y H3 quedan bloqueadas y la Iteración 5 no cierra. | Tomarlas al inicio de la Iteración 5, no durante |
| P3 | **T2 requiere un Supabase de pruebas separado.** Ejecutar E2E de escritura contra producción no es aceptable. | Decidir el entorno de pruebas antes de empezar la Iteración 6; `supabase db reset` ya es viable desde que A1 está cerrado |
| P4 | **La promesa de EXIF es hoy una afirmación no respaldada** en la UI y en el README, y la demo es de solo lectura, así que no se ejercita — pero el texto sigue publicado. | Si S2 no entra antes del lanzamiento, ajustar el copy en la Iteración 5 en vez de mantener la promesa |

---

## 6. Actualización 19/08/2026 — D1, D2 y D3 implementados

En `main` (tags `v0.5.0-verificacion`, `v0.6.0-d1-d2-d3`):

- **D1 (modelo de bounty multi-reclamo):** decidido por el titular — cualquier número de personas
  puede reclamar un bounty, recompensa completa a cada una. `api/bounties/claim/route.ts`
  reescrito (INSERT en `bounties_reclamados` + `unique(bounty_id, usuario_id)` en vez de UPDATE
  atómico sobre `bounties`). H1 cerrado: `/dashboard/participaciones/[id]` sin fallback mock.
- **D2 (N7, quién modera):** solo `admin`/`admin_exposiciones`; `sysadmin` ya no ve el enlace a
  Moderación. Fuente única en `src/lib/roles.ts`.
- **D3 (insignias):** solo el Pasaporte de Exposiciones tiene datos reales (ranking calculado al
  archivar una exposición, `src/lib/insignias.ts`); Vitrina de Insignias y Mosaico Comunitario
  pasan a un estado "Próximamente" honesto — ninguna de las dos tenía esquema ni criterios
  definidos, son productos nuevos por diseñar, no decisión de esta iteración.
- Dos bugs nuevos encontrados en pruebas manuales (B1/B2) corregidos: enlace "Editar" de un set
  apuntaba a la ruta de crear; botón "Eliminar" era un `<button>` sin `onClick`.
- 205 → 239 tests, cobertura sin bajar de las 4 métricas, ESLint baseline bajado de 201 a 187
  (código nuevo escrito sin `any` en los mocks de Supabase).

**⚠️ Pendiente crítico, bloquea que lo anterior funcione en producción:** 2 migraciones nuevas
escritas en esta ronda (`20260818120000_bounties_multi_reclamo.sql`,
`20260818130000_sets_insignias_admin_write.sql`) **no están aplicadas contra Supabase real**. El
código ya desplegado asume que existen. Hasta que se apliquen, reclamar un bounty y archivar una
exposición con participantes fallarán en producción — mismo patrón de riesgo que N1/N2 de la
Iteración 3.

---

## 7. Cierre de Iteración 4 y arranque de Iteración 5 (19/08/2026)

### Iteración 4 — estado final tras las pruebas E2E del titular

| Ítem | Estado |
|---|---|
| V1–V4 | ✅ Cerrados |
| C1, C2, C3, H2 | ✅ Cerrados |
| D2, D3 | ✅ Confirmados funcionando en producción (moderación, reparto de insignias) |
| H1, H3 | ✅ Cerrados — verificado sin residuos de mock (`grep` limpio) |
| B1, B2 | ⏳ Corregidos, **pendiente confirmación visual del titular** |
| D1 | ⏳ Implementado, **pendiente probar reclamar un bounty con dos cuentas** |
| Nuevo hallazgo (no estaba en ningún documento) | Se podía votar/participar en una exposición ya archivada — solo estaba oculto en la UI, no bloqueado en RLS. **Corregido** (migración `20260819110000`), pendiente de aplicar y verificar. |

### Vitrina de Insignias vacía — no es una deuda, es la decisión D3 funcionando

Confirmado: es exactamente el estado que se decidió a propósito (`ProximamentePanel.tsx`, ver D3
más arriba). No hay lógica de logros de 24 insignias implementada en ningún sitio -- mostrar algo
ahí sería inventar datos, lo contrario de lo que D3 corrigió. Queda como decisión de producto
futura y separada, no como bug.

### Preguntas abiertas para el titular antes de empezar la implementación de Iteración 5

1. **EXIF/geolocalización (ADR-005/ADR-010, hallazgo S2)** — el bloqueo original de ADR-010 era
   "no hay infraestructura real contra la que verificar". Ya no es cierto: hay Vercel + Supabase
   en producción. Falta decidir la **técnica**:
   - `sharp` (ya presente en `node_modules` como dependencia transitiva de `next/image` -- no
     añadiría una dependencia nueva) vs. parseo manual de bytes EXIF sin dependencias.
   - Revocar la subida directa del cliente al bucket `fotos_sets` (hoy con la anon key) y
     sustituirla por un Route Handler que reciba la imagen, la limpie con `sharp` server-side, y
     suba el resultado con permisos de servidor.
2. **H5 (detalle/histórico de exposiciones)** — con el hallazgo de esta ronda ya cerrado (no se
   puede votar tras archivar), la "vista oficial post-cierre" que proponía H5 ya no tiene el
   riesgo de que el histórico cambie por debajo. ¿Se confirma su alcance tal cual quedó descrito?
3. **S6 (`reportes`)** — tabla sin ningún consumidor en `src/`. ¿Se construye la UI de denuncia,
   o se retira el esquema?
4. **H4 (capturas del README)** — esto sí lo puedo hacer yo con el navegador contra el despliegue
   real, no hace falta que las tomes tú.

Sin decisión en 1–3, no se puede planificar el coste real de la Iteración 5 con precisión: el
tamaño de EXIF por sí solo (M–L) domina sobre el resto de ítems ya acotados (S1, E1, E2, E3 son
S/XS cada uno).
