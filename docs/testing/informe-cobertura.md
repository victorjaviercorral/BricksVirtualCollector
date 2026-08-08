# Informe de Cobertura y Testing - Lego Virtual Museum

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

## Resumen Global
- **Cobertura Global Actual:** 94.45% en líneas, 87.65% en ramas lógicas (branches), 88.48% en funciones, 93.2% en declaraciones. Muy por encima del umbral del 85%.
- **Control de Regresiones:** Configurado en `vitest.config.ts`.
- **Mocks:** Configurados correctamente, obligando el limpiado en `beforeEach` (`vi.clearAllMocks()`).
