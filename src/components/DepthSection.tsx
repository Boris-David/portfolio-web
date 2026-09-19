import { Icon } from "@/components/Icon";
import { RichParagraph } from "@/components/RichText";
import { SectionHead } from "@/components/SectionHead";
import type { DepthItem, SectionHead as SectionHeadContent } from "@/content/types";

/** Three topics gone into in depth, rather than fifteen technologies listed. */
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
            <RichParagraph value={item.body} />
          </article>
        ))}
      </div>
    </section>
  );
}
