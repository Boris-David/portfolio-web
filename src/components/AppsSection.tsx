import Image from "next/image";
import { SectionHead } from "@/components/SectionHead";
import type { ProductionApp, SectionHead as SectionHeadContent } from "@/content/types";

/**
 * La grille des applications en production.
 *
 * Les icônes sont nommées d'après le **slug public** de chaque application
 * (`tcl.png`, `oura.png`) et non d'après un identifiant interne : ce dépôt est
 * public, et les numéros de réseau internes ne le sont pas.
 *
 * Chaque carte est un lien vers l'App Store. Le nom de l'application y suffit
 * comme libellé : l'icône est décorative, elle ne répète que ce que le texte
 * dit déjà.
 */
export function AppsSection({
  head,
  note,
  apps,
}: {
  readonly head: SectionHeadContent;
  readonly note: string;
  readonly apps: readonly ProductionApp[];
}) {
  return (
    <section className="wrap" id="apps">
      <SectionHead head={head} />
      <div className="apps" data-stagger="">
        {apps.map((app) => (
          <a
            className="app-card"
            key={app.slug}
            href={app.appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src={`/icons/${app.slug}.png`} alt="" width={44} height={44} />
            <span className="app-card__name">{app.name}</span>
            <span className="app-card__place">{app.territory}</span>
          </a>
        ))}
      </div>
      <p className="note">{note}</p>
    </section>
  );
}
