# portfolio-web

Le site portfolio d'**Amissan Boris-David Amoussou-Guenou**, ingénieur iOS senior.

Bilingue français / anglais, entièrement rendu côté serveur, **100 / 100 / 100 / 100**
à Lighthouse sur les deux routes.

Le site n'est pas seulement la vitrine du travail : il en **est** une pièce. Tout
ce qu'il affiche — architecture, accessibilité, tests, CI — est lisible dans ce
dépôt.

Décisions qui le fondent :
[0001 — Quatre dépôts](https://github.com/Boris-David/portfolio/blob/main/docs/adr/0001-quatre-depots.md) ·
[0002 — Une source unique de contenu](https://github.com/Boris-David/portfolio/blob/main/docs/adr/0002-source-unique-de-contenu.md) ·
[0003 — Choix des stacks](https://github.com/Boris-David/portfolio/blob/main/docs/adr/0003-choix-des-stacks.md) ·
[0004 — Le CV est généré par l'API](https://github.com/Boris-David/portfolio/blob/main/docs/adr/0004-le-cv-est-genere-par-l-api.md)

---

## Démarrer

```bash
npm ci
npm run dev        # http://localhost:3000  (français) et /en (anglais)
```

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` · `npm start` | construction de production, puis service |
| `npm run verify` | **tout ce qui casse la CI, en local** : tokens, lint, types, tests, secrets |
| `npm run test` | tests unitaires (Vitest) |
| `npm run test:e2e` | bout en bout + accessibilité (Playwright — construit et sert la prod) |
| `npm run lighthouse` | budget Lighthouse, échoue sous 100 |
| `npm run tokens` | régénère le CSS de design et la favicone depuis `design/tokens.json` |

Aucune variable d'environnement n'est nécessaire pour démarrer : les valeurs par
défaut sont utilisables. Voir [`.env.example`](.env.example) pour les surcharger.

---

## Les partis pris

### Le design se génère, il ne se recopie pas

`design/tokens.json` est la **source unique** — couleurs, espacements, rayons,
courbes. `scripts/design-tokens.mjs` en dérive deux artefacts versionnés :
`src/styles/tokens.generated.css` et `public/icon.svg`.

Aucune couleur hexadécimale, aucune courbe de Bézier n'est écrite à la main dans
une feuille de style : [un test le vérifie](tests/unit/design-tokens.test.ts), et
`npm run tokens:check` échoue si le généré diverge de sa source. Les animations
JavaScript lisent elles aussi leurs courbes dans le CSS calculé plutôt que de les
redéclarer — une courbe changée dans les tokens change le dépliage des cartes.

Le pont vers Tailwind est un `@theme inline`, ce qui met `var(--paper)` dans
`bg-paper` au lieu d'y figer une couleur : **une bascule de thème repeint tout,
sans une seule variante `dark:`** dans les composants.

Provenance et garde anti-dérive de la copie : [`design/README.md`](design/README.md).

### Bilingue par routes, pas par bascule JavaScript

`/` sert le français, `/en` l'anglais — deux racines Next distinctes, chacune avec
son `<html lang>`, ses métadonnées, son URL canonique, son image Open Graph et ses
`hreflang`. Une bascule en JavaScript n'aurait ni URL partageable, ni page
indexable par langue, ni bouton « précédent » qui marche.

Les deux langues implémentent le **même type** (`src/content/types.ts`) : une
traduction oubliée ne compile pas. La maquette d'origine portait un dictionnaire
indexé par clé, où un oubli laissait du français à l'écran sans que rien ne le
signale.

### Les animations sont une couche, jamais une condition de lecture

Trois garanties, tenues par des tests :

1. **Sans JavaScript, tout se lit.** L'état initial masqué d'une apparition
   n'existe que sous `html.js`, classe posée par un script inline. Sans lui,
   aucune règle ne s'applique et la page est entière ;
2. **`prefers-reduced-motion` supprime le mouvement**, il ne le réduit pas ;
3. **rien n'attend.** Le premier écran n'est pas animé du tout : une apparition
   en fondu sur l'accroche retarderait la première information.

Le dépliage des cartes est bâti **sur** `<details>` : le clavier, `Ctrl+F`, les
moteurs de recherche et le sans-JavaScript fonctionnent sans qu'on écrive une
ligne. Par-dessus, une machine à états dissocie « le contenu est dans le flux » de
« la carte paraît ouverte » — c'est ce qui permet d'animer une fermeture, que
`<details>` coupe net sinon. L'animation elle-même passe par `motion/mini`
(≈ 2 Ko, Web Animations) : mesure de la hauteur réelle, jamais de `height: auto`,
et reprise à la hauteur courante quand on referme une carte en pleine ouverture.

### Presque tout est un composant serveur

Trois composants clients seulement : le dépliage, la bascule de thème, et une
couche d'effets montée une fois qui observe le document (apparitions, cascades,
compteurs, section courante). Les quinze sections de la page restent des
composants serveur — leur balisage ne descend jamais dans le bundle.

### Le contenu est derrière une frontière

Les pages appellent `getSiteContent()` et `getTicketingApps()`
(`src/content/source.ts`), jamais un fichier. Le contenu est local aujourd'hui ;
il viendra de `portfolio-api` **au build** (ADR 0002). Cette bascule ne touchera
aucun composant — c'est précisément à quoi sert ce module.

Le balisage éditorial est un dialecte minuscule (`**gras**`, `` `code` ``) analysé
vers des nœuds typés : **aucun `dangerouslySetInnerHTML`**, donc aucune surface
d'injection le jour où le texte viendra du réseau.

### Le CV vient de l'API, et le site n'en fabrique pas

ADR 0004 : un seul moteur de rendu produit **un seul fichier**, servi au web comme
à l'app iOS. Le bouton pointe vers `GET {API}/v1/cv/{fr|en}.pdf`.

**Le site n'a pas de feuille d'impression, et ne doit pas en avoir** — un test de
bout en bout vérifie qu'aucune règle `@media print` n'existe. En garder une, c'est
garder deux CV qui se ressembleraient au début, puis plus du tout.

> ⚠️ **Dépendance inter-dépôts.** L'attribut `download` est ignoré par les
> navigateurs sur un lien **cross-origin** : c'est l'API qui doit envoyer
> `Content-Disposition: attachment`, sinon le PDF s'ouvre dans l'onglet au lieu
> d'être téléchargé. L'origine se règle par `NEXT_PUBLIC_API_BASE_URL`.

---

## Qualité — ce qui est mesuré, et par quoi

| | Résultat | Tenu par |
|---|---|---|
| Lighthouse bureau, `/` et `/en` | **100 / 100 / 100 / 100** | `lighthouserc.json`, la CI échoue sous 100 |
| Lighthouse mobile bridé | 95–96 / 100 / 100 / 100 | mesuré, non bloquant |
| CLS · TBT | **0** · **0 ms** | budget Lighthouse |
| Accessibilité | **0 violation** axe WCAG 2.1 AA | 2 langues × 2 thèmes × cartes dépliées |
| Cibles tactiles | ≥ 44 px partout | test de bout en bout |
| Responsive | aucun défilement horizontal à 400 px | testé **dans les deux langues** |
| Sans JavaScript | page entière et cartes utilisables | test de bout en bout |

74 tests unitaires, 101 tests de bout en bout sur deux fenêtres d'affichage.

Les tests de bout en bout tournent sur la **construction de production** : un
`next dev` testerait un artefact qui n'est jamais livré.

### Ce que les tests gardent, au-delà du code

`tests/unit/content.test.ts` garde le **contenu** : que le « 33 » des trois
phrases éditoriales corresponde au nombre réel d'applications de la source, que la
pile d'icônes compte juste (5 + 28 = 33), qu'aucune formulation explicitement
refusée ne revienne, et qu'aucun identifiant de réseau interne ne sorte. Un
chiffre qui dérive de sa source ne doit pas se découvrir en entretien.

---

## Sécurité

Dépôt public, site statique, aucun secret : le site ne s'authentifie nulle part.

- `npm run check:secrets` refuse toute valeur de secret dans l'arbre versionné.
  Il double le hook de pre-commit du workspace — lequel n'existe pas dans un clone
  isolé, puisque `core.hooksPath` ne survit pas au clonage ;
- `npm audit --omit=dev --audit-level=high` en CI. Lighthouse CI est appelé par
  `npx` avec une version épinglée plutôt qu'installé : l'ajouter aux dépendances
  ferait entrer une dizaine de vulnérabilités transitives dans l'audit d'un dépôt
  que des recruteurs vont lire ;
- en-têtes de sécurité dans [`vercel.json`](vercel.json).

> `script-src` autorise `'unsafe-inline'`. C'est un choix documenté, pas un
> oubli : Next injecte ses propres scripts inline pour la charge utile RSC, et
> les interdire demanderait un *nonce*, donc un middleware, donc un rendu
> dynamique — on perdrait la génération statique et la performance. Le site
> n'affiche aucune entrée utilisateur et ne charge aucun script tiers : la
> surface que `'unsafe-inline'` laisse ouverte est vide.

---

## Déploiement

Vercel est **préparé mais non branché** : `vercel.json` porte la configuration et
les en-têtes, la CI ne déploie pas. Brancher le dépôt à un projet Vercel suffit.

Le build de production exécute `npm run tokens:check` avant `next build` : un
déploiement ne peut pas partir avec un CSS de design qui aurait dérivé de ses
tokens.
