import type { Metadata } from "next";
import { buildMetadata, LayoutShell } from "@/app/layout-shell";

/** The English root, served at `/en`. See the French root for the mechanism. */
export const generateMetadata = (): Promise<Metadata> => buildMetadata("en");

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <LayoutShell locale="en">{children}</LayoutShell>;
}
