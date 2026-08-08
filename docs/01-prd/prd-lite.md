---
proyecto: lego-virtual-museum
tipo: prd
etapa: mvp
exposicion: X2
estado: borrador
version: 0.3
fecha: 2026-07-28
tags: [spec-vjc]
---

# PRD-lite — Lego Virtual Museum

**Etapa:** MVP · **Exposición:** X2 · **Fecha:** 2026-07-28 · **Version:** 0.3

## 1. Problema

Víctor, coleccionista de LEGO Star Wars desde hace 5-6 años, nunca ha expuesto su colección
de forma organizada. Evita revelar su identidad, ser "catalogado" socialmente y socializar
cara a cara. En 5-6 años solo ha compartido fotos sueltas por WhatsApp con amigos cercanos,
sin alcance ni conexión con otros coleccionistas.

**Por qué ahora:** 2024-2025 concentran evidencia documentada de que el riesgo que motiva
el anonimato se ha intensificado, no es hipotético: robos de colecciones LEGO por $100K-
$300K (E4, E5), LEGO entrando al top-10 de retail más robado (E3), y el mercado kidult/AFOL
creciendo del 23,4% al 28% de ventas de juguetes en pocos años (E6) — más coleccionistas
acumulando valor real y expuesto al mismo tiempo que el riesgo de robo se documenta más.
La necesidad ya fue validada mediante Discovery (PRD heredado, seccion 3.1: 2 entrevistas
externas reales + 1 autoentrevista, metodologia Mom Test, confianza 🟡 Media).

**Contexto adicional del proyecto (no es la urgencia del problema, es la motivacion del
autor para abordarlo ahora):** el autor tambien busca validar de punta a punta el flujo de
Spec-Driven Development que construyó (Spec VJC Framework), usando este proyecto como
referencia de una aplicación real llevada a producción — no solo prototipos HTML.

## 2. Usuarios

**Segmento primario:** coleccionistas adultos de LEGO (AFOL — Adult Fans of LEGO) con
colecciones de valor económico real, que hoy evitan exponerlas por miedo al robo o a la
exposición de identidad. Arquetipo de referencia: Víctor, coleccionista de LEGO Star Wars
desde hace 5-6 años.

**Job to be done:** cuando quiero exponer mi colección de LEGO, quiero hacerlo de forma
anónima, privada y segura, para poder enseñarla a personas con mis mismos intereses en la
construcción de LEGO.

**Anti-usuario:** quien busca vender su colección o trata esto como un marketplace; quien
busca una red social en tiempo real (vivencias, chats, publicaciones para compartir y
comentar construcciones). Ambos casos están fuera del alcance de v1 (ver Exclusiones).

## 3. Alternativas hoy

| Alternativa actual | Por qué no es suficiente |
|--------------------|--------------------------|
| WhatsApp / fotos sueltas a amigos cercanos | Sin alcance ni catalogación: solo llega a contactos ya conocidos, no conecta con otros coleccionistas con intereses afines. |
| Foros o redes sociales generalistas (Reddit, Instagram) con cuenta personal | Expone la identidad real del coleccionista, justo lo que RC-01 y el problema de fondo buscan evitar. |
| No hacer nada / no exponer en absoluto | Es lo que ocurre hoy: cero riesgo de exposición, pero también cero visibilidad y cero conexión con otros coleccionistas — confirma el problema, no lo resuelve. |

## 4. Evidencia

| # | Dato | Fuente | Fecha |
|---|------|--------|-------|
| E1 | Tamaño economía secundaria LEGO: $705M histórico, $140M solo en H1 2024 | WILCO Toys | 2024 |
| E2 | Apreciación anual de sets retirados: 11-15%/año, retorno superior a oro/acciones en 2ª mano | WILCO Toys / underpriced.app / Vox | 2024 / 2019 |
| E3 | LEGO en el top-10 de retail más robado (junto a denim, Apple) | CNN Business | 29-jun-2024 |
| E4 | Robo documentado: $300.000 en sets robados en 4 casas | LA Times | 10-abr-2024 |
| E5 | Robo a tienda especializada Bricks & Minifigs: >$100.000 | NY Times | 14-abr-2025 |
| E6 | Crecimiento del segmento kidult/AFOL: 23,4%→28% de ventas de juguetes (2019-2022), mercado €4,6B en 5 países | Fortune | 2024 |

