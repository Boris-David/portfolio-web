import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Amissan Amoussou-G., ingénieur iOS senior — billettique mobile";

export default function OpengraphImage() {
  return renderOgImage("fr");
}
