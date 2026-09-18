import type { Chrome } from "@/content/types";

/**
 * The footer carries the long form of the name -- the only place it appears
 * besides the resume.
 *
 * It is read from the content and not written here: a name is a fact, and a
 * fact typed into a component is a second source of truth that stops agreeing
 * with the first without anybody noticing.
 */
export function SiteFooter({
  fullName,
  chrome,
}: {
  readonly fullName: string;
  readonly chrome: Chrome;
}) {
  return (
    <footer className="wrap">
      <div className="site-footer">
        <span>
          {fullName} — {chrome.footerRole}
        </span>
        <span>{chrome.footerLocation}</span>
      </div>
    </footer>
  );
}
