import { RichParagraph } from "@/components/RichText";
import type { Personality } from "@/content/types";

/**
 * Who he is when he is not writing code.
 *
 * ## Why a section here and a bottom sheet on iOS
 *
 * The app hides this behind a sheet because a phone screen holds one thing at a
 * time and the reader is deep inside a navigation stack: revealing it has to
 * cost a tap, and closing it a swipe. A long page has neither constraint. Two
 * hundred words behind a toggle, on a document the reader is already scrolling,
 * is ceremony — the same content, in the form each surface actually has.
 *
 * ## Why it sits after the work and before the contact
 *
 * It answers "what is he like to work with", and a reader asks that **after**
 * being convinced by the rest, never before. Landing right ahead of the contact
 * block is the order a conversation takes.
 */
export function PersonalitySection({
  personality,
}: {
  readonly personality: Personality;
}) {
  return (
    <section className="wrap" id="qui-je-suis">
      <div className="sec-head" data-reveal="">
        <div className="sec-head__eyebrow">{personality.eyebrow}</div>
        <h2>{personality.title}</h2>
      </div>

      <div className="persona" data-reveal="">
        {/*
         * The one line a reader repeats after meeting somebody. It was a
         * paragraph among the others and disappeared into them; the emphasis is
         * typographic and nothing else — same paper, no card, no rule, no tint.
         * A distinction that needed a badge to be noticed would be one nobody
         * gave him.
         */}
        <p className="persona__highlight">
          <strong>{personality.highlight.title}</strong>
          <span>{personality.highlight.detail}</span>
        </p>

        {personality.summary.map((paragraph, index) => (
          <RichParagraph key={index} value={paragraph} />
        ))}

        {personality.interests.length > 0 ? (
          <>
            <p className="persona__label">{personality.interestsLabel}</p>
            <ul className="chips">
              {personality.interests.map((interest) => (
                <li className="chip" key={interest}>
                  {interest}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
