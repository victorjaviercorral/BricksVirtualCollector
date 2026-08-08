---
proyecto: lego-virtual-museum
tipo: proyecto
etapa: mvp
exposicion: X2
estado: activo
version: 0.3
fecha: 2026-07-30
tags: [spec-vjc]
---

# Proyecto — Lego Virtual Museum

**Repo:** https://github.com/victorjaviercorral/LegoVirtualMuseum (rama `main`, sincronizada localmente) · **Estado:** activo
**Framework:** Spec VJC Framework v1.2.0 (actualizado desde v1.1.0 el 2026-07-30 — ver Registro de decisiones de proceso)
**Última actualización:** 2026-07-30

## Clasificación

| Eje | Valor | Justificación |
|-----|-------|---------------|
| **Etapa** | MVP | El Go/No-Go del PRD-lite (§4) exige señal de mercado real en 3 meses (50 vitrinas, 100 usuarios registrados, 1.500 visitas) — no es una validación de concepto desechable (Prototipo), es "producto real y mínimo puesto delante de alguien" (`docs/modelo.md` §1). |
| **Exposición** | X2 | Hay cuentas de usuario (Supabase Auth), contenido subido (fotos de colecciones) y datos personales — dispara X2 (`docs/modelo.md` §1). No hay dinero, menores, datos de categoría especial ni IA de cara al usuario declarados en el PRD, por lo que no se dispara X3. |

**Módulos de cumplimiento activados:** ninguno (no hay señal de pagos, menores, IA de cara al usuario ni datos de categoría especial — `docs/modelo.md` §3.3). Reevaluar en `/go-live` si esto cambia.
**Checklists activas** (según `docs/modelo.md` §3.2, columna X2): `seguridad-agentica.md` · `seguridad.md` · `performance.md` · `accesibilidad.md` · `contenido-seo.md` · `privacidad-gdpr.md` · `testing.md` (RC-XX con test automático) · `operacion.md` · textos legales publicados (privacidad + cookies + términos) · `/preflight` obligatorio antes de lanzar.

## Presupuesto

| | |
|---|---|
| Inicio | 2026-07-27 |
| Fecha límite | 2026-08-24 (propuesta: +4 semanas, presupuesto por defecto de etapa MVP, constitution B.7) — **[PENDIENTE: confirmación explícita del usuario; estirar este plazo exige decisión registrada, no deriva]** |
| Presupuesto de definición (20%) | ~4 días (constitution B.6) |
| Coste mensual de infraestructura | Supabase (tier gratuito previsto), con migración a Supabase Pro si se supera el umbral gratuito `[PENDIENTE: confirmar coste exacto en /specify]` · Alerta de facturación: sí (recomendado activarla antes de exponer a usuarios reales, dado X2) |

### Presupuesto de preguntas (constitution B.6-bis)

Máximo **8 preguntas** en todo el flujo de definición. Agotado el cupo, lo pendiente se convierte en asunción marcada `[ASUMIDO: …]` o en `[PENDIENTE]` si es un dato. Tabla incorporada al migrar a framework v1.2.0 (2026-07-30); los comandos anteriores a esa versión (`/spec-init`, `/prd-lite`) no llevaron cuenta formal — se registran como `[PENDIENTE: no cronometrado]` en vez de asumir un número.

| Comando | Cupo | Gastadas | Notas |
|---------|:---:|:---:|-------|
| `/spec-init` | 4 | `[PENDIENTE: no cronometrado, previo a v1.2.0]` | Ejecutado bajo v0.1.1/v1.1.0, antes de esta tabla |
| `/prd-lite` | 2 | `[PENDIENTE: no cronometrado, previo a v1.2.0]` | Ejecutado bajo v1.1.0, antes de esta tabla |
| `/expand` | 2 | 0 | Ver `requirements.md` §7 — ningún hueco requirió pregunta, todos resueltos como `AS-nn` de bajo riesgo o ya cerrados en artefactos existentes |
| `/specify` | 0 | 0 | — |
| **Acumulado** | **8** | **0 confirmadas** | |

<Un comando puede ceder cupo a otro; ninguno puede ampliar el total. Una tanda de confirmación sobre un bloque ya redactado no consume cupo.>

## Entorno

| | |
|---|---|
| Desarrollo | Windows (confirmado por el autor) · runtime Node.js `[PENDIENTE: fijar versión exacta en /plan]` |
| Despliegue | Vercel (ADR-001) · región por defecto de Vercel `[PENDIENTE: confirmar región concreta al configurar el proyecto]` |
| Dominio | Sin dominio propio en esta etapa: subdominio gratuito `*.vercel.app` (ADR-007). Consolidación bajo `victorjaviercorral.com` diferida a una eventual decisión de `/go-live`, independiente de esta. |

## Stack previsto
Frontend: Next.js (React) + Tailwind CSS (ADR-001), desplegado en Vercel.
Backend: Supabase — Postgres + Auth + Storage, con Supabase Edge Functions para lógica de servidor (ADR-002).
Rate limiting: Upstash Redis, tier gratuito (ADR-003).
Testing: Vitest + Playwright (ADR-006).
Decisiones completas y alternativas descartadas en `docs/06-decisiones/ADR-001` a `ADR-007`.

## Gates

Umbrales según constitution C.14 para etapa MVP:
- Media mínima: 6,5 · Suelo por dimensión: 6,0
- Rondas por defecto: 1

