---
paths:
  - "tests/**"
  - "playwright.config.ts"
  - "vitest.config.mts"
  - "lighthouserc.json"
  - ".github/workflows/**"
  - "scripts/check-secrets.mjs"
---

# Tests et CI

> Chargée quand on touche aux tests ou au pipeline.

## Le partage — qui teste quoi, et pourquoi

| | Outil | Ce qui s'y teste |
|---|---|---|
| Unitaire | Vitest + jsdom | logique pure, contrat de contenu, générateur de tokens, comportement du dépliage **sans moteur d'animation** |
| Bout en bout | Playwright, Chromium | ce qui demande un vrai navigateur : animations, contraste calculé, mise en page, sans-JavaScript, clavier natif |
| Budget | Lighthouse CI | performance, accessibilité, bonnes pratiques, SEO — **échoue sous 100** |

Le critère de placement : **si le test passerait aussi bien en simulant
l'environnement, il n'a rien prouvé.** L'activation d'un `<summary>` par Entrée
est un comportement du navigateur ; la tester dans jsdom testerait jsdom.

## Les tests de bout en bout tournent sur la production

`playwright.config.ts` lance `npm run build` puis `next start`. Un `next dev`
testerait un artefact qui n'est jamais livré — autre HTML, autres images, autre
JavaScript.

Deux fenêtres d'affichage : bureau, et **400 px** — la contrainte la plus serrée
du projet.

## Ce qui n'est pas négociable

- **un bug corrigé = un test qui aurait échoué avant le correctif.** Sans
  exception ;
- **on ne simule pas ce qu'on prétend tester.** Pas de `Element.animate`
  simulé, pas de `matchMedia` truqué pour contourner un comportement ;
- **on ne désactive pas un test pour faire passer un changement.** Un test de
  contenu qui échoue dit qu'une phrase publiée est devenue fausse : c'est la
  phrase qu'on corrige ;
- **on n'assouplit pas un seuil pour verdir le pipeline.** 100 est une exigence,
  pas une cible mouvante.

## Les tests de contenu sont des tests

`tests/unit/content.test.ts` vérifie que le « 33 » des phrases éditoriales
correspond au nombre réel d'applications, que la pile d'icônes compte juste, et
qu'aucune formulation explicitement refusée par l'auteur ne revient.

Ce ne sont pas des tests « en trop » : un chiffre faux sur un portfolio se
découvre en entretien, au pire moment.

## Mesurer une page en mouvement

Avant toute mesure de contraste, de position ou de taille : terminer les
apparitions. Une page à mi-animation produit des valeurs qui n'existent à aucun
moment stable. Voir `settleReveals` dans `tests/e2e/accessibility.spec.ts`.

## Le pipeline

Trois jobs parallèles : qualité (tokens, lint, types, unitaires, secrets, audit),
bout en bout + accessibilité, budget Lighthouse.

- **aucun secret n'est nécessaire** : `permissions: contents: read`, et rien ne
  se déploie. Une CI qui n'a besoin de rien ne peut rien fuiter ;
- **Lighthouse CI s'appelle par `npx` avec une version épinglée**, il n'est pas
  une dépendance. L'installer ferait entrer une dizaine de vulnérabilités
  transitives dans l'audit d'un dépôt que des recruteurs vont lire ;
- **l'audit de dépendances ne porte que sur la production** (`--omit=dev`) :
  l'outillage de développement ne s'exécute jamais chez un visiteur.

## Avant d'annoncer que c'est fait

```bash
npm run verify
npm run test:e2e
```

Lire la **sortie**, jamais le code de retour d'un tube. Un test qui échoue se
dit, avec sa sortie.
