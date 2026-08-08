# Diagnóstico Inicial de Testing - Lego Virtual Museum

## 1. Framework de Test y Cobertura
**Estado actual:** No se ha detectado ningún framework de test ni herramienta de cobertura instalados en el proyecto (no hay dependencias de Jest, Vitest, Cypress, Playwright, etc. en `package.json`, ni se han encontrado archivos con el patrón `*.test.ts` o `*.spec.ts`).

**Propuesta:** 
Dado que el stack es Next.js (App Router) con React y Supabase, propongo instalar el siguiente stack estándar para este ecosistema:
- **Test Runner / Unit & Integration:** `Vitest` (es más rápido y tiene mejor integración con el ecosistema moderno de Vite/Next que Jest) o alternativamente `Jest`. *Propongo Vitest por rendimiento y soporte nativo ESM.*
- **Testing Library:** `@testing-library/react` y `@testing-library/jest-dom` para probar los componentes React simulando la interacción del usuario.
- **Cobertura:** `@vitest/coverage-v8` (o `istanbul` si elegimos Jest).
- **End-to-End (E2E):** `Playwright` para los recorridos críticos de usuario.

*Espero confirmación sobre esta propuesta antes de proceder con la instalación.*

## 2. Cobertura Actual
Dado que no existen tests actualmente, la cobertura de partida es **0%** en todas las métricas:
- **Líneas:** 0%
- **Ramas (Branches):** 0%
- **Funciones:** 0%
- **Sentencias (Statements):** 0%

## 3. Inventario y Clasificación de Secciones por Riesgo
Se han analizado las carpetas en `src/` y se ha clasificado el riesgo cruzando el impacto de un fallo y la complejidad del código.

| Sección / Módulo | Rutas / Componentes | Riesgo | Justificación (Impacto vs Complejidad) |
| :--- | :--- | :--- | :--- |
| **Autenticación e Integración** | `src/app/auth`, `src/app/login`, `src/lib/supabase` | **Crítico** | *Impacto muy alto* (acceso a cuentas). Complejidad media. |
| **Administración y Moderación** | `src/app/admin`, `src/app/moderacion` | **Alto** | *Impacto alto* (control de la plataforma, borrado/edición global). Complejidad alta. |
| **Edición / Mesa de Trabajo** | `src/app/mesa-de-trabajo`, `MesaTrabajoClient.tsx` | **Alto** | *Impacto alto* (creación/modificación de datos de usuario). Complejidad muy alta (estado complejo). |
| **Sistema de Bounties** | `src/app/bounties`, `BountiesClient.tsx` | **Medio-Alto** | *Impacto medio-alto* (lógica de negocio core). Complejidad media-alta. |
| **Dashboard y Perfil Privado** | `src/app/dashboard`, `src/app/perfil`, `src/app/mis-vitrinas`, `src/app/ajustes` | **Medio** | *Impacto medio* (gestión personal). Complejidad media. |
| **Visualización Pública** | `src/app/vitrina`, `src/app/set`, `src/app/exposicion`, `src/app/v` | **Medio-Bajo** | *Impacto bajo* (solo lectura/presentación). Complejidad media. |
| **Componentes UI (Base)** | `src/components/*` (Navbar, Modals, Theme) | **Bajo** | *Impacto bajo* (fallos visuales). Complejidad baja. |

### Orden de Ataque Propuesto para las Fases
1. **Autenticación e Integración (`src/lib/supabase`, `auth`, `login`)**: Proteger el acceso.
2. **Edición / Mesa de Trabajo (`mesa-de-trabajo`)**: Proteger la creación de contenido de los usuarios.
3. **Administración y Moderación (`admin`, `moderacion`)**: Proteger las acciones con privilegios elevados.
4. **Sistema de Bounties (`bounties`)**: Validar la lógica central de participaciones.
5. **Dashboard y Perfil Privado (`dashboard`, `perfil`, `mis-vitrinas`)**: Asegurar la correcta gestión del inventario personal.
6. **Visualización Pública y Componentes UI (`vitrina`, `set`, `components`)**: Cerrar la cobertura en la capa de presentación pura.

## 4. Detección de Código Difícilmente Testeable (Deuda Técnica)
A primera vista, sin refactor, nos vamos a encontrar problemas en:
- **Componentes de Cliente "Gordos" (`MesaTrabajoClient.tsx`, `DashboardClient.tsx`)**: Tienen miles de bytes de código y mezclan probablemente hooks de estado complejos, fetch/llamadas a API (Supabase) y UI.
  - *Coste estimado de refactor:* Alto (2-3 horas por componente para extraer la lógica de negocio a custom hooks o funciones puras).
- **Server Components / Server Actions**: Next.js App Router mezcla la consulta a base de datos en los componentes de servidor. Testearlos unitariamente requerirá modularizar las consultas (extraer a servicios en `src/lib/`) o usar tests de integración directamente.
  - *Coste estimado de refactor:* Medio.

---
**NOTA:** Esperando validación del orden de ataque y confirmación de la herramienta (Vitest + Playwright o Jest + Cypress/Playwright) antes de comenzar la Fase 1.
