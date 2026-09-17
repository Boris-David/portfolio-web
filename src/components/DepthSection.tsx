import { Icon } from "@/components/Icon";
import { RichText } from "@/components/RichText";
import { SectionHead } from "@/components/SectionHead";
import type { DepthItem, SectionHead as SectionHeadContent } from "@/content/types";

/** Trois sujets creusés, plutôt que quinze technologies listées. */
export function DepthSection({
  head,
  items,
}: {
  readonly head: SectionHeadContent;
  readonly items: readonly DepthItem[];
}) {
  return (
    <section className="wrap" id="profondeur">
      <SectionHead head={head} />
      <div className="depth">
        {items.map((item) => (
          <article className="depth-card" key={item.title} data-reveal="">
            <div className="depth-card__icon">
              <Icon name={item.icon} />
            </div>
            <h3>{item.title}</h3>
            <p>
              <RichText value={item.body} />
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
