/**
 * Génération du CSS de design depuis `design/tokens.json`.
 *
 * Aucune couleur, aucun espacement, aucun rayon et aucune courbe n'est écrit à
 * la main dans le CSS de l'application : tout descend d'ici. Le fichier produit
 * est versionné et `npm run tokens:check` refuse qu'il diverge de sa source.
 *
 * Deux couches, et la séparation n'est pas cosmétique :
 *
 *   1. **la couche runtime** — des propriétés personnalisées classiques
 *      (`--paper`, `--s5`, `--e-io`…), écrites en CSS ordinaire. C'est ce que
 *      lisent les feuilles de style écrites à la main, et c'est ce que le thème
 *      sombre redéfinit ;
 *   2. **le pont Tailwind** — un `@theme inline` qui mappe les espaces de noms
 *      de Tailwind (`--color-*`, `--spacing-*`, `--radius-*`…) sur la couche 1.
 *      `inline` est le point décisif : Tailwind écrit alors `var(--paper)` dans
 *      l'utilitaire `bg-paper` au lieu d'y figer `#FAF8F3`. Une bascule de thème
 *      repeint donc tout le design system d'un coup, sans une seule variante
 *      `dark:` dans les composants.
 *
 * Les deux couches portent des noms différents **à dessein** : `--radius-md`
 * côté Tailwind, `--r-md` côté runtime. Les nommer pareil produirait
 * `--radius-md: var(--radius-md)` — un cycle que le navigateur résout en
 * n'appliquant rien du tout, en silence.
 */

/** Les quatre familles dont AUCUNE valeur ne peut être écrite ailleurs. */
export const GENERATED_NAMESPACES = ["color", "space", "radius", "ease"];

const BANNER = `/* ─────────────────────────────────────────────────────────────────────────────
 * FICHIER GÉNÉRÉ — ne pas modifier à la main.
 *
 * Source   : design/tokens.json
 * Produit  : npm run tokens
 * Vérifié  : npm run tokens:check  (la CI échoue si ce fichier diverge)
 * ───────────────────────────────────────────────────────────────────────────── */`;

/**
 * Noms de la couche runtime. Courts parce qu'on les lit partout dans le CSS des
 * composants, et distincts des espaces de noms Tailwind pour éviter le cycle.
 */
const RUNTIME = {
  space: (key) => `--s${key}`,
  radius: (key) => `--r-${key}`,
  ease: (key) => `--e-${key}`,
  type: (key) => `--t-${key}`,
  font: (key) => `--f-${key}`,
  color: (key) => `--${key}`,
};

/** Espaces de noms attendus par Tailwind v4. */
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
 * `Fraunces` et `Instrument Sans` sont des noms propres et se citent ;
 * `ui-monospace` est un mot-clé CSS et le citer le rendrait inopérant.
 */
const quoteFamily = (family) => (/^[a-z][a-z0-9-]*$/.test(family) ? family : `"${family}"`);

/**
 * Chaîne de polices avec un point d'injection.
 *
 * Les polices sont auto-hébergées par `next/font`, qui ne laisse pas choisir le
 * nom de famille : il génère quelque chose comme `__Fraunces_1a2b3c`. Le nom
 * écrit dans les tokens ne peut donc pas être utilisé directement.
 *
 * D'où ce `var(--font-loaded-display, "Fraunces")` : le chargeur de polices
 * renseigne la variable, et la famille des tokens reste le repli — celui qui
 * s'applique si le chargeur disparaît. La chaîne de secours continue de
 * descendre des tokens, sans être recopiée nulle part.
 */
const fontStack = (key, { family, fallback }) =>
  `var(--font-loaded-${key}, ${quoteFamily(family)}), ${fallback}`;

/**
 * L'ombre est dérivée des tokens plutôt que choisie : composée de l'encre en
 * clair, du noir pur en sombre. Écrite ici, elle suit une mise à jour de la
 * palette au lieu de rester silencieusement sur l'ancienne.
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
    throw new Error(`Couleur hexadécimale invalide dans les tokens : « ${hex} »`);
  }
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255].join(",");
}

/** Le bloc de couleurs d'un thème — le seul qui change entre clair et sombre. */
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
    "}",
  ].join("\n");
}

/**
 * Le thème sombre s'applique de deux façons, et il faut les deux : la
 * préférence système, et le choix explicite porté par `data-theme`. Le garde
 * `:not([data-theme="light"])` fait que le choix explicite gagne toujours sur
 * la préférence — sans lui, quelqu'un dont le système est en sombre ne pourrait
 * jamais forcer le clair.
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
 * Les espacements sont exposés sous `s1`…`s9` — et non `1`…`9` — pour ne pas se
 * confondre avec l'échelle dynamique par défaut de Tailwind : `p-s5` se lit
 * « l'espacement 5 du design system », `p-5` se lirait « 20 px ». Confondre les
 * deux est exactement ce qui fait dériver un rythme vertical.
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
 * La favicone, dessinée depuis les tokens.
 *
 * Elle est générée — et non déposée — pour la même raison que le CSS : ses deux
 * couleurs sont l'accent et son contraste, et une favicone figée continuerait
 * d'afficher l'ancien bleu après un changement de palette.
 *
 * En SVG, elle pèse deux cent trente octets contre vingt-six kilo-octets pour
 * l'icône ICO par défaut du gabarit — et reste nette à toutes les tailles.
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

/** @param {object} tokens le contenu de `design/tokens.json` */
export function generateTokensCss(tokens) {
  assertShape(tokens);
  return [BANNER, "", runtimeLayer(tokens), "", darkTheme(tokens), "", tailwindBridge(tokens), ""].join(
    "\n",
  );
}

/**
 * Un token manquant doit casser la génération, pas produire un CSS
 * silencieusement incomplet où `bg-accent` ne peindrait plus rien.
 */
function assertShape(tokens) {
  for (const namespace of [...GENERATED_NAMESPACES, "type", "font", "a11y"]) {
    if (!tokens[namespace] || typeof tokens[namespace] !== "object") {
      throw new Error(`tokens.json : espace de noms « ${namespace} » absent ou invalide`);
    }
  }
  for (const [name, value] of Object.entries(tokens.color)) {
    for (const theme of ["light", "dark"]) {
      if (typeof value[theme] !== "string") {
        throw new Error(`tokens.json : color.${name} n'a pas de valeur « ${theme} »`);
      }
      hexToRgb(value[theme]);
    }
  }
  for (const [name, value] of Object.entries(tokens.space)) {
    if (!Number.isFinite(value)) {
      throw new Error(`tokens.json : space.${name} doit être un nombre de pixels`);
    }
  }
  for (const [name, value] of Object.entries(tokens.font)) {
    if (typeof value?.family !== "string" || typeof value?.fallback !== "string") {
      throw new Error(`tokens.json : font.${name} doit porter « family » et « fallback »`);
    }
  }
  if (!Number.isFinite(tokens.a11y.minTouchTarget)) {
    throw new Error("tokens.json : a11y.minTouchTarget doit être un nombre de pixels");
  }
}
