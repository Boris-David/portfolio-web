import type { Locale } from "@/content/types";

/**
 * Les dates lisibles, dérivées — jamais écrites à la main.
 *
 * L'API sert des dates machine : `2023-05`, `2025-11`, `2020`. Le site affiche
 * « mai 2023 → aujourd'hui », « novembre 2025 », « 2020 — 2021 ». Deux façons de
 * franchir cet écart :
 *
 *   - une table de mois par langue. Écartée : douze entrées × deux langues à
 *     tenir à jour, et une faute de casse ou d'abréviation qui ne se voit qu'en
 *     production ;
 *   - **`Intl.DateTimeFormat`**, qui connaît déjà les deux langues. Retenue.
 *
 * Un seul détail ne s'obtient pas directement : le **point d'abréviation**. Le
 * français le porte déjà (« janv. »), l'anglais non (« Jan »), et « mai » comme
 * « May » n'en prennent aucun puisqu'ils ne sont pas abrégés. La règle est donc
 * la même dans les deux langues : *une forme courte qui diffère de la forme
 * longue est une abréviation, et une abréviation prend un point.*
 *
 * Vérifié contre chaque date déjà publiée dans les deux langues, plus des mois
 * qui n'apparaissent nulle part dans le contenu — la règle généralise, elle ne
 * décrit pas les cas présents.
 */

/** `2023-05` → `{ year: 2023, month: 5 }` ; `2020` → `{ year: 2020 }`. */
interface YearMonth {
  readonly year: number;
  readonly month?: number;
}

export function parseYearMonth(value: string, path: string): YearMonth {
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  if (match === null) {
    throw new Error(`Date « ${value} » illisible en ${path} : « AAAA » ou « AAAA-MM » attendu.`);
  }
  const year = Number(match[1]);
  return match[2] === undefined ? { year } : { year, month: Number(match[2]) };
}

function asDate({ year, month }: YearMonth): Date {
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1));
}

function monthName(date: Date, locale: Locale, style: "short" | "long"): string {
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: style }).format(date);
}

/** « mai 2023 », « janv. 2022 », « Oct. 2020 ». Une année seule reste l'année. */
export function formatShort(value: YearMonth, locale: Locale): string {
  if (value.month === undefined) return String(value.year);
  const date = asDate(value);
  const short = monthName(date, locale, "short");
  const long = monthName(date, locale, "long");
  const abbreviated = short !== long && !short.endsWith(".") ? `${short}.` : short;
  return `${abbreviated} ${value.year}`;
}

/** « novembre 2025 », « November 2025 ». Une année seule reste l'année. */
export function formatLong(value: YearMonth, locale: Locale): string {
  if (value.month === undefined) return String(value.year);
  return `${monthName(asDate(value), locale, "long")} ${value.year}`;
}

const ONGOING: Readonly<Record<Locale, string>> = { fr: "aujourd'hui", en: "today" };

/**
 * « mai 2023 → aujourd'hui », « janv. 2022 → avr. 2023 ».
 *
 * La flèche et le mot « aujourd'hui » sont de la présentation : ils vivent ici,
 * pas dans l'API, qui dit seulement qu'il n'y a pas de date de fin.
 */
export function formatRange(
  start: YearMonth,
  end: YearMonth | null,
  locale: Locale,
): string {
  const to = end === null ? ONGOING[locale] : formatShort(end, locale);
  return `${formatShort(start, locale)} → ${to}`;
}

/** « 2020 — 2021 » : deux années, cadratin encadré d'espaces. */
export function formatYearSpan(startYear: number, endYear: number): string {
  return `${startYear} — ${endYear}`;
}
