/**
 * Generation of the design CSS from `design/tokens.json`.
 *
 * No colour, no spacing, no radius and no easing curve is written by hand in
 * the application CSS: everything comes down from here. The produced file is
 * tracked and `npm run tokens:check` refuses to let it drift from its source.
 *
 * Two layers, and the separation is not cosmetic:
 *
 *   1. **the runtime layer** — plain custom properties (`--paper`, `--s5`,
 *      `--e-io`…), written as ordinary CSS. This is what the hand-written
 *      stylesheets read, and this is what the dark theme redefines;
 *   2. **the Tailwind bridge** — a `@theme inline` that maps Tailwind's
 *      namespaces (`--color-*`, `--spacing-*`, `--radius-*`…) onto layer 1.
 *      `inline` is the decisive bit: Tailwind then writes `var(--paper)` into
 *      the `bg-paper` utility instead of freezing `#FAF8F3` into it. Switching
 *      theme therefore repaints the whole design system at once, without a
 *      single `dark:` variant in the components.
 *
 * The two layers carry different names **by design**: `--radius-md` on the
 * Tailwind side, `--r-md` on the runtime side. Naming them the same would
 * produce `--radius-md: var(--radius-md)` — a cycle that the browser resolves
 * by applying nothing at all, silently.
 */

/** The four families of which NO value may be written anywhere else. */
export const GENERATED_NAMESPACES = ["color", "space", "radius", "ease"];

const BANNER = `/* ─────────────────────────────────────────────────────────────────────────────
 * GENERATED FILE — do not edit by hand.
 *
 * Source    : design/tokens.json
 * Produced  : npm run tokens
 * Verified  : npm run tokens:check  (CI fails if this file drifts)
 * ───────────────────────────────────────────────────────────────────────────── */`;

/**
 * Runtime-layer names. Short, because they are read all over the component CSS,
 * and distinct from the Tailwind namespaces to avoid the cycle.
 */
const RUNTIME = {
  space: (key) => `--s${key}`,
  radius: (key) => `--r-${key}`,
  ease: (key) => `--e-${key}`,
  type: (key) => `--t-${key}`,
  font: (key) => `--f-${key}`,
  color: (key) => `--${key}`,
};

/** The namespaces Tailwind v4 expects. */
const TAILWIND = {
  space: (key) => `--spacing-s${key}`,
  radius: (key) => `--radius-${key}`,
  ease: (key) => `--ease-${key}`,
  type: (key) => `--text-${key}`,
  font: (key) => `--font-${key}`,
  color: (key) => `--color-${key}`,
};

const typeKeys = (tokens) => Object.keys(tokens.type).filter((key) => !key.startsWith("$"));

/**
 * `Fraunces` and `Instrument Sans` are proper names and must be quoted;
 * `ui-monospace` is a CSS keyword and quoting it would make it inoperative.
 */
const quoteFamily = (family) => (/^[a-z][a-z0-9-]*$/.test(family) ? family : `"${family}"`);

/**
 * A font stack with an injection point.
 *
 * The fonts are self-hosted by `next/font`, which does not let you choose the
 * family name: it generates something like `__Fraunces_1a2b3c`. The name
 * written in the tokens therefore cannot be used directly.
 *
 * Hence this `var(--font-loaded-display, "Fraunces")`: the font loader fills the
 * variable in, and the family from the tokens stays as the fallback — the one
 * that applies if the loader disappears. The fallback chain still comes down
 * from the tokens, without being copied anywhere.
 */
const fontStack = (key, { family, fallback }) =>
  `var(--font-loaded-${key}, ${quoteFamily(family)}), ${fallback}`;

/**
 * The box-shadow is derived from the tokens rather than picked: composed of the
 * ink in light mode, of pure black in dark mode. Written here, it follows a
 * palette update instead of silently staying on the old one.
 */
function shadow(theme, tokens) {
  const base = theme === "light" ? hexToRgb(tokens.color.ink.light) : "0,0,0";
  const [near, far] = theme === "light" ? [0.05, 0.22] : [0.5, 0.85];
  return `0 1px 2px rgba(${base},${near}), 0 14px 34px -18px rgba(${base},${far})`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int) || value.length !== 6) {
    throw new Error(`Invalid hexadecimal colour in the tokens: “${hex}”`);
  }
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255].join(",");
}

/** A theme's colour block — the only part that changes between light and dark. */
function colorBlock(tokens, theme, indent = "  ") {
  const lines = Object.entries(tokens.color).map(
    ([name, value]) => `${indent}${RUNTIME.color(name)}: ${value[theme]};`,
  );
  lines.push(`${indent}--shadow: ${shadow(theme, tokens)};`);
  return lines.join("\n");
}

function section(entries) {
  return entries.join("\n");
}

