import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/lib/supabase/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/login/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/components/MesaTrabajoClient.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/mesa-de-trabajo/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/admin/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/dashboard/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/perfil/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/vitrina/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/bounties/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/api/bounties/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/components/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/lib/queries/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/proxy.{test,spec}.?(c|m)[jt]s?(x)',
      'src/lib/rate-limit.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/auth/confirm/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/api/bricks/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/api/auth/delete-account/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/set/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/lib/roles.{test,spec}.?(c|m)[jt]s?(x)',
      'src/lib/insignias.{test,spec}.?(c|m)[jt]s?(x)',
      'src/components/badges/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
    exclude: ['node_modules', '.next', 'e2e/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
        statements: 85
      },
      // Fase 1, 2, 3 y 4: Auth, Integración, Mesa de Trabajo, Admin, Coleccionistas
      include: [
        'src/lib/supabase/**',
        'src/app/login/**',
        'src/app/mesa-de-trabajo/**',
        'src/components/MesaTrabajoClient.tsx',
        'src/app/admin/layout.tsx',
        'src/app/admin/moderacion/**',
        'src/app/admin/exposiciones/**',
        'src/app/dashboard/**',
        'src/app/perfil/**',
        'src/app/vitrina/**',
        'src/components/EditVitrinaModal.tsx',
        'src/components/MoveSetModal.tsx',
        'src/components/VitrinaClient.tsx',
        'src/app/bounties/**',
        'src/app/api/bounties/**',
        'src/components/BountiesClient.tsx',
        'src/components/BountiesSectionClient.tsx',
        // Fase 2 (F2.5 / F2.9): superficie de seguridad y capa de acceso a datos
        'src/lib/queries/**',
        'src/proxy.ts',
        'src/lib/rate-limit.ts',
        'src/app/auth/confirm/**',
        'src/app/api/bricks/**',
        'src/app/api/auth/delete-account/**',
        // Iteración 3 (Bloque A): retirada de mock data
        'src/app/set/**',
        // Iteración 4 (D2/N7): fuente única de verdad para el rol de moderador
        'src/lib/roles.ts',
        // Iteración 4 (D3): reparto real de insignias al cerrar una exposición
        'src/lib/insignias.ts',
        'src/components/badges/**',
        'src/app/dashboard/insignias/**'
      ],
      // Excluir de cobertura ficheros puramente config o que se cubren con E2E
      exclude: [
        'node_modules/',
        '.next/',
        'vitest.*.ts',
        'playwright.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'eslint.config.mjs',
        'src/app/layout.tsx', // Covered by E2E
        '**/*.d.ts'
      ]
    }
  }
});
