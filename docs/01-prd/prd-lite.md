# PRD-lite — Lego Virtual Museum

**Tier:** Ligero · **Fecha:** 2026-07-27 · **Version:** 0.1

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

## 2. Evidencia

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
> públicamente por su hobby) `[PENDIENTE: permalink y fecha exacta del comentario]`

> "People do buy and sell lego second hand over the Internet and the amount they stole
> would add up. The worst part is that it would be pretty well untraceable I think." —
> autor original del post en r/videos, 2030 votos (reconocimiento explícito del problema
> de trazabilidad) `[PENDIENTE: permalink y fecha exacta del post]`

## 3. Hipótesis

Creemos que **ofrecer un museo virtual anónimo, sin red social ni desplazamiento físico**,
para **coleccionistas de LEGO como Víctor**, resultará en **que expongan colecciones que
hoy permanecen ocultas por miedo al robo o a la exposición de identidad**, porque **E3-E5
confirman que LEGO es un objetivo real y documentado de robo (top-10 de retail más robado,
casos de $100K-$300K), y el anonimato elimina ese riesgo percibido sin exigir
desplazamiento físico ni redes sociales genéricas**.

## 4. Go / No-Go

| Métrica | Baseline | Target | Plazo | Cómo medir |
|---------|----------|--------|-------|------------|
| Vitrinas publicadas | 0 | 50 | 3 meses desde el prototipo | Conteo directo de filas en la BD (Supabase) |
| Visitas totales | 0 | 1.500 | 3 meses | Analítica ligera (Plausible) o contador propio |
| Enlaces compartidos | 0 | 100 | 3 meses | Contador incremental al generarse/visitarse el enlace |
| Usuarios registrados | 0 | 100 | 3 meses | Conteo directo de filas en tabla de usuarios (Supabase Auth) |

**Criterio de revisión de hipótesis:** si a los 3 meses no se alcanza el 40% de los targets
(20 vitrinas o 40 usuarios), revisar la hipótesis de valor antes de invertir en Fase 3.

## 5. Requisitos críticos de valor

| ID | Requisito (que, si falla, destruye la propuesta de valor) | Evidencia origen |
|----|-----------------------------------------------------------|------------------|
| RC-01 | **Anonimato real** — el sistema no debe revelar ni permitir inferir identidad ni ubicación del coleccionista: sin metadata EXIF/GPS en fotos, sin exigir foto de perfil personal ni dirección (avatar genérico opcional en su lugar), sin datos de contacto obligatorios. | PRD 1.1, 1.3 (Penumbras: robos y trazabilidad); constitution A.2 (caso de referencia explícito a no repetir) |
| RC-02 | **Sin mensajería ni contacto directo 1:1** entre usuarios, en ningún flujo. No excluye interacción agregada/pública (comentarios, votos, gamificación) — ver Exclusiones 5-6 para el alcance de v1. | PRD 3.6 Exclusión 4; Discovery hallazgo 4 (rechazo a contacto directo tras mostrar piezas valiosas, confirmado en 2/3 sesiones) |
| RC-03 | **Moderación de contenido inapropiado sin romper el anonimato** — no puede depender de identificar o contactar directamente al infractor. Candidatos para /specify (a decidir, no cerrado): (a) clasificación automática de contenido antes de publicar; (b) cola de revisión solo-admin (el propio autor en v1) sobre contenido reportado; (c) reporte comunitario con rate-limiting anti-abuso. Restricción explícita en cualquier opción: **prohibido correlacionar un reporte con IP/historial de sesión del reportante hacia el reportado**, y el admin nunca expone la identidad de quien reporta a quien es reportado. | PRD FAQ 3.5.3 — `[PENDIENTE: elegir mecanismo final entre los candidatos en /specify]` |
| RC-04 | **Privacidad y seguridad conforme a GDPR** (base de usuarios inicial en UE): derecho de borrado de cuenta/datos, minimización de datos personales, sin venta de datos a terceros en v1. Sub-requisitos: retención `[PENDIENTE: definir plazo — propuesta de partida: borrado inmediato de datos personales al solicitarlo, maximo 30 dias para procesos tecnicos derivados como backups]`; base legal de tratamiento: consentimiento explícito del usuario al registrarse (Art. 6.1.a GDPR); consentimiento/cookies: banner opt-in antes de cargar cualquier script de analítica; herramienta de analítica (Plausible) es conocida por ser cookie-less y no usar identificadores personales persistentes, pero `[PENDIENTE: confirmar contra su politica de privacidad vigente en /specify antes de integrarla]`. Secretos en variables de entorno y rate limiting ya son baseline del framework (constitution C.8), reforzados aquí por ser núcleo de la propuesta de valor ("anónimo, seguro y privado"). | Aportado por el autor en esta sesión; constitution C.8 |

## 6. Exclusiones (v1)

1. Sin marketplace de compra/venta — foco en exhibición, no en e-commerce/logística.
2. Sin verificación de autenticidad ni tasación de piezas — no es un servicio de valoración.
3. Sin app móvil nativa — solo web, para validar rápido el concepto.
4. Sin mensajería/chat directo entre usuarios — preserva el anonimato (RC-02); un canal directo sería vector de exposición.
5. Sin comentarios, votos/recomendaciones ni gamificación con rankings temáticos — decidido en esta sesión: nice-to-have de v2, mantiene v1 mínimo y validable rápido (coherente con el PRD heredado, que ya ponía "comunidades temáticas" en fase posterior).
6. Sin sistema de subastas/pujas — futurible; requiere análisis legal propio de qué datos se pueden proveer, fuera de alcance hasta que se aborde.

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
