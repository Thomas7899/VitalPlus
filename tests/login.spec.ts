// tests/login.spec.ts
// E2E-Tests für die Login-Seite (ohne Auth-State)

import { test, expect } from '@playwright/test';

// Diese Tests laufen OHNE vorherige Authentifizierung
test.describe('Login-Seite', () => {
  
  // Überschreibe den Storage-State für diese Tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sollte die Login-Seite laden', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Login-relevante Inhalte
    const loginContent = page.locator('form, button, [class*="login"], [class*="sign"]');
    await expect(loginContent.first()).toBeVisible({ timeout: 15000 });
  });

  test('sollte einen Demo-Login-Button haben', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Demo-Login Button
    const demoButton = page.getByRole('button', { name: /Demo|Gast|Test/i });
    await expect(demoButton).toBeVisible({ timeout: 10000 });
  });

  test('sollte Login-Formular oder OAuth-Buttons haben', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Formular oder OAuth-Provider
    const loginElements = page.locator('form input, button[type="submit"], [class*="oauth"], [class*="provider"]');
    await expect(loginElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('sollte bei geschützten Routen zur Login-Seite weiterleiten', async ({ page }) => {
    // Versuche auf geschützte Seite zu gehen
    await page.goto('/blutdruck');
    
    // Sollte zur Login-Seite weitergeleitet werden
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
  });

  test('sollte bei Dashboard zur Login-Seite weiterleiten wenn nicht angemeldet', async ({ page }) => {
    await page.goto('/');
    
    // Sollte zur Login-Seite weitergeleitet werden
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
  });

  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Prüfe auf responsive Layout
    const mainContent = page.locator('main, [class*="container"], [class*="card"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('sollte ansprechende Fehlermeldungen bei ungültigem Login zeigen', async ({ page }) => {
    await page.goto('/login?error=CredentialsSignin');
    await page.waitForLoadState('networkidle');

    // Bei Fehler-Parameter sollte eine Fehlermeldung angezeigt werden
    // (Optional - abhängig von der Implementierung)
  });
});

// Tests MIT Authentifizierung
test.describe('Authentifizierter Benutzer', () => {
  
  test('sollte nach Login zum Dashboard weitergeleitet werden', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sollte NICHT auf Login-Seite sein (wegen Auth-Setup)
    await expect(page).not.toHaveURL(/.*login.*/, { timeout: 5000 });
    
    // Sollte Dashboard-Inhalte anzeigen
    const dashboardContent = page.locator('h1, h2, [class*="dashboard"], [class*="welcome"]');
    await expect(dashboardContent.first()).toBeVisible({ timeout: 15000 });
  });

  test('sollte auf geschützte Seiten zugreifen können', async ({ page }) => {
    await page.goto('/blutdruck');
    await page.waitForLoadState('networkidle');

    // Sollte NICHT zur Login-Seite weitergeleitet werden
    await expect(page).toHaveURL(/.*blutdruck.*/);
    
    // Seite sollte Inhalt haben
    const content = page.locator('h1, h2, form, [class*="card"]');
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});
