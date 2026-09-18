import { ImageResponse } from "next/og";
import tokens from "@/../design/tokens.json";
import { getSiteContent } from "@/content/source";
import type { Locale } from "@/content/types";

/**
 * The Open Graph image — the thumbnail a recruiter sees when the link is
 * shared on LinkedIn.
 *
 * It is **generated at build time** rather than drawn by hand: an exported
 * image would become a second source of truth for the headline and for the
 * colours, and would drift on the first content edit.
 *
 * The colours come from `design/tokens.json`, never from a hex value written
 * here. The typography, on the other hand, is the engine's own: embedding
 * Fraunces would mean reading a font file at build time for a purely decorative
 * gain on a 1200 × 630 thumbnail.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const color = {
  paper: tokens.color.paper.light,
  paper2: tokens.color["paper-2"].light,
  line: tokens.color.line.light,
  ink: tokens.color.ink.light,
  ink3: tokens.color["ink-3"].light,
  accent: tokens.color.accent.light,
};

export async function renderOgImage(locale: Locale) {
  const content = await getSiteContent(locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: color.paper,
          padding: `${tokens.space[8]}px ${tokens.space[9]}px`,
          borderTop: `${tokens.space[1] * 2}px solid ${color.accent}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: color.accent,
              fontWeight: 600,
            }}
          >
            {content.hero.role}
          </div>
          <div
            style={{
              fontSize: 86,
              color: color.ink,
              fontWeight: 700,
              letterSpacing: -2,
              marginTop: tokens.space[4],
            }}
          >
            {content.hero.name}
          </div>
          <div
            style={{
              fontSize: 34,
              color: color.ink3,
              marginTop: tokens.space[5],
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            {content.appsHead.title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: tokens.space[5],
            borderTop: `2px solid ${color.line}`,
            paddingTop: tokens.space[5],
          }}
        >
          {content.proof.slice(0, 3).map((point) => (
            <div
              key={point.label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: color.paper2,
                border: `2px solid ${color.line}`,
                borderRadius: tokens.radius.lg,
                padding: `${tokens.space[3]}px ${tokens.space[5]}px`,
                flex: 1,
              }}
            >
              <div style={{ fontSize: 44, color: color.ink, fontWeight: 700 }}>
                {`${point.prefix ?? ""}${point.value}${point.unit ? ` ${point.unit}` : ""}`}
              </div>
              <div style={{ fontSize: 20, color: color.ink3, marginTop: 4 }}>{point.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
