import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';

// Config del E2E de invitado (Fase 9, ADR-011). Va contra un Supabase de PRUEBAS, nunca contra
// producción: por eso vive aparte de playwright.config.ts y exige sus propias variables.
const url = process.env.E2E_SUPABASE_URL;
const anon = process.env.E2E_SUPABASE_ANON_KEY;
const service = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  throw new Error(
    'E2E de invitado: faltan E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY y/o E2E_SUPABASE_SERVICE_ROLE_KEY. ' +
      'Ver docs/testing/e2e-invitado.md.'
  );
}
if (existsSync('.env.local')) {
  const prod = readFileSync('.env.local', 'utf8').match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  if (prod && prod === url) {
    throw new Error('E2E de invitado: E2E_SUPABASE_URL coincide con la URL de producción de .env.local. Abortado.');
  }
}

const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  testMatch: /invitado\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0, // un flujo con estado (crea datos): reintentar enmascararía fallos reales
  timeout: 90_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    // Las variables del proceso tienen prioridad sobre .env.local: la app apunta al Supabase de pruebas.
    env: { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: service },
  },
});
