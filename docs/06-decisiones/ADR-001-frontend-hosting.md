---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-001 — Framework de frontend y hosting

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
El PRD-lite (§6 Alcance v1, §7 Go/No-Go) exige vitrinas públicas indexables (la checklist de
SEO se activa en X2) y un flujo con motion custom (drag, momentum, rubber-banding —
`design-identity.md`). Next.js + Vercel es la pareja de referencia del ecosistema para ese
perfil, sin configuración adicional.

## Decisión
Next.js (React) + Tailwind CSS como framework de frontend, desplegado en Vercel.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Vue / Nuxt | Menos ecosistema de librerías de motion ya evaluado para esta identidad visual. |
| Svelte / SvelteKit | Curva de aprendizaje adicional sin beneficio claro sobre el problema a validar. |
| Astro | Mejor ajuste para contenido estático; peor para una app con estado de usuario y autenticación. |

## Consecuencias
Acoplamiento moderado a Vercel (Next.js es portable a otros hosts con adaptador si hiciera
falta). A cambio, soporte nativo de SSR/ISR para las vitrinas públicas y despliegue sin
fricción desde el día uno (constitution G.29).
