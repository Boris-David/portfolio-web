import type { Metadata } from "next";
import { buildMetadata, LayoutShell } from "@/app/layout-shell";

/**
 * The French root, served at `/`.
 *
 * Next allows several roots as long as every route lives inside a group. That
 * is what gives each language its own `<html lang>`, its own metadata and its
 * own canonical URL — with no URL rewriting and no middleware on the critical
 * path.
 */
export const generateMetadata = (): Promise<Metadata> => buildMetadata("fr");

export default function FrenchLayout({ children }: { children: React.ReactNode }) {
  return <LayoutShell locale="fr">{children}</LayoutShell>;
}