Observaciones cualitativas:
> "The police blamed me, said I left my door unlocked, which wasn't true... It's been many
> years and I still have anxiety at night." — comentario en r/videos, coleccionista
> afectado por robo (hilo sobre robo de colección LEGO de un coleccionista conocido
> públicamente por su hobby) `[PENDIENTE: permalink y fecha exacta del comentario — sin dato, no confirmado por el autor en esta sesión]`

> "People do buy and sell lego second hand over the Internet and the amount they stole
> would add up. The worst part is that it would be pretty well untraceable I think." —
> autor original del post en r/videos, 2030 votos (reconocimiento explícito del problema
> de trazabilidad) `[PENDIENTE: permalink y fecha exacta del post — sin dato, no confirmado por el autor en esta sesión]`

## 5. Hipótesis y asunciones

**Hipótesis:** Creemos que **ofrecer un museo virtual anónimo, sin red social ni desplazamiento físico**,
para **coleccionistas de LEGO como Víctor**, resultará en **que expongan colecciones que
hoy permanecen ocultas por miedo al robo o a la exposición de identidad**, porque **E3-E5
confirman que LEGO es un objetivo real y documentado de robo (top-10 de retail más robado,
casos de $100K-$300K), y el anonimato elimina ese riesgo percibido sin exigir
desplazamiento físico ni redes sociales genéricas**.

| # | Asunción | ¿Arriesgada? | Cómo la ponemos a prueba en esta etapa |
|---|----------|:---:|----------------------------------------|
| A1 | El anonimato real (sin EXIF/GPS, sin foto de perfil personal, sin datos de contacto obligatorios) es suficiente para que colecciones que hoy no se exponen, se expongan. | | Verificable directamente con el MVP: RC-01 implementado como requisito técnico, medido por adopción (usuarios registrados, vitrinas publicadas). |
| A2 | Existe demanda real de un espacio dedicado a exhibir colecciones LEGO — no de un marketplace ni de una red social genérica. | **Sí — la más arriesgada** | Difundiendo el enlace del MVP en comunidades AFOL reales y midiendo si terceros (más allá de Víctor) crean y comparten vitrinas y generan visitas en el plazo de 3 meses (Go/No-Go §7). Si no hay tracción de terceros, la demanda no existe con independencia de cuán bien resuelto esté el anonimato (A1). |
| A3 | El acceso sin fricción (sin registro obligatorio para ver una vitrina pública, login mínimo solo para publicar) es necesario para alcanzar el objetivo de 1.500 visitas. | | Medible con el contador de visitas frente al de usuarios registrados: si las visitas se quedan muy por debajo del objetivo pese a un buen número de vitrinas publicadas, la fricción de acceso es sospechosa antes que la demanda (A2). |

**Asunción más arriesgada:** A2 — si no existe demanda real de un espacio de exhibición
dedicado (más allá del propio Víctor), el resto de asunciones y todo el trabajo de
anonimato y acceso sin fricción no tiene a quién servir.

## 6. Alcance v1

Lo mínimo que un usuario debe poder hacer para que la hipótesis sea comprobable.

| # | Capacidad | must / should | Sirve a |
|---|-----------|:---:|---------|
| C1 | Crear una vitrina virtual con catalogación básica del set mediante un formulario: nombre del set (obligatorio); fecha de lanzamiento, código identificador, número de piezas y temática (Star Wars, Harry Potter, El Señor de los Anillos, etc.) como campos opcionales que mejoran la categorización y el descubrimiento. | must | A1, A2 |
| C2 | Subir fotos de piezas/sets con limpieza automática de metadata EXIF/GPS antes de publicarlas. | must | A1 (RC-01) |
| C3 | Publicar la vitrina mediante un enlace, eligiendo nivel de visibilidad: pública, privada sin acceso de nadie, o privada con enlace de invitación. | must | A1, A3 |
| C4 | Acceder y gestionar la vitrina propia mediante registro/login mínimo, sin exigir datos de contacto ni foto de perfil personal. | must | A1 (RC-01) |
| C5 | Reportar contenido inapropiado sin romper el anonimato de quien reporta ni de quien es reportado. | must | RC-03 |
| C6 | Vista resumen del perfil del coleccionista: número de sets, temática predominante y datos básicos agregados, visibles de un vistazo. | must | A2, JTBD (conectar con personas de intereses afines) |
| C7 | Zona "Explorar": descubrir vitrinas mediante filtros por temática y, opcionalmente, coincidencia con intereses guardados por el usuario. | **must** *(promovido desde should — addendum spec v0.3, 2026-07-28)* | A2 (la más arriesgada) — un MVP cuyo alcance excluye la única capacidad que sirve a su asunción más arriesgada no puede validarla (hallazgo F4 del addendum, ver ADR-008). Se elimina el recorte por proporcionalidad que justificaba *should*: el alcance real que dispara ese riesgo (intereses guardados) queda fuera en `/specify` a favor de un motor de filtros/orden/búsqueda simple (ver spec R-08), que sí cabe en el presupuesto de la etapa. |

