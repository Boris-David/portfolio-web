# portfolio-web

Le site portfolio d'**Amissan Boris-David Amoussou-Guenou**, ingénieur iOS senior.

Bilingue français / anglais, **entièrement pré-rendu**, **100 / 100 / 100 / 100**
à Lighthouse sur les deux routes. Hébergé sur **Cloudflare Workers Static
Assets**, sur `amissan.dev`.

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
| `npm run preview` | sert `out/` avec `wrangler dev` — exactement ce que servira Cloudflare |
| `npm run deploy` | publie sur Cloudflare (demande un jeton) |

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
à l'app iOS. Le bouton pointe vers `https://api.amissan.dev/v1/cv/{fr|en}.pdf`,
vérifié contre l'API **en production** : les deux PDF répondent 200, commencent
bien par `%PDF-`, et revalident en 304 sur `If-None-Match`.

**Le site n'a pas de feuille d'impression, et ne doit pas en avoir** — un test de
bout en bout vérifie qu'aucune règle `@media print` n'existe. En garder une, c'est
garder deux CV qui se ressembleraient au début, puis plus du tout.

Le lien **ouvre** le PDF dans un nouvel onglet et ne porte pas `download`. Deux
faits l'imposent, constatés plutôt que supposés : l'API sert le PDF en
`Content-Disposition: inline`, et l'attribut `download` est de toute façon
**ignoré par les navigateurs sur un lien d'origine différente**. `amissan.dev` et
`api.amissan.dev` sont du même site mais pas de la même origine. Le garder aurait
été promettre un téléchargement que rien ne déclenche ; l'`aria-label` dit donc
« ouvrir », et précise le nouvel onglet.

---

## Qualité — ce qui est mesuré, et par quoi

| | Résultat | Tenu par |
|---|---|---|
| Lighthouse bureau, `/` et `/en` | **100 / 100 / 100 / 100** | `lighthouserc.json`, la CI échoue sous 100 |
| Lighthouse mobile bridé | 95 / 100 / 100 / 100 | mesuré sur 3 exécutions, non bloquant |
| CLS · TBT · LCP bureau | **0** · **0 ms** · 0,6 s | budget Lighthouse |
| Accessibilité | **0 violation** axe WCAG 2.1 AA | 2 langues × 2 thèmes × cartes dépliées |
| En-têtes de sécurité | CSP, HSTS, COOP, nosniff… | test de bout en bout sur `wrangler dev` |
| Cibles tactiles | ≥ 44 px partout | test de bout en bout |
| Responsive | aucun défilement horizontal à 400 px | testé **dans les deux langues** |
| Sans JavaScript | page entière et cartes utilisables | test de bout en bout |

74 tests unitaires, 115 tests de bout en bout sur deux fenêtres d'affichage.

Les tests de bout en bout et le budget Lighthouse tournent sur l'export servi par
**`wrangler dev`** — le magasin d'actifs de production, avec son `_headers`, sa
résolution d'URL et sa page 404. Une régression d'en-tête casse donc un test, au
lieu de se découvrir au scan de sécurité d'un recruteur.

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
- en-têtes de sécurité dans [`public/_headers`](public/_headers), **vérifiés par
  un test** : CSP, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, COOP et CORP.

`connect-src` vaut `'self'` et rien de plus : le contenu est consommé au build
(ADR 0002) et le CV est une navigation, pas une requête. Autoriser l'origine de
l'API ouvrirait une porte que personne n'emprunte.

> `script-src` autorise `'unsafe-inline'`. C'est un choix documenté, pas un
> oubli : Next injecte ses propres scripts inline pour la charge utile RSC, et
> les interdire demanderait un *nonce*, donc un rendu à la requête, donc un
> Worker sur le chemin chaud. Le site n'affiche aucune entrée utilisateur et ne
> charge aucun script tiers : la surface que `'unsafe-inline'` laisse ouverte est
> vide.

---

## Hébergement — Cloudflare Workers Static Assets

### Pourquoi l'export statique, et pas `@opennextjs/cloudflare`

