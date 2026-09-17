"use client";

import { Icon } from "@/components/Icon";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * La bascule de thème.
 *
 * Ce composant **ne tient aucun état**, et c'est le point important : le thème
 * est déjà porté par `data-theme` sur `<html>`, posé par un script inline avant
 * la première peinture. Le dupliquer dans un `useState` créerait une seconde
 * vérité — désynchronisée pendant toute l'hydratation, puisque React ne sait
 * rien de ce que le script a décidé.
 *
 * On lit donc le DOM au moment du clic, et on lui réécrit. L'icône, elle, est
 * choisie par le CSS selon le thème effectif : le bouton est juste dès le HTML
 * serveur, avant même que ce composant ne soit hydraté.
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
      // Navigation privée, stockage refusé : le thème vaut pour cette page, et c'est tout.
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