`[PENDIENTE: validar C1-C6 contra la asunción A2 en /specify — si tras el diseño técnico alguna capacidad no sirve claramente a la hipótesis, se cuestiona o se mueve a exclusiones, constitution B.5]`

## 7. Go / No-Go

| Métrica | Baseline | Target | Plazo | Cómo se mide | Instrumentación |
|---------|:---:|:---:|:---:|--------------|-----------------|
| Vitrinas publicadas | 0 | 50 | 3 meses desde el prototipo | Conteo directo de filas en la BD (Supabase) | `COUNT(*) FROM vitrinas WHERE estado='publicada'` — incluye **todas** las visibilidades (pública, privada sin acceso, privada con enlace); confirmado por el autor que las privadas también cuentan para esta métrica. |
| Visitas totales | 0 | 1.500 | 3 meses | Analítica ligera (Plausible) o contador propio | Contador de visitas sin filtrar por visibilidad — toda visita cuenta, incluidas las de vitrinas privadas por invitación (confirmado por el autor: "todas cuentan"). |
| Enlaces compartidos | 0 | 100 | 3 meses | Contador incremental al generarse/visitarse el enlace | Dos eventos distintos por enlace: `enlace_generado` (al crearse) y `enlace_visitado` (primera apertura externa), para poder derivar la tasa de apertura (% de enlaces generados que reciben al menos una visita) como métrica de calidad, sin target propio en este Go/No-Go. |
| Usuarios registrados | 0 | 100 | 3 meses | Conteo directo de filas en tabla de usuarios (Supabase Auth) | `COUNT(*) FROM auth.users` (Supabase Auth). |

**Criterio de revisión de hipótesis:** si a los 3 meses no se alcanza el 40% de los targets
(20 vitrinas o 40 usuarios), revisar la hipótesis de valor antes de invertir en Fase 3.

**Fecha de revisión:** 2026-10-27 — copiada a `docs/00-proyecto/project.md` (constitution H.33).
`[PENDIENTE: recalcular si el prototipo funcional real de producto difiere de esta fecha ancla, ver nota en project.md]`

## 8. Requisitos críticos de valor

