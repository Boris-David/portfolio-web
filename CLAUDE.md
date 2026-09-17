# portfolio-web — instructions de dépôt

> Ce fichier se charge à **chaque** session ouverte dans ce dépôt. Il ne contient
> que ce qui régit le dépôt **entier**. Ce qui ne concerne qu'une sous-surface —
> design system, contenu, animations, tests — vit dans `.claude/rules/` avec un
> `paths:`, et ne se charge que quand on touche aux fichiers concernés.
>
> Le workspace `portfolio` ajoute par-dessus ses règles racines (posture,
> périmètre, workflow git, contenu éditorial). Sur la qualité, **c'est toujours
> la barre la plus haute qui gagne.**

## Ce qu'est ce dépôt

Le site portfolio d'Amissan Amoussou-G., bilingue, public, lu par des recruteurs.

**Le site est lui-même la démonstration.** Un raccourci pris ici n'est pas une
dette technique privée : c'est une pièce à conviction contre son auteur. Le
lecteur visé ouvre le dépôt, pas seulement la page.

## Les quatre invariants — ce qui ne se négocie pas

### 1. Aucune valeur de design écrite à la main

Couleurs, espacements, rayons, courbes descendent de `design/tokens.json` par
`scripts/design-tokens.mjs`. Un `#FAF8F3` ou un `cubic-bezier(…)` dans une
feuille de style est une erreur, pas un raccourci — et un test échoue.

Après toute modification de `design/tokens.json` : `npm run tokens`.

### 2. Rien d'illisible sans JavaScript

La page entière doit se lire, et les cartes se déplier, script désactivé. Toute
animation est une **couche par-dessus** un document déjà complet :

- un état initial masqué ne s'écrit **que** sous `html.js` ;
- `prefers-reduced-motion` **supprime** le mouvement, il ne l'atténue pas ;
- rien qui retarde la lecture — le premier écran n'est pas animé.

### 3. Le CV est un PDF de l'API, jamais une impression du site

ADR 0004. **Ne jamais ajouter de `@media print`**, sous aucun prétexte : deux
gabarits, ce sont deux CV qui divergent. Un test de bout en bout le vérifie.

### 4. Un dépôt public ne reçoit aucun secret

Le site est statique et ne s'authentifie nulle part : il n'a besoin d'aucun
secret, donc il n'en accueille aucun. `npm run check:secrets`.

### 5. Le site reste entièrement pré-rendu

`output: "export"` n'est pas un réglage de confort : c'est ce qui rend
l'hébergement gratuit, parce que les actifs statiques de Cloudflare sont hors
quota. **Introduire une fonctionnalité serveur** — middleware, server action,
route handler, revalidation, `cookies()`, `headers()` — casse la construction et
remettrait un Worker sur le chemin chaud de chaque page vue. Si le besoin se
présente vraiment, ça se décide, ça ne se glisse pas.

## Avant d'annoncer que c'est fait

```bash
npm run verify     # tokens, lint, types, tests unitaires, secrets
npm run test:e2e   # bout en bout + accessibilité, servis par wrangler dev
```

`npm run preview` sert `out/` exactement comme Cloudflare le servira — en-têtes,
résolution d'URL et page 404 comprises.

Vérifier la **sortie**, jamais le code de retour d'un tube — il rend celui de la
dernière commande. Un test qui échoue se dit, avec sa sortie.

« Ça compile » ≠ « ça marche ». Pour toute correction de bug : un test qui aurait
échoué **avant** le correctif.

## Où vont les choses

| Quoi | Où |
|---|---|
| Contenu éditorial, les deux langues | `src/content/locales/` |
| Frontière vers la source de contenu | `src/content/source.ts` — les pages n'ouvrent jamais un fichier |
| Objets du design system | `src/styles/components.css` |
| Effets d'amélioration progressive | `src/lib/effects/` |
| Routes par langue | `src/app/(fr)/` et `src/app/(en)/` |
| En-têtes de sécurité | `public/_headers` — lu par Cloudflare, pas servi |
| Hébergement | `wrangler.jsonc` et `.github/workflows/deploy.yml` |

## Ce qui se discute avant d'être fait

- **Ajouter une dépendance.** Chaque paquet est du poids, une surface d'audit et
  une chose à expliquer à l'oral. La question n'est pas « est-ce pratique » mais
  « qu'est-ce qui serait pire sans ».
- **Rendre un composant serveur « client »**. Le défaut est serveur. Passer
  `"use client"` demande une raison nommée : un gestionnaire d'événement, un
  état, une API du navigateur.
- **Toucher au contenu.** Les chiffres et les formulations sont des arbitrages
  rendus, consignés dans `.claude/rules/contenu-editorial.md` du workspace. On ne
  les réécrit pas « en mieux ».
