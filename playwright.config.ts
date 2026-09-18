import { defineConfig, devices } from "@playwright/test";

/**
 * The end-to-end tests run against the **production build served by
 * Cloudflare**, not against Next's development server.
 *
 * `wrangler dev` runs the same static asset store as production: the same URL
 * resolution (`/en` → `en.html`), the same `_headers`, the same 404 page. The
 * tests therefore see what a visitor will see, security headers included —
 * which no improvised static server would have guaranteed.
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
     * A viewport 400 px wide: the tightest responsive constraint in the
     * project. No horizontal scrolling may appear there.
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
