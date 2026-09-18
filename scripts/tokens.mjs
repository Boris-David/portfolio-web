#!/usr/bin/env node
/**
 * `npm run tokens`        writes the artefacts derived from design/tokens.json
 * `npm run tokens:check`  fails if they have drifted from their source, or if
 *                         the local copy of the tokens has drifted from the hub.
 *
 * `--check` mode is what turns "regenerate after touching the tokens" from a
 * discipline into a guard: CI runs it, and a divergence breaks the build
 * instead of being spotted by eye on a screen.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";
import { generateFaviconSvg, generateTokensCss } from "./design-tokens.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS = resolve(ROOT, "design/tokens.json");
/** The hub, when working from inside the `portfolio` workspace. */
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

/** Every derived artefact, with what it takes to reproduce it. */
const artifacts = [
  { path: resolve(ROOT, "src/styles/tokens.generated.css"), content: generateTokensCss(tokens) },
  { path: resolve(ROOT, "public/icon.svg"), content: generateFaviconSvg(tokens) },
];

const shortPath = (path) => relative(ROOT, path);

if (!check) {
  for (const artifact of artifacts) {
    await writeFile(artifact.path, artifact.content, "utf8");
    console.log(`✓ ${shortPath(artifact.path)} written from design/tokens.json`);
  }
  process.exit(0);
}

const failures = [];

for (const artifact of artifacts) {
  const current = await readOr(artifact.path, null);
  if (current === null) {
    failures.push(`${shortPath(artifact.path)} is missing — run \`npm run tokens\`.`);
  } else if (current !== artifact.content) {
    failures.push(
      `${shortPath(artifact.path)} has drifted from design/tokens.json.\n` +
        "  It was edited by hand, or the tokens changed without regeneration.\n" +
        "  Fix: npm run tokens",
    );
  }
}

/**
 * The upstream copy is only checked when upstream is there. In a standalone
 * clone of `portfolio-web` — so in CI — there is nothing to compare against: we
 * say so, we do not break. A guard that fails for lack of context ends up
 * disabled.
 */
const upstream = await readOr(UPSTREAM, null);
if (upstream === null) {
  console.log("· hub absent: skipping the comparison of design/tokens.json against upstream.");
} else if (upstream !== source) {
  failures.push(
    "design/tokens.json has drifted from ../design/tokens.json (the hub, single source).\n" +
      "  Fix: cp ../design/tokens.json design/tokens.json && npm run tokens",
  );
} else {
  console.log("✓ design/tokens.json is identical to the hub.");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}

console.log("✓ the design artefacts do derive from design/tokens.json.");
