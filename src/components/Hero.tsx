import Image from "next/image";
import { Icon } from "@/components/Icon";
import { RichText } from "@/components/RichText";
import { EMAIL } from "@/content/links";
import type { Hero as HeroContent } from "@/content/types";

/**
 * L'en-tête éditorial.
 *
 * Rien n'y est animé à l'arrivée — et c'est une décision. Une apparition en
 * fondu sur le premier écran retarde la première information de quelques
 * centaines de millisecondes : exactement ce qu'un recruteur qui scanne ne
 * pardonne pas. Les apparitions commencent sous la ligne de flottaison.
 */
export function Hero({ hero }: { readonly hero: HeroContent }) {
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
            <a className="btn btn--primary lift press" href={`mailto:${EMAIL}`}>
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
            src="/shots/01-journal.jpg"
            alt={hero.shotAlt}
            width={415}
            height={900}
            /**
             * Volontairement **sans** `priority`.
             *
             * Le plus grand élément peint de cette page est le paragraphe
             * d'accroche, pas cette capture. La précharger mettait 72 Ko en
             * concurrence avec la police et la feuille de style dont ce texte
             * dépend — et sur mobile elle est en plus sous la ligne de
             * flottaison, puisque la grille empile le texte en premier.
             *
             * Mesuré : mobile bridé 94 → 95, bureau inchangé à 100, décalage
             * cumulé toujours nul. Précharger ce qui n'est pas le LCP retarde
             * le LCP.
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
