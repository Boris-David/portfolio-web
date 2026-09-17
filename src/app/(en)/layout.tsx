import type { Metadata } from "next";
import { buildMetadata, LayoutShell } from "@/app/layout-shell";

/** Racine anglaise, servie à `/en`. Voir la racine française pour le mécanisme. */
export const generateMetadata = (): Promise<Metadata> => buildMetadata("en");

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <LayoutShell locale="en">{children}</LayoutShell>;
}
