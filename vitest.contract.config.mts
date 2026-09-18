import { defineConfig } from "vitest/config";

/**
 * The contract tests, isolated from the ordinary suite.
 *
 * They hit `portfolio-api` in production: including them in `npm run test`
 * would turn a repository that broke nothing red on the day the API is
 * unavailable. They are run explicitly — `npm run test:contract` — and in CI on
 * a dedicated trigger.
 *
 * Node environment rather than jsdom: we are talking to a service, not to a
 * document.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/contract/**/*.test.ts"],
  },
});
