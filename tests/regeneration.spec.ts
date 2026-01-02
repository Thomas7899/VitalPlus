// tests/regeneration.spec.ts
// E2E-Tests für die Regeneration/Schlaf-Seite

import { test, expect } from '@playwright/test';

test.describe('Regeneration/Schlaf-Seite', () => {
  
  test('sollte die Regeneration-Seite laden', async ({ page }) => {
    await page.goto('/regeneration');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Seiteninhalt
    const pageContent = page.locator('h1, h2, [class*="card"]').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });

  test('sollte Eingabefelder für Schlafdaten haben', async ({ page }) => {
    await page.goto('/regeneration');
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
  });

  test('sollte Schlaf-Statistiken anzeigen', async ({ page }) => {
    await page.goto('/regeneration');
    await page.waitForLoadState('networkidle');

    // Prüfe auf StatCards oder Schlaf-relevante Inhalte
    const statsContent = page.locator('[class*="stat"], [class*="card"], [class*="sleep"]');
    await expect(statsContent.first()).toBeVisible({ timeout: 15000 });
  });

  test('sollte zwischen Tabs wechseln können', async ({ page }) => {
    await page.goto('/regeneration');
    await page.waitForLoadState('networkidle');

    const tabsList = page.locator('[role="tablist"]');
    
    if (await tabsList.isVisible()) {
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      
      // Teste Tab-Wechsel
      if (tabCount > 1) {
        await tabs.nth(1).click();
        await page.waitForTimeout(300);
        
        const tabPanel = page.locator('[role="tabpanel"]');
        await expect(tabPanel).toBeVisible();
      }
    }
  });

  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/regeneration');
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('main, [class*="container"]').first();
    await expect(mainContent).toBeVisible();
  });
});
