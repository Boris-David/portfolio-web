import { Icon } from "@/components/Icon";
import { RichText } from "@/components/RichText";
import { GITHUB_URL, LINKEDIN_URL } from "@/content/links";
import type { Contact } from "@/content/types";

/** L'adresse e-mail est le seul canal de contact publié — pas de formulaire, pas de téléphone. */
export function ContactSection({ contact }: { readonly contact: Contact }) {
  return (
    <section className="wrap" id="contact">
      <div className="contact" data-reveal="">
        <h2>{contact.title}</h2>
        <p>
          <RichText value={contact.body} />
        </p>
        <a className="contact__mail" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
        <div className="cta-row">
          <a className="btn btn--primary lift press" href={`mailto:${contact.email}`}>
            <Icon name="mail" />
            <span>{contact.mailCta}</span>
          </a>
          <a
            className="btn lift press"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="linkedin" />
            <span>LinkedIn</span>
          </a>
          <a className="btn lift press" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="github" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </section>
  );
}
