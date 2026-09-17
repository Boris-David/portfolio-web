import type { Locale } from "@/content/types";

/**
 * Les territoires sont des noms de lieux : ils ne se traduisent pas, ils ont
 * — ou non — un exonyme.
 *
 * Cette table ne contient donc que les deux cas où la maquette de référence
 * emploie elle-même une forme anglaise (« from Lyon to Tuscany, all the way to
 * French Polynesia »). Tout le reste est laissé tel quel : traduire « Alès » ou
 * « Centre-Val de Loire » serait inventer, et inventer un nom de lieu sur un
 * portfolio se voit immédiatement.
 */
const EXONYMS: Readonly<Record<string, string>> = {
  "Toscane, Italie": "Tuscany, Italy",
  "Polynésie française": "French Polynesia",
  "Projet personnel": "Personal project",
};

export function localizeTerritory(territory: string, locale: Locale): string {
  if (locale === "fr") return territory;
  return EXONYMS[territory] ?? territory;
}
