import { defineConfig, devices } from "@playwright/test";

/**
 * Les tests de bout en bout tournent sur la **construction de production servie
 * par Cloudflare**, pas sur le serveur de développement de Next.
 *
 * `wrangler dev` exécute le même magasin d'actifs statiques que la production :
 * la même résolution d'URL (`/en` → `en.html`), le même `_headers`, la même page
 * 404. Les tests voient donc ce que verra un visiteur, en-têtes de sécurité
 * compris — ce qu'aucun serveur statique improvisé n'aurait garanti.
 */
const PORT = 3111;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    /**
     * Un viewport à 400 px de large : la contrainte de responsive la plus
     * serrée du projet. Aucun défilement horizontal ne doit y apparaître.
     */
    {
      name: "mobile-400",
      use: { ...devices["Desktop Chrome"], viewport: { width: 400, height: 850 } },
    },
  ],

  webServer: {
    command: `npm run build && npx wrangler dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
