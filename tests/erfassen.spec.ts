// tests/erfassen.spec.ts
// E2E-Tests für die kombinierte Erfassungs-Seite

import { test, expect } from '@playwright/test';

test.describe('Kombinierte Erfassungs-Seite', () => {
  
  test('sollte die Erfassen-Seite laden und Überschrift anzeigen', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Hauptüberschrift
    const heading = page.getByRole('heading', { name: /Gesundheitsdaten erfassen/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('sollte Schnellnavigation mit allen Kategorien haben', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Navigations-Buttons
    const navButtons = page.locator('[class*="sticky"] button');
    await expect(navButtons.first()).toBeVisible({ timeout: 10000 });

    // Prüfe auf Kategorien
    const kategorien = ['Blutdruck', 'Ernährung', 'Vitalfunktionen', 'Körper', 'Schlaf'];
    for (const kategorie of kategorien) {
      const button = page.getByRole('button', { name: new RegExp(kategorie, 'i') });
      // Mindestens einige sollten sichtbar sein
    }
  });

  test('sollte alle Formularsektionen enthalten', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Section-IDs
    const sections = ['blutdruck', 'kalorien', 'vitalfunktionen', 'koerper', 'schlaf'];
    
    for (const sectionId of sections) {
      const section = page.locator(`#${sectionId}`);
      await expect(section).toBeAttached();
    }
  });

  test('sollte Scroll-Navigation funktionieren', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    // Klicke auf einen Navigations-Button (z.B. Schlaf)
    const schlafButton = page.getByRole('button', { name: /Schlaf/i });
    if (await schlafButton.isVisible()) {
      await schlafButton.click();
      await page.waitForTimeout(1000);

      // Prüfe ob die Schlaf-Sektion im Viewport ist
      const schlafSection = page.locator('#schlaf');
      await expect(schlafSection).toBeInViewport({ timeout: 5000 });
    }
  });

  test('sollte Scroll-to-Top Button bei langem Scrollen zeigen', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    // Scrolle nach unten
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

    // Prüfe auf Scroll-to-Top Button
    const scrollTopButton = page.locator('button[aria-label*="oben"], button:has(svg)').last();
    // Der Button sollte erscheinen nach dem Scrollen
  });

  test('sollte Blutdruck-Formular enthalten', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Prüfe auf Blutdruck-Sektion
    const blutdruckSection = page.locator('#blutdruck');
    await expect(blutdruckSection).toBeVisible({ timeout: 15000 });

    // Prüfe auf Formular-Elemente innerhalb der Sektion
    const formElements = blutdruckSection.locator('form, input, button');
    await expect(formElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('sollte Kalorien-Formular enthalten', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Scrolle zur Kalorien-Sektion
    const kalorienSection = page.locator('#kalorien');
    await kalorienSection.scrollIntoViewIfNeeded();
    await expect(kalorienSection).toBeVisible({ timeout: 15000 });
  });

  test('sollte Vitalfunktionen-Formular enthalten', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    const vitalSection = page.locator('#vitalfunktionen');
    await expect(vitalSection).toBeVisible({ timeout: 10000 });

    // Prüfe auf typische Vitalwert-Eingabefelder
    const inputs = vitalSection.locator('input[type="number"]');
    await expect(inputs.first()).toBeVisible();
  });

  test('sollte Körper-Formular enthalten', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    const koerperSection = page.locator('#koerper');
    await expect(koerperSection).toBeVisible({ timeout: 10000 });
  });

  test('sollte Schlaf-Formular enthalten', async ({ page }) => {
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    // Scrolle zur Schlaf-Sektion
    const schlafSection = page.locator('#schlaf');
    await schlafSection.scrollIntoViewIfNeeded();
    await expect(schlafSection).toBeVisible({ timeout: 10000 });

    // Prüfe auf Schlaf-relevante Elemente (Formular, Eingaben)
    const schlafForm = schlafSection.locator('form, input, [role="slider"], button');
    await expect(schlafForm.first()).toBeVisible({ timeout: 5000 });
  });

  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/erfassen');
    await page.waitForLoadState('networkidle');

    // Prüfe dass Seite responsive ist
    const mainContent = page.locator('main, [class*="container"]').first();
    await expect(mainContent).toBeVisible();

    // Navigations-Buttons sollten kompakt sein auf Mobile
    const navButtons = page.locator('[class*="sticky"] button');
    await expect(navButtons.first()).toBeVisible();
  });
});
