# Proyecto — Lego Virtual Museum

**Repo de codigo:** https://github.com/victorjaviercorral/LegoVirtualMuseum (rama `main`, sincronizada localmente)
**Framework:** Spec VJC Framework v0.1.1
**Fecha PRD heredado:** 2026-07-26 · **Fecha `/spec-init`:** 2026-07-27

## Tier: Ligero

**Justificacion** (triaje constitution B.7, 3 preguntas):
1. Usuarios externos reales o datos personales de terceros en v1: **No** — Fase 1 es de uso propio/cerrado, confirmado por el usuario y por el PRD heredado (seccion 2.4: "Fase 1 (prototipo personal): uso propio, sin usuarios externos").
2. Mas de un stakeholder con intereses distintos: **No** — el usuario es el unico stakeholder/decisor.
3. Problema/mercado incierto o conocido de primera mano: **Conocido de primera mano** — el usuario es coleccionista LEGO Star Wars desde hace 5-6 anos (PRD 1.1).

**Nota de trazabilidad:** el `_index.md` del repo y el PRD heredado describen una vision futura (Fase 2: museo publico con comunidad anonima, usuarios externos subiendo colecciones, moderacion). Esa vision NO es el alcance de v1 y no cambia la clasificacion Ligero actual. Cuando el proyecto avance a Fase 2, este tier debe reevaluarse (probablemente sube a Medio: usuarios externos + datos de terceros).

## Insumo heredado

PRD completo ya existente en `C:\Users\victo\OneDrive\Escritorio\Agentic Product Framework Development\PRD.md`
— **PRD LegoVault v5, CONDICIONAL 6.7/10** (revisor independiente #3). Incluye:
- Evidencia cuantitativa y cualitativa del problema (mercado 2a mano LEGO, robos documentados, testimonios).
- 3 sesiones de discovery (Mom Test): 2 externas reales + 1 auto-entrevista.
- Exclusiones v1 definidas: sin marketplace, sin verificacion de autenticidad, sin app nativa, sin mensajeria directa.
- Must-have v1: vitrina virtual publicable por enlace, anonimato, acceso sin friccion, catalogacion basica.

Este PRD es la base real para `/prd-lite` — no se reconstruye desde cero (constitution A.1/A.2).

## Stack previsto

`[PENDIENTE: no confirmado aun como decision tecnica de este framework]`. El PRD heredado
menciona Supabase (tier gratuito) como backend estimado para Fase 1-2, con umbral de
migracion a Supabase Pro si se supera el tier gratuito — pendiente de confirmar en `/specify`.

## Criterios de parada de gates (tier Ligero)

- 1 (una) revision de quality gate por defecto (constitution B.5).
- Rondas adicionales: maximo 2, solo si el usuario las solicita explicitamente.
- Banda de avance: PASS o CONDICIONAL con puntuacion **>= 6.5** permite avanzar.
- Revision ciega en sub-agente fresco sin acceso a la autoevaluacion del autor (constitution B.6).

## Identidad de diseno

Ver `docs/03-diseno/design-identity.md`. Confirmada tras 4 iteraciones (v1 neubrutalismo →
v2 archivo/museo → v3 fusion → v4 sandbox interactivo, **confirmada**). Mockup preservado en
`docs/03-diseno/identity-mockup-v4.html`.

## Siguiente paso

`/prd-lite` (usando el PRD heredado como insumo principal, no como punto de partida en blanco).
