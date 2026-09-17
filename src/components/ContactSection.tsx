import { Icon } from "@/components/Icon";
import { RichText } from "@/components/RichText";
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
          {contact.links.map((link) => (
            <a
              key={link.id}
              className="btn lift press"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name={link.id} />
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
