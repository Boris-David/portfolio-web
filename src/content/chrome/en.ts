import type { SiteChrome } from "@/content/chrome/types";

/**
 * The interface chrome in English.
 *
 * Same rules as `fr.ts`: no facts, only what exists because there is a page.
 */
export const enChrome: SiteChrome = {
  meta: {
    title: "Amissan Amoussou-G. — Senior iOS Engineer",
    description: "Senior iOS engineer specialised in mobile ticketing at Instant System. 33 transport apps in production ship my ticketing layer. French Riviera, remote.",
    ogImageAlt: "Amissan Amoussou-G., senior iOS engineer — mobile ticketing",
  },
  chrome: {
    navLabel: "Main navigation",
    navLinks: [
      {
        target: "cas",
        label: "Projects",
      },
      {
        target: "apps",
        label: "Apps",
      },
      {
        target: "profondeur",
        label: "Expertise",
      },
      {
        target: "parcours",
        label: "Experience",
      },
      {
        target: "formation",
        label: "Education",
      },
      {
        target: "contact",
        label: "Contact",
      },
    ],
    cvLabel: "Résumé",
    cvAriaLabel: "Open the résumé as a PDF (English), new tab",
    themeToggleLabel: "Switch theme",
    skipToContent: "Skip to content",
    otherLocaleCode: "FR",
    otherLocaleLabel: "Repasser en français",
    footerRole: "iOS engineer",
    footerLocation: "French Riviera, France · remote",
  },
  heroCtas: {
    primary: "Get in touch",
    secondary: "See my work",
  },
  backgroundTitles: {
    education: "Education",
    certifications: "Certifications",
    openProjects: "Open projects",
  },
  verifyCertificate: "Verify certificate",
  sourceCode: "Source code",
  mailCta: "Send an email",
};
