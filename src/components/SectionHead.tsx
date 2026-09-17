import { RichText } from "@/components/RichText";
import type { SectionHead as SectionHeadContent } from "@/content/types";

/**
 * L'en-tête d'une section : le numéro, le titre, et l'entrée en matière.
 *
 * Le numéro est décoratif dans son rôle mais informatif dans son texte
 * (« 01 · Études de cas ») : il reste donc du vrai texte, lu par les lecteurs
 * d'écran, et non un pseudo-élément CSS.
 */
export function SectionHead({ head }: { readonly head: SectionHeadContent }) {
  return (
    <div className="sec-head" data-reveal="">
      <div className="sec-head__eyebrow">{head.eyebrow}</div>
      <h2>{head.title}</h2>
      {head.intro ? (
        <p>
          <RichText value={head.intro} />
        </p>
      ) : null}
    </div>
  );
}
