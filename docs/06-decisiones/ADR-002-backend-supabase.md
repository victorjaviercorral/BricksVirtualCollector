---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-002 — Backend y almacenamiento

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
El PRD-lite ya asumía Supabase como backend estimado (tier gratuito, con umbral de migración
a Pro). La lógica de servidor que exige RC-01 (limpieza EXIF/GPS) y la checklist de seguridad
(rate limiting, moderación) necesita ejecutarse en un entorno de confianza, no en el cliente.

## Decisión
Supabase (Postgres + Auth + Storage) como backend único. La lógica de servidor (limpieza
EXIF/GPS, rate limiting, moderación) se implementa en Supabase Edge Functions (Deno), sin
sumar un backend independiente.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Backend propio (Node/Express) | Más superficie a mantener sin beneficio para el alcance v1. |
| Firebase | El PRD ya asumía Supabase; su modelo relacional (Postgres) encaja mejor con vitrinas/sets/piezas que un modelo documental. |

## Consecuencias
Todo el rate limiting y la lógica de negocio pasa por Edge Functions. Vigilar el límite de
tiempo de ejecución de las Edge Functions si en el futuro se añade procesado de imagen más
pesado que la limpieza de metadatos.
