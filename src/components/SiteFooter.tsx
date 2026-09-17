import type { Chrome } from "@/content/types";

/** Le pied de page porte la forme longue du nom — la seule occurrence avec le CV. */
export function SiteFooter({ chrome }: { readonly chrome: Chrome }) {
  return (
    <footer className="wrap">
      <div className="site-footer">
        <span>Amissan Boris-David Amoussou-Guenou — {chrome.footerRole}</span>
        <span>{chrome.footerLocation}</span>
      </div>
    </footer>
  );
}
