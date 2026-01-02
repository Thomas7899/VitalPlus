// tests/vitalfunktionen.spec.ts
// E2E-Tests für die Vitalfunktionen-Seite (Herzfrequenz, Atemfrequenz, SpO2)

import { test, expect } from '@playwright/test';

test.describe('Vitalfunktionen-Seite', () => {
  
  test('sollte die Vitalfunktionen-Seite laden', async ({ page }) => {
    await page.goto('/vitalfunktionen');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Seiteninhalt
    const pageContent = page.locator('h1, h2, [class*="card"]').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });

  test('sollte Eingabefelder für Herzfrequenz, Atemfrequenz und SpO2 haben', async ({ page }) => {
    await page.goto('/vitalfunktionen');
    await page.waitForLoadState('networkidle');

    // Klicke auf Eingabe-Tab falls vorhanden
    const eingabeTab = page.getByRole('tab', { name: /Eingabe|Erfassen/i });
    if (await eingabeTab.isVisible()) {
      await eingabeTab.click();
      await page.waitForTimeout(300);
    }

    // Prüfe auf numerische Eingabefelder
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs.first()).toBeVisible({ timeout: 10000 });
  });

  test('sollte Statistik-Karten oder Charts anzeigen', async ({ page }) => {
    await page.goto('/vitalfunktionen');
    await page.waitForLoadState('networkidle');

    // Prüfe auf StatCards oder Charts
    const statsOrCharts = page.locator('[class*="stat"], [class*="chart"], canvas, svg');
    await expect(statsOrCharts.first()).toBeVisible({ timeout: 15000 });
  });

  test('sollte zwischen Tabs wechseln können', async ({ page }) => {
    await page.goto('/vitalfunktionen');
    await page.waitForLoadState('networkidle');

    const tabsList = page.locator('[role="tablist"]');
    
    if (await tabsList.isVisible()) {
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      
      // Klicke durch alle Tabs
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(300);
        
        // Prüfe dass Tab-Panel sichtbar ist
        const tabPanel = page.locator('[role="tabpanel"]');
        await expect(tabPanel).toBeVisible();
      }
    }
  });

  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/vitalfunktionen');
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('main, [class*="container"]').first();
    await expect(mainContent).toBeVisible();
  });
});
