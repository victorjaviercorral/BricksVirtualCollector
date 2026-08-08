---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-07-27
tags: [spec-vjc, decision]
---

# ADR-003 — Rate limiting

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto
`checklists/seguridad.md` ítem 13 exige rate limiting en todo endpoint público, más estricto
en autenticación, registro, recuperación de contraseña y subida de archivos. Supabase no trae
esto nativo.

## Decisión
Upstash Redis (tier gratuito) para contadores de rate limiting por IP/usuario, invocado desde
las Edge Functions en los endpoints sensibles.

## Alternativas descartadas
| Alternativa | Razón de descarte |
|-------------|-------------------|
| Tabla de contadores propia en Postgres | Añade carga de escritura a la BD principal y latencia extra en cada petición sensible. |
| Cloudflare delante de Vercel | Capa de infraestructura adicional no justificada al tamaño de este MVP. |

## Consecuencias
Dependencia de un proveedor más en el stack. Su tier gratuito está documentado públicamente
como suficiente (del orden de miles de comandos/día sin tarjeta) para el volumen esperado
(100 usuarios, 1.500 visitas en 3 meses), pero la vigencia exacta de ese pricing se confirma
al integrarlo, no en esta spec (constitution A.3: no se afirma una verificación no ejecutada).
