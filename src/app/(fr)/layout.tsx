import type { Metadata } from "next";
import { buildMetadata, LayoutShell } from "@/app/layout-shell";

/**
 * Racine française, servie à `/`.
 *
 * Next autorise plusieurs racines dès lors que chaque route vit dans un groupe.
 * C'est ce qui donne à chaque langue son propre `<html lang>`, ses propres
 * métadonnées et sa propre URL canonique — sans réécriture d'URL ni middleware
 * sur le chemin critique.
 */
export const generateMetadata = (): Promise<Metadata> => buildMetadata("fr");

export default function FrenchLayout({ children }: { children: React.ReactNode }) {
  return <LayoutShell locale="fr">{children}</LayoutShell>;
}
