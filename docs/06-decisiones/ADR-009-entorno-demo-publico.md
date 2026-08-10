---
proyecto: lego-virtual-museum
tipo: adr
estado: aceptada
version: 1
fecha: 2026-08-10
decide: arquitectura del entorno de demostración pública
relacionada_con: [auditoria-arquitectura, ADR-002-backend-supabase, ADR-003-rate-limiting]
tags: [spec-vjc, decision, seguridad, lanzamiento]
---

# ADR-009 — Entorno de demostración pública: despliegue único con cuenta demo de solo lectura

**Fecha:** 2026-08-10 · **Estado:** aceptada (pendiente de activación)

> **Nota de activación:** esta decisión queda tomada pero **no ejecutada**. Se activa cuando se
> decida abrir el proyecto al exterior. Hasta entonces el proyecto permanece sin despliegue
> público.

## Contexto

El proyecto va a exponerse por primera vez a una audiencia profesional. La necesidad es que un
visitante pueda recorrer la aplicación y ver las funcionalidades disponibles, con datos ya
cargados, sin que ello ponga en riesgo la seguridad del proyecto ni genere carga de
mantenimiento.

Se valoraron tres arquitecturas en un análisis previo (`demo_architecture_analysis.md`,
documento externo): A) frontend estático con API mockeada en el navegador, B) backend en solo
lectura con escrituras simuladas por middleware, C) entorno sandbox aislado con base de datos
efímera y reseteo por CRON.

La auditoría de arquitectura (`docs/auditoria-arquitectura.md`, 2026-08-10) aportó tres datos que
condicionan la decisión:

1. **La Opción A no es aplicable a este código.** La aplicación tiene 21 consumidores de Supabase
   en servidor (Server Components, route handlers, `proxy.ts`), entre ellos `app/layout.tsx` y la
   landing. Un Service Worker en el navegador no puede interceptar esas llamadas. Además
   `next build` produce 38 rutas dinámicas y 0 estáticas, por lo que no hay artefacto estático que
   desplegar en una CDN sin reescribir la aplicación.
2. **La Opción C está bloqueada.** Depende de recrear la base de datos desde migraciones, y
   `supabase/migrations/` no contiene 6 tablas que el código usa (hallazgo A1).
3. **La frontera de seguridad de este proyecto es RLS, no el secreto de las claves.**
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` viaja al navegador por diseño. Y RLS tiene hoy una escalada de
   privilegios abierta (hallazgo S1).

## Decisión

**Un único despliegue sobre la infraestructura existente, con una cuenta de demostración de solo
lectura y el registro de nuevos usuarios cerrado.**

Tres controles, en este orden:

1. **Escritura revocada a nivel de *grant*, no de política:**

   ```sql
   revoke insert, update, delete on all tables in schema public from authenticated, anon;
   ```

   Se elige la revocación de privilegios sobre las políticas RLS por tabla porque cubre también
   las 6 tablas que no están en las migraciones y cuyas políticas no son auditables desde el
   repositorio (A1). Es una garantía del motor, no de la aplicación.

2. **Registro cerrado** en la configuración de Supabase Auth, y eliminación del auto-registro
   implícito de `src/app/login/page.tsx:35`. El único acceso es la cuenta demo.

3. **Contenido semilla** en la cuenta demo: vitrinas y sets ficticios suficientes para recorrer la
   aplicación.

## Alternativas descartadas

| Alternativa | Razón de descarte |
|---|---|
| **A. Frontend estático con API mockeada (MSW)** | Inaplicable: 21 de los 38 consumidores de datos corren en servidor y MSW no los intercepta; el proyecto no tiene ninguna ruta estática y `output: 'export'` exigiría eliminar las 4 API routes, `proxy.ts` y todos los `cookies()`. Era la opción recomendada por el análisis externo, escrita bajo el supuesto de una SPA que consume una API por `fetch`. |
| **B. Backend en solo lectura con middleware que simula `200 OK`** | La garantía queda en código de aplicación, que hay que escribir, mantener y que puede fallar en una ruta olvidada. La revocación de privilegios en la base de datos ofrece la misma propiedad sin código y sin excepciones posibles. |
| **C. Sandbox aislado con BBDD efímera y CRON de reseteo** | Bloqueada por A1: las migraciones no reproducen el esquema. Además introduce el mantenimiento (CRON, seed, vigilancia) que la premisa excluye explícitamente, y permite que un visitante deje contenido inapropiado visible hasta el siguiente reseteo. |
| **D. Demo con escritura y reseteo periódico** | Reintroduce el mantenimiento y la posibilidad de degradación del contenido. Se reserva para cuando el proyecto tenga usuarios reales. |
| **E. Protección del despliegue con contraseña (Vercel Deployment Protection)** | Reduce la exposición, pero anula el objetivo: el enlace se publica en una red profesional para que cualquiera lo abra sin fricción. Se conserva como palanca de emergencia si aparece abuso. |
| **F. "Modo demo" con un flag sobre el proyecto de producción actual** | Contraviene la premisa de aislamiento: una condición mal evaluada expone datos reales. Descartada sin más análisis. |

## Consecuencias

**Positivas**

- Un solo entorno, un solo proyecto de Supabase, un solo despliegue. Sin coste de creación ni de
  mantenimiento de infraestructura paralela.
- **Mantenimiento cero por construcción:** si nada se puede escribir, no hay nada que resetear,
  vigilar ni moderar.
- La revocación de escritura neutraliza de una sola vez cuatro hallazgos de la auditoría: la
  escalada de privilegios (S1), las Server Actions sin autorización (S2), el reclamo de bounties
  ajenos (S3) y la inserción libre de bricks (S6). **Neutraliza no equivale a corregir**: los
  defectos siguen en el código y deben corregirse antes de abrir la escritura.
- Sin registro no hay usuarios reales: desaparecen el contenido subido por terceros, el coste
  variable de Storage, el deber de moderación y el tratamiento de datos personales de terceros.
  Esto sostiene el encuadre de prototipo no comercial (ver `legal/analisis-titularidad-persona-fisica.md`).

**Negativas y limitaciones aceptadas**

- Los flujos de escritura (crear vitrina, subir set, reclamar bounty) **no son ejecutables** por el
  visitante. Se documentan con capturas o GIF en el README.
- Los botones que disparan escrituras fallarán silenciosamente si no se ocultan bajo el flag de
  demo. Es trabajo pendiente de la fase de activación.
- Publicar el repositorio expone `supabase/migrations/` y con ello el modelo RLS. **La escalada de
  privilegios S1 debe corregirse en el código antes de publicar el repositorio**, con
  independencia de que la revocación de *grants* la neutralice en runtime.
- La ubicación del proyecto de Supabase (UE o EE.UU.) sigue sin verificar y condiciona el análisis
  de transferencias internacionales.

## Criterio de verificación de la activación

Antes de anunciar el enlace:

1. Con la sesión de la cuenta demo, un `insert`, un `update` y un `delete` contra cualquier tabla
   de `public` devuelven error de permisos.
2. Un intento de registro con un email nuevo es rechazado.
3. `update usuarios_perfil set role='sysadmin' where id=auth.uid()` falla.
4. Ninguna ruta de la aplicación muestra datos mock hard-coded (hallazgos R2 y R3).
5. `/admin/*` no es accesible con la cuenta demo.
