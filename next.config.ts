import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Le rendu est entièrement statique et le site ne lit aucune donnée au
   * runtime : `X-Powered-By` n'apprend rien d'utile à personne, et renseigne un
   * scanner sur la pile. On le retire.
   */
  poweredByHeader: false,

  /**
   * `experimental.inlineCss` a été essayé et **écarté sur mesure**.
   *
   * L'intuition était bonne — la feuille de style bloque le rendu pendant
   * ~160 ms sur un mobile bridé, et le LCP de cette page est du texte. Mais
   * l'intégrer au document a dégradé le résultat : 2 922 ms de LCP contre
   * 2 857 ms, sur trois mesures chacune. Le document fait déjà 30 Ko — tout le
   * contenu y est, replié mais présent — et lui ajouter la feuille retarde la
   * fin de l'analyse au lieu de la laisser se télécharger en parallèle.
   *
   * Noté ici pour que la mesure ne se reperde pas, et que personne ne réactive
   * l'option en pensant gagner quelque chose.
   */
};

export default nextConfig;
