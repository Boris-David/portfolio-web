import type { SiteContent } from "@/content/types";
import {
  EMAIL,
  KCALORIES_APP_STORE_URL,
  NEWS_APP_URL,
  SAFE_CERTIFICATE_URL,
  SCRUM_CERTIFICATE_URL,
} from "@/content/links";

/**
 * Le contenu français, tel qu'arbitré dans `.claude/rules/contenu-editorial.md`
 * du workspace. Chaque chiffre y est autorisé nommément ; aucun autre ne s'écrit
 * ici. Les formulations ont été validées — on les porte, on ne les réécrit pas.
 */
export const fr: SiteContent = {
  locale: "fr",

  meta: {
    title: "Amissan Amoussou-G. — Ingénieur iOS senior",
    description:
      "Ingénieur iOS senior, spécialiste de la billettique mobile chez Instant System. 33 applications de transport en production embarquent ma couche de billettique. Alpes-Maritimes, télétravail.",
    ogImageAlt: "Amissan Amoussou-G., ingénieur iOS senior — billettique mobile",
  },

  chrome: {
    navLabel: "Navigation principale",
    navLinks: [
      { target: "cas", label: "Études de cas" },
      { target: "apps", label: "Applications" },
      { target: "profondeur", label: "Profondeur" },
      { target: "parcours", label: "Parcours" },
      { target: "contact", label: "Contact" },
    ],
    cvLabel: "CV",
    cvAriaLabel: "Télécharger le CV en PDF (français)",
    themeToggleLabel: "Changer de thème",
    skipToContent: "Aller au contenu",
    otherLocaleCode: "EN",
    otherLocaleLabel: "Switch to English",
    footerRole: "ingénieur iOS",
    footerLocation: "Alpes-Maritimes, France · télétravail",
  },

  hero: {
    availability: "Ouvert aux opportunités",
    role: "Ingénieur iOS senior",
    name: "Amissan Amoussou-G.",
    lede: [
      "Je développe la **billettique mobile** chez **Instant System**, et c'est mon domaine d'expertise. J'ai travaillé dans un grand groupe comme dans une startup de dix personnes, et j'y arrive toujours de la même façon : je prends un périmètre, je l'apprends à fond, et je le rends fiable.",
      "Ce que j'apporte au-delà du code, ce sont des faits, pas des adjectifs : **j'ai tenu seul la billettique d'un portefeuille entier pendant un an**, et la bibliothèque anti-fraude qui protège nos titres dématérialisés est née d'une initiative personnelle — elle tourne aujourd'hui sur nos deux socles.",
    ],
    meta: [
      { icon: "pin", label: "Alpes-Maritimes" },
      { icon: "home", label: "Opportunités de télétravail complet et fréquent" },
      { icon: "globe", label: "Français · anglais professionnel (TOEIC 840)" },
    ],
    primaryCta: "Me contacter",
    secondaryCta: "Voir mon travail",
    shotAlt: "Écran principal de KCalories : le journal alimentaire de la journée.",
    shotTag: "KCalories — sur l'App Store",
  },

  proof: [
    { value: "33", counts: true, label: "applications de transport en production embarquent mon travail" },
    { value: "6", unit: "ans", counts: true, label: "d'ingénierie iOS, depuis octobre 2020" },
    { prefix: "~", value: "1", unit: "M", label: "d'utilisateurs sur Mail Orange" },
    { prefix: "> ", value: "99,8", unit: "%", label: "de sessions sans crash sur KCalories" },
  ],

  casesHead: {
    eyebrow: "01 · Études de cas",
    title: "Deux projets racontés comme un ingénieur produit",
    intro:
      "Le problème, les décisions que j'ai prises, et ce qu'elles ont produit. Ce n'est pas la syntaxe Swift qui se juge ici, c'est le jugement technique.",
  },

  cases: [
    {
      kind: "workstreams",
      id: "billettique",
      title: "La billettique mobile de 33 réseaux de transport",
      subtitle: "Instant System · depuis mai 2023 · en production",
      iconStack: ["tcl", "oura", "at-bus", "tere-tahiti", "twisto"],
      iconStackMore: "+28",
      labels: { problem: "Problème", decision: "Décision", result: "Résultat" },
      intro:
        "J'arrive dans une équipe **sans aucun développeur mobile**, seul sur le périmètre billettique de l'ensemble du portefeuille — pendant un an. Voici cinq chantiers, avec le problème qui les a déclenchés et ce qu'ils ont produit.",
      workstreams: [
        {
          id: "authentification",
          title: "L'authentification qui déconnectait sans raison",
          summary: "Un code hérité que personne ne voulait toucher — refondu avec des acteurs",
          problem: [
            "Quand plusieurs requêtes recevaient une réponse « non autorisé » **en même temps**, chacune déclenchait son propre rafraîchissement de jeton. Les rafraîchissements concurrents s'invalidaient entre eux, et l'utilisateur se retrouvait **déconnecté sans raison apparente**. Le code d'authentification datait de 2019 et personne ne voulait y toucher.",
          ],
          decision: [
            "J'ai pris l'initiative de la refonte, et je suis passé en `async/await` avec un **acteur** pour porter l'état d'authentification.",
            "**Pourquoi un acteur plutôt qu'un verrou :** un verrou protège l'état à condition qu'on pense à le prendre partout — rien ne le vérifie, et un verrou tenu pendant une attente asynchrone est un blocage qui n'attend que son heure. Avec un acteur, l'isolation devient une **propriété du type** : tout accès venant de l'extérieur est nécessairement sérialisé, et l'oubli n'est plus possible.",
            "Le cœur de la correction : la **tâche de rafraîchissement en cours est mémorisée**. Les requêtes concurrentes n'en lancent pas une nouvelle, elles attendent la même. Un seul rafraîchissement, quel que soit le nombre d'appels simultanés — plus une garde contre la boucle de réessais sur un même appel.",
          ],
          result: [
            "**L'authentification sur TCL est devenue nettement plus stable.** Fin des déconnexions inexpliquées — celles qu'on ne reproduit jamais en test et qu'on ne voit qu'en production.",
          ],
          chips: ["actor", "async/await", "Task", "Sendable"],
        },
        {
          id: "anti-fraude",
          title: "La fraude au QR code",
          summary: "Une initiative en sprint d'innovation, devenue une fonctionnalité vendue",
          problem: [
            "Un titre dématérialisé s'affiche en QR code. Les fraudeurs en prenaient une **capture d'écran** qu'ils transmettaient à des tiers — et au contrôle, rien ne distinguait la copie de l'original.",
          ],
          decision: [
            "En **sprint d'innovation**, j'ai pris l'initiative de concevoir une bibliothèque interne qui **masque le contenu de l'écran** dès qu'une capture ou un enregistrement est en cours. Le titre reste lisible pour son porteur, et disparaît de tout ce qui pourrait être partagé.",
          ],
          result: [
            "Déployée sur **l'ensemble des applications**, puis **reprise sur le nouveau socle**. Les clients en sont satisfaits — au point que c'est devenu une **fonctionnalité qu'ils paient**. Une idée de sprint devenue une ligne de valeur.",
          ],
        },
        {
          id: "rechargement",
          title: "Le rechargement de carte sur le réseau lyonnais",
          summary: "Du POC à la production, développé quasiment seul",
          problem: [
            "Le réseau lyonnais attendait de pouvoir **recharger une carte de transport depuis le mobile**. Côté iOS, tout restait à faire : l'intégration du SDK du prestataire de billettique n'avait jamais été menée.",
          ],
          decision: [
            "J'ai d'abord **prouvé l'intégration par un POC** — un POC ne doit pas montrer que ça marche, il doit montrer ce qui va coincer en production. Puis j'ai développé **quasiment seul la fonctionnalité complète sur iOS**, jusqu'à la mise en production.",
          ],
          result: [
            "Livrée. Je suis aujourd'hui **l'un des référents techniques de l'application TCL**, dont je suis l'expert, et je porte le **lancement du m-ticket** dessus.",
          ],
        },
        {
          id: "architecture",
          title: "Tenir la clean architecture jusqu'au bout",
          summary: "Le produit porte le défaut, le prestataire n'override que sa différence",
          problem: [
            "L'architecture d'abstraction par prestataire de billettique avait été posée par le tech lead. Mais des implémentations **totalement indépendantes du prestataire** vivaient quand même dans les modules prestataires — donc dupliquées autant de fois qu'il y a de fournisseurs.",
          ],
          decision: [
            "J'ai **créé le module d'un nouveau prestataire** alors qu'il présentait peu de spécificités : le faire vivre à part aurait été plus court, mais aurait laissé un trou dans l'architecture. La cohérence de bout en bout valait la ligne de code en plus.",
            "Et j'ai **milité pour — et obtenu — la remontée au niveau du produit** des implémentations indépendantes du prestataire. Les prestataires ne surchargent plus que ce qu'ils veulent réellement changer.",
          ],
          result: [
            "Moins de duplication entre fournisseurs, et une **règle claire qui tient sans arbitrage** : le produit porte le comportement par défaut, le prestataire n'override que sa différence.",
          ],
        },
        {
          id: "socle",
          title: "Le lancement du nouveau socle",
          summary: "Oùra et la Toscane, sur tous les pans fonctionnels",
          problem: [
            "Le nouveau socle produit, en clean architecture avec injection de dépendances, devait embarquer toute la billettique — sans régression par rapport à un socle éprouvé depuis des années.",
          ],
          decision: [
            "Je suis intervenu sur **tous les pans fonctionnels** : catalogue d'achat, panier, produits à paramètres, historiques d'achat, gestion de bénéficiaires, achat pour autrui. Et j'ai écrit la **bibliothèque interne de génération des QR codes** à partir d'un payload encodé — la brique qui porte la validation du titre et son contrôle.",
          ],
          result: [
            "Socle lancé sur **Oùra** (Auvergne-Rhône-Alpes) et sur la **Toscane**. J'y ai appris SwiftUI, l'injection de dépendances et cette architecture **en production, sur un produit livré**.",
          ],
        },
      ],
      tags: [
        "Swift",
        "SwiftUI",
        "UIKit",
        "Swift Concurrency",
        "Acteurs",
        "Clean Architecture",
        "Modules SPM",
        "Injection de dépendances",
        "XcodeGen",
        "Jenkins",
        "fastlane · match",
      ],
    },
    {
      kind: "columns",
      id: "kcalories",
      title: "KCalories — quatre stacks, seul, en cinq mois",
      subtitle: "Projet personnel · publiée sur l'App Store",
      iconSlug: "kcalories",
      link: { href: KCALORIES_APP_STORE_URL, label: "App Store" },
      labels: {
        problem: "Problème",
        decision: "Décisions et réalisations",
        result: "Résultats",
      },
      problem: [
        "J'ai payé pour trois applications de suivi nutritionnel. Le prix n'a jamais été le frein — **aucune ne réunissait tout** : le jeûne, le suivi calorique, le suivi cétogène en glucides nets, et une interface qui ne se subit pas.",
        "Je voulais aussi savoir si je pouvais tenir un produit entier, pas seulement une couche iOS.",
      ],
      decisions: [
        "**Construire les quatre stacks moi-même** plutôt que d'assembler des services : application iOS, backend, back-office d'administration, page de présentation. Tenir le produit de bout en bout était le but, pas un moyen.",
        "**Architecture stricte et modules SPM dès le premier jour**, quand rien ne l'imposait encore — les frontières se posent avant d'avoir de quoi les remplir, sinon elles ne se posent jamais.",
        "**Feature flags et intégration continue dès la première semaine**, pour livrer sans bloquer et sans rituel manuel.",
      ],
      results: [
        "**Publiée sur l'App Store cinq mois** après la première ligne de code.",
        "**Plus de 99,8 % de sessions sans crash** — la qualité se mesure, elle ne se déclare pas.",
        "**Version 2.0 vingt jours** après la 1.0 : la chaîne de livraison tenait.",
        "Disponible en **français et en anglais**, avec deux thèmes complets.",
      ],
      gallery: [
        {
          file: "03-jeune.jpg",
          alt: "Écran de jeûne intermittent, intégré au journal.",
          caption: "Le jeûne, dans le journal",
        },
        {
          file: "04-traversee.jpg",
          alt: "Les six phases physiologiques du jeûne.",
          caption: "Les six phases physiologiques",
        },
        {
          file: "05-regimes-keto.jpg",
          alt: "Sélection des régimes alimentaires, dont le cétogène.",
          caption: "Régimes et glucides nets",
        },
        {
          file: "02-themes.jpg",
          alt: "Les deux thèmes visuels de l'application.",
          caption: "Deux thèmes complets",
        },
      ],
      tags: [
        "SwiftUI",
        "SwiftData",
        "Clean Architecture",
        "Modules SPM",
        "Feature flags",
        "Backend",
        "Back-office",
        "CI/CD",
        "FR · EN",
      ],
    },
  ],

  appsHead: {
    eyebrow: "02 · En production",
    title: "33 applications, 3 territoires, un même socle",
    intro:
      "Chez Instant System, les applications de transport sont construites en marque blanche sur un socle commun. **La couche de billettique que je développe et maintiens est embarquée dans chacune de celles-ci** — de Lyon à la Toscane, jusqu'à la Polynésie française.",
  },
  appsNote:
    "Applications éditées par les autorités de transport et leurs exploitants. Ma contribution porte sur la couche mobile de billettique — achat, usage, validation et contrôle — et son intégration dans chaque application.",

  depthHead: {
    eyebrow: "03 · Profondeur technique",
    title: "Là où je vais au fond",
    intro:
      "Trois sujets creusés, plutôt que quinze technologies listées. Ce sont ceux sur lesquels je peux être challengé une heure durant.",
  },
  depth: [
    {
      icon: "flow",
      title: "Concurrence et état partagé",
      body: "Les jetons de session, leur renouvellement et les retours d'erreur sont l'endroit où les accès concurrents produisent les bugs qu'on ne reproduit jamais. Acteurs, `async/await`, isolation : ce que le compilateur garantit à ma place vaut mieux que ce que je promets de vérifier.",
    },
    {
      icon: "layers",
      title: "Frontières et modularisation",
      body: "Clean Architecture en modules séparés plutôt qu'en dossiers, et des modules qui dépendent d'un contrat, jamais d'une implémentation. Une frontière que le compilateur ne refuse pas n'est pas une frontière — c'est une convention qu'on finit par oublier.",
    },
    {
      icon: "gear",
      title: "Du code au produit livré",
      body: "Génération de projet par spec plutôt que par fichier binaire, signature gérée par fastlane et match, pipelines par produit et par module, feature flags pour découpler la livraison de la mise en service. Ce qui n'est pas automatisé finit par ne pas être fait.",
    },
  ],

  background: {
    head: { eyebrow: "04 · Parcours", title: "Expériences, formation et certifications" },
    jobs: [
      {
        id: "instant-system",
        title: "Ingénieur iOS",
        company: "Instant System · Sophia Antipolis",
        dates: "mai 2023 → aujourd'hui",
        openByDefault: true,
        roles: [
          "Référent technique billettique",
          "Scrum Master · depuis février 2025",
          "Ambassadeur IA",
          "Tuteur",
        ],
        bullets: [
          "**Seul développeur mobile** du périmètre billettique pendant un an, sur l'ensemble du portefeuille : stabilisation de la production et développement de fonctionnalités.",
          "Développement **quasiment seul du rechargement de carte de transport** sur l'application TCL, dont je suis aujourd'hui l'un des référents techniques.",
          "Deux **bibliothèques internes** conçues et livrées : la protection anti-fraude des titres à l'écran, et la génération des QR codes de validation.",
          "**Création du module d'abstraction d'un nouveau prestataire billettique**, et remontée au niveau du produit des implémentations indépendantes du prestataire.",
          "**Refonte complète de la gestion de session** — jetons, renouvellement, retry, déconnexion — portée par des acteurs et `async/await`.",
          "**Onboarding de tous les développeurs mobiles** arrivés après moi, iOS et Android ; tutorat officiel d'un développeur iOS.",
          "**Ateliers d'architecture avec le CTO** et les architectes ; démos client ; conduite d'entretiens de recrutement.",
          "**Scrum Master** de mon équipe sans quitter le développement — et resté l'un de ses principaux contributeurs techniques.",
        ],
        stack:
          "Swift · SwiftUI · UIKit · Swift Concurrency, acteurs, async/await · Combine · Clean Architecture 3 puis 4 couches · injection de dépendances · SPM, XCFrameworks, CocoaPods · XcodeGen et specs YAML · Jenkins · fastlane · match · Bitbucket · SAFe",
      },
      {
        id: "mail-orange",
        title: "Ingénieur iOS",
        company: "Mail Orange — Orange, via Inetum · Mougins",
        dates: "janv. 2022 → avr. 2023",
        bullets: [
          "Fonctionnalités et corrections sur une messagerie à **environ un million d'utilisateurs**, dans une équipe de trois développeurs iOS.",
          "Sujets menés **de bout en bout** dès les premières semaines : brouillons, gestion des pièces jointes.",
          "Maintien de la **compatibilité multi-versions d'iOS** et du **layout iPad**, sur une base très utilisée en tablette.",
          "Travail sur un existant hétérogène — VIPER sur le composeur, MVP ailleurs.",
          "Participation aux refinements et aux décisions techniques ; échanges avec les **équipes tierces** sur les services intégrés.",
        ],
        stack:
          "Swift · Objective-C · UIKit programmatique, xib, storyboards, Auto Layout · MVP · VIPER · Delegate, Observer · UIDocumentPicker · app extensions · CocoaPods · SAFe",
      },
      {
        id: "stiilt",
        title: "Ingénieur iOS — alternance",
        company: "STIILT · Nice",
        dates: "oct. 2020 → oct. 2021",
        bullets: [
          "**Migration complète d'Objective-C vers Swift** de l'application d'autopartage de véhicules premium, déjà publiée sur l'App Store — la base passe de **30 % à plus de 92 % de Swift en un an**.",
          "Migration menée **en parallèle des livraisons de fonctionnalités** par un collègue, sur la même base, sans interrompre les mises en production. La stratégie était de mon ressort.",
          "Refonte de la couche réseau, profiling et optimisation.",
        ],
        stack:
          "Objective-C → Swift · UIKit · MVC · storyboards, xib · CocoaPods · migration incrémentale sur application vivante",
      },
    ],
    educationTitle: "Formation",
    education: [
      {
        when: "2020 — 2021",
        what: "Master 2 Ingénierie informatique",
        where: "Université Côte d'Azur — Nice",
      },
      {
        when: "2019 — 2021",
        what: "Diplôme d'ingénieur en sciences informatiques",
        where: "Polytech Nice Sophia Antipolis — spécialité Intelligence Ambiante et Mobile",
      },
      {
        when: "2016 — 2019",
        what: "Ingénieur des travaux informatiques",
        where: "Institut Africain d'Informatique — Lomé",
      },
    ],
    certificationsTitle: "Certifications",
    certifications: [
      {
        when: "novembre 2025",
        what: "Professional Scrum Master I",
        where: "Scrum.org",
        link: { href: SCRUM_CERTIFICATE_URL, label: "Vérifier le certificat" },
      },
      {
        when: "2025",
        what: "Certified SAFe 6 Practitioner",
        where: "Scaled Agile",
        link: { href: SAFE_CERTIFICATE_URL, label: "Vérifier le certificat" },
      },
    ],
    openProjectsTitle: "Projets ouverts",
    openProjects: [
      {
        what: "Advanced Calendar",
        where:
          "Composant calendrier SwiftUI, construit par pont sur UIKit pour dépasser les limites de `UICalendarView`. Écrit parce que le framework ne suffisait pas.",
      },
      {
        what: "News App",
        where:
          "Fil d'actualité en MVVM, parsing en direct, signature par fastlane et match. Écrite pour l'entretien technique d'Instant System.",
        link: { href: NEWS_APP_URL, label: "Code source" },
      },
    ],
    skills: [
      { title: "Langages", items: ["Swift", "Objective-C"] },
      {
        title: "Interface",
        items: ["SwiftUI", "UIKit", "Auto Layout", "Dynamic Type", "iPad", "App extensions"],
      },
      {
        title: "Concurrence",
        items: ["async/await", "Acteurs", "Swift Concurrency", "Combine", "GCD"],
      },
      {
        title: "Architecture",
        items: [
          "Clean Architecture",
          "MVVM",
          "MVP",
          "VIPER",
          "Injection de dépendances",
          "Modules SPM",
          "Feature flags",
        ],
      },
      {
        title: "Outils et CI/CD",
        items: [
          "Xcode",
          "XcodeGen",
          "SPM",
          "CocoaPods",
          "XCFrameworks",
          "fastlane",
          "match",
          "Jenkins",
          "Git",
          "Bitbucket",
        ],
      },
      {
        title: "Méthode",
        items: ["SAFe", "Scrum", "Code review", "Tests unitaires", "Refinement", "Mentorat"],
      },
    ],
  },

  contact: {
    title: "Travaillons ensemble.",
    body: "Je cherche un poste de développeur iOS — confirmé, senior ou lead. L'étiquette compte moins que le reste : ce qui compte, c'est que ma voix pèse dans les choix techniques.",
    email: EMAIL,
    mailCta: "Écrire un mail",
  },
};