Le choix s'est fait **sur pièce**, en regardant ce que le site utilise
réellement : ni middleware, ni server action, ni route handler, ni revalidation,
ni `cookies()`/`headers()`. Toutes les routes étaient déjà pré-rendues avant la
migration. `next build` avec `output: "export"` ne retire donc rien — il constate.

| | `output: "export"` | `@opennextjs/cloudflare` |
|---|---|---|
| Ce que ça sert | des fichiers | le serveur Next dans un Worker |
| Coût par requête | **aucun** — les actifs statiques sont gratuits, illimités, et **hors** du quota de 100 000 requêtes/jour | une invocation de Worker par requête |
| Optimisation d'images | absente | absente aussi — `sharp` ne tourne pas sur workerd |
| Fonctionnalités serveur préservées | aucune | toutes — dont **zéro** n'est utilisée ici |
| Pièces mobiles | le répertoire `out/` | un adaptateur, un bundle serveur, un cache |

Le second aurait ajouté un adaptateur et une invocation par page vue pour faire
tourner des fonctionnalités que ce site n'a pas. Le premier gagne sans contrepartie.

### L'optimisation d'images, remplacée par des sources déjà bien dimensionnées

L'optimiseur de Next est un service à la requête ; il n'existe pas dans un export.
Plutôt que d'ajouter un pipeline de dérivés, on sert les sources telles quelles —
elles sont **déjà taillées pour leur usage** : les icônes font 132 px pour un
affichage à 44, les captures 415 px de large pour un affichage à 300 au plus.
L'optimiseur ne faisait donc presque que convertir le format.

Vérifié plutôt que supposé, sur trois exécutions à chaque fois : le bureau reste
à **100** (LCP 0,6 s, CLS 0), le mobile bridé à **95** — soit exactement le
niveau d'avant la migration. Une image lourde ajoutée un jour se verrait : le
budget Lighthouse casse la construction au-delà de 1,8 Mo.

Au passage, la capture d'accroche a **perdu son `priority`** : le plus grand
élément peint de cette page est le paragraphe d'accroche, pas l'image. La
précharger mettait 72 Ko en concurrence avec la police dont ce texte dépend.
Mobile 94 → 95, bureau inchangé.

### Le domaine

`amissan.dev` est déclaré dans [`wrangler.jsonc`](wrangler.jsonc) en domaine
personnalisé. La zone étant déjà sur le compte via Cloudflare Registrar,
`wrangler deploy` crée l'enregistrement DNS lui-même — rien à cliquer.

**`www.amissan.dev` est la seule chose qui reste manuelle**, et c'est un
arbitrage, pas un oubli : une redirection d'hôte ne s'exprime ni dans
`wrangler.jsonc` ni dans `_headers`, dont les motifs portent sur le chemin. Elle
pourrait s'écrire dans un Worker — mais un Worker ne s'exécute que sur les
requêtes qui ne correspondent à aucun actif, et `/` en correspond toujours un. Il
faudrait donc `run_worker_first`, c'est-à-dire un Worker sur le chemin chaud de
chaque page vue : on perdrait la gratuité des actifs, qui est la raison même du
choix de Cloudflare. La forme native et gratuite est une règle de redirection de
zone ; la marche à suivre est en tête de
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

En attendant, le lien canonique de chaque page pointe déjà sur l'apex : aucun
moteur n'indexerait le site deux fois.

### Déployer

Le workflow est **préparé, pas branché** : il ne se déclenche qu'à la main et
s'arrête proprement tant que la configuration manque. Ce qu'il faut poser une
fois sur le dépôt — un secret `CLOUDFLARE_API_TOKEN`, une variable
`CLOUDFLARE_ACCOUNT_ID` — est listé en tête du fichier. Le jeton peut être celui
déjà créé pour `portfolio-api` : même compte, même zone, mêmes portées.

Le déploiement rejoue `tokens:check`, refuse un export incomplet, puis **vérifie
le site en ligne** — les deux langues en 200 et les en-têtes réellement servis.
Un `wrangler deploy` réussi ne prouve pas qu'un site fonctionne.
