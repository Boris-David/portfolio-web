# `design/tokens.json` — copie d'amont, pas une source

Ce fichier est une **copie octet pour octet** de `design/tokens.json` du dépôt
[`portfolio`](https://github.com/Boris-David/portfolio), qui en est la **source
unique** (ADR 0001 : le hub porte les tokens de design, parce qu'ils appartiennent
à au moins deux dépôts).

Il est vendu ici — au sens de *vendoring* — pour une raison précise : `portfolio-web`
doit pouvoir se cloner et se construire **seul**. Un générateur qui lirait
`../design/tokens.json` marcherait sur la machine de l'auteur et nulle part
ailleurs.

## Ce qui empêche la copie de mentir

Une copie non gardée devient une deuxième vérité. Deux gardes, mécaniques :

| Garde | Commande | Ce qu'elle refuse |
|---|---|---|
| Le CSS généré correspond aux tokens | `npm run tokens:check` | un `tokens.generated.css` modifié à la main, ou oublié après un changement de tokens |
| La copie correspond à l'amont | `npm run tokens:check` *(quand `../design/tokens.json` existe)* | une copie qui a dérivé du hub |

La seconde garde ne peut s'exécuter que dans le workspace `portfolio`, là où le
hub est présent à côté. Sur un clone isolé — et donc en CI — elle est **ignorée
en le disant** plutôt que d'échouer : un clone isolé n'a rien à vérifier, et une
garde qui échoue faute de contexte est une garde qu'on finit par désactiver.

C'est donc la **PR de mise à jour des tokens** qui porte la responsabilité de
synchroniser les deux dépôts. Coût assumé par l'ADR 0001 : un changement
transverse traverse deux dépôts, et ce coût est visible plutôt que masqué.

## Mettre à jour les tokens

```bash
cp ../design/tokens.json design/tokens.json   # depuis le workspace portfolio
npm run tokens                                # régénère src/styles/tokens.generated.css
npm run tokens:check                          # doit être vert
```

Le fichier généré est **versionné** : la CI le vérifie mais ne le produit pas.
Un artefact généré et non versionné se lit mal en revue — on ne voit pas ce qu'un
changement de token a réellement changé dans le CSS.
