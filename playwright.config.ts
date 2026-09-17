import { defineConfig, devices } from "@playwright/test";

/**
 * Les tests de bout en bout tournent sur la **construction de production**, pas
 * sur le serveur de développement : c'est le seul moyen de tester ce que verra
 * un visiteur — le même HTML statique, les mêmes images optimisées, le même
 * JavaScript. Un `next dev` testerait un artefact qui n'est jamais livré.
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
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
