"use client";

import { useEffect } from "react";
import { setupActiveSection } from "@/lib/effects/active-section";
import { setupCounters } from "@/lib/effects/counters";
import { setupReveal } from "@/lib/effects/reveal";
import { watchReducedMotion } from "@/lib/effects/reduced-motion";

/**
 * La couche d'amélioration progressive de la page, montée une seule fois.
 *
 * C'est le seul endroit du site où du code React touche au DOM qu'il n'a pas
 * rendu, et c'est un arbitrage assumé : l'alternative — faire de chaque section
 * un composant client pour lui donner une `ref` — enverrait tout le balisage de
 * la page dans le bundle pour un fondu de 0,9 seconde. Ces effets sont
 * **décoratifs et retirables** ; les traiter comme une couche par-dessus le
 * document rendu est exactement ce qu'ils sont.
 *
 * Aucun de ces effets ne conditionne la lecture : sans JavaScript, ou en
 * `prefers-reduced-motion`, la page est complète et immobile.
 */
export function PageEffects() {
  useEffect(() => {
    let teardown: Array<() => void> = [];

    const start = () => {
      teardown.forEach((stop) => stop());
      teardown = [setupReveal(), setupCounters(), setupActiveSection()];
    };

    start();
    // La préférence de mouvement peut basculer en cours de session.
    const unwatch = watchReducedMotion(start);

    return () => {
      unwatch();
      teardown.forEach((stop) => stop());
    };
  }, []);

  return null;
}
