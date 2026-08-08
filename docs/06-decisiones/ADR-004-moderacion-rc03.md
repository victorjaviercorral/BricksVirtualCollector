---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-004 — Mecanismo de moderación (RC-03)

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
RC-03 exige moderar contenido inapropiado sin poder desanonimizar a nadie. El PRD-lite dejó
3 candidatos explícitamente abiertos para decidir en `/specify`: (a) clasificación automática,
(b) cola de revisión solo-admin sobre contenido reportado, (c) reporte comunitario con
rate-limiting anti-abuso.

## Decisión
Combinar (c) + (b): reporte comunitario con rate-limiting anti-abuso, que alimenta una cola
de revisión solo-admin (el propio autor en v1). Sin clasificación automática de contenido.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Clasificación automática de contenido (a) | Desproporcionado para un MVP de 4 semanas (constitution B.6): exige entrenar/integrar un clasificador y definir su tasa de falsos positivos/negativos, sin evidencia aún de que el volumen de contenido lo justifique. |

## Consecuencias
La moderación depende de que el autor revise la cola manualmente; no escala más allá de un
único admin. Aceptable al volumen objetivo de v1 (50 vitrinas en 3 meses). Reevaluar si el
volumen crece o si se pasa a `/go-live` con más usuarios.