| ID | Requisito (que, si falla, destruye la propuesta de valor) | Evidencia origen |
|----|-----------------------------------------------------------|------------------|
| RC-01 | **Anonimato real** — el sistema no debe revelar ni permitir inferir identidad ni ubicación del coleccionista: sin metadata EXIF/GPS en fotos, sin exigir foto de perfil personal ni dirección (avatar genérico opcional en su lugar), sin datos de contacto obligatorios. | PRD 1.1, 1.3 (Penumbras: robos y trazabilidad); constitution A.2 (caso de referencia explícito a no repetir) |
| RC-02 | **Sin mensajería ni contacto directo 1:1** entre usuarios, en ningún flujo. No excluye interacción agregada/pública (comentarios, votos, gamificación) — ver Exclusiones 5-6 para el alcance de v1. | PRD 3.6 Exclusión 4; Discovery hallazgo 4 (rechazo a contacto directo tras mostrar piezas valiosas, confirmado en 2/3 sesiones) |
| RC-03 | **Moderación de contenido inapropiado sin romper el anonimato** — no puede depender de identificar o contactar directamente al infractor. Candidatos para /specify (a decidir, no cerrado): (a) clasificación automática de contenido antes de publicar; (b) cola de revisión solo-admin (el propio autor en v1) sobre contenido reportado; (c) reporte comunitario con rate-limiting anti-abuso. Restricción explícita en cualquier opción: **prohibido correlacionar un reporte con IP/historial de sesión del reportante hacia el reportado**, y el admin nunca expone la identidad de quien reporta a quien es reportado. | PRD FAQ 3.5.3 — `[PENDIENTE: elegir mecanismo final entre los candidatos en /specify — el autor confirmó en esta sesión dejarlo abierto a propósito]` |
| RC-04 | **Privacidad y seguridad conforme a GDPR** (base de usuarios inicial en UE): derecho de borrado de cuenta/datos, minimización de datos personales, sin venta de datos a terceros en v1. Sub-requisitos: retención — borrado inmediato de datos personales al solicitarlo, máximo 30 días para procesos técnicos derivados como backups (confirmado por el autor en esta sesión como el mínimo viable GDPR); base legal de tratamiento: consentimiento explícito del usuario al registrarse (Art. 6.1.a GDPR); consentimiento/cookies: banner opt-in antes de cargar cualquier script de analítica; herramienta de analítica (Plausible): el autor autorizó en esta sesión proceder con ella (es conocida por ser cookie-less y no usar identificadores personales persistentes) — la verificación técnica formal contra su política de privacidad vigente queda como paso de `/specify` antes de integrarla en código; no se marca aquí como "verificada" porque esa comprobación no se ha ejecutado todavía (constitution A.3). Secretos en variables de entorno y rate limiting ya son baseline del framework (constitution D.17), reforzados aquí por ser núcleo de la propuesta de valor ("anónimo, seguro y privado"). | Aportado por el autor en esta sesión; constitution D.17 |

## 9. Exclusiones (v1)

1. Sin marketplace de compra/venta — foco en exhibición, no en e-commerce/logística.
2. Sin verificación de autenticidad ni tasación de piezas — no es un servicio de valoración.
3. Sin app móvil nativa — solo web, para validar rápido el concepto.
4. Sin mensajería/chat directo entre usuarios — preserva el anonimato (RC-02); un canal directo sería vector de exposición.
5. Sin comentarios, votos/recomendaciones ni gamificación con rankings temáticos — decidido en esta sesión: nice-to-have de v2, mantiene v1 mínimo y validable rápido (coherente con el PRD heredado, que ya ponía "comunidades temáticas" en fase posterior).
6. Sin sistema de subastas/pujas — futurible; requiere análisis legal propio de qué datos se pueden proveer, fuera de alcance hasta que se aborde.
7. Sin reconocimiento automático de sets por imagen (IA que identifique el set y autocomplete sus datos) — futurible explícito de fase post-MVP, confirmado por el autor en esta sesión; en v1 la carga de datos del set es manual mediante el formulario básico (ver §6 Alcance v1, C1).

## Quality Gate

**Fecha:** 2026-07-27 · **Revisor:** sub-agente ciego (sin acceso a conversacion previa ni autoevaluacion) · **Ronda:** 1/1 (default tier Ligero)

**Veredicto:** CONDICIONAL · **Global: 7.0/10** (promedio simple D1=6.5, D2=8.0, D3=6.5) — supera el umbral de avance de tier Ligero (>=6.5, constitution B.5).

**Hallazgos (orden de severidad) y resolucion:**
1. [Alto] RC-03 sin mecanismo candidato → **Corregido**: se anadieron 3 opciones candidatas y una restriccion explicita (no correlacionar reportes con IP/sesion).
2. [Medio-alto] "Por que ahora" respondia a la motivacion del autor, no a la urgencia del problema → **Corregido**: reescrito liderando con E3-E6 (urgencia del lado del problema), la motivacion del autor se mantiene como contexto aparte.
3. [Medio] "Validado con 1 entrevista" no trazable → **Corregido**: referenciado a PRD heredado 3.1 (Discovery: 2 entrevistas externas + 1 autoentrevista, confianza Media).
4. [Medio] RC-04 (GDPR) incompleto → **Corregido**: anadidos retencion (propuesta con PENDIENTE de plazo exacto), base legal, mecanismo de consentimiento/cookies, y confirmacion pendiente sobre Plausible.
5. [Bajo-medio] Citas de Reddit sin permalink/fecha → **Marcado explicitamente** `[PENDIENTE]` en el propio texto (no se fabrico un permalink).

