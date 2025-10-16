import { test, expect } from '@playwright/test';

test.describe('Blutdruck-Seite', () => {
  // Prüft, ob die Seite korrekt geladen wird
  test('sollte die Blutdruck-Seite laden und den Titel anzeigen', async ({ page }) => {
    await page.goto('/blutdruck');

    // Erwartung: Titel oder Überschrift existiert
    // KORREKTUR: Wir zielen auf die spezifische Seitenüberschrift, um Mehrdeutigkeit zu vermeiden.
    const mainHeading = page.getByRole('heading', { name: /Blutdruck Monitor/i });
    await expect(mainHeading).toBeVisible();
  });

  // Beispiel: Prüft, ob ein Diagramm oder eine Tabelle vorhanden ist
  test('sollte ein Blutdruck-Diagramm oder eine Tabelle anzeigen', async ({ page }) => {
    await page.goto('/blutdruck');

    const chart = page.locator('canvas, svg, table');
    await expect(chart.first()).toBeVisible();
  });

  // Beispiel: Navigation von Sidebar zur Blutdruck-Seite funktioniert
  test('sollte über Sidebar zur Blutdruck-Seite navigieren', async ({ page }) => {
    await page.goto('/');

    // Klick auf Sidebar-Eintrag "Blutdruck"
    // KORREKTUR: Das Navigationselement ist jetzt ein Link, kein Button.
    await page.getByRole('link', { name: 'Blutdruck', exact: true }).click();

    // Überprüfen, ob URL korrekt ist
    await expect(page).toHaveURL(/.*blutdruck/);

    // Titel oder Inhalt prüfen
    // KORREKTUR: Auch hier verwenden wir den spezifischen Selektor für die Seitenüberschrift.
    const mainHeading = page.getByRole('heading', { name: /Blutdruck Monitor/i });
    await expect(mainHeading).toBeVisible();
  });

  // Beispiel: Responsives Verhalten (Mobile View)
  test('sollte im mobilen Layout korrekt rendern', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone-Größe
    await page.goto('/blutdruck');

    // Sidebar-Button sichtbar
    const toggle = page.getByRole('button').first();
    await expect(toggle).toBeVisible();
  });
});
