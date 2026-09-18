import { Disclosure } from "@/components/Disclosure";
import { Icon } from "@/components/Icon";
import { RichText } from "@/components/RichText";
import { SectionHead } from "@/components/SectionHead";
import type { Background, Job, TimelineRow } from "@/content/types";

/**
 * Background: expandable experiences, then education, certifications and
 * skills.
 *
 * The current experience is expanded by default — it is the one people come to
 * read. The other two expand on demand: a recruiter scans, and opens what
 * interests them.
 */
export function BackgroundSection({ background }: { readonly background: Background }) {
  return (
    <section className="wrap" id="parcours">
      <SectionHead head={background.head} />

      {background.jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

      <div className="split">
        <div data-reveal="">
          <h3>{background.educationTitle}</h3>
          <Rows rows={background.education} />
        </div>
        <div data-reveal="">
          <h3>{background.certificationsTitle}</h3>
          <Rows rows={background.certifications} />
          <h3 style={{ marginTop: "var(--s6)" }}>{background.openProjectsTitle}</h3>
          <Rows rows={background.openProjects} />
        </div>
      </div>

      <div className="skills" data-reveal="">
        {background.skills.map((group) => (
          <div key={group.title}>
            <h4>{group.title}</h4>
            <div className="chips">
              {group.items.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JobCard({ job }: { readonly job: Job }) {
  return (
    <div data-reveal="">
      <Disclosure
        className="job disclosure"
        summaryClassName="disclosure__summary job__summary"
        defaultOpen={job.openByDefault}
        testId={`job-${job.id}`}
        summary={
          <>
            <h3>{job.title}</h3>
            <span className="job__company">{job.company}</span>
            <span className="job__dates">{job.dates}</span>
            <Icon name="chevron" className="disclosure__chevron" />
          </>
        }
      >
        <div className="job__body" data-cascade="">
          {job.roles ? (
            <div className="roles">
              {job.roles.map((role) => (
                <span className="role" key={role}>
                  {role}
                </span>
              ))}
            </div>
          ) : null}
          <ul className="job__bullets">
            {job.bullets.map((bullet) => (
              <li key={bullet.slice(0, 32)}>
                <RichText value={bullet} />
              </li>
            ))}
          </ul>
          <p className="stack">{job.stack}</p>
        </div>
      </Disclosure>
    </div>
  );
}

function Rows({ rows }: { readonly rows: readonly TimelineRow[] }) {
  return (
    <div className="rows">
      {rows.map((row) => (
        <div className="row" key={row.what}>
          {row.when ? <span className="row__when">{row.when}</span> : null}
          <span className="row__what">{row.what}</span>
          <span className="row__where">
            <RichText value={row.where} />
          </span>
          {row.link ? (
            <a className="row__link" href={row.link.href} target="_blank" rel="noopener noreferrer">
              <span>{row.link.label}</span>
              <Icon name="external" />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
