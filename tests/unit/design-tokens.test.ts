import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateTokensCss, GENERATED_NAMESPACES } from "../../scripts/design-tokens.mjs";
import { parseCubicBezier } from "@/lib/effects/design-runtime";

const ROOT = resolve(__dirname, "../..");
const tokens = JSON.parse(readFileSync(resolve(ROOT, "design/tokens.json"), "utf8"));
const generated = readFileSync(resolve(ROOT, "src/styles/tokens.generated.css"), "utf8");

/**
 * The generator is the piece that guarantees no design value is copied out by
 * hand. These tests check that it produces what we think it does, and above all
 * that it **breaks** when the source is inconsistent.
 */
describe("the token generator", () => {
  it("produces exactly the tracked file", () => {
    expect(generateTokensCss(tokens)).toBe(generated);
  });

  it("emits every colour in both themes", () => {
    for (const [name, value] of Object.entries<Record<string, string>>(tokens.color)) {
      expect(generated).toContain(`--${name}: ${value.light};`);
      expect(generated).toContain(`--${name}: ${value.dark};`);
    }
  });

  it("emits every spacing, radius and easing curve", () => {
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

  it("derives the minimum touch target from the accessibility tokens", () => {
    expect(generated).toContain(`--touch-target: ${tokens.a11y.minTouchTarget}px;`);
  });

  /**
   * `--radius-md: var(--radius-md)` is a cycle: the browser then applies
   * nothing at all, silently. That is precisely the bug the first version of the
   * generator produced, hence this test.
   */
  it("produces no variable that references itself", () => {
    const cycles = [...generated.matchAll(/^\s*(--[\w-]+):\s*var\(\1\)/gm)];
    expect(cycles.map((match) => match[1])).toEqual([]);
  });

  it("leaves an injection point for the font loader, with a fallback", () => {
    expect(generated).toContain('--f-display: var(--font-loaded-display, "Fraunces"), Georgia, serif;');
    // `ui-monospace` is a CSS keyword: quoting it would make it inoperative.
    expect(generated).toContain("--f-mono: var(--font-loaded-mono, ui-monospace)");
  });

  it("makes the explicit theme win over the system preference", () => {
    expect(generated).toContain(':root:not([data-theme="light"])');
    expect(generated).toContain(':root[data-theme="dark"]');
  });

  it.each(GENERATED_NAMESPACES)("rejects a source where “%s” is missing", (namespace) => {
    const broken = { ...tokens, [namespace]: undefined };
    expect(() => generateTokensCss(broken)).toThrow(new RegExp(namespace));
  });

  it("rejects an invalid hexadecimal colour", () => {
    const broken = { ...tokens, color: { ...tokens.color, ink: { light: "bleu", dark: "#000000" } } };
    expect(() => generateTokensCss(broken)).toThrow(/hexadecimal/);
  });

  it("rejects a spacing that is not a number", () => {
    const broken = { ...tokens, space: { ...tokens.space, 1: "4px" } };
    expect(() => generateTokensCss(broken)).toThrow(/space\.1/);
  });
});

/**
 * The JavaScript animations read their easing curves out of the computed CSS. If
 * the format changed, they would silently fall back to a neutral curve — and the
 * disclosure would lose its character with nothing to flag it.
 */
describe("how the animations read the easing curves", () => {
  it.each(Object.entries<string>(tokens.ease))("can read the “%s” curve back", (_, value) => {
    const parsed = parseCubicBezier(value);
    expect(parsed).not.toBeNull();
    expect(parsed).toHaveLength(4);
  });

  it("returns null on a value that is not a curve", () => {
    expect(parseCubicBezier("linear")).toBeNull();
    expect(parseCubicBezier("cubic-bezier(1,2)")).toBeNull();
  });
});

/**
 * The guard that gives the whole generator its meaning: if a design value can be
 * written by hand in a stylesheet, then nothing derives from `tokens.json` any
 * more.
 */
describe("no design value hard-coded in the application CSS", () => {
  const stylesheets = ["base.css", "motion.css", "components.css", "disclosure.css"].map((name) => ({
    name,
    css: readFileSync(resolve(ROOT, "src/styles", name), "utf8"),
  }));

  it.each(stylesheets)("$name contains no hexadecimal colour", ({ css }) => {
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });

  it.each(stylesheets)("$name contains no literal Bézier curve", ({ css }) => {
    expect(css.match(/cubic-bezier\(/g) ?? []).toEqual([]);
  });
});
