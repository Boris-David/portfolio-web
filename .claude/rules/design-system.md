---
paths:
  - "src/styles/**"
  - "scripts/design-tokens.mjs"
  - "scripts/tokens.mjs"
  - "design/**"
  - "src/app/globals.css"
---

# Design system — tokens, CSS, Tailwind

> Chargée quand on touche au design. Elle décline l'invariant n° 1 du
> `CLAUDE.md` : **aucune valeur de design ne s'écrit à la main.**

## La chaîne, dans l'ordre

```
design/tokens.json            ← source unique (copie d'amont du hub)
        │  scripts/design-tokens.mjs
        ▼
src/styles/tokens.generated.css   +   public/icon.svg     ← générés, versionnés
        │
        ├─ couche runtime   : --paper, --s5, --e-io, --r-md, --t-body…
        └─ pont Tailwind    : @theme inline → --color-paper: var(--paper)
```

`npm run tokens` régénère. `npm run tokens:check` échoue si le généré diverge —
c'est ce que la CI exécute.

## Les deux familles de noms, et pourquoi elles diffèrent

| Usage | Nom | Exemple |
|---|---|---|
| CSS écrit à la main | court, couche runtime | `var(--s5)`, `var(--e-io)`, `var(--ink-3)` |
| Utilitaire Tailwind | espace de noms Tailwind | `p-s5`, `ease-io`, `text-ink-3` |

Les nommer pareil produirait `--radius-md: var(--radius-md)` — un cycle que le
navigateur résout en n'appliquant **rien**, en silence. C'est arrivé à la
première version du générateur ; un test le garde désormais.

Les espacements sont exposés sous `s1`…`s9` et non `1`…`9` : `p-s5` se lit
« l'espacement 5 du design system », `p-5` se lirait « 20 px ». Confondre les
deux est exactement ce qui fait dériver un rythme vertical.

## Interdits, vérifiés par un test

- une couleur hexadécimale dans une feuille de style de `src/styles/` ;
- un `cubic-bezier(…)` littéral — en CSS **comme en JavaScript** : les animations
  lisent leurs courbes dans le CSS calculé (`readEasing("--e-io")`) ;
- modifier `src/styles/tokens.generated.css` à la main ;
- modifier `design/tokens.json` sans répercuter la modification dans le hub.

## Classe de composant ou utilitaire Tailwind ?

| | |
|---|---|
| **Classe** dans `components.css` | l'objet se répète ET porte une intention de design : `.btn`, `.chip`, `.case`, tout ce qui a `font-variation-settings`, `clamp()` ou un `letter-spacing` négatif |
| **Utilitaire** dans le JSX | mise en page ponctuelle d'un composant, non réutilisée |

Écrire `font-variation-settings` en valeur arbitraire
(`[font-variation-settings:'opsz'_144]`) rend le composant illisible et le design
impossible à faire évoluer d'un seul endroit. Ce n'est pas plus « Tailwind », c'est
juste pire.

## Thème sombre

**Jamais de variante `dark:`.** Le pont `@theme inline` fait que `bg-paper`
contient `var(--paper)` : redéfinir la variable suffit à repeindre la page.

Le garde `:root:not([data-theme="light"])` fait primer le choix explicite sur la
préférence système — sans lui, quelqu'un dont le système est en sombre ne
pourrait jamais forcer le clair.

## Accessibilité, côté CSS

- toute cible tactile : `min-height: var(--touch-target)` — la valeur vient des
  tokens `a11y`, jamais d'un `44px` écrit à la main ;
- `:focus-visible` n'est jamais retiré ni remplacé par `outline: none` ;
- le contraste tient en clair **et** en sombre : l'audit axe tourne dans les deux.
