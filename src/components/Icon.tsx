import type { IconName } from "@/content/types";

/**
 * The icon set is an inline SVG sprite, dropped into the document once.
 *
 * Three reasons not to render each icon in full: the chevron appears ten times
 * on the page, and a sprite pays for the path only once; no network request is
 * added; and `currentColor` lets each context decide on the fill or the stroke,
 * which an `<img>` would not allow.
 */

const PATHS: Record<IconName, React.ReactNode> = {
  github: (
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.35-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
  ),
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.65h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.65c0-1.35-.03-3.08-1.9-3.08-1.9 0-2.19 1.46-2.19 2.98V21h-4V9z" />
  ),
  mail: (
    <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13zm2.2.5L12 12l7.8-6H4.2zM20 7.4l-7.4 5.7a1 1 0 0 1-1.2 0L4 7.4V18h16V7.4z" />
  ),
  appstore: (
    <path d="M16.3 12.7c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7c1.2 0 1.9-1.1 2.7-2.2.8-1.2 1.2-2.4 1.2-2.5 0 0-2.2-.9-2.2-3.8zM14.2 5.6c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z" />
  ),
  /**
   * A download, not a printer: the résumé is a PDF produced by the API
   * (ADR 0004). A printer icon would promise a print stylesheet the site no
   * longer has — and must no longer have.
   */
  document: <path d="M13 3v9.2l3.6-3.6L18 10l-6 6-6-6 1.4-1.4L11 12.2V3h2zM4 18h16v2H4v-2z" />,
  external: (
    <path d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3zM5 5h5v2H6v11h11v-4h2v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
  ),
  pin: (
    <>
      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
      <circle cx="12" cy="9" r="2.6" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  flow: (
    <>
      <rect x="3" y="3" width="7" height="6" rx="1.5" />
      <rect x="14" y="15" width="7" height="6" rx="1.5" />
      <path d="M10 6h4a3 3 0 0 1 3 3v6" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" fill="none">
        <path d="M12 1.8v2.6M12 19.6v2.6M22.2 12h-2.6M4.4 12H1.8M19.2 4.8l-1.8 1.8M6.6 17.4l-1.8 1.8M19.2 19.2l-1.8-1.8M6.6 6.6 4.8 4.8" />
      </g>
    </>
  ),
  moon: <path d="M21 13.2A9 9 0 0 1 10.8 3a9 9 0 1 0 10.2 10.2z" />,
};

const symbolId = (name: IconName) => `icon-${name}`;

/** Dropped in exactly once per document, right after the opening `<body>`. */
export function IconSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {(Object.keys(PATHS) as IconName[]).map((name) => (
          <symbol key={name} id={symbolId(name)} viewBox="0 0 24 24">
            {PATHS[name]}
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

interface IconProps {
  readonly name: IconName;
  readonly className?: string;
}

/**
 * The icons are decorative: the meaning is carried by the text next to them, or
 * by the `aria-label` of the control that contains them. They are therefore
 * hidden from screen readers — announcing "image" before every label helps
 * nobody.
 */
export function Icon({ name, className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <use href={`#${symbolId(name)}`} />
    </svg>
  );
}
