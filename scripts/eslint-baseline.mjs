#!/usr/bin/env node
/**
 * Gate de ESLint con baseline congelado (tarea C2 del plan de intervención).
 *
 * Motivo: el proyecto arrastra 201 errores de ESLint preexistentes, detectados
 * cuando ESLint pudo ejecutarse por primera vez (Iteración 1). Exigir cero hoy
 * dejaría el CI permanentemente en rojo, y desactivar reglas para ocultarlos
 * está prohibido por AGENTS.md §1. La postura intermedia honesta es congelar la
 * deuda: el gate no obliga a bajarla, pero falla si sube.
 *
 * Al corregir errores, baja ESLINT_BASELINE en el mismo PR para que el nuevo
 * suelo quede fijado y no se pueda volver atrás.
 *
 * Usa la API de Node de ESLint en vez de lanzar el binario: `execFileSync` con
 * `npx.cmd` falla con EINVAL en Windows, y el proyecto se desarrolla ahí.
 */
import { ESLint } from 'eslint';

const ESLINT_BASELINE = 187;

const eslint = new ESLint();
const results = await eslint.lintFiles(['.']);

const errors = results.reduce((n, f) => n + f.errorCount, 0);
const warnings = results.reduce((n, f) => n + f.warningCount, 0);

console.log(`ESLint: ${errors} errores, ${warnings} avisos (baseline: ${ESLINT_BASELINE}).`);

if (errors > ESLINT_BASELINE) {
  const formatter = await eslint.loadFormatter('stylish');
  console.error(await formatter.format(results));
  console.error(
    `\n✖ El número de errores ha subido de ${ESLINT_BASELINE} a ${errors}.\n` +
    `  Corrige los errores nuevos introducidos por este cambio.\n` +
    `  Está prohibido desactivar la regla o añadir eslint-disable para pasar el gate.\n`
  );
  process.exit(1);
}

if (errors < ESLINT_BASELINE) {
  console.warn(
    `\n⚠ Los errores han bajado a ${errors}. Actualiza ESLINT_BASELINE en\n` +
    `  scripts/eslint-baseline.mjs a ${errors} en este mismo PR para fijar el nuevo suelo.\n`
  );
}

console.log('✔ ESLint dentro del baseline.');
