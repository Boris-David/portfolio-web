---
paths:
  - "wrangler.jsonc"
  - "public/_headers"
  - "next.config.ts"
  - ".github/workflows/deploy.yml"
---

# Déploiement — Cloudflare Workers Static Assets

> Chargée quand on touche à l'hébergement, aux en-têtes ou à la configuration
> de construction.

## Le modèle, en une phrase

`next build` écrit `out/`, Cloudflare le sert depuis son magasin d'actifs
statiques. **Il n'y a pas de script de Worker**, et c'est le cœur du montage.

## Ce qui rend l'hébergement gratuit, et ce qui le casserait

Les actifs statiques de Cloudflare sont gratuits, illimités, et **ne comptent pas**
dans le quota de 100 000 requêtes par jour. Un Worker sur le chemin chaud
transformerait chaque page vue en invocation facturable.

Trois gestes le casseraient, et aucun ne se fait à la légère :

| Geste | Ce qu'il coûte |
|---|---|
| Ajouter `main` à `wrangler.jsonc` | un Worker à déployer — inutile tant que rien n'a besoin de calculer |
| Ajouter `assets.run_worker_first` | **chaque requête** devient une invocation |
| Introduire une fonctionnalité serveur Next | l'export échoue, et il faudrait un adaptateur |

Rappel de ce qu'est une fonctionnalité serveur : middleware, server action, route
handler, `revalidate`, `cookies()`, `headers()`, `dynamic = "force-dynamic"`.

## Pourquoi pas `@opennextjs/cloudflare`

Décidé sur pièce, pas par principe : le site n'utilise **aucune** fonctionnalité
serveur, et toutes ses routes étaient déjà pré-rendues. L'adaptateur aurait
ajouté un bundle serveur, un cache et une invocation par requête pour faire
tourner des fonctionnalités absentes. Il n'aurait même pas rendu l'optimisation
d'images — `sharp` ne tourne pas sur workerd.

Le jour où une fonctionnalité serveur devient réellement nécessaire, c'est
l'adaptateur qu'il faudra, et ce choix se réexamine **avec le besoin qui le
motive**, pas avant.

## Les en-têtes vivent dans `public/_headers`

Copié dans `out/` par l'export, lu par Cloudflare comme configuration — il n'est
jamais servi, et un test le vérifie.

- toute modification d'en-tête se reflète dans `tests/e2e/deploiement.spec.ts` ;
- `connect-src` reste `'self'` : le contenu est consommé au build et le CV est
  une navigation, pas une requête. Y ajouter l'origine de l'API ouvrirait une
  porte que personne n'emprunte ;
- `'unsafe-inline'` sur `script-src` est documenté dans le fichier. Le retirer
  demanderait un *nonce*, donc un rendu à la requête : c'est un changement
  d'architecture, pas un durcissement.

## Les images ne sont pas optimisées, et c'est mesuré

`images.unoptimized: true` parce qu'il n'y a pas d'optimiseur dans un export. Ça
tient parce que **les sources sont déjà dimensionnées pour leur usage** — 132 px
pour un affichage à 44, 415 px de large pour un affichage à 300 au plus.

Avant d'ajouter une image : vérifier qu'elle n'est pas beaucoup plus grande que
sa taille d'affichage. Le budget `total-byte-weight` (1,8 Mo) casse la
construction, mais il attrape tard — il attrape le cumul, pas la bévue.

## Ce qui reste manuel, et pourquoi

`www.amissan.dev → amissan.dev` est une **règle de redirection de zone**, posée
une fois dans le tableau de bord. Ce n'est pas une paresse : une redirection
d'hôte ne s'exprime ni dans `wrangler.jsonc` ni dans `_headers`, dont les motifs
portent sur le chemin ; et la faire dans un Worker exigerait `run_worker_first`,
donc de perdre la gratuité des actifs. La marche à suivre est en tête de
`deploy.yml`.

## Le déploiement se vérifie de l'extérieur

`wrangler deploy` réussit volontiers sur un site cassé. Le workflow rejoue donc
`tokens:check`, refuse un export incomplet, puis **interroge le site en ligne** :
les deux langues en 200, et les en-têtes réellement servis.
