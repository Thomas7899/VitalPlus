// tests/koerperzusammensetzung.spec.ts
// E2E-Tests für die Körperzusammensetzung-Seite (Gewicht, BMI, Körperfett, Muskelmasse)

import { test, expect } from '@playwright/test';

test.describe('Körperzusammensetzung-Seite', () => {
  
  test('sollte die Körperzusammensetzung-Seite laden', async ({ page }) => {
    await page.goto('/koerperzusammensetzung');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Seiteninhalt
    const pageContent = page.locator('h1, h2, [class*="card"]').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });

  test('sollte Eingabefelder für Körperdaten haben', async ({ page }) => {
    await page.goto('/koerperzusammensetzung');
    await page.waitForLoadState('networkidle');

    // Klicke auf Eingabe-Tab falls vorhanden
    const eingabeTab = page.getByRole('tab', { name: /Eingabe|Erfassen/i });
    if (await eingabeTab.isVisible()) {
      await eingabeTab.click();
      await page.waitForTimeout(300);
    }

    // Prüfe auf Formular
    const form = page.locator('form');
    await expect(form.first()).toBeVisible({ timeout: 10000 });
    
    // Prüfe auf numerische Eingabefelder (Gewicht, Körperfett, etc.)
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs.first()).toBeVisible({ timeout: 5000 });
  });

  test('sollte Statistik-Karten für Körperwerte anzeigen', async ({ page }) => {
    await page.goto('/koerperzusammensetzung');
    await page.waitForLoadState('networkidle');

    // Prüfe auf StatCards
    const statCards = page.locator('[class*="stat"], [class*="card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 15000 });
  });

  test('sollte eine Datentabelle oder Chart haben', async ({ page }) => {
    await page.goto('/koerperzusammensetzung');
    await page.waitForLoadState('networkidle');

    // Versuche Tabellen-Tab zu finden
    const tabelleTab = page.getByRole('tab', { name: /Tabelle|Verlauf|History/i });
    if (await tabelleTab.isVisible()) {
      await tabelleTab.click();
      await page.waitForTimeout(500);
    }

    // Prüfe auf Datenvisualisierung
    const dataViz = page.locator('table, canvas, svg, [class*="chart"]');
    await expect(dataViz.first()).toBeVisible({ timeout: 10000 });
  });

  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/koerperzusammensetzung');
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('main, [class*="container"]').first();
    await expect(mainContent).toBeVisible();
  });
});