**Decision del autor:** corregir los 5 hallazgos en esta misma ronda (constitution B.5: 1 revision por defecto, sin perseguir el PASS). No se solicitaron rondas adicionales. Avanza a `/specify`.

> **Nota de migración (2026-07-27):** este veredicto se registró bajo la clasificación "Tier Ligero" del framework v0.1.1, con banda de avance de media simple ≥6,5. Reevaluado retroactivamente contra el umbral de la etapa MVP en constitution C.14 (v1.1: media ≥6,5 **y suelo por dimensión ≥6,0**), las tres dimensiones (6,5 / 8,0 / 6,5) superan el suelo, por lo que el veredicto se mantiene sin necesidad de repetir el gate. No se re-ejecuta el quality gate en esta sesión de migración.

## Historial

| Versión | Fecha | Cambio | ADR |
|:---:|:---:|--------|-----|
| 0.1 | 2026-07-27 | Versión inicial | — |
| 0.2 | 2026-07-27 | Migración aditiva a plantilla v1.1: añadidas §2 Usuarios, §3 Alternativas hoy, §6 Alcance v1 (contrato de `/specify`, antes inexistente), asunciones descompuestas en §5 con A2 marcada como más arriesgada, y columna Instrumentación en §7. Resueltos 2 de 4 `[PENDIENTE]` abiertos (retención RC-04, autorización de Plausible); permalinks de Reddit y mecanismo final de RC-03 siguen `[PENDIENTE]` a petición explícita del autor. No se re-ejecutó el quality gate (nota de migración añadida en su lugar). | — |
| 0.3 | 2026-07-28 | Corrección de alcance vía addendum spec v0.3 (`/amend`): C7/Explorar promovido de *should* a *must* — hallazgo F4 detectó que el MVP, tal como estaba acotado, excluía la única capacidad (C7) que sirve a A2, la asunción más arriesgada, haciendo el MVP incapaz de validar su propia hipótesis. No se re-ejecuta el quality gate del PRD-lite (constitution: cambio de alcance con origen documentado, no una revisión de fondo del artefacto); sí se ejecuta sobre la spec, que es donde recae el detalle nuevo (R-10 a R-16). | ADR-008 |



---

## ADDENDUM FASE 3: Ampliación del MVP (Gamificación y Museo)

**Fecha:** 2026-08-05
**Contexto:** Tras un brainstorming de mejora de UI/UX, el autor decide incluir en el MVP las siguientes funcionalidades para aportar valor a coleccionistas y visitantes. Se excluyen expresamente la Certificación de Autenticidad y la Estimación de Valor Monetario.

### Nuevas Capacidades Incluidas en el MVP:
1. **Sistema de "Kudos" o "Bricks" (Me Gusta):** Interacción social anónima. Los visitantes dejan "Bricks" en las vitrinas. Los coleccionistas ven un contador acumulado en su dashboard privado y perfil público.
2. **Insignias (Badges) para Coleccionistas:** Logros automáticos (ej. *Classic Space Master*) asociados al alias para gamificar la subida de sets y fomentar la retención.
3. **"Bounties" o Peticiones de la Comunidad:** Lista de sets legendarios o muy buscados ("Wanted") que la comunidad quiere ver. Los coleccionistas anónimos pueden reclamarlos subiéndolos al museo.
4. **Modo "Visita Guiada" (Modo Inmersivo):** Vista a pantalla completa, inmersiva y sin distracciones, para navegar por las fotos de una vitrina o galería temática como si fuera un documental de museo.
5. **Exposiciones Temporales (Curaduría):** Secciones temáticas destacadas en portada (ej. "Historia de LEGO Technic") que agrupan vitrinas de diferentes coleccionistas.
6. **Dashboard de Analíticas (Insights):** Ampliación del panel privado (`/dashboard`) donde el coleccionista visualiza sus visitas, "Bricks" totales y métricas de impacto de su colección.

Estas seis características pasan a formar parte obligatoria del alcance (Scope) del **MVP**. El modelo de datos, rutas y diseño UI deberán ser actualizados en iteraciones subsiguientes para darles soporte.

