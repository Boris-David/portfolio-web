import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateTokensCss, GENERATED_NAMESPACES } from "../../scripts/design-tokens.mjs";
import { parseCubicBezier } from "@/lib/effects/design-runtime";

const ROOT = resolve(__dirname, "../..");
const tokens = JSON.parse(readFileSync(resolve(ROOT, "design/tokens.json"), "utf8"));
const generated = readFileSync(resolve(ROOT, "src/styles/tokens.generated.css"), "utf8");

/**
 * Le générateur est la pièce qui garantit qu'aucune valeur de design n'est
 * recopiée à la main. Ces tests vérifient qu'il produit ce qu'on croit, et
 * surtout qu'il **casse** quand la source est incohérente.
 */
describe("le générateur de tokens", () => {
  it("produit exactement le fichier versionné", () => {
    expect(generateTokensCss(tokens)).toBe(generated);
  });

  it("émet chaque couleur dans les deux thèmes", () => {
    for (const [name, value] of Object.entries<Record<string, string>>(tokens.color)) {
      expect(generated).toContain(`--${name}: ${value.light};`);
      expect(generated).toContain(`--${name}: ${value.dark};`);
    }
  });

  it("émet chaque espacement, rayon et courbe", () => {
    for (const [key, value] of Object.entries(tokens.space)) {
      expect(generated).toContain(`--s${key}: ${value}px;`);
    }
    for (const [key, value] of Object.entries(tokens.radius)) {
      expect(generated).toContain(`--r-${key}: ${value}px;`);
    }
    for (const [key, value] of Object.entries(tokens.ease)) {
      expect(generated).toContain(`--e-${key}: ${value};`);
    }
  });

  it("dérive la cible tactile minimale des tokens d'accessibilité", () => {
    expect(generated).toContain(`--touch-target: ${tokens.a11y.minTouchTarget}px;`);
  });

  /**
   * `--radius-md: var(--radius-md)` est un cycle : le navigateur n'applique
   * alors rien, en silence. C'est précisément le bug qu'a produit la première
   * version du générateur, d'où ce test.
   */
  it("ne produit aucune variable qui se référence elle-même", () => {
    const cycles = [...generated.matchAll(/^\s*(--[\w-]+):\s*var\(\1\)/gm)];
    expect(cycles.map((match) => match[1])).toEqual([]);
  });

  it("laisse un point d'injection au chargeur de polices, avec repli", () => {
    expect(generated).toContain('--f-display: var(--font-loaded-display, "Fraunces"), Georgia, serif;');
    // `ui-monospace` est un mot-clé CSS : le citer le rendrait inopérant.
    expect(generated).toContain("--f-mono: var(--font-loaded-mono, ui-monospace)");
  });

  it("fait primer le thème explicite sur la préférence système", () => {
    expect(generated).toContain(':root:not([data-theme="light"])');
    expect(generated).toContain(':root[data-theme="dark"]');
  });

  it.each(GENERATED_NAMESPACES)("refuse une source où « %s » manque", (namespace) => {
    const broken = { ...tokens, [namespace]: undefined };
    expect(() => generateTokensCss(broken)).toThrow(new RegExp(namespace));
  });

  it("refuse une couleur hexadécimale invalide", () => {
    const broken = { ...tokens, color: { ...tokens.color, ink: { light: "bleu", dark: "#000000" } } };
    expect(() => generateTokensCss(broken)).toThrow(/hexadécimale/);
  });

  it("refuse un espacement qui n'est pas un nombre", () => {
    const broken = { ...tokens, space: { ...tokens.space, 1: "4px" } };
    expect(() => generateTokensCss(broken)).toThrow(/space\.1/);
  });
});

/**
 * Les animations JavaScript lisent les courbes dans le CSS calculé. Si le
 * format change, elles retomberaient silencieusement sur une courbe neutre —
 * et le dépliage perdrait son caractère sans que rien ne le signale.
 */
describe("la lecture des courbes par les animations", () => {
  it.each(Object.entries<string>(tokens.ease))("sait relire la courbe « %s »", (_, value) => {
    const parsed = parseCubicBezier(value);
    expect(parsed).not.toBeNull();
    expect(parsed).toHaveLength(4);
  });

  it("rend null sur une valeur qui n'est pas une courbe", () => {
    expect(parseCubicBezier("linear")).toBeNull();
    expect(parseCubicBezier("cubic-bezier(1,2)")).toBeNull();
  });
});

/**
 * La garde qui donne son sens à tout le générateur : si une valeur de design
 * peut être écrite à la main dans une feuille de style, alors rien ne dérive
 * plus de `tokens.json`.
 */
describe("aucune valeur de design écrite en dur dans le CSS de l'application", () => {
  const stylesheets = ["base.css", "motion.css", "components.css", "disclosure.css"].map((name) => ({
    name,
    css: readFileSync(resolve(ROOT, "src/styles", name), "utf8"),
  }));

  it.each(stylesheets)("$name ne contient aucune couleur hexadécimale", ({ css }) => {
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });

  it.each(stylesheets)("$name ne contient aucune courbe de Bézier littérale", ({ css }) => {
    expect(css.match(/cubic-bezier\(/g) ?? []).toEqual([]);
  });
});
