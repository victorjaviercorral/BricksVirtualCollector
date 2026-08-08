# Guía de Testing para Agentes de IA

Todo agente o desarrollador que modifique código en Lego Virtual Museum **DEBE** leer y acatar estas directrices. El incumplimiento de estas normas se considera un fallo crítico en la tarea.

## Reglas No Negociables (Ley de Hierro)
1. **Nunca ocultar fallos:** Está estrictamente prohibido usar `skip`, `todo`, `xit`, comentar tests, o usar flags como `--passWithNoTests` para que la suite pase en verde si hay fallos.
2. **Asumir la culpa del código:** Si un test falla, asume por defecto que has introducido un bug en el código de producción, no que el test esté mal. Solo corrige el test si puedes justificar documentalmente (en el informe) por qué la expectativa original era errónea.
3. **No hacer trampa con aserciones:** Prohibido hacer `expect(true).toBe(true)`, capturar errores mudos en `catch`, o copiar y pegar salidas reales sin verificar que sean semánticamente correctas.
4. **Mockear solo las fronteras puras:** Prohibido mockear la unidad que se está testeando o su lógica interna.
5. **No bajar el umbral:** La configuración de Vitest exige un mínimo del 85% de cobertura general. Cualquier PR/commit que baje esta cobertura será rechazado por CI.
6. **Usa `vi.clearAllMocks()` en lugar de `vi.resetAllMocks()`:** El método `resetAllMocks` destruye la implementación del mock (dejándolo en un `undefined` silencioso), lo que causa falsos negativos o errores indescifrables. Para limpiar el historial de llamadas de un mock en un `beforeEach`, usa siempre `vi.clearAllMocks()`.

## Stack de Testing
- **Unit & Integration:** Vitest + React Testing Library (RTL).
- **Cobertura:** `@vitest/coverage-v8`.
- **E2E:** Playwright.

## Comandos Disponibles
- `npm run test`: Ejecuta la suite una vez.
- `npm run test:watch`: Modo iterativo.
- `npm run test:coverage`: Ejecuta la suite y comprueba que se cumplan los umbrales del 85%. Si un componente no llega, añadirá un error.
- `npm run test:e2e`: Corre la suite de Playwright.

## Convenciones de Ficheros
- Los tests unitarios deben nombrarse `[nombre-fichero].test.ts(x)` y colocarse en el mismo directorio (colocation) que el fichero al que testean o en una carpeta `__tests__` aledaña.
- Los tests e2e deben ir en el directorio raíz `e2e/`.

## ¿Cómo trabajar bajo esta estrategia?
1. Escribe tu código.
2. Escribe los tests (o al revés, en TDD).
3. Ejecuta `npm run test:coverage`.
4. Si la cobertura del fichero que has tocado es inferior al 85% en branches o líneas, **añade los casos que falten** (especialmente los caminos de error/catch).
5. No consideres tu tarea terminada hasta que `npm run test:coverage` esté en verde al 100%.
