/**
 * Reading the design tokens from the CSS, at runtime.
 *
 * JavaScript animations need the same easing curves as the CSS transitions.
 * Copying them into the code — `[0.65, 0.02, 0.28, 1]` — would create a second
 * source of truth for the design: changing a curve in `tokens.json` would leave
 * the disclosure on the old one, with nothing to say so.
 *
 * So we read the custom property the browser has already computed. The fallback
 * is not a design value: it is a neutral curve, present only so that an
 * environment without computed CSS (jsdom in tests) does not break.
 */

export type CubicBezier = [number, number, number, number];

/** Neutral fallback — never a design system value, so as not to duplicate one. */
const neutral = (): CubicBezier => [0.25, 0.1, 0.25, 1];

const CUBIC_BEZIER = /cubic-bezier\(\s*([^)]+)\)/;

export function parseCubicBezier(value: string): CubicBezier | null {
  const match = CUBIC_BEZIER.exec(value);
  if (!match) return null;
  const numbers = match[1].split(",").map((part) => Number(part.trim()));
  if (numbers.length !== 4 || numbers.some((n) => !Number.isFinite(n))) return null;
  return [numbers[0], numbers[1], numbers[2], numbers[3]];
}

/**
 * @param variable the name of the variable, for example `--e-io`.
 */
export function readEasing(variable: string): CubicBezier {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return neutral();
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable);
  return parseCubicBezier(raw) ?? neutral();
}
