import { RichParagraph } from "@/components/RichText";
import type { SectionHead as SectionHeadContent } from "@/content/types";

/**
 * A section's heading: the number, the title, and the opening lines.
 *
 * The number is decorative in its role but informative in its text
 * ("01 · Études de cas"): it therefore stays real text, read out by screen
 * readers, rather than a CSS pseudo-element.
 */
export function SectionHead({ head }: { readonly head: SectionHeadContent }) {
  return (
    <div className="sec-head" data-reveal="">
      <div className="sec-head__eyebrow">{head.eyebrow}</div>
      <h2>{head.title}</h2>
      {head.intro ? (
        <RichParagraph value={head.intro} />
      ) : null}
    </div>
  );
}
