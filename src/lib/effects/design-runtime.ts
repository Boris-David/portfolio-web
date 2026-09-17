/**
 * Lire les tokens de design depuis le CSS, au runtime.
 *
 * Les animations JavaScript ont besoin des mêmes courbes que les transitions
 * CSS. Les recopier dans le code — `[0.65, 0.02, 0.28, 1]` — créerait une
 * deuxième source de vérité pour le design : changer une courbe dans
 * `tokens.json` laisserait le dépliage sur l'ancienne, sans que rien ne le dise.
 *
 * On lit donc la propriété personnalisée déjà calculée par le navigateur. Le
 * repli n'est pas une valeur de design : c'est une courbe neutre, présente
 * uniquement pour qu'un environnement sans CSS calculé (jsdom en test) ne casse
 * pas.
 */

export type CubicBezier = [number, number, number, number];

/** Repli neutre — jamais une valeur du design system, pour ne pas la dupliquer. */
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
 * @param variable le nom de la variable, par exemple `--e-io`.
 */
export function readEasing(variable: string): CubicBezier {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return neutral();
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable);
  return parseCubicBezier(raw) ?? neutral();
}
