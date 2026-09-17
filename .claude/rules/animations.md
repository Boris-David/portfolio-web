---
paths:
  - "src/lib/effects/**"
  - "src/components/Disclosure.tsx"
  - "src/components/PageEffects.tsx"
  - "src/styles/motion.css"
  - "src/styles/disclosure.css"
---

# Animations

> Chargée quand on touche au mouvement. L'auteur y tient particulièrement, et une
> animation ratée se voit plus qu'une animation absente.

## La règle qui prime sur toutes les autres

**Une animation est une couche par-dessus un document déjà complet.** Jamais ce
qui rend une information visible.

Trois conséquences, chacune testée :

1. **Sans JavaScript**, la page est entière. Un état initial masqué ne s'écrit
   **que** sous `html.js`, classe posée par le script d'amorçage. Écrire
   `opacity: 0` hors de ce garde cacherait du contenu à quelqu'un qui n'a pas
   de JavaScript — et à un moteur de recherche mal luné ;
2. **`prefers-reduced-motion` supprime**, il n'atténue pas. Une animation
   « discrète » reste une animation pour quelqu'un que le mouvement rend malade.
   Toute nouvelle transition a son bloc `@media (prefers-reduced-motion: reduce)` ;
3. **Rien n'attend.** Le premier écran n'est pas animé. Une apparition ne
   dépasse pas ~280 ms de décalage, une cascade ~620 ms.

## Les courbes viennent des tokens

En CSS : `var(--e-out)`, `--e-soft`, `--e-io`, `--e-back`.
En JavaScript : `readEasing("--e-io")`, qui lit le CSS calculé.

**Jamais un tableau de nombres écrit dans le code.** Une courbe changée dans
`tokens.json` doit changer le dépliage.

**Jamais `linear`** — sur quoi que ce soit.

## Le dépliage des cartes

C'est le point n° 1 de l'auteur. Ce qui le fait tenir, et qu'il ne faut pas
défaire :

- **le socle est `<details>` natif.** Le rôle ARIA, `aria-expanded`, Entrée et
  Espace, `Ctrl+F` sur du contenu replié, l'ouverture avant impression : tout ça
  est gratuit. Une `<div onClick>` obligerait à tout réécrire, mal ;
- **une machine à états** (`closed` / `opening` / `open` / `closing`) sépare « le
  contenu est dans le flux » de « la carte paraît ouverte ». Sans cette
  séparation, `<details>` masque son contenu dès `open = false` et coupe net
  l'animation de fermeture ;
- **on n'anime jamais vers `auto`.** On mesure, on anime en pixels, puis on rend
  la hauteur à `auto` — sinon la carte reste figée à sa hauteur mesurée et coupe
  son contenu au premier redimensionnement ;
- **l'interruption compte.** Refermer en pleine ouverture repart de la hauteur
  courante. Motion applique la valeur courante au style quand on arrête une
  animation : c'est de là que repart l'inverse. Ne jamais remettre la hauteur à
  zéro en entrant dans `opening` si l'état précédent était `closing` ;
- **la cascade suit la hauteur**, elle ne part pas avec : sinon on lit un texte
  qui bouge encore.

## Motion : `motion/mini`, et pas plus

`animate` bâti sur les Web Animations, environ deux kilo-octets. Le moteur
complet apporterait springs, animations de layout et gestes — rien de ce que ces
cartes utilisent, pour beaucoup de poids sur une page qui vise 100 en
performance.

Passer au moteur complet demande une raison mesurée, pas une préférence.

## L'absence de Web Animations est un cas nominal

`canAnimate()` vérifie `typeof element.animate === "function"`. jsdom ne
l'implémente pas — et c'est **voulu** : les tests unitaires s'exécutent dans
l'environnement sans moteur d'animation, ce qui prouve que le dépliage reste
fonctionnel sans lui. Ne jamais simuler `Element.animate` pour « faire passer »
un test : le test ne dirait plus rien.

Ce qui demande un vrai navigateur — courbes, hauteur qui s'anime, interruption,
Entrée sur un `<summary>` — se teste dans `tests/e2e/disclosure.spec.ts`.

## Mesurer une page en mouvement donne de faux résultats

Un test qui mesure un contraste ou une cible tactile **doit** d'abord terminer
les apparitions (`settleReveals`) : à mi-apparition, un texte est à opacité 0,5
donc mélangé à son fond, et le `scale(.994)` rend 43,7 px là où le CSS en impose
44. Deux faux positifs bien réels, déjà rencontrés.
