import { test, expect } from '@playwright/test';

test('hat den korrekten Titel', async ({ page }) => {
  // 1. Navigiere zur Startseite. Die `baseURL` aus der Konfiguration wird verwendet,
  //    also navigieren wir einfach zu '/'.
  await page.goto('/');

  // 2. Erwarte, dass der Seitentitel "Vital+ App" ist.
  await expect(page).toHaveTitle(/Vital\+ App/);
});

test('zeigt die Dashboard-Seite für einen angemeldeten Benutzer an', async ({ page }) => {
  // 1. Navigiere zur Startseite.
  await page.goto('/');

  // 2. Suche nach der Überschrift auf der Dashboard-Seite.
  //    Playwright wartet automatisch, bis das Element erscheint.
  const dashboardHeading = page.getByRole('heading', { name: /Willkommen zurück!/ });
  
  // 3. Erwarte, dass die Überschrift auf der Seite sichtbar ist.
  await expect(dashboardHeading).toBeVisible();
});
