#!/usr/bin/env node
/**
 * Rejects any secret value in the tracked tree.
 *
 * This repository is **public**, and a pushed secret is irreversible: it lives
 * in the history even after the commit that removes it. The only protection
 * worth anything is the one that runs beforehand.
 *
 * Two guards, complementary and not redundant:
 *
 *   - the workspace's `.githooks/pre-commit`, wired up through `core.hooksPath`,
 *     rejects the commit on the workstation. That one is the best: nothing gets
 *     written;
 *   - **this script**, run by CI. It exists because the workspace hook is not in
 *     this repository: a standalone clone of `portfolio-web` does not have it,
 *     and `core.hooksPath` does not survive a clone. Without this script, the
 *     guard would disappear at exactly the point where the repository becomes
 *     public.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

/** Patterns for **values**, not for variable names. */
const PATTERNS = [
  { label: "private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}/ },
  { label: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: "OpenAI-style key", pattern: /\bsk-[A-Za-z0-9]{20,}/ },
  { label: "AWS access key id", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "Vercel token", pattern: /\bvercel_[A-Za-z0-9]{24,}/ },
  { label: "Google service account", pattern: /"type"\s*:\s*"service_account"/ },
  /**
   * Employer marker: the portfolio's editorial rule forbids any employer domain
   * in a public repository — author, message or content.
   */
  { label: "employer domain", pattern: /\b(instant-system|inetum)\.com\b/ },
];

/** Files that have no business in a public repository, whatever they contain. */
const FORBIDDEN_PATHS = [/^\.env$/, /^\.env\.local$/, /^\.env\..*\.local$/, /\.pem$/, /\.p12$/];

/** This file defines the patterns: it contains them, by construction. */
const SELF = "scripts/check-secrets.mjs";

/**
 * Tracked files **and** those not tracked yet that `.gitignore` does not
 * exclude.
 *
 * Inspecting only the index would have two blind spots: before the first
 * commit it is empty — and the script would proudly report zero secrets in zero
 * files; and a secret dropped in but not yet added would slip through, which is
 * exactly the moment we want to catch it.
 */
const list = (...args) =>
  execFileSync("git", ["ls-files", "-z", ...args], { encoding: "utf8" }).split("\0").filter(Boolean);

const tracked = [...new Set([...list(), ...list("--others", "--exclude-standard")])];

if (tracked.length === 0) {
  console.error("✖ no file to inspect — the guard guards nothing. Check the git repository.");
  process.exit(1);
}

const findings = [];

for (const file of tracked) {
  if (file === SELF) continue;

  for (const forbidden of FORBIDDEN_PATHS) {
    if (forbidden.test(file)) {
      findings.push(`${file} — file forbidden in a public repository`);
    }
  }

  let stats;
  try {
    stats = statSync(file);
  } catch {
    continue; // File deleted but still in the index: nothing to read.
  }
  // Binaries (images, fonts) do not carry a secret in cleartext.
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
  console.error("✖ Values forbidden in a public repository:");
  for (const finding of findings) console.error(`  ${finding}`);
  console.error("\n  History is irreversible: remove before committing, not after.");
  process.exit(1);
}

console.log(`✓ no secret and no employer marker in ${tracked.length} tracked files.`);