| Artefacto | Gate | Fecha | Veredicto |
|-----------|:---:|:---:|-----------|
| PRD-lite | obligatorio (MVP) | 2026-07-27 | CONDICIONAL · Global 7,0/10 (D1=6,5, D2=8,0, D3=6,5). Registrado bajo el criterio de avance anterior (tier Ligero, media simple ≥6,5); reevaluado retroactivamente contra el suelo por dimensión de C.14 (MVP, suelo 6,0): todas las dimensiones lo superan, se mantiene el veredicto sin necesidad de re-gate. |
| requirements.md | sin gate propio: se revisa dentro del de la spec | 2026-07-30 | v0.1 generado retroactivamente sobre spec.md v0.3 (framework v1.2.0). Ver constitution C.15/A.2. |
| Spec | obligatorio (MVP, núcleo) | 2026-07-27 | CONDICIONAL · Global 6,8/10 (D1=6,5, D2=6,5, D3=7,5) — supera media (6,5) y suelo (6,0). 5 hallazgos, los 5 corregidos en ronda 1/1. Copia en `docs/02-spec/gates/gate-spec-2026-07-27.md`. **Spec v0.3 (addendum 2026-07-28) aún no tiene gate propio** — pendiente, ver spec.md §Quality Gate. |

## Hitos

| Hito | Fecha prevista | Fecha real |
|------|:---:|:---:|
| Definición cerrada (PRD completo + spec núcleo + gate) | `[PENDIENTE: se fija al cerrar /specify]` | |
| Esqueleto desplegado | `[PENDIENTE]` | |
| Lanzamiento (preflight GO) | `[PENDIENTE]` | |
| **Revisión Go/No-Go** | 2026-10-27 (provisional: 3 meses desde 2026-07-27, per PRD §4 "3 meses desde el prototipo") — `[PENDIENTE: recalcular cuando exista el prototipo funcional real; el mockup de identidad visual v4 no es el prototipo de producto que el PRD usa como ancla de esta fecha]` | |

## Registro de decisiones de proceso
<Cambios de etapa, cambios de exposición, ampliaciones de presupuesto: fecha, qué cambió y por qué. Constitution B.7 y B.10 exigen que estas decisiones sean explícitas, no derivas.>

| Fecha | Decisión | Razón |
|:---:|----------|-------|
| 2026-07-27 | Reclasificación de "Tier Ligero" (framework v0.1.1) a **MVP · X2** (framework v1.1.0) | Contradicción detectada entre `project.md` (Tier Ligero, justificado por "sin usuarios externos ni datos personales en Fase 1") y el propio PRD-lite: el Go/No-Go (§4) exige 100 usuarios registrados con Supabase Auth, 50 vitrinas publicadas y 1.500 visitas — señal de mercado real, no de boceto/prototipo cerrado — y RC-04 exige cumplimiento GDPR, lo que presupone datos personales de usuarios reales (X2). El modelo de dos ejes de v1.1 hace esta contradicción explícita: la etapa mide cuánta definición merece el trabajo (MVP, por el objetivo de señal de mercado), la exposición mide a qué te expones con independencia de la etapa (X2, por los datos personales), y ambos ejes venían resueltos con un único criterio insuficiente ("tier"). |
| 2026-07-28 | Addendum spec v0.3 vía `/amend`: C7/Explorar promovido de *should* a *must* en PRD-lite y spec; añadidos R-10 a R-16 (dashboard, mis vitrinas, detalle de set, perfil público, ajustes de cuenta, cola de moderación, estados transversales); prototipo extendido de 5 a 12 pantallas | Validación del prototipo v0.1 (diagnóstico externo F1-F4) encontró que la spec tenía un requisito *must* sin pantalla (R-07), dos flujos ya especificados sin pantalla (moderación, borrado de cuenta), un modelo de datos más rico que los flujos que exponía (N fotos/set, N vitrinas/usuario), y que el alcance definido excluía C7 — la única capacidad que sirve a A2, la asunción más arriesgada del PRD. Un MVP que no puede probar su propia hipótesis no es publicable para recoger la señal de mercado que el Go/No-Go exige. Detalle en ADR-008. |
| 2026-07-30 | Actualización de framework declarado de v1.1.0 a **v1.2.0** (constitution B.10); ejecución retroactiva de `/expand` produciendo `docs/02-spec/requirements.md` v0.1 | v1.1.0 no incluía el comando `/expand` (introducido en 1.2.0) — por eso `spec.md` v0.3 tiene R-01 a R-16 redactados directamente. Al reinstalar/recargar el plugin se detectó el desfase de versión y se decidió, en vez de arrastrarlo en silencio, declararlo explícitamente y cerrar el hueco: `requirements.md` reescribe R-01 a R-16 en EARS estricto (mismo contenido/origen, ver AS-01) y añade R-17 a R-72 aplicando las 7 lentes de `docs/modelo.md` §3.4 sobre las 7 capacidades *must*. 3 requisitos (R-22, R-56, R-70) se clasifican v2 por ser de bajo riesgo (sin pérdida de datos ni brecha de permisos/legal) frente al presupuesto de 4 semanas ya ajustado por ADR-008. |

## Métricas del framework (constitution H.34)
| Fase | Tiempo real | Rondas de gate | Notas |
|------|:---:|:---:|-------|
| PRD-lite | `[PENDIENTE: no cronometrado]` | 1/1 | Gate único por defecto, sin rondas adicionales solicitadas |

**Gate escapes:** ninguno registrado aún (nada desplegado a producción todavía).
