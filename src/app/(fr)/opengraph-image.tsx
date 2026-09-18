import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

/**
 * The image depends only on the content and the tokens, both known at build
 * time. `force-static` says so: the static export requires every route to state
 * whether it prerenders, rather than assuming it.
 */
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Amissan Amoussou-G., ingénieur iOS senior — billettique mobile";

export default function OpengraphImage() {
  return renderOgImage("fr");
}
