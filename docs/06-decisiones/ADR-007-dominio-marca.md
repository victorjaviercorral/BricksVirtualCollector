---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-007 — Dominio y consolidación de marca

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
El autor tiene otro proyecto (VJC Tools) desplegado en Netlify bajo su dominio propio
`victorjaviercorral.com`, y planteó si eso debía inclinar la balanza hacia Netlify en vez de
Vercel para este proyecto, por consolidar la imagen de marca en un mismo sitio. Confirmó
también que no comprará un dominio propio para este proyecto hasta validar el MVP.

## Decisión
Mantener Vercel como hosting de este proyecto (ADR-001) y usar el subdominio gratuito que
asigna (`*.vercel.app`) mientras no haya `/go-live`. La elección de proveedor de hosting y la
consolidación de marca/dominio se tratan como decisiones independientes: un dominio propio
puede apuntar por DNS a un despliegue en Vercel igual que a uno en Netlify.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Netlify, por consistencia de marca con VJC Tools | El ajuste técnico con Next.js (ADR-001) pesa más que la conveniencia de un único dashboard; esa conveniencia se puede lograr después, sin cambiar de proveedor, si se decide consolidar dominio en `/go-live`. |

## Consecuencias
Dos proveedores de hosting distintos conviven en el portfolio del autor durante la fase MVP.
Si en `/go-live` se decide adquirir un dominio propio y consolidarlo bajo
`victorjaviercorral.com`, esa es una decisión nueva e independiente, con su propio ADR.
