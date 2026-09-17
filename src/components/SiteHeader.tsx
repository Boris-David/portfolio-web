import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Chrome, Locale, ProfileLink } from "@/content/types";
import { cvUrl, otherLocale, pathForLocale } from "@/lib/site";

/**
 * La barre de navigation.
 *
 * Deux liens y méritent une explication :
 *
 * **La langue** est un vrai lien vers une vraie page (`/` ↔ `/en`), pas un
 * bouton qui réécrirait le DOM. Une bascule en JavaScript n'a pas d'URL à
 * partager, rien à indexer par langue, et casse le bouton « précédent ».
 *
 * **Le CV** sort du site : c'est le PDF produit par l'API (ADR 0004).
 *
 * Il s'ouvre dans un nouvel onglet, et ne porte **pas** `download`. Deux faits
 * l'imposent, vérifiés sur l'API en production plutôt que supposés : elle sert
 * le PDF en `Content-Disposition: inline`, et l'attribut `download` est de toute
 * façon **ignoré par les navigateurs sur un lien d'origine différente**.
 * `amissan.dev` et `api.amissan.dev` sont du même site mais pas de la même
 * origine : l'attribut n'aurait rien fait. Le garder aurait été promettre un
 * téléchargement que rien ne déclenche — l'`aria-label` dit donc « ouvrir ».
 */
export function SiteHeader({
  chrome,
  locale,
  brand,
  links,
}: {
  readonly chrome: Chrome;
  readonly locale: Locale;
  /** Le nom affiché — un fait, donc servi par la source, jamais écrit ici. */
  readonly brand: string;
  /** Les profils publics, la même liste que la section Contact. */
  readonly links: readonly ProfileLink[];
}) {
  return (
    <nav className="nav" aria-label={chrome.navLabel}>
      <div className="nav__inner">
        <span className="nav__brand">{brand}</span>

        <div className="nav__links">
          {chrome.navLinks.map((link) => (
            <a key={link.target} className="nav__link" href={`#${link.target}`} data-nav-link="">
              {/* Le <span> porte le soulignement ; le lien porte la cible de 44 px. */}
              <span>{link.label}</span>
            </a>
          ))}
        </div>

        <div className="nav__actions">
          <Link
            className="icon-btn icon-btn--lang lift press"
            href={pathForLocale(otherLocale(locale))}
            hrefLang={otherLocale(locale)}
            aria-label={chrome.otherLocaleLabel}
            data-testid="locale-switch"
          >
            {chrome.otherLocaleCode}
          </Link>

          <ThemeToggle label={chrome.themeToggleLabel} />

          {/* Raccourcis retirés sous 640 px : la section Contact les porte en entier. */}
          {links.map((link) => (
            <a
              key={link.id}
              className="icon-btn nav__social lift press"
              href={link.href}
              aria-label={link.label}
            >
              <Icon name={link.id} />
            </a>
          ))}

          <a
            className="btn btn--sm lift press"
            href={cvUrl(locale)}
            aria-label={chrome.cvAriaLabel}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="cv-link"
          >
            <Icon name="document" />
            {/* Masqué sous 640 px : l'intitulé anglais « Résumé » y ferait déborder la barre. */}
            <span className="btn__label">{chrome.cvLabel}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
