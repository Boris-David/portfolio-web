import Image from "next/image";
import { SectionHead } from "@/components/SectionHead";
import type {
  ProductionApp,
  SectionHead as SectionHeadContent,
} from "@/content/types";

/**
 * The grid of apps in production.
 *
 * The icons are named after each app's **public slug** (`tcl.png`, `oura.png`)
 * and not after an internal identifier: this repository is public, and internal
 * network numbers are not.
 *
 * Every card is a link to the App Store, so an app without one is skipped: an
 * anchor with no destination is a card that lies about being clickable. Every
 * ticketing app has a store page, which is why nothing disappears here today.
 * The app's name is enough as its label: the icon is decorative, it only
 * repeats what the text already says.
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
        {apps.map((app) =>
          app.appStoreUrl === null ? null : (
            <a
              className="app-card"
              key={app.slug}
              href={app.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={`/icons/${app.slug}.png`}
                alt=""
                width={44}
                height={44}
              />
              <span className="app-card__name">{app.name}</span>
              <span className="app-card__place">{app.territory}</span>
            </a>
          ),
        )}
      </div>
      <p className="note">{note}</p>
    </section>
  );
}
