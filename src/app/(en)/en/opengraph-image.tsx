import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Amissan Amoussou-G., senior iOS engineer — mobile ticketing";

export default function OpengraphImage() {
  return renderOgImage("en");
}
