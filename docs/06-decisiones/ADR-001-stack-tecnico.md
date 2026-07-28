# ADR-001 — Stack tecnico: Next.js + Supabase + Netlify

**Fecha:** 2026-07-27 · **Estado:** aceptada

## Contexto

El PRD heredado (LegoVault v5) estimaba Supabase como backend (tier gratuito, con umbral de
migracion a Pro), pero no confirmaba frontend ni hosting. El proyecto necesita: autenticacion
real para v1 (beta controlada multi-usuario), almacenamiento de imagenes con limpieza de
metadatos (RC-01), RLS por usuario (RC-04), y un stack que minimice friccion en desarrollo
asistido por IA (patron muy representado, documentacion abundante). El autor ya opera Netlify
para su sitio web personal y usa React como referencia de la industria, sin criterio propio
para elegir framework mas alla de popularidad/escalabilidad/simplicidad.

## Decision

**Next.js (React) como framework de aplicacion, Supabase como backend (Postgres + Auth + Storage + RLS), Netlify como hosting.**

## Alternativas descartadas

| Alternativa | Razon de descarte |
|-------------|-------------------|
| Vercel como hosting | Integracion mas nativa con Next.js, pero el autor ya opera Netlify para otro sitio; evitar una segunda plataforma de hosting reduce superficie operativa sin coste funcional relevante para este proyecto |
| Backend propio (Node/Express + Postgres autogestionado) | Mas control, pero implica gestionar autenticacion, RLS y storage a mano — contradice constitution C.8 (autenticacion solo via proveedor gestionado) y aumenta superficie de error de seguridad para un proyecto de un solo desarrollador |
| Otro framework frontend (SvelteKit, Nuxt, Astro) | Menor representacion en tooling/documentacion de referencia; el autor pidio explicitamente "el que la industria use mas" y menor consumo de iteraciones en desarrollo asistido por IA |

## Consecuencias

**Positivas:**
- Supabase cubre Auth + RLS + Storage nativamente, alineado con RC-01 (limpieza EXIF/GPS en upload), RC-02/RC-03 (aislamiento de datos por usuario) y RC-04 (GDPR: borrado en cascada via RLS/policies).
- Costo estimado se mantiene en el rango ya calculado por el PRD heredado (~10-15EUR/ano, tier gratuito de Supabase cubre el volumen de la beta).
- Next.js + Netlify es una combinacion soportada de primera clase (Next.js Runtime oficial de Netlify), no un workaround.

**Negativas / coste aceptado:**
- Netlify no es tan nativo para Next.js como Vercel (algunas features de Next.js mas recientes pueden tardar mas en soportarse); se acepta este coste por evitar una segunda plataforma de hosting.
- Supabase tier gratuito tiene limites (500MB BD, 1GB storage, 50.000 MAU) — la spec debe definir el umbral de migracion a Supabase Pro como requisito no funcional explicito, no dejarlo implicito.
