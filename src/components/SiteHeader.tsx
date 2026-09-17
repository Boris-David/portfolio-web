import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GITHUB_URL, LINKEDIN_URL } from "@/content/links";
import type { Chrome, Locale } from "@/content/types";
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
 * **Le CV** sort du site : c'est le PDF produit par l'API (ADR 0004). Il porte
 * donc `download`, et son `aria-label` annonce le format et la langue — un lien
 * qui déclenche un téléchargement doit le dire avant le clic.
 */
export function SiteHeader({
  chrome,
  locale,
}: {
  readonly chrome: Chrome;
  readonly locale: Locale;
}) {
  return (
    <nav className="nav" aria-label={chrome.navLabel}>
      <div className="nav__inner">
        <span className="nav__brand">Amissan Amoussou-G.</span>

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
          <a className="icon-btn nav__social lift press" href={GITHUB_URL} aria-label="GitHub">
            <Icon name="github" />
          </a>
          <a className="icon-btn nav__social lift press" href={LINKEDIN_URL} aria-label="LinkedIn">
            <Icon name="linkedin" />
          </a>

          <a
            className="btn btn--sm lift press"
            href={cvUrl(locale)}
            aria-label={chrome.cvAriaLabel}
            download
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
