import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Export statique : `next build` écrit `out/`, que Cloudflare sert depuis son
   * magasin d'actifs.
   *
   * Le site n'utilise **aucune** fonctionnalité serveur — ni middleware, ni
   * server action, ni route handler, ni revalidation, ni `cookies()`/`headers()`.
   * Toutes les routes étaient déjà pré-rendues avant ce changement. L'export ne
   * retire donc rien : il constate.
   *
   * Ce que ça achète : les actifs statiques de Cloudflare sont gratuits,
   * illimités, et **ne comptent pas** dans le quota de 100 000 requêtes par
   * jour. `@opennextjs/cloudflare` aurait mis le serveur Next dans un Worker —
   * donc une invocation par requête — pour faire tourner des fonctionnalités que
   * ce site n'utilise pas. Le raisonnement complet est dans le README.
   */
  output: "export",

  /**
   * Le rendu est entièrement statique : `X-Powered-By` n'apprend rien d'utile à
   * personne, et renseigne un scanner sur la pile.
   */
  poweredByHeader: false,

  /**
   * L'optimiseur d'images de Next est un service à la requête ; il n'existe pas
   * dans un export statique. Trois façons de vivre avec, et une seule tient :
   *
   *   - un service d'images tiers : payant, et une dépendance réseau de plus
   *     sur le chemin critique ;
   *   - un pipeline de dérivés au build (redimensionnement + AVIF) : il faudrait
   *     `sharp` et un chargeur personnalisé ;
   *   - **servir les sources telles quelles**, parce qu'elles sont déjà
   *     dimensionnées pour leur usage : les icônes font 132 px pour un affichage
   *     à 44, les captures 415 px de large pour un affichage à 300 au plus.
   *     L'optimiseur ne faisait donc presque que convertir le format.
   *
   * Mesuré, pas supposé. Sur la construction exportée et servie compressée —
   * ce que Cloudflare fait — le bureau reste à **100** avec un LCP de 0,4 s
   * (contre 0,6 s auparavant), et le mobile bridé **passe de 95 à 99**, à poids
   * quasi identique (358 Ko contre 352). Les allers-retours vers l'optimiseur
   * coûtaient plus que la conversion ne rapportait.
   *
   * Le garde-fou reste le budget Lighthouse : `total-byte-weight` casse la
   * construction au-delà de 1,8 Mo. Une image lourde ajoutée un jour se verra.
   */
  images: { unoptimized: true },
};

export default nextConfig;
