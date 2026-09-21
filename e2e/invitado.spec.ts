import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

/**
 * E2E del acceso de invitado (Fase 9, ADR-011). Recorre el walkthrough completo con UNA sesión
 * anónima y comprueba el aislamiento. Va contra el Supabase de PRUEBAS (playwright.invitado.config.ts)
 * sembrado con scripts/e2e-seed.mjs. Las pruebas son secuenciales y comparten estado a propósito:
 * modelan el recorrido de una persona real.
 */
const seed = JSON.parse(readFileSync('e2e/seed-data.json', 'utf8'));
const admin = createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

test.describe.configure({ mode: 'serial' });

test.describe('Acceso de invitado — walkthrough completo', () => {
  let page: Page;
  let vitrinaId = '';
  let guestId = '';

  test.beforeAll(async ({ browser }) => {
    page = await (await browser.newContext()).newPage();
  });

  test.afterAll(async () => {
    // La purga de 48 h lo haría igualmente; se borra para no acumular invitados de pruebas.
    if (guestId) await admin.auth.admin.deleteUser(guestId);
    await page.context().close();
  });

  test('1. un clic entra al Hub con sesión anónima y banner de modo demo', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: /prueba la demo sin registrarte/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('status').filter({ hasText: /modo demo/i })).toBeVisible();

    const { data } = await admin
      .from('usuarios_perfil')
      .select('id, es_invitado, username')
      .eq('es_invitado', true)
      .order('creado_en', { ascending: false })
      .limit(1)
      .single();
    guestId = data!.id;
    expect(data!.username).toMatch(/^Invitado_/);
  });

  test('2. sin haber hecho nada ve la semilla: galería, bounty y exposición', async () => {
    await page.goto('/galeria');
    for (const v of seed.vitrinas) await expect(page.getByText(v.nombre).first()).toBeVisible();
    await page.goto('/bounties');
    await expect(page.getByText(seed.bounty.nombre_set)).toBeVisible();
    await page.goto('/exposiciones');
    await expect(page.getByText(seed.exposicion.titulo)).toBeVisible();
  });

  test('3. crea una vitrina: "Pública" está bloqueada y queda privada', async () => {
    await page.goto('/dashboard/vitrinas');
    await page.getByRole('button', { name: /^\+?\s*Crear Vitrina$/ }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Nombre de la Vitrina/i).fill(seed.invitado.vitrina);
    await expect(dialog.getByRole('button', { name: /Pública/ })).toBeDisabled();
    await dialog.getByRole('button', { name: /Crear Vitrina/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/vitrina\/[0-9a-f-]{36}/);
    vitrinaId = page.url().split('/').pop()!;

    const { data } = await admin.from('vitrinas').select('visibilidad').eq('id', vitrinaId).single();
    expect(data!.visibilidad).toBe('privada');
  });

  test('4. sube un set con foto y la limpieza EXIF elimina el GPS del fichero servido (S2)', async () => {
    await page.goto('/mesa-de-trabajo');
    await page.locator('#mesa-vitrina-destino').selectOption({ label: seed.invitado.vitrina });
    await page.locator('#mesa-num-set').fill('75192');
    await page.locator('#mesa-num-piezas').fill(String(seed.invitado.piezas));
    await page.locator('#mesa-tematica').selectOption('Star Wars');
    await page.locator('#mesa-nombre-set').fill(seed.invitado.set);
    // set-gps.jpg lleva coordenadas GPS reales en su EXIF.
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/set-gps.jpg');
    await page.getByRole('button', { name: /Añadir Set/ }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/vitrina/${vitrinaId}`));
    await expect(page.getByText(seed.invitado.set)).toBeVisible();

    const { data: fotos } = await admin
      .from('fotos')
      .select('url, sets!inner(nombre)')
      .eq('sets.nombre', seed.invitado.set);
    const servida = await page.request.get(fotos![0].url);
    expect(servida.ok()).toBe(true);
    const meta = await sharp(await servida.body()).metadata();
    expect(meta.exif, 'el fichero servido no debe conservar EXIF/GPS').toBeUndefined();
  });

  test('5. vota en contenido público', async () => {
    await page.goto('/galeria');
    await page.getByText(seed.vitrinas[0].nombre).first().click();
    await expect(page).toHaveURL(/\/vitrina\//);
    const voto = page.getByRole('button', { name: /\d+ Bricks?/ }).first();
    await voto.click();
    await expect(voto).toBeDisabled();
  });

  test('6. reclama un bounty con su set', async () => {
    await page.goto('/bounties');
    await page.getByRole('button', { name: /Reclamar Misión/ }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText(seed.invitado.set).click();
    await dialog.getByRole('button', { name: /Cobrar Recompensa Directa/ }).click();
    await expect(page.getByText('Ya reclamado')).toBeVisible();
  });

  test('7. desbloquea una insignia y queda persistida', async () => {
    await page.goto('/dashboard/insignias');
    await expect(page.getByText('Primera Pieza').first()).toBeVisible();
    await expect
      .poll(async () => {
        const { count } = await admin.from('insignias_usuario').select('*', { count: 'exact', head: true }).eq('usuario_id', guestId);
        return count ?? 0;
      })
      .toBeGreaterThan(0);
  });

  test('8. nada del invitado es visible para terceros', async ({ browser }) => {
    const visitante = await (await browser.newContext()).newPage();
    await visitante.goto('/galeria');
    await expect(visitante.getByText(seed.vitrinas[0].nombre).first()).toBeVisible(); // la semilla sí
    await expect(visitante.getByText(seed.invitado.vitrina)).toHaveCount(0);
    const perfil = await visitante.goto(`/perfil/${guestId}`);
    expect(perfil!.status()).toBe(404);
    await visitante.context().close();
  });

  test('9. /admin queda cerrado a invitados', async () => {
    await page.goto('/admin/exposiciones');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/admin/bounties');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('10. una foto por encima de 3 MB se rechaza en modo demo', async () => {
    const res = await page.request.post('/api/sets/foto', {
      multipart: { file: { name: 'grande.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(4 * 1024 * 1024) } },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/3MB/);
  });
});
