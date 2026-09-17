import type { SiteContent } from "@/content/types";
import {
  EMAIL,
  KCALORIES_APP_STORE_URL,
  NEWS_APP_URL,
  SAFE_CERTIFICATE_URL,
  SCRUM_CERTIFICATE_URL,
} from "@/content/links";

/**
 * Le contenu anglais. Il implémente le même type que le français : un champ
 * oublié ici ne compile pas, là où le dictionnaire par clés de la maquette
 * laissait passer du français à l'écran sans que rien ne le signale.
 *
 * Ce n'est pas une traduction littérale — les formulations anglaises ont été
 * validées telles quelles dans la maquette de référence.
 */
export const en: SiteContent = {
  locale: "en",

  meta: {
    title: "Amissan Amoussou-G. — Senior iOS Engineer",
    description:
      "Senior iOS engineer specialised in mobile ticketing at Instant System. 33 transport apps in production ship my ticketing layer. French Riviera, remote.",
    ogImageAlt: "Amissan Amoussou-G., senior iOS engineer — mobile ticketing",
  },

  chrome: {
    navLabel: "Main navigation",
    navLinks: [
      { target: "cas", label: "Case studies" },
      { target: "apps", label: "Apps" },
      { target: "profondeur", label: "Depth" },
      { target: "parcours", label: "Background" },
      { target: "contact", label: "Contact" },
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

  hero: {
    availability: "Open to opportunities",
    role: "Senior iOS Engineer",
    name: "Amissan Amoussou-G.",
    lede: [
      "I build the **mobile ticketing** at **Instant System**, and it is my area of expertise. I have worked in a large corporation and in a ten-person startup alike, and I go about it the same way every time: I take a scope, I learn it thoroughly, and I make it dependable.",
      "What I bring beyond the code is facts, not adjectives: **I owned the ticketing of an entire app portfolio alone for a year**, and the anti-fraud library that protects our digital tickets began as my own initiative — it now runs on both of our platforms.",
    ],
    meta: [
      { icon: "pin", label: "French Riviera, France" },
      { icon: "home", label: "Fully remote, or mostly remote" },
      { icon: "globe", label: "French · professional English (TOEIC 840)" },
    ],
    primaryCta: "Get in touch",
    secondaryCta: "See my work",
    shotAlt: "KCalories main screen: the day's food diary.",
    shotTag: "KCalories — on the App Store",
  },

  proof: [
    { value: "33", counts: true, label: "transport apps in production ship my work" },
    { value: "6", unit: "yrs", counts: true, label: "of iOS engineering, since October 2020" },
    { prefix: "~", value: "5", unit: "M", label: "users of the apps I have contributed to" },
    { prefix: "> ", value: "99.8", unit: "%", label: "crash-free sessions on KCalories" },
  ],

  casesHead: {
    eyebrow: "01 · Case studies",
    title: "Two projects told the way a product engineer would",
    intro:
      "The problem, the decisions I made, and what they produced. What is being judged here is not Swift syntax — it is technical judgement.",
  },

  cases: [
    {
      kind: "workstreams",
      id: "billettique",
      title: "Mobile ticketing for 33 transport networks",
      subtitle: "Instant System · since May 2023 · in production",
      iconStack: ["tcl", "oura", "at-bus", "tere-tahiti", "twisto"],
      iconStackMore: "+28",
      labels: { problem: "Problem", decision: "Decision", result: "Result" },
      intro:
        "I joined a team with **no mobile developer at all**, alone on the ticketing scope of the whole portfolio — for a year. Here are five workstreams, each with the problem that triggered it and what it produced.",
      workstreams: [
        {
          id: "authentification",
          title: "Authentication that logged people out for no reason",
          summary: "Inherited code nobody wanted to touch — rebuilt on actors",
          problem: [
            "When several requests received an unauthorised response **at the same time**, each one fired its own token refresh. The concurrent refreshes invalidated one another, and the user ended up **signed out for no apparent reason**. The authentication code dated back to 2019 and nobody wanted to touch it.",
          ],
          decision: [
            "I took the initiative on the rebuild, moving to `async/await` with an **actor** holding the authentication state.",
            "**Why an actor rather than a lock:** a lock protects state provided you remember to take it everywhere — nothing checks that, and a lock held across an await is a deadlock waiting to happen. With an actor, isolation becomes a **property of the type**: every access from outside is necessarily serialised, and forgetting is no longer possible.",
            "The heart of the fix: the **in-flight refresh task is remembered**. Concurrent requests do not start a new one, they await the same one. A single refresh, however many simultaneous calls — plus a guard against retry loops on the same call.",
          ],
          result: [
            "**Authentication on TCL became markedly more stable.** No more unexplained sign-outs — the kind you never reproduce in testing and only ever see in production.",
          ],
          chips: ["actor", "async/await", "Task", "Sendable"],
        },
        {
          id: "anti-fraude",
          title: "QR code fraud",
          summary: "An innovation-sprint initiative that became a paid feature",
          problem: [
            "A digital ticket is displayed as a QR code. Fraudsters would take a **screenshot** and pass it on — and at inspection, nothing told the copy apart from the original.",
          ],
          decision: [
            "During an **innovation sprint**, I took the initiative of designing an internal library that **masks the screen content** as soon as a capture or a recording is under way. The ticket stays readable to its holder, and disappears from anything that could be shared.",
          ],
          result: [
            "Rolled out across **every app**, then **adopted on the new platform**. Clients are pleased with it — to the point that it became a **feature they pay for**. A sprint idea turned into a line of revenue.",
          ],
        },
        {
          id: "rechargement",
          title: "Card top-up on the Lyon network",
          summary: "From proof of concept to production, built almost single-handedly",
          problem: [
            "The Lyon network had been waiting to let riders **top up a transport card from their phone**. On iOS, everything was still to be done: the ticketing vendor's SDK had never been integrated.",
          ],
          decision: [
            "I first **proved the integration with a POC** — a POC should not show that it works, it should show what will break in production. Then I built **almost the entire feature on iOS single-handedly**, through to release.",
          ],
          result: [
            "Shipped. I am now **one of the technical leads on the TCL app**, which I know inside out, and I am driving the **m-ticket launch** on it.",
          ],
        },
        {
          id: "architecture",
          title: "Carrying clean architecture all the way",
          summary: "The product owns the default, the vendor overrides only its difference",
          problem: [
            "The per-vendor ticketing abstraction had been laid down by the tech lead. But implementations that were **entirely vendor-independent** still lived inside the vendor modules — duplicated once per supplier.",
          ],
          decision: [
            "I **created the module for a new vendor** even though it had few specifics: keeping it outside would have been quicker, but would have left a hole in the architecture. End-to-end consistency was worth the extra code.",
            "And I **argued for — and obtained — lifting vendor-independent implementations up to the product**. Vendors now override only what they actually mean to change.",
          ],
          result: [
            "Less duplication between suppliers, and a **clear rule that holds without arbitration**: the product owns the default behaviour, the vendor overrides only its difference.",
          ],
        },
        {
          id: "socle",
          title: "Launching the new platform",
          summary: "Oùra and Tuscany, across every functional area",
          problem: [
            "The new product platform, in clean architecture with dependency injection, had to carry the whole of ticketing — with no regression against a platform proven over years.",
          ],
          decision: [
            "I worked across **every functional area**: purchase catalogue, cart, parameterised products, purchase history, beneficiary management, buying on someone's behalf. And I wrote the **internal QR code generation library** from an encoded payload — the building block behind ticket validation and inspection.",
          ],
          result: [
            "Platform launched on **Oùra** (Auvergne-Rhône-Alpes) and in **Tuscany**. That is where I learned SwiftUI, dependency injection and this architecture — **in production, on a shipped product**.",
          ],
        },
      ],
      tags: [
        "Swift",
        "SwiftUI",
        "UIKit",
        "Swift Concurrency",
        "Actors",
        "Clean Architecture",
        "SPM modules",
        "Dependency injection",
        "XcodeGen",
        "Jenkins",
        "fastlane · match",
      ],
    },
    {
      kind: "columns",
      id: "kcalories",
      title: "KCalories — four stacks, alone, in five months",
      subtitle: "Personal project · published on the App Store",
      iconSlug: "kcalories",
      link: { href: KCALORIES_APP_STORE_URL, label: "App Store" },
      labels: { problem: "Problem", decision: "Decisions & delivery", result: "Results" },
      problem: [
        "I paid for three nutrition tracking apps. Price was never the obstacle — **none of them had everything**: fasting, calorie tracking, keto tracking by net carbs, and an interface you do not have to put up with.",
        "I also wanted to find out whether I could carry a whole product, not just an iOS layer.",
      ],
      decisions: [
        "**Build all four stacks myself** rather than assembling services: iOS app, backend, admin back-office, marketing page. Carrying the product end to end was the point, not the means.",
        "**Strict architecture and SPM modules from day one**, when nothing yet demanded it — boundaries get drawn before there is anything to put behind them, or they never get drawn at all.",
        "**Feature flags and continuous integration from week one**, to ship without blocking and without manual ritual.",
      ],
      results: [
        "**Published on the App Store five months** after the first line of code.",
        "**Over 99.8% crash-free sessions** — quality is measured, not claimed.",
        "**Version 2.0 twenty days** after 1.0: the delivery pipeline held.",
        "Available in **French and English**, with two complete themes.",
      ],
      gallery: [
        {
          file: "03-jeune.jpg",
          alt: "Intermittent fasting screen, built into the diary.",
          caption: "Fasting, inside the diary",
        },
        {
          file: "04-traversee.jpg",
          alt: "The six physiological phases of fasting.",
          caption: "The six physiological phases",
        },
        {
          file: "05-regimes-keto.jpg",
          alt: "Diet selection, including the ketogenic diet.",
          caption: "Diets and net carbs",
        },
        {
          file: "02-themes.jpg",
          alt: "The two visual themes of the app.",
          caption: "Two complete themes",
        },
      ],
      tags: [
        "SwiftUI",
        "SwiftData",
        "Clean Architecture",
        "SPM modules",
        "Feature flags",
        "Backend",
        "Back-office",
        "CI/CD",
        "FR · EN",
      ],
    },
  ],

  appsHead: {
    eyebrow: "02 · In production",
    title: "33 apps, 3 territories, one platform",
    intro:
      "At Instant System, transport apps are built white-label on a shared platform. **The ticketing layer I build and maintain ships inside every one of these** — from Lyon to Tuscany, all the way to French Polynesia.",
  },
  appsNote:
    "Apps published by transport authorities and their operators. My contribution covers the mobile ticketing layer — purchase, usage, validation and inspection — and its integration into each app.",

  depthHead: {
    eyebrow: "03 · Technical depth",
    title: "Where I go deep",
    intro:
      "Three subjects explored properly, rather than fifteen technologies listed. These are the ones I can be challenged on for an hour.",
  },
  depth: [
    {
      icon: "flow",
      title: "Concurrency and shared state",
      body: "Session tokens, their renewal and error paths are where concurrent access produces the bugs you can never reproduce. Actors, `async/await`, isolation: what the compiler guarantees on my behalf beats what I promise to check.",
    },
    {
      icon: "layers",
      title: "Boundaries and modularisation",
      body: "Clean Architecture in separate modules rather than folders, and modules that depend on a contract, never on an implementation. A boundary the compiler does not refuse is not a boundary — it is a convention that eventually gets forgotten.",
    },
    {
      icon: "gear",
      title: "From code to shipped product",
      body: "Project generation from a spec rather than a binary file, signing handled by fastlane and match, pipelines per product and per module, feature flags to decouple shipping from releasing. Whatever is not automated ends up not being done.",
    },
  ],

  background: {
    head: { eyebrow: "04 · Background", title: "Experience, education and certifications" },
    jobs: [
      {
        id: "instant-system",
        title: "iOS Engineer",
        company: "Instant System · Sophia Antipolis",
        dates: "May 2023 → today",
        openByDefault: true,
        roles: [
          "Technical lead, ticketing",
          "Scrum Master · since February 2025",
          "AI ambassador",
          "Mentor",
        ],
        bullets: [
          "**Sole mobile developer** on the ticketing scope for a year, across the whole portfolio: stabilising production and building features.",
          "Built **transport card top-up almost single-handedly** on the TCL app, where I am now one of the technical leads.",
          "Two **internal libraries** designed and shipped: on-screen anti-fraud protection for tickets, and validation QR code generation.",
          "**Created the abstraction module for a new ticketing vendor**, and lifted vendor-independent implementations up to the product.",
          "**Complete rebuild of session handling** — tokens, renewal, retry, sign-out — on actors and `async/await`.",
          "**Onboarded every mobile developer** who joined after me, iOS and Android; official mentor to an iOS developer.",
          "**Architecture workshops with the CTO** and the architects; client demos; conducting hiring interviews.",
          "**Scrum Master** of my team without stepping away from development — and still one of its main technical contributors.",
        ],
        stack:
          "Swift · SwiftUI · UIKit · Swift Concurrency, actors, async/await · Combine · Clean Architecture, 3 then 4 layers · dependency injection · SPM, XCFrameworks, CocoaPods · XcodeGen and YAML specs · Jenkins · fastlane · match · Bitbucket · SAFe",
      },
      {
        id: "mail-orange",
        title: "iOS Engineer",
        company: "Mail Orange — Orange, via Inetum · Mougins",
        dates: "Jan. 2022 → Apr. 2023",
        bullets: [
          "Features and fixes on a mail app with **around one million users**, in a team of three iOS developers.",
          "Topics owned **end to end** from the first weeks: drafts, attachment handling.",
          "Maintained **compatibility across iOS versions** and the **iPad layout**, on a codebase heavily used on tablets.",
          "Worked on a heterogeneous codebase — VIPER in the composer, MVP elsewhere.",
          "Took part in refinements and technical decisions; worked with **third-party teams** on integrated services.",
        ],
        stack:
          "Swift · Objective-C · programmatic UIKit, xib, storyboards, Auto Layout · MVP · VIPER · Delegate, Observer · UIDocumentPicker · app extensions · CocoaPods · SAFe",
      },
      {
        id: "stiilt",
        title: "iOS Engineer — apprenticeship",
        company: "STIILT · Nice",
        dates: "Oct. 2020 → Oct. 2021",
        bullets: [
          "**Full migration from Objective-C to Swift** of a premium car-sharing app already live on the App Store — the codebase went from **30% to over 92% Swift in one year**.",
          "Migration carried out **alongside a colleague's feature releases** on the same codebase, without interrupting production. The strategy was mine.",
          "Rebuilt the networking layer, profiling and optimisation.",
        ],
        stack:
          "Objective-C → Swift · UIKit · MVC · storyboards, xib · CocoaPods · incremental migration on a live app",
      },
    ],
    educationTitle: "Education",
    education: [
      {
        when: "2020 — 2021",
        what: "Master's degree in Software Engineering",
        where: "Université Côte d'Azur — Nice",
      },
      {
        when: "2019 — 2021",
        what: "Engineering degree in Computer Science",
        where: "Polytech Nice Sophia Antipolis — Ambient & Mobile Intelligence track",
      },
      {
        when: "2016 — 2019",
        what: "Bachelor of Engineering in Computer Science",
        where: "Institut Africain d'Informatique — Lomé",
      },
    ],
    certificationsTitle: "Certifications",
    certifications: [
      {
        when: "November 2025",
        what: "Professional Scrum Master I",
        where: "Scrum.org",
        link: { href: SCRUM_CERTIFICATE_URL, label: "Verify certificate" },
      },
      {
        when: "2025",
        what: "Certified SAFe 6 Practitioner",
        where: "Scaled Agile",
        link: { href: SAFE_CERTIFICATE_URL, label: "Verify certificate" },
      },
    ],
    openProjectsTitle: "Open projects",
    openProjects: [
      {
        what: "Advanced Calendar",
        where:
          "SwiftUI calendar component, bridged over UIKit to move past the limits of `UICalendarView`. Written because the framework was not enough.",
      },
      {
        what: "News App",
        where:
          "MVVM news feed, live parsing, signing handled by fastlane and match. Written for the Instant System technical interview.",
        link: { href: NEWS_APP_URL, label: "Source code" },
      },
    ],
    skills: [
      { title: "Languages", items: ["Swift", "Objective-C"] },
      {
        title: "Interface",
        items: ["SwiftUI", "UIKit", "Auto Layout", "Dynamic Type", "iPad", "App extensions"],
      },
      {
        title: "Concurrency",
        items: ["async/await", "Actors", "Swift Concurrency", "Combine", "GCD"],
      },
      {
        title: "Architecture",
        items: [
          "Clean Architecture",
          "MVVM",
          "MVP",
          "VIPER",
          "Dependency injection",
          "SPM modules",
          "Feature flags",
        ],
      },
      {
        title: "Tooling & CI/CD",
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
        title: "Practice",
        items: ["SAFe", "Scrum", "Code review", "Unit testing", "Refinement", "Mentoring"],
      },
    ],
  },

  contact: {
    title: "Let's work together.",
    body: "I am looking for an iOS developer role — mid-level, senior or lead. The label matters less than the rest: what matters is that my voice carries weight in technical decisions.",
    email: EMAIL,
    mailCta: "Send an email",
  },
};
