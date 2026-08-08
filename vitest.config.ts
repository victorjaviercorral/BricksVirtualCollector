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
      'src/app/mis-vitrinas/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/vitrina/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/bounties/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/app/api/bounties/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'src/components/**/*.{test,spec}.?(c|m)[jt]s?(x)',
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
        'src/components/DashboardClient.tsx',
        'src/app/perfil/**',
        'src/app/mis-vitrinas/**',
        'src/app/vitrina/**',
        'src/components/EditVitrinaModal.tsx',
        'src/components/MoveSetModal.tsx',
        'src/components/VitrinaClient.tsx',
        'src/app/bounties/**',
        'src/app/api/bounties/**',
        'src/components/BountiesClient.tsx',
        'src/components/BountiesSectionClient.tsx'
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
