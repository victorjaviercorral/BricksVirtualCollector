<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Reglas No Negociables del Proyecto

### 1. Política de Testing y Cobertura
Si un test falla, hay exactamente dos salidas válidas:
1. Corregir el código de producción, porque el test ha detectado un defecto real.
2. Corregir el test, **solo si documentas por qué la expectativa era incorrecta**, en el informe de la carpeta `docs`.

**Queda estrictamente prohibido en todo el proyecto:**
- Eliminar, comentar, marcar como `skip`/`todo`/`xit` o excluir de la configuración un test que falla.
- Escribir tests que pasen siempre: sin aserciones, con aserciones tautológicas (`expect(true).toBe(true)`), con el resultado esperado copiado de la salida real sin razonar si es correcta, o con `try/catch` que se traguen el fallo.
- Mockear la unidad que se está probando, o mockear hasta el punto de que el test no ejerza lógica propia.
- Actualizar snapshots en bloque sin revisar el diff.
- Bajar el umbral de cobertura configurado (el cual está diseñado para impedir degradaciones), añadir rutas al `coveragePathIgnorePatterns` para subir el porcentaje artificialmente, o usar flags tipo `--passWithNoTests`.
- Dar por terminada una tarea con la suite en rojo. Si no puedes arreglar un fallo, déjalo en rojo, no lo tapes, y repórtalo explícitamente indicando qué has intentado.

### 2. Filosofía de Desarrollo: Flujos de Usuario y Consolidación (Zero-Duplication)
Antes de crear nuevas pantallas o funciones, debes:
1. **Evaluar el flujo del usuario (User Flow):** Entender desde dónde viene el usuario, qué intenta lograr y hacia dónde va.
2. **Evitar la duplicación:** Investigar si ya existe una pantalla, componente o ruta que maneje una responsabilidad similar. No crees dos áreas independientes no sincronizadas para el mismo propósito (ej. dos pantallas de "Ajustes/Perfil").
3. **Consolidar:** Si encuentras solapamientos, tu primera propuesta debe ser refactorizar y unificar, garantizando una única fuente de verdad (Single Source of Truth) para la funcionalidad.

### 3. Gestión del Conocimiento y Documentación Continua
El proyecto requiere una **trazabilidad estricta** de todas las mejoras, fases y decisiones tomadas.
Antes de dar por terminada cualquier nueva funcionalidad, fase de diseño o mejora técnica, debes:
1. **Actualizar el Registro Maestro:** Añadir una nueva entrada en la tabla del archivo `docs/00-proyecto/FASES_Y_MEJORAS.md` que resuma la iniciativa, su estado y las decisiones tomadas.
2. **Compartimentar el Conocimiento:** Crear o actualizar la documentación pertinente dentro de las carpetas específicas en `docs/` (ej. `docs/03-diseno/`, `docs/legal/`, `docs/testing/`). 
3. **No fallar en la ejecución:** Esta es una tarea de alto impacto. La información es poder y es vital para el trabajo de los próximos agentes que asistan en el proyecto.

### 4. Investigación Previa Obligatoria (Contexto Real vs Documental)
**Regla Estricta:** Antes de generar documentación, planificar mejoras o describir flujos de usuario, **estás obligado a leer el código fuente real implementado (componentes, rutas, APIs).**
1. **No asumas:** Los PRDs (Product Requirements Documents) son documentos vivos que pueden quedar desactualizados frente a la realidad del código (MVP iterativo).
2. **Verifica:** Usa herramientas como `view_file` o `list_dir` para inspeccionar la carpeta `src/app/` y `src/components/` antes de afirmar cómo funciona un flujo.
3. **Contexto:** Si te falta contexto sobre una funcionalidad, averígualo leyendo la base de código. Generar documentación inventada o basada en suposiciones socava la confianza y calidad del proyecto.

### 4. Gestión de Entregas y Checkpoints (Versionado y Rollback)
Para asegurar la estabilidad del código base y permitir volver a un estado funcional si algo sale mal, debes seguir esta política de versionado al finalizar tareas importantes:
1. **Commits Estructurados y Semánticos:** Agrupa los cambios lógicamente antes de hacer commit. Usa convenciones (ej. `feat:`, `fix:`, `docs:`, `chore:`).
2. **Tags de Checkpoint:** Siempre que se complete un hito importante, una fase de diseño, o antes de un refactor crítico, debes crear un **tag** descriptivo (ej. `git tag -a v0.1.0-mvp-setup -m "Checkpoint inicial"`). Esto asegura tener una foto fija del estado y permite hacer rollback rápidamente.
3. **Sincronización (Push):** Haz `push` de los commits y los tags (`git push origin <rama>` y `git push --tags`) para consolidar el trabajo en el repositorio remoto, asegurando que la subida (push) deje un rastro claro de recuperación.
