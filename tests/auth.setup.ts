// tests/auth.setup.ts
// Gemeinsames Setup für authentifizierte Tests

import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

// ES-Module Kompatibilität
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_USER_EMAIL = "max.mueller@example.com";
const authFile = path.join(__dirname, "..", ".playwright", "auth-state.json");

// Dieses Setup wird vor allen authentifizierten Tests ausgeführt
setup("Demo-Login durchführen", async ({ page }) => {
  // Gehe zur Login-Seite
  await page.goto("/login");
  
  // Rufe die Test-Login-API direkt im Browser-Kontext auf
  const loginResult = await page.evaluate(async (email) => {
    const response = await fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    });
    return response.json();
  }, DEMO_USER_EMAIL);

  // Prüfen, ob Login erfolgreich war
  expect(loginResult.success).toBeTruthy();
  
  // Gehe zur Startseite um die Session zu validieren
  await page.goto("/");
  
  // Warte, bis wir nicht mehr auf Login sind
  await expect(page).not.toHaveURL(/.*login.*/, { timeout: 10000 });
  
  // Speichere den Authentifizierungsstatus für andere Tests
  await page.context().storageState({ path: authFile });
});

export { authFile };
