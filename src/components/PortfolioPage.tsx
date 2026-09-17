import { AppsSection } from "@/components/AppsSection";
import { BackgroundSection } from "@/components/BackgroundSection";
import { CaseStudies } from "@/components/CaseStudies";
import { ContactSection } from "@/components/ContactSection";
import { DepthSection } from "@/components/DepthSection";
import { Hero } from "@/components/Hero";
import { PageEffects } from "@/components/PageEffects";
import { ProofBar } from "@/components/ProofBar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteContent, getTicketingApps } from "@/content/source";
import type { Locale } from "@/content/types";

/**
 * La page, pour une langue.
 *
 * Les deux routes (`/` et `/en`) rendent ce composant. Rien ici ne connaît le
 * routage : la langue arrive en paramètre, le contenu vient de la source, et
 * c'est tout. Le jour où le contenu viendra de l'API, seul `@/content/source`
 * change.
 */
export async function PortfolioPage({ locale }: { readonly locale: Locale }) {
  const [content, apps] = await Promise.all([getSiteContent(locale), getTicketingApps(locale)]);

  return (
    <>
      <a className="skip-link" href="#contenu">
        {content.chrome.skipToContent}
      </a>

      <SiteHeader chrome={content.chrome} locale={locale} />

      <main id="contenu">
        <Hero hero={content.hero} />
        <ProofBar points={content.proof} />
        <CaseStudies head={content.casesHead} cases={content.cases} />
        <AppsSection head={content.appsHead} note={content.appsNote} apps={apps} />
        <DepthSection head={content.depthHead} items={content.depth} />
        <BackgroundSection background={content.background} />
        <ContactSection contact={content.contact} />
      </main>

      <SiteFooter chrome={content.chrome} />

      {/* La couche d'amélioration progressive, montée une seule fois. */}
      <PageEffects />
    </>
  );
}
