import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build artefacts: `out/` is the published export, `.wrangler/` the local
    // state of the asset server. Neither is written by hand, so neither is ever
    // read back.
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
