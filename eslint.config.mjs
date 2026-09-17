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
    // Artefacts de construction : `out/` est l'export publié, `.wrangler/`
    // l'état local du serveur d'actifs. Ni l'un ni l'autre n'est écrit à la
    // main, donc ni l'un ni l'autre ne se relit.
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
