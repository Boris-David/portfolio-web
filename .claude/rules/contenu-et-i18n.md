---
paths:
  - "src/content/**"
  - "src/lib/site.ts"
  - "src/app/layout-shell.tsx"
  - "src/app/(fr)/**"
  - "src/app/(en)/**"
  - "tests/fixtures/**"
  - "tests/contract/**"
---

# Contenu et bilinguisme

> Chargée quand on touche au contenu ou aux routes de langue.
>
> Les **arbitrages éditoriaux** — quel chiffre est publiable, quelle formulation
> a été refusée — vivent dans `.claude/rules/contenu-editorial.md` du workspace,
> qui se charge de toute façon à chaque session. Ce fichier-ci ne traite que de
> la **mécanique**.

## Le contenu vient de l'API, et de nulle part ailleurs

ADR 0002. Ce dépôt **n'écrit aucun fait**. Ni chiffre, ni date, ni phrase du
dossier : tout vient de `portfolio-api`, récupéré **au `next build`** et figé
dans l'export statique (ADR 0005). Le visiteur ne fait aucune requête.

```
portfolio-api ──▶ api/fetch.ts ──▶ api/adapt.ts ──▶ source.ts ──▶ pages
                  (une fois        (domaine →       (frontière)
                 par langue)       présentation)
```

**Ne jamais réintroduire un fichier de contenu local.** Ce serait une seconde
source de vérité, qui dérive en silence — et ce dépôt en a déjà payé le prix :
le « 33 » vivait à quatre endroits côté web contre un seul côté API.

## La ligne de partage : contenu contre chrome

> **Est du contenu ce qui resterait vrai si le site n'existait pas.**

| | Où | Exemples |
|---|---|---|
| **Contenu** | API | un fait du parcours, un chiffre, une phrase, une URL de profil, le nom affiché |
| **Chrome** | `src/content/chrome/` | « Aller au contenu », « Changer de thème », le choix d'une icône, l'ordre des ancres, la description de référencement |

Le test : ce libellé aurait-il un sens dans un CV en PDF ou dans une app iOS
native ? Non → c'est du chrome, il reste ici.

## L'adaptation, et ce qu'elle a le droit de dériver

`api/adapt.ts` traduit le modèle de **domaine** vers le modèle de
**présentation**. Il **dérive** ce que l'API n'a aucune raison de connaître :

- la numérotation des sections (« 01 · ») — depuis leur rang ;
- le « +28 » de la pile d'icônes — depuis le nombre réel d'applications ;
- les dates lisibles — `Intl`, jamais une table de mois écrite à la main ;
- le nom de fichier d'une capture — depuis l'identifiant du média.

**Ce qu'il n'a pas le droit de faire** : inventer une valeur absente, se replier
sur un défaut, ou masquer un champ manquant. Un contenu incomplet **casse la
construction** ; il ne produit jamais une section vide.

## La validation est fusionnée à la lecture

Pas de schéma dans ce dépôt — l'API a le sien, et le recopier ferait une seconde
vérité sur la **forme**. `api/field.ts` valide **en lisant** : chaque accès
connaît son chemin et lève en le nommant.

```
ContentShapeError: Contenu de l'API inattendu en « portfolio.data.profile.headline » :
une chaîne non vide attendu, reçu rien.
```

Un champ qu'on ne lit jamais ne peut pas casser la construction ; un champ qu'on
lit ne peut pas valoir `undefined` sans qu'on l'apprenne.

## Le balisage éditorial

Deux emphases, et deux seulement : `**gras**` et `` `code` ``. Pas d'imbrication.

L'API sert des segments typés ; `api/markup.ts` les ramène au balisage **et
vérifie la conversion en la relisant**. Le balisage n'a pas d'échappement : sans
cette garde, un segment contenant `**` produirait une phrase déformée qui
resterait une chaîne parfaitement valide.

**Jamais de `dangerouslySetInnerHTML`, jamais de HTML dans une chaîne de
contenu.** Le contenu est une entrée réseau.

## La frontière vers la source

Les pages appellent `getSiteContent(locale)`, `getTicketingApps(locale)`.
**Aucun composant ne lit une source de contenu**, et aucun n'écrit une URL, un
nom ou un chiffre en dur.

Requête **et** adaptation sont mémoïsées par langue : quatre lectures ne
produisent qu'une requête. Ce n'est pas une optimisation — sans elle, deux
lectures pourraient tomber de part et d'autre d'un déploiement de l'API, et une
même page porterait deux versions du contenu.

## Le témoin de fraîcheur

Chaque page publie `<meta name="content-version">` : l'empreinte du contenu sur
lequel elle a été construite. L'API sert la sienne dans `meta.contentVersion`.

Les comparer répond en une requête à la seule question qu'on ne pouvait pas
poser : *le site en ligne a-t-il été construit sur le contenu courant ?* Sans ce
témoin, un site figé sur du contenu périmé est **indiscernable** d'un site à
jour — tout répond 200, tout s'affiche, et la page ment. ADR 0006.

## Les tests : fixture hors ligne, contrat en ligne

- `tests/fixtures/portfolio-{fr,en}.json` — une capture de l'API. Les tests
  unitaires la servent via un stub de `fetch`, et exercent donc **le vrai
  chemin** de `source.ts`, hors ligne et de façon déterministe ;
- `npm run test:contract` — tape l'API **réelle**. Il ne compare pas les valeurs
  (le contenu a le droit de changer), il compare la **forme** : un champ
  renommé, ajouté ou retiré rend la fixture menteuse.

Une fixture qu'on ne confronte jamais redevient une seconde source de vérité.
La régénérer :

```bash
curl -s "https://api.amissan.dev/v1/portfolio?lang=fr" | python3 -m json.tool \
  > tests/fixtures/portfolio-fr.json
```

⚠️ **Un test de comportement ne connaît aucun slug de contenu.**
`disclosure.spec.ts` désignait un chantier par `workstream-authentification` : le
passage à l'API a renommé le slug en `authentication` sans rien changer à
l'écran, et onze tests de comportement sont tombés pour une raison qui ne les
regardait pas. Ils désignent désormais par la structure.

## Les routes de langue

`/` en français, `/en` en anglais : deux racines Next, chacune avec son
`<html lang>`, ses métadonnées, son canonique, ses `hreflang` et son image Open
Graph.

- **jamais** de bascule de langue en JavaScript : pas d'URL partageable, rien à
  indexer par langue, bouton « précédent » cassé ;
- **jamais** de middleware de négociation : il rendrait les pages dynamiques et
  coûterait la génération statique ;
- ajouter une langue = une entrée dans `LOCALES`, un fichier de chrome, un
  groupe de routes. Les `hreflang` se dérivent tout seuls.

L'API choisit sa langue par **`?lang=`** — pas `?locale=`, qui serait ignoré en
silence. Une réponse rendue dans une autre langue que celle demandée est
**refusée** : publier la page anglaise avec du contenu français est une panne
qu'on ne voit qu'une fois en ligne.

## Les actifs

Icônes nommées par **slug public** (`tcl.png`), jamais par un identifiant de
réseau interne — un test le vérifie. Captures nommées par **identifiant de
média** (`jeune.jpg`), le préfixe d'ordre ayant disparu avec l'ordre qu'il
encodait, désormais porté par l'API.

Un slug ou un média sans fichier ne produit pas d'erreur : il produit une image
cassée que personne ne regarde. `tests/unit/source.test.ts` fait correspondre un
fichier à chaque actif **réellement rendu** — et seulement à ceux-là :
`mail-orange` est publié dans les applications sans jamais paraître en icône.
