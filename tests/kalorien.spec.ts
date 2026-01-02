// tests/kalorien.spec.ts
// E2E-Tests für die Kalorien/Ernährungs-Seite

import { test, expect } from '@playwright/test';

test.describe('Kalorien/Ernährung-Seite', () => {
  
  test('sollte die Kalorien-Seite laden und den Titel anzeigen', async ({ page }) => {
    await page.goto('/kalorien');
    await page.waitForLoadState('networkidle');

    // Prüfe auf Seiteninhalt (Formular oder Überschrift)
    const pageContent = page.locator('h1, h2, [class*="card"]').first();
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });

  test('sollte Tabs oder Formular-Elemente haben', async ({ page }) => {
    await page.goto('/kalorien');
    await page.waitForLoadState('networkidle');

    // Warte auf Seiteninhalt
    await page.waitForTimeout(2000);

    // Prüfe ob Tabs oder Formular vorhanden sind
    const tabsList = page.locator('[role="tablist"]');
    const form = page.locator('form');
    const cards = page.locator('[class*="card"]');

    // Mindestens eines davon sollte sichtbar sein
    const hasContent = await tabsList.or(form).or(cards).first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('sollte das Kalorienformular anzeigen', async ({ page }) => {
    await page.goto('/kalorien');
    await page.waitForLoadState('networkidle');

    // Klicke auf Eingabe-Tab falls nicht aktiv
    const eingabeTab = page.getByRole('tab', { name: /Eingabe|Erfassen/i });
    if (await eingabeTab.isVisible()) {
      await eingabeTab.click();
    }

    // Prüfe auf Formularelemente
    const formElements = page.locator('input, select, button[type="submit"]');
    await expect(formElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('sollte eine Kalorien-Tabelle oder Diagramm anzeigen können', async ({ page }) => {
    await page.goto('/kalorien');
    await page.waitForLoadState('networkidle');

    // Versuche Tabellen-Tab zu finden und klicken
    const tabelleTab = page.getByRole('tab', { name: /Tabelle|Liste|Verlauf/i });
    if (await tabelleTab.isVisible()) {
      await tabelleTab.click();
      await page.waitForTimeout(500);
    }

    // Prüfe auf Tabelle, Diagramm oder "keine Daten" Nachricht
    const dataContainer = page.locator('table, canvas, svg, [class*="empty"], [class*="no-data"]');
    await expect(dataContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/kalorien');
    await page.waitForLoadState('networkidle');

    // Prüfe ob Seite responsive ist
    const mainContent = page.locator('main, [class*="container"]').first();
    await expect(mainContent).toBeVisible();

    // Menü-Button sollte sichtbar sein
    const menuButton = page.locator('main button').first();
    await expect(menuButton).toBeVisible();
  });
});
