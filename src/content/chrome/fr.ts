import type { SiteChrome } from "@/content/chrome/types";

/**
 * Le chrome d'interface en français.
 *
 * Aucun fait ici — ni chiffre, ni date, ni phrase du dossier. Tout cela vient
 * de l'API. Ce fichier ne porte que ce qui n'existe que parce qu'il y a une
 * page : des gestes, des repères de navigation et le référencement.
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
        label: "Études de cas",
      },
      {
        target: "apps",
        label: "Applications",
      },
      {
        target: "profondeur",
        label: "Profondeur",
      },
      {
        target: "parcours",
        label: "Parcours",
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
    secondary: "Voir mon travail",
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
