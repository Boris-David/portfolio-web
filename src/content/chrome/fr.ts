import type { SiteChrome } from "@/content/chrome/types";

/**
 * The interface chrome in French.
 *
 * No facts here — no figure, no date, no sentence from the record. All of that
 * comes from the API. This file carries only what exists because there is a
 * page: gestures, navigation landmarks and search metadata.
 */
export const frChrome: SiteChrome = {
  meta: {
    title: "Amissan Amoussou-G. — Ingénieur iOS senior",
    description: "Ingénieur iOS senior, spécialiste de la billettique mobile chez Instant System. 33 applications de transport en production embarquent ma couche de billettique. Alpes-Maritimes, télétravail.",
    ogImageAlt: "Amissan Amoussou-G., ingénieur iOS senior — billettique mobile",
  },
  chrome: {
    navLabel: "Navigation principale",
    navLinks: [
      {
        target: "cas",
        label: "Problèmes",
      },
      {
        target: "apps",
        label: "Applications",
      },
      {
        target: "profondeur",
        label: "Expertise",
      },
      {
        target: "parcours",
        label: "Missions",
      },
      {
        target: "formation",
        label: "Formation",
      },
      {
        target: "contact",
        label: "Contact",
      },
    ],
    cvLabel: "CV",
    cvAriaLabel: "Ouvrir le CV en PDF (français), nouvel onglet",
    themeToggleLabel: "Changer de thème",
    skipToContent: "Aller au contenu",
    otherLocaleCode: "EN",
    otherLocaleLabel: "Switch to English",
    footerRole: "ingénieur iOS",
    footerLocation: "Alpes-Maritimes, France · télétravail",
  },
  heroCtas: {
    primary: "Me contacter",
  },
  backgroundTitles: {
    education: "Formation",
    certifications: "Certifications",
    openProjects: "Projets ouverts",
  },
  verifyCertificate: "Vérifier le certificat",
  sourceCode: "Code source",
  mailCta: "Écrire un mail",
};
