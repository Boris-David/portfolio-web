#!/usr/bin/env node
/**
 * `npm run tokens`        écrit les artefacts dérivés de design/tokens.json
 * `npm run tokens:check`  échoue s'ils divergent de leur source, ou si la copie
 *                         des tokens a dérivé du hub.
 *
 * Le mode `--check` est ce qui transforme « on régénère après avoir touché aux
 * tokens » d'une discipline en une garde : la CI l'exécute, et une divergence
 * casse la construction au lieu de se découvrir à l'œil sur un écran.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";
import { generateFaviconSvg, generateTokensCss } from "./design-tokens.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS = resolve(ROOT, "design/tokens.json");
/** Le hub, quand on travaille depuis le workspace `portfolio`. */
const UPSTREAM = resolve(ROOT, "../design/tokens.json");

const check = process.argv.includes("--check");

const readOr = async (path, fallback) => {
  try {
    return await readFile(path, "utf8");
  } catch {
    return fallback;
  }
};

const source = await readFile(TOKENS, "utf8");
const tokens = JSON.parse(source);

/** Chaque artefact dérivé, avec de quoi le reproduire. */
const artifacts = [
  { path: resolve(ROOT, "src/styles/tokens.generated.css"), content: generateTokensCss(tokens) },
  { path: resolve(ROOT, "public/icon.svg"), content: generateFaviconSvg(tokens) },
];

const shortPath = (path) => relative(ROOT, path);

if (!check) {
  for (const artifact of artifacts) {
    await writeFile(artifact.path, artifact.content, "utf8");
    console.log(`✓ ${shortPath(artifact.path)} écrit depuis design/tokens.json`);
  }
  process.exit(0);
}

const failures = [];

for (const artifact of artifacts) {
  const current = await readOr(artifact.path, null);
  if (current === null) {
    failures.push(`${shortPath(artifact.path)} est absent — lancer \`npm run tokens\`.`);
  } else if (current !== artifact.content) {
    failures.push(
      `${shortPath(artifact.path)} diverge de design/tokens.json.\n` +
        "  Il a été modifié à la main, ou les tokens ont changé sans régénération.\n" +
        "  Corriger : npm run tokens",
    );
  }
}

/**
 * La copie d'amont ne se vérifie que si l'amont est là. Sur un clone isolé de
 * `portfolio-web` — donc en CI — il n'y a rien à comparer : on le dit, on ne
 * casse pas. Une garde qui échoue faute de contexte finit désactivée.
 */
const upstream = await readOr(UPSTREAM, null);
if (upstream === null) {
  console.log("· hub absent : comparaison de design/tokens.json à l'amont ignorée.");
} else if (upstream !== source) {
  failures.push(
    "design/tokens.json a dérivé de ../design/tokens.json (le hub, source unique).\n" +
      "  Corriger : cp ../design/tokens.json design/tokens.json && npm run tokens",
  );
} else {
  console.log("✓ design/tokens.json est identique au hub.");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log("✓ les artefacts de design dérivent bien de design/tokens.json.");
