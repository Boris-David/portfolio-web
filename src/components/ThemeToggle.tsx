"use client";

import { Icon } from "@/components/Icon";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * The theme toggle.
 *
 * This component **holds no state**, and that is the point: the theme is
 * already carried by `data-theme` on `<html>`, set by an inline script before
 * the first paint. Duplicating it in a `useState` would create a second truth —
 * out of sync for the whole of hydration, since React knows nothing of what the
 * script decided.
 *
 * So we read the DOM at click time, and write back to it. The icon is picked by
 * the CSS according to the effective theme: the button is correct from the
 * server HTML onwards, before this component is even hydrated.
 */
export function ThemeToggle({ label }: { readonly label: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme");
    const effective: Theme =
      current === "dark" || current === "light" ? current : resolveSystemTheme();
    const next: Theme = effective === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing, storage refused: the theme holds for this page, and that is all.
    }
  };

  return (
    <button className="icon-btn lift press" type="button" onClick={toggle} aria-label={label}>
      <Icon name="moon" className="only-light" />
      <Icon name="sun" className="only-dark" />
    </button>
  );
}

function resolveSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
