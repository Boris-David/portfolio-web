import Image from "next/image";
import { Disclosure } from "@/components/Disclosure";
import { Icon } from "@/components/Icon";
import { RichParagraph, RichText } from "@/components/RichText";
import { SectionHead } from "@/components/SectionHead";
import type {
  CaseStudy,
  ColumnsCase,
  Markup,
  SectionHead as SectionHeadContent,
  WorkstreamCase,
} from "@/content/types";

const ICON_SIZE = 46;

/**
 * The case studies: problem, decision, result.
 *
 * Two shapes coexist because the two projects are not told the same way —
 * ticketing is a run of independent workstreams, KCalories is a single product.
 * A generic card would have flattened the difference; a discriminated union
 * makes it explicit, and the compiler refuses to let a case be rendered with the
 * wrong template.
 */
export function CaseStudies({
  head,
  cases,
}: {
  readonly head: SectionHeadContent;
  readonly cases: readonly CaseStudy[];
}) {
  return (
    <section className="wrap" id="cas">
      <SectionHead head={head} />
      {cases.map((study) =>
        study.kind === "workstreams" ? (
          <WorkstreamCaseCard key={study.id} study={study} />
        ) : (
          <ColumnsCaseCard key={study.id} study={study} />
        ),
      )}
    </section>
  );
}

/** One column of the triptych. `data-cascade` marks it for the entry animation. */
function PdrColumn({
  label,
  paragraphs,
  children,
}: {
  readonly label: string;
  readonly paragraphs?: readonly Markup[];
  readonly children?: React.ReactNode;
}) {
  return (
    <div data-cascade="">
      <h4>{label}</h4>
      {paragraphs?.map((paragraph) => (
        <RichParagraph key={paragraph.slice(0, 32)} value={paragraph} />
      ))}
      {children}
    </div>
  );
}

function PdrList({ items }: { readonly items: readonly Markup[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.slice(0, 32)}>
          <RichText value={item} />
        </li>
      ))}
    </ul>
  );
}

function Tags({ tags }: { readonly tags: readonly string[] }) {
  return (
    <div className="case__foot">
      {tags.map((tag) => (
        <span className="tag" key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}

function WorkstreamCaseCard({ study }: { readonly study: WorkstreamCase }) {
  return (
    <article className="case" data-reveal="">
      <div className="case__top">
        {/* Decorative: these icons repeat what the title right next to them says. */}
        <div className="icon-stack" aria-hidden="true">
          {study.iconStack.map((slug) => (
            <Image
              key={slug}
              src={`/icons/${slug}.png`}
              alt=""
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ))}
          <span className="icon-stack__more">{study.iconStackMore}</span>
        </div>
        <div className="case__id">
          <h3>{study.title}</h3>
          <p className="case__sub">{study.subtitle}</p>
        </div>
      </div>

      <div className="case__intro">
        <RichParagraph value={study.intro} />
      </div>

      <div className="workstreams">
        {study.workstreams.map((workstream, index) => (
          <Disclosure
            key={workstream.id}
            className="disclosure"
            summaryClassName="disclosure__summary"
            testId={`workstream-${workstream.id}`}
            summary={
              <>
                <span className="disclosure__numero">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="disclosure__heading">
                  <b>{workstream.title}</b>
                  <em>{workstream.summary}</em>
                </span>
                <Icon name="chevron" className="disclosure__chevron" />
              </>
            }
          >
            <div className="pdr">
              <PdrColumn label={study.labels.problem} paragraphs={workstream.problem} />
              <PdrColumn label={study.labels.decision} paragraphs={workstream.decision} />
              <PdrColumn label={study.labels.result} paragraphs={workstream.result}>
                {workstream.chips ? (
                  <div className="chips" style={{ marginTop: "var(--s4)" }}>
                    {workstream.chips.map((chip) => (
                      <span className="chip" key={chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
              </PdrColumn>
            </div>
          </Disclosure>
        ))}
      </div>

      <Tags tags={study.tags} />
    </article>
  );
}

function ColumnsCaseCard({ study }: { readonly study: ColumnsCase }) {
  return (
    <article className="case" data-reveal="">
      <div className="case__top">
        <Image
          className="case__icon"
          src={`/icons/${study.iconSlug}.png`}
          alt=""
          width={56}
          height={56}
        />
        <div className="case__id">
          <h3>{study.title}</h3>
          <p className="case__sub">{study.subtitle}</p>
        </div>
        <a className="btn btn--sm lift press" href={study.link.href}>
          <Icon name="appstore" />
          <span>{study.link.label}</span>
        </a>
      </div>

      <div className="pdr">
        <PdrColumn label={study.labels.problem} paragraphs={study.problem} />
        <PdrColumn label={study.labels.decision}>
          <PdrList items={study.decisions} />
        </PdrColumn>
        <PdrColumn label={study.labels.result}>
          <PdrList items={study.results} />
        </PdrColumn>
      </div>

      <div className="gallery">
        {study.gallery.map((shot) => (
          <figure key={shot.file}>
            <Image
              src={`/shots/${shot.file}`}
              alt={shot.alt}
              width={415}
              height={900}
              sizes="(min-width: 700px) 240px, 45vw"
            />
            <figcaption>{shot.caption}</figcaption>
          </figure>
        ))}
      </div>

      <Tags tags={study.tags} />
    </article>
  );
}
