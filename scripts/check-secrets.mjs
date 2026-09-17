#!/usr/bin/env node
/**
 * Refuse toute valeur de secret dans l'arbre versionné.
 *
 * Ce dépôt est **public**, et un secret poussé est irréversible : il vit dans
 * l'historique même après le commit qui le retire. La seule protection qui vaut
 * est celle qui s'exécute avant.
 *
 * Deux gardes, complémentaires et pas redondantes :
 *
 *   - `.githooks/pre-commit` du workspace, branché par `core.hooksPath`, refuse
 *     le commit sur le poste de travail. C'est la meilleure : rien n'est écrit ;
 *   - **ce script**, exécuté par la CI. Il existe parce que le hook du workspace
 *     n'est pas dans ce dépôt : un clone isolé de `portfolio-web` ne l'a pas, et
 *     `core.hooksPath` ne survit pas à un clone. Sans ce script, la garde
 *     disparaîtrait exactement là où le dépôt devient public.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

/** Des motifs de **valeurs**, pas de noms de variables. */
const PATTERNS = [
  { label: "clé privée", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: "jeton GitHub", pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}/ },
  { label: "clé Google API", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: "clé de type OpenAI", pattern: /\bsk-[A-Za-z0-9]{20,}/ },
  { label: "identifiant AWS", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "jeton Vercel", pattern: /\bvercel_[A-Za-z0-9]{24,}/ },
  { label: "compte de service Google", pattern: /"type"\s*:\s*"service_account"/ },
  /**
   * Marqueur d'employeur : la règle éditoriale du portfolio interdit tout
   * domaine d'employeur dans un dépôt public — auteur, message ou contenu.
   */
  { label: "domaine d'employeur", pattern: /\b(instant-system|inetum)\.com\b/ },
];

/** Des fichiers qui n'ont rien à faire dans un dépôt public, quel qu'en soit le contenu. */
const FORBIDDEN_PATHS = [/^\.env$/, /^\.env\.local$/, /^\.env\..*\.local$/, /\.pem$/, /\.p12$/];

/** Ce fichier définit les motifs : il les contient, par construction. */
const SELF = "scripts/check-secrets.mjs";

/**
 * Les fichiers versionnés **et** ceux qui ne le sont pas encore mais que
 * `.gitignore` n'exclut pas.
 *
 * N'inspecter que l'index aurait deux angles morts : avant le premier commit,
 * il est vide — et le script annoncerait fièrement zéro secret dans zéro
 * fichier ; et un secret déposé mais pas encore ajouté passerait, alors que
 * c'est exactement le moment où on veut l'attraper.
 */
const list = (...args) =>
  execFileSync("git", ["ls-files", "-z", ...args], { encoding: "utf8" }).split("\0").filter(Boolean);

const tracked = [...new Set([...list(), ...list("--others", "--exclude-standard")])];

if (tracked.length === 0) {
  console.error("✖ aucun fichier à inspecter — la garde ne garde rien. Vérifier le dépôt git.");
  process.exit(1);
}

const findings = [];

for (const file of tracked) {
  if (file === SELF) continue;

  for (const forbidden of FORBIDDEN_PATHS) {
    if (forbidden.test(file)) {
      findings.push(`${file} — fichier interdit dans un dépôt public`);
    }
  }

  let stats;
  try {
    stats = statSync(file);
  } catch {
    continue; // Fichier supprimé mais encore indexé : rien à lire.
  }
  // Les binaires (images, polices) ne portent pas de secret en clair.
  if (!stats.isFile() || stats.size > 2_000_000) continue;
  if (/\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip)$/i.test(file)) continue;

  const content = readFileSync(file, "utf8");
  for (const { label, pattern } of PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push(`${file}:${line} — ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error("✖ Valeurs interdites dans un dépôt public :");
  for (const finding of findings) console.error(`  ${finding}`);
  console.error("\n  L'historique est irréversible : retirer avant de commiter, pas après.");
  process.exit(1);
}

console.log(`✓ aucun secret ni marqueur d'employeur dans ${tracked.length} fichiers versionnés.`);
