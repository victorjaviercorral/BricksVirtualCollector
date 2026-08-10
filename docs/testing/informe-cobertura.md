# Informe de Cobertura y Testing - BricksVirtualCollector

> ## ✅ Estado real a 10 de agosto de 2026 (tras Fase 2, Ronda 1)
>
> **La suite está en verde: 169/169 tests, 36/36 ficheros.** Los 8 fallos que había al empezar la
> Fase 2 (`dashboard/page.test.tsx`, `ParticipacionesClient.test.tsx`) están corregidos: se
> reescribieron contra la implementación real (`HubClient`, el rediseño de participaciones), no
> se ocultaron ni se marcaron `skip`.
>
> **Cobertura verificada con `npx vitest run --coverage`, umbral del 85% cumplido en las 4
> métricas:**
>
> | Métrica | % |
> |---|---|
> | Statements | 94,20% |
> | Branches | 88,41% |
> | Functions | 91,97% |
> | Lines | 95,31% |
>
> **Sigue siendo una lista blanca, no `src/**` completo** (criterio literal de F2.4 en
> `docs/auditoria-arquitectura.md`). Se amplió con 6 entradas nuevas en esta ronda:
> `src/lib/queries/**`, `src/proxy.ts`, `src/lib/rate-limit.ts`, `src/app/auth/confirm/**`,
> `src/app/api/bricks/**`, `src/app/api/auth/delete-account/**` — exactamente los 5 ficheros de
> superficie de seguridad de F2.5, más la nueva capa de acceso a datos de F2.9. Siguen **fuera**
> del gate: `src/app/page.tsx`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`,
> `src/app/exposicion/[id]/ExposicionClient.tsx`, `src/app/v/[id]/page.tsx`,
> `src/app/api/health`, y todo `src/app/admin/system/**`. Ampliar a `src/**` completo queda como
> trabajo de una ronda posterior.
>
> Detalle completo de la ejecución en `docs/05-plan/seguimiento-iteracion-2.md`.

---

## Registro de tests eliminados

`AGENTS.md` §1 prohíbe eliminar tests que fallan. Se documenta aquí el único caso de eliminación,
que **no responde a un test en rojo que se tape**, sino a la desaparición de su sujeto.

| Fecha | Test eliminado | Motivo |
| :--- | :--- | :--- |
| 2026-08-10 | `src/app/mis-vitrinas/page.test.tsx` | El test afirmaba que la página renderizaba el texto `"Pantalla Mis Vitrinas"` y `"Contenido simulado para verificar el flujo."`, es decir, **validaba un placeholder de andamiaje**, no comportamiento de producto. Cuando la página se implementó de verdad, el test se rompió porque medía el stub. En la tarea QW-04 se eliminó la ruta `/mis-vitrinas` completa por duplicar `/dashboard/vitrinas` (regla de Zero-Duplication, `AGENTS.md` §2) y por contener un defecto de esquema (`created_at` en lugar de `creado_en`). Al desaparecer el sujeto del test, el test desaparece con él. La funcionalidad equivalente vive en `/dashboard/vitrinas` y **queda sin cobertura**: crear ese test es trabajo pendiente de la iteración 2. |

## Deuda de linting detectada (nueva, 2026-08-10)

Hasta la tarea QW-02, `npx eslint .` **abortaba con `ENOENT`** sobre el directorio `coverage/`, por
lo que nadie había visto nunca su salida completa. Corregida la configuración, el resultado es:

**152 errores y 94 avisos.** Desglose por regla:

| Regla | Errores | Avisos |
| :--- | ---: | ---: |
| `@typescript-eslint/no-explicit-any` | 133 | 0 |
| `@typescript-eslint/no-unused-vars` | 0 | 54 |
| `@next/next/no-img-element` | 0 | 30 |
| `react/no-unescaped-entities` | 8 | 0 |
| `react-hooks/exhaustive-deps` | 0 | 6 |
| `react-hooks/immutability` | 4 | 0 |
| `react-hooks/set-state-in-effect` | 4 | 0 |
| `@next/next/no-location-assign-relative-destination` | 0 | 3 |
| `react-hooks/purity` | 2 | 0 |
| `jsx-a11y/alt-text` | 1 | 0 |
| `prefer-const` | 1 | 0 |

78 de los 152 errores están en código de producción; el resto, en ficheros de test.

**No se ha desactivado ni relajado ninguna regla para reducir esta cifra.** El desglose corrobora
tres hallazgos de la auditoría con la herramienta oficial del framework: C2 (uso de `any`), P1
(ausencia de `next/image`) y X4 (imagen sin `alt`). Su corrección se planifica en la iteración 2.

### Actualización tras Fase 2, Ronda 1 (10/08/2026)

**186 errores, 89 avisos.** El total sube (152→186), pero la lectura correcta es otra: son
**110 errores en ficheros de test** (los ~30 tests nuevos escritos en esta ronda usan `as any`
para tipar mocks de Supabase, el mismo patrón ya establecido en la suite existente) y **76 en
código de producción — una bajada frente a los 78 anteriores**, pese a haber añadido ficheros de
producción nuevos (`src/lib/queries/vitrinas.ts`, la reescritura de `src/lib/rate-limit.ts`),
ambos sin un solo `any`. `no-unused-vars` bajó de 54 a 51 avisos (retirado `DashboardClient.tsx`,
huérfano). Sigue sin desactivarse ninguna regla. El grueso pendiente (167 `any`, 28 `no-img-element`)
queda para la iteración 3.

---

## Registro histórico por fases

## Fase 1: Configuración y Autenticación
- **Archivos:** `src/lib/supabase/*`, `src/app/login/*`
- **Cobertura alcanzada:** > 98%
- **Estado:** ✅ Aprobado

## Fase 2: Mesa de Trabajo
- **Archivos:** `src/components/MesaTrabajoClient.tsx`, `src/app/mesa-de-trabajo/*`
- **Cobertura alcanzada:** 89.18% (líneas 93.2%)
- **Estado:** ✅ Aprobado
- **Observaciones:** 
  - Se implementó un mock estricto de Suspense (`React.use`) para sortear las limitaciones de JSDOM.
  - Se documentó el uso defensivo de `/* istanbul ignore next */` en la validación de `id` ausente cuando el botón está deshabilitado por UI.

## Fase 3: Panel de Administración (Roles, Moderación, Exposiciones)
- **Archivos:** `src/app/admin/*`
- **Cobertura alcanzada:** > 96%
- **Estado:** ✅ Aprobado
- **Observaciones:**
  - **Refactorización obligada:** Se detectaron `Server Actions` inline en `moderacion/page.tsx` que eran inaccesibles para Vitest sin levantar un servidor E2E. Se extrajeron exitosamente a `actions.ts`.
  - **Exposiciones:** Se testearon subidas de ficheros mockeando `supabase.storage`. Para las validaciones del formulario, debido a la estricta y a veces opaca validación HTML5 de JSDOM (`required` en inputs) que bloquea el evento de submit, se invocó `fireEvent.submit` directamente sobre el formulario tras rellenar los datos. Esto permite testear la validación en JS escrita en el componente (que es el objetivo real) sin depender de que el DOM virtual maneje perfectamente las APIs de validación nativas.
  - **Layout:** Se cubrieron todas las ramas de redirección y renderizado en base a roles (RBAC).

## Fase 4: Coleccionistas y Usuarios
- **Archivos:** `src/app/dashboard/*`, `src/app/perfil/*`, `src/components/VitrinaClient.tsx`, `src/components/EditVitrinaModal.tsx`, `src/components/MoveSetModal.tsx`
- **Cobertura alcanzada:** > 85% (Global Branch Coverage: 87.32%, Global Line Coverage: 93.81%)
- **Estado:** ✅ Aprobado
- **Observaciones:**
  - Se probó SSR de layouts y páginas validando flujos de redirección y carga de datos.
  - Para `ParticipacionesClient.tsx` se agregaron pruebas exhaustivas de estado de pestañas y bifurcaciones de UI en estados vacíos (por ejemplo, usuario sin Bounties ni Insignias).
  - En `VitrinaClient.tsx`, la declaración `createClient()` a nivel de módulo impedía inyectar un mock correcto en tests que simulaban hooks (como `useRouter`). Se refactorizó moviéndolo dentro del componente cliente.
  - El uso de `getByRole('generic')` para el spinner del loader fallaba al encontrar múltiples divs genéricos. Se reemplazó por un query de selector en el contenedor o roles más específicos.

## Fase 5: Bounties e Insignias
- **Archivos:** `src/app/bounties/*`, `src/app/api/bounties/claim/*`, `src/components/BountiesClient.tsx`, `src/components/BountiesSectionClient.tsx`
- **Cobertura alcanzada:** > 95% en los ficheros de la fase.
- **Estado:** ✅ Aprobado
- **Observaciones:**
  - En `BountiesClient.test.tsx` hubo un `ReferenceError` porque `vi.mock` se eleva (hoist) por encima de las declaraciones de los mocks (`mockFrom`). Se solucionó usando `vi.hoisted(() => { ... })` para asegurar la correcta inicialización antes de la inyección de dependencias.
  - El uso de `getByTestId` arrojaba error estricto (`TestingLibraryElementError`) cuando el DOM virtual simulaba el spinner usando CSS `animate-spin` en lugar de un `data-testid`. Se optimizó usando `container.querySelector('.animate-spin')`.
  - Se probó a fondo la API POST de `claim`, incluyendo ramas de error (400, 401, 404, 500) y la transacción final simulando la recompensa de `Bricks`.

## Resumen Global (histórico — ver aviso de estado al inicio)
- **Cobertura registrada en su momento:** 94.45% en líneas, 87.65% en ramas lógicas (branches), 88.48% en funciones, 93.2% en declaraciones — **sobre la lista blanca de `coverage.include`, no sobre el proyecto completo**. Hoy no es reproducible: la suite está en rojo.
- **Control de Regresiones:** Configurado en `vitest.config.ts`.
- **Mocks:** Configurados correctamente, obligando el limpiado en `beforeEach` (`vi.clearAllMocks()`).
