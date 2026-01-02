// tests/profil.spec.ts
// E2E-Tests für die Benutzer-Profil-Seite

import { test, expect } from '@playwright/test';

test.describe('Profil-Seite', () => {
  
  test('sollte die Profil-Seite laden', async ({ page }) => {
    await page.goto('/user');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Seiteninhalt
    const pageContent = page.locator('h1, h2, [class*="card"], form').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });

  test('sollte Profilformular mit Benutzerinformationen anzeigen', async ({ page }) => {
    await page.goto('/user');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Formular
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 10000 });

    // Prüfe auf typische Profilfelder
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]');
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    
    // Mindestens eines der Felder sollte vorhanden sein
    const hasNameOrEmail = await nameInput.or(emailInput).first().isVisible();
    expect(hasNameOrEmail).toBeTruthy();
  });

  test('sollte Eingabefelder für persönliche Daten haben', async ({ page }) => {
    await page.goto('/user');
    await page.waitForLoadState('networkidle');

    // Warte auf Datenladung
    await page.waitForTimeout(2000);

    // Prüfe auf Formular mit Eingabefeldern
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 10000 });

    // Prüfe auf mindestens ein Eingabefeld
    const inputs = page.locator('form input');
    await expect(inputs.first()).toBeVisible({ timeout: 5000 });
  });

  test('sollte einen Speichern-Button haben', async ({ page }) => {
    await page.goto('/user');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Submit-Button
    const submitButton = page.locator('button[type="submit"], button:has-text("Speichern"), button:has-text("Aktualisieren")');
    await expect(submitButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('sollte vorbefüllte Benutzerdaten anzeigen', async ({ page }) => {
    await page.goto('/user');
    await page.waitForLoadState('networkidle');

    // Warte auf Datenladung
    await page.waitForTimeout(2000);

    // Prüfe ob Name-Feld einen Wert hat (Demo-User: Max Müller)
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      const nameValue = await nameInput.inputValue();
      // Bei eingeloggtem Demo-User sollte ein Name vorhanden sein
      expect(nameValue.length).toBeGreaterThan(0);
    }
  });

  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/user');
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('main, [class*="container"]').first();
    await expect(mainContent).toBeVisible();
  });
});
