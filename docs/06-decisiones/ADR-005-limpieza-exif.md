---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-005 — Limpieza de metadatos EXIF/GPS (RC-01)

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
RC-01 es el requisito crítico central de la propuesta de valor (anonimato real). Constitution
A.2 cita explícitamente el caso EXIF/GPS diluido en narrativa como el error a no repetir: debe
bajar a requisito técnico verificable, no depender de que el cliente lo implemente bien.

## Decisión
La limpieza de metadatos EXIF/GPS se ejecuta en una Edge Function en el momento de la subida,
antes de persistir el archivo en Supabase Storage. La imagen original con metadata nunca se
persiste en ningún almacenamiento, ni siquiera temporalmente más allá de la ejecución de la
función.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Limpieza en el cliente (JS en el navegador) | No verificable ni garantizable server-side: un cliente modificado, un bug de frontend o una llamada directa a la API dejaría pasar metadata sin que el sistema lo impida. |

## Consecuencias
Toda subida pasa obligatoriamente por la Edge Function; no existe ruta directa de cliente a
Storage para archivos de imagen. Esto es lo que hace a RC-01 verificable con un test
automatizado (subir imagen con GPS, comprobar su ausencia en el archivo servido).
