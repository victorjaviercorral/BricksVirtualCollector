import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación E2E', () => {
  test('debe cargar la página de login y mostrar los elementos clave', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar título y textos principales
    await expect(page.getByRole('heading', { name: /Acceso Seguro/i })).toBeVisible();
    await expect(page.getByPlaceholder('coleccionista@ejemplo.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    
    // Verificar que el botón de login está
    const loginButton = page.getByRole('button', { name: /Entrar \/ Registrarse/i });
    await expect(loginButton).toBeVisible();
    
    // Verificar mensaje de anonimato
    await expect(page.getByText(/100% Anónimo/i)).toBeVisible();
  });

  test('debe mostrar error de validación nativo si se intenta enviar el formulario vacío', async ({ page }) => {
    await page.goto('/login');
    
    const loginButton = page.getByRole('button', { name: /Entrar \/ Registrarse/i });
    await loginButton.click();

    // Como los inputs tienen el atributo required, el navegador bloquea el submit.
    // Playwright no captura fácilmente el tooltip nativo de required en todos los navegadores igual,
    // pero podemos asegurar que seguimos en la misma página y no ha habido redirección a dashboard.
    await expect(page).toHaveURL(/.*\/login/);
  });
});
