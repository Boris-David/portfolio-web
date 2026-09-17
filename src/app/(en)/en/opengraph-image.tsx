import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

/**
 * L'image ne dépend que du contenu et des tokens, tous deux connus au build.
 * `force-static` le déclare : l'export statique exige que chaque route sache
 * dire si elle se pré-rend, plutôt que de le supposer.
 */
export const dynamic = "force-static";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Amissan Amoussou-G., senior iOS engineer — mobile ticketing";

export default function OpengraphImage() {
  return renderOgImage("en");
}
