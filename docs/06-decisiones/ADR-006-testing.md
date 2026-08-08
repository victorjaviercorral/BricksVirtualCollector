---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-006 — Estrategia de testing

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
`checklists/testing.md` exige declarar en la spec qué capas se prueban y con qué
herramientas, no improvisarlo. El proyecto ya usa Next.js (ADR-001).

## Decisión
Vitest para tests unitarios/integración ligera, Playwright para tests end-to-end, incluido
un test del flujo principal reutilizable como comprobación de humo tras cada despliegue.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Jest | Vitest es más rápido y de integración más directa con el ecosistema Vite/Next actual. |
| Cypress | Playwright cubre mejor múltiples navegadores y es el estándar actual del ecosistema Next.js. |

## Consecuencias
Dos herramientas a mantener. Cobertura enfocada en RC-XX y rutas críticas (autenticación,
subida con limpieza EXIF, reporte de contenido), no en un porcentaje global de cobertura
(checklist de testing, ítem 2).
