import { AppsSection } from "@/components/AppsSection";
import { BackgroundSection } from "@/components/BackgroundSection";
import { CaseStudies } from "@/components/CaseStudies";
import { ContactSection } from "@/components/ContactSection";
import { DepthSection } from "@/components/DepthSection";
import { Hero } from "@/components/Hero";
import { PageEffects } from "@/components/PageEffects";
import { PersonalitySection } from "@/components/PersonalitySection";
import { ProofBar } from "@/components/ProofBar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteContent, getTicketingApps } from "@/content/source";
import type { Locale } from "@/content/types";

/**
 * The page, for one language.
 *
 * Both routes (`/` and `/en`) render this component. Nothing here knows about
 * routing: the locale arrives as a prop, the content comes from the source, and
 * that is all. The day the content comes from the API, only `@/content/source`
 * changes.
 */
export async function PortfolioPage({ locale }: { readonly locale: Locale }) {
  const [content, apps] = await Promise.all([
    getSiteContent(locale),
    getTicketingApps(locale),
  ]);

  return (
    <>
      <a className="skip-link" href="#contenu">
        {content.chrome.skipToContent}
      </a>

      <SiteHeader
        chrome={content.chrome}
        locale={locale}
        brand={content.hero.name}
        links={content.contact.links}
      />

      <main id="contenu">
        <Hero hero={content.hero} email={content.contact.email} />
        <ProofBar points={content.proof} />
        <CaseStudies head={content.casesHead} cases={content.cases} />
        <AppsSection
          head={content.appsHead}
          note={content.appsNote}
          apps={apps}
        />
        <DepthSection head={content.depthHead} items={content.depth} />
        <BackgroundSection background={content.background} />
        <PersonalitySection personality={content.personality} />
        <ContactSection contact={content.contact} />
      </main>

      <SiteFooter formalName={content.formalName} chrome={content.chrome} />

      {/* The progressive enhancement layer, mounted exactly once. */}
      <PageEffects />
    </>
  );
}
