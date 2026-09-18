import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Chrome, Locale, ProfileLink } from "@/content/types";
import { cvUrl, otherLocale, pathForLocale } from "@/lib/site";

/**
 * The navigation bar.
 *
 * Two of its links deserve an explanation:
 *
 * **The language** is a real link to a real page (`/` ↔ `/en`), not a button
 * that would rewrite the DOM. A JavaScript switch has no URL to share, nothing
 * to index per language, and breaks the back button.
 *
 * **The résumé** leaves the site: it is the PDF produced by the API (ADR 0004).
 *
 * It opens in a new tab, and carries **no** `download`. Two facts force that,
 * verified against the API in production rather than assumed: it serves the PDF
 * with `Content-Disposition: inline`, and the `download` attribute is in any
 * case **ignored by browsers on a cross-origin link**. `amissan.dev` and
 * `api.amissan.dev` are the same site but not the same origin: the attribute
 * would have done nothing. Keeping it would have promised a download that
 * nothing triggers — so the `aria-label` says "open".
 */
export function SiteHeader({
  chrome,
  locale,
  brand,
  links,
}: {
  readonly chrome: Chrome;
  readonly locale: Locale;
  /** The displayed name — a fact, so served by the source, never written here. */
  readonly brand: string;
  /** The public profiles, the same list as the Contact section. */
  readonly links: readonly ProfileLink[];
}) {
  return (
    <nav className="nav" aria-label={chrome.navLabel}>
      <div className="nav__inner">
        <span className="nav__brand">{brand}</span>

        <div className="nav__links">
          {chrome.navLinks.map((link) => (
            <a key={link.target} className="nav__link" href={`#${link.target}`} data-nav-link="">
              {/* The <span> carries the underline; the link carries the 44 px target. */}
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

          {/* Shortcuts dropped below 640 px: the Contact section carries them in full. */}
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
            {/* Hidden below 640 px: the English label "Résumé" would overflow the bar there. */}
            <span className="btn__label">{chrome.cvLabel}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
