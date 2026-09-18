import Image from "next/image";
import { Icon } from "@/components/Icon";
import { RichText } from "@/components/RichText";
import type { Hero as HeroContent } from "@/content/types";

/**
 * The editorial header.
 *
 * Nothing in it animates on arrival — and that is a decision. A fade-in on the
 * first screen delays the first piece of information by a few hundred
 * milliseconds: exactly what a recruiter who is scanning does not forgive. The
 * reveals start below the fold.
 */
export function Hero({
  hero,
  email,
}: {
  readonly hero: HeroContent;
  /** The only published contact channel, served by the content source. */
  readonly email: string;
}) {
  return (
    <header className="hero wrap">
      <div className="hero__grid">
        <div>
          <span className="availability">
            <i className="availability__dot pulse-dot" aria-hidden="true" />
            <span>{hero.availability}</span>
          </span>

          <p className="hero__kicker">{hero.role}</p>
          <h1 className="hero__name">{hero.name}</h1>

          {hero.lede.map((paragraph) => (
            <p className="hero__lede" key={paragraph.slice(0, 32)}>
              <RichText value={paragraph} />
            </p>
          ))}

          <ul className="hero__meta">
            {hero.meta.map((item) => (
              <li key={item.label}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <div className="cta-row">
            <a className="btn btn--primary lift press" href={`mailto:${email}`}>
              <Icon name="mail" />
              <span>{hero.primaryCta}</span>
            </a>
            <a className="btn lift press" href="#cas">
              {hero.secondaryCta}
            </a>
          </div>
        </div>

        <div className="shot">
          <Image
            src={`/shots/${hero.shotFile}`}
            alt={hero.shotAlt}
            width={415}
            height={900}
            /**
             * Deliberately **without** `priority`.
             *
             * The largest contentful paint on this page is the lede paragraph,
             * not this screenshot. Preloading it put 72 KB in competition with
             * the font and the stylesheet that text depends on — and on mobile
             * it is below the fold as well, since the grid stacks the text
             * first.
             *
             * Measured: throttled mobile 94 → 95, desktop unchanged at 100,
             * cumulative layout shift still zero. Preloading what is not the LCP
             * delays the LCP.
             */
            sizes="(min-width: 960px) 300px, 70vw"
          />
          <span className="shot__tag">
            <Icon name="appstore" />
            <span>{hero.shotTag}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