function runtimeLayer(tokens) {
  const map = (namespace, format) =>
    Object.entries(tokens[namespace])
      .filter(([key]) => !key.startsWith("$"))
      .map(([key, value]) => `  ${RUNTIME[namespace](key)}: ${format(value, key)};`);

  return [
    ":root {",
    colorBlock(tokens, "light"),
    "",
    section(map("space", (value) => `${value}px`)),
    "",
    section(map("radius", (value) => `${value}px`)),
    "",
    section(map("ease", (value) => value)),
    "",
    section(map("type", (value) => `${value}px`)),
    "",
    section(map("font", (value, key) => fontStack(key, value))),
    "",
    `  --touch-target: ${tokens.a11y.minTouchTarget}px;`,
    "",
    // How a block of text is set. Shared with the application and the résumé —
    // see the `text` group in `design/tokens.json`. The vocabulary is neutral
    // (`start`, `center`, `end`, `justify`) and happens to be CSS's own here,
    // which is a coincidence of this platform and not the reason for it.
    ...Object.entries(tokens.text.align).map(([role, value]) => `  --align-${role}: ${value};`),
    "}",
  ].join("\n");
}

/**
 * The dark theme applies in two ways, and both are needed: the system
 * preference, and the explicit choice carried by `data-theme`. The
 * `:not([data-theme="light"])` guard makes the explicit choice always win over
 * the preference — without it, somebody whose system is in dark mode could
 * never force light.
 */
function darkTheme(tokens) {
  return [
    "@media (prefers-color-scheme: dark) {",
    '  :root:not([data-theme="light"]) {',
    colorBlock(tokens, "dark", "    "),
    "  }",
    "}",
    "",
    ':root[data-theme="dark"] {',
    colorBlock(tokens, "dark"),
    "}",
  ].join("\n");
}

/**
 * Spacings are exposed as `s1`…`s9` — and not `1`…`9` — so as not to be
 * confused with Tailwind's default dynamic scale: `p-s5` reads as "design
 * system spacing 5", `p-5` would read as "20 px". Confusing the two is exactly
 * what makes a vertical rhythm drift.
 */
function tailwindBridge(tokens) {
  const bridge = (namespace, keys) =>
    keys.map((key) => `  ${TAILWIND[namespace](key)}: var(${RUNTIME[namespace](key)});`);

  return [
    "@theme inline {",
    section(bridge("color", Object.keys(tokens.color))),
    "",
    section(bridge("space", Object.keys(tokens.space))),
    "",
    section(bridge("radius", Object.keys(tokens.radius))),
    "",
    section(bridge("ease", Object.keys(tokens.ease))),
    "",
    section(bridge("type", typeKeys(tokens))),
    "",
    section(bridge("font", Object.keys(tokens.font))),
    "",
    "  --shadow-token: var(--shadow);",
    "}",
  ].join("\n");
}

/**
 * The favicon, drawn from the tokens.
 *
 * It is generated — rather than dropped in — for the same reason as the CSS:
 * its two colours are the accent and its contrast, and a frozen favicon would
 * keep showing the old blue after a palette change.
 *
 * As SVG it weighs two hundred and thirty bytes against twenty-six kilobytes
 * for the template's default ICO icon — and stays sharp at every size.
 */
export function generateFaviconSvg(tokens) {
  const background = tokens.color.accent.light;
  const letter = tokens.color["on-accent"].light;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="A">` +
    `<rect width="64" height="64" rx="14" fill="${background}"/>` +
    `<path fill="${letter}" fill-rule="evenodd" d="M32 13 49 51h-8.2l-3.3-7.6H26.5L23.2 51H15L32 13Zm0 14.9-3.5 8.3h7L32 27.9Z"/>` +
    `</svg>\n`
  );
}

/** @param {object} tokens the contents of `design/tokens.json` */
export function generateTokensCss(tokens) {
  assertShape(tokens);
  return [BANNER, "", runtimeLayer(tokens), "", darkTheme(tokens), "", tailwindBridge(tokens), ""].join(
    "\n",
  );
}

/**
 * A missing token must break generation, not produce a silently incomplete CSS
 * where `bg-accent` would no longer paint anything.
 */
function assertShape(tokens) {
  for (const namespace of [...GENERATED_NAMESPACES, "type", "font", "a11y", "text"]) {
    if (!tokens[namespace] || typeof tokens[namespace] !== "object") {
      throw new Error(`tokens.json: namespace “${namespace}” missing or invalid`);
    }
  }
  for (const [name, value] of Object.entries(tokens.color)) {
    for (const theme of ["light", "dark"]) {
      if (typeof value[theme] !== "string") {
        throw new Error(`tokens.json: color.${name} has no “${theme}” value`);
      }
      hexToRgb(value[theme]);
    }
  }
  for (const [name, value] of Object.entries(tokens.space)) {
    if (!Number.isFinite(value)) {
      throw new Error(`tokens.json: space.${name} must be a number of pixels`);
    }
  }
  for (const [name, value] of Object.entries(tokens.font)) {
    if (typeof value?.family !== "string" || typeof value?.fallback !== "string") {
      throw new Error(`tokens.json: font.${name} must carry “family” and “fallback”`);
    }
  }
  if (!Number.isFinite(tokens.a11y.minTouchTarget)) {
    throw new Error("tokens.json: a11y.minTouchTarget must be a number of pixels");
  }
  // A value the other surfaces cannot map is a value that silently does
  // nothing on one of them.
  const ALIGNMENTS = new Set(["start", "center", "end", "justify"]);
  for (const [role, value] of Object.entries(tokens.text.align ?? {})) {
    if (!ALIGNMENTS.has(value)) {
      throw new Error(
        `tokens.json: text.align.${role} is “${value}” — expected one of ${[...ALIGNMENTS].join(", ")}`,
      );
    }
  }
}
