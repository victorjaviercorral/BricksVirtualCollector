# Proyecto — Lego Virtual Museum

**Repo de codigo:** https://github.com/victorjaviercorral/LegoVirtualMuseum (rama `main`, sincronizada localmente)
**Framework:** Spec VJC Framework v0.1.1
**Fecha PRD heredado:** 2026-07-26 · **Fecha `/spec-init`:** 2026-07-27

## Tier: Medio (reclasificado en `/specify`, 2026-07-27 — ver historial abajo)

**Justificacion actual** (constitution B.7): v1 sera una **beta controlada** — el autor invita
a un grupo curado de personas interesadas, con cuenta propia (autenticacion real) y subiendo
sus propias fotos/colecciones. Son usuarios externos reales con datos propios desde v1,
aunque el acceso este invitado/controlado y no sea publico abierto. La constitucion no
distingue "controlado" de "publico" — el criterio es la existencia de usuarios externos
reales con datos propios, que aqui se cumple. Efecto practico: el quality gate de spec en
adelante exige **>= 7** (no >= 6.5). El research/discovery ya existe en el PRD heredado
(3 sesiones Mom Test), por lo que el requisito adicional de "research ligero" de tier Medio
ya esta cubierto retroactivamente.

**Historial de clasificacion:**
1. `/spec-init` (2026-07-26): clasificado **Ligero** — triaje asumia "Fase 1 = uso propio de
   Victor, sin usuarios externos" (PRD heredado 2.4).
2. `/specify` (2026-07-27): al confirmar que las metricas Go/No-Go del PRD (50 vitrinas, 100
   usuarios en 3 meses) exigen multi-usuario desde v1, y que v1 sera una beta con testers
   reales subiendo sus propios datos, se reclasifica a **Medio**. Decision explicita del
   usuario tras dos rondas de confirmacion.

## Insumo heredado

PRD completo ya existente en `C:\Users\victo\OneDrive\Escritorio\Agentic Product Framework Development\PRD.md`
— **PRD LegoVault v5, CONDICIONAL 6.7/10** (revisor independiente #3). Incluye:
- Evidencia cuantitativa y cualitativa del problema (mercado 2a mano LEGO, robos documentados, testimonios).
- 3 sesiones de discovery (Mom Test): 2 externas reales + 1 auto-entrevista.
- Exclusiones v1 definidas: sin marketplace, sin verificacion de autenticidad, sin app nativa, sin mensajeria directa.
- Must-have v1: vitrina virtual publicable por enlace, anonimato, acceso sin friccion, catalogacion basica.

Este PRD es la base real para `/prd-lite` — no se reconstruye desde cero (constitution A.1/A.2).

## Stack previsto

**Next.js (React) + Supabase (Postgres/Auth/Storage/RLS) + Netlify (hosting).** Confirmado en
`/specify`, 2026-07-27 — ver [[06-decisiones/ADR-001-stack-tecnico]].

## Criterios de parada de gates (tier Medio)

- 1 (una) revision de quality gate por defecto (constitution B.5).
- Rondas adicionales: maximo 2, solo si el usuario las solicita explicitamente.
- Banda de avance: PASS o CONDICIONAL con puntuacion **>= 7.0** permite avanzar (tier Medio).
  El PRD-lite ya fue aprobado bajo el criterio Ligero (>=6.5, obtuvo 7.0) antes de la
  reclasificacion; no se re-abre. De aqui en adelante (spec y siguientes) aplica >=7.0.
- Revision ciega en sub-agente fresco sin acceso a la autoevaluacion del autor (constitution B.6).

## Identidad de diseno

Ver `docs/03-diseno/design-identity.md`. Confirmada tras 4 iteraciones (v1 neubrutalismo →
v2 archivo/museo → v3 fusion → v4 sandbox interactivo, **confirmada**). Mockup preservado en
`docs/03-diseno/identity-mockup-v4.html`.

## Siguiente paso

`/prd-lite` (usando el PRD heredado como insumo principal, no como punto de partida en blanco).
