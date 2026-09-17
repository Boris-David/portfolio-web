---
paths:
  - "src/content/**"
  - "src/lib/site.ts"
  - "src/app/layout-shell.tsx"
  - "src/app/(fr)/**"
  - "src/app/(en)/**"
---

# Contenu et bilinguisme

> Chargée quand on touche au contenu ou aux routes de langue.
>
> Les **arbitrages éditoriaux** — quel chiffre est publiable, quelle formulation
> a été refusée — vivent dans `.claude/rules/contenu-editorial.md` du workspace,
> qui se charge de toute façon à chaque session. Ce fichier-ci ne traite que de
> la **mécanique**.

## Le modèle est la garde

`src/content/types.ts` définit le contenu une fois. `fr.ts` et `en.ts`
l'implémentent tous les deux.

**Un champ oublié dans `en.ts` ne compile pas.** C'est le point : la maquette
d'origine portait un dictionnaire indexé par clé, où un oubli laissait du
français à l'écran sans que rien ne le signale.

Ajouter un champ = le remplir dans les **deux** langues, dans le même commit.

## Le balisage éditorial

Deux emphases, et deux seulement : `**gras**` et `` `code` ``. Pas d'imbrication.

`parseRichText` les transforme en nœuds typés, rendus par `<RichText>`.

**Jamais de `dangerouslySetInnerHTML`, jamais de HTML dans une chaîne de
contenu.** Ce n'est pas de la prudence excessive : le contenu viendra de l'API
(ADR 0002), et une chaîne de contenu est alors une entrée réseau.

Besoin d'une troisième emphase ? Ça se discute — une grammaire qu'on n'utilise
pas est une grammaire qu'on maintient pour rien.

## La frontière vers la source

Les pages appellent `getSiteContent(locale)` et `getTicketingApps(locale)`.
**Aucun composant n'importe un fichier de contenu**, et aucun ne lit
`data/apps.json`.

Ces fonctions sont `async` alors que rien n'attend — volontairement. Une source
distante l'est ; rendre la signature asynchrone plus tard obligerait à rouvrir
chaque appelant, c'est-à-dire exactement la réécriture qu'on veut éviter.

## Les routes de langue

`/` en français, `/en` en anglais : deux racines Next, chacune avec son
`<html lang>`, ses métadonnées, son canonique, ses `hreflang` et son image Open
Graph.

- **jamais** de bascule de langue en JavaScript : pas d'URL partageable, rien à
  indexer par langue, bouton « précédent » cassé ;
- **jamais** de middleware de négociation : il rendrait les pages dynamiques et
  coûterait la génération statique ;
- ajouter une langue = une entrée dans `LOCALES`, un fichier de locale, un
  groupe de routes. Les `hreflang` se dérivent tout seuls.

## Les données d'applications

`src/content/data/apps.json` est une **copie** de `portfolio-api`. Les icônes sont
nommées par le **slug public** (`tcl.png`), jamais par un identifiant de réseau
interne — ceux-ci ne sortent jamais, et un test le vérifie.

Le nombre d'applications apparaît dans plusieurs phrases éditoriales. Il est
gardé par `tests/unit/content.test.ts` : si la source gagne ou perd un réseau, les
phrases mentent, et le test échoue. **Ne jamais désactiver ce test pour faire
passer un changement de données** — c'est le contenu qu'il faut corriger.

## Les territoires

Un nom de lieu ne se traduit pas : il a, ou non, un exonyme. `territories.ts` ne
contient que les cas où la maquette validée emploie elle-même une forme anglaise.
Traduire « Alès » serait inventer, et inventer un nom de lieu sur un portfolio se
voit immédiatement.
