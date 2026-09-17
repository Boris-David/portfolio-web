import { defineConfig } from "vitest/config";

/**
 * Les tests de contrat, isolés de la suite ordinaire.
 *
 * Ils tapent `portfolio-api` en production : les inclure dans `npm run test`
 * rendrait rouge un dépôt qui n'a rien cassé, le jour où l'API est
 * indisponible. Ils se lancent explicitement — `npm run test:contract` — et en
 * CI sur un déclencheur dédié.
 *
 * Environnement Node et non jsdom : on parle à un service, pas à un document.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/contract/**/*.test.ts"],
  },
});
