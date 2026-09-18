import type { Locale } from "@/content/types";

/**
 * Human-readable dates, derived — never written by hand.
 *
 * The API serves machine dates: `2023-05`, `2025-11`, `2020`. The site displays
 * "mai 2023 → aujourd'hui", "novembre 2025", "2020 — 2021". Two ways of
 * bridging that gap:
 *
 *   - a table of month names per locale. Ruled out: twelve entries × two locales
 *     to keep up to date, and a mistake in casing or abbreviation that only
 *     shows up in production;
 *   - **`Intl.DateTimeFormat`**, which already knows both languages. Chosen.
 *
 * One detail alone cannot be had directly: the **abbreviation full stop**.
 * French already carries it ("janv."), English does not ("Jan"), and neither
 * "mai" nor "May" takes one since they are not abbreviated. The rule is
 * therefore the same in both languages: *a short form that differs from the
 * long form is an abbreviation, and an abbreviation takes a full stop.*
 *
 * Checked against every date already published in both languages, plus months
 * that appear nowhere in the content — the rule generalises, it does not merely
 * describe the cases at hand.
 */

/** `2023-05` → `{ year: 2023, month: 5 }`; `2020` → `{ year: 2020 }`. */
interface YearMonth {
  readonly year: number;
  readonly month?: number;
}

export function parseYearMonth(value: string, path: string): YearMonth {
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  if (match === null) {
    throw new Error(`Date “${value}” unreadable at ${path}: expected “YYYY” or “YYYY-MM”.`);
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

/** "mai 2023", "janv. 2022", "Oct. 2020". A bare year stays the year. */
export function formatShort(value: YearMonth, locale: Locale): string {
  if (value.month === undefined) return String(value.year);
  const date = asDate(value);
  const short = monthName(date, locale, "short");
  const long = monthName(date, locale, "long");
  const abbreviated = short !== long && !short.endsWith(".") ? `${short}.` : short;
  return `${abbreviated} ${value.year}`;
}

/** "novembre 2025", "November 2025". A bare year stays the year. */
export function formatLong(value: YearMonth, locale: Locale): string {
  if (value.month === undefined) return String(value.year);
  return `${monthName(asDate(value), locale, "long")} ${value.year}`;
}

const ONGOING: Readonly<Record<Locale, string>> = { fr: "aujourd'hui", en: "today" };

/**
 * "mai 2023 → aujourd'hui", "janv. 2022 → avr. 2023".
 *
 * The arrow and the word "today" are presentation: they live here, not in the
 * API, which only says that there is no end date.
 */
export function formatRange(
  start: YearMonth,
  end: YearMonth | null,
  locale: Locale,
): string {
  const to = end === null ? ONGOING[locale] : formatShort(end, locale);
  return `${formatShort(start, locale)} → ${to}`;
}

/** "2020 — 2021": two years, em dash surrounded by spaces. */
export function formatYearSpan(startYear: number, endYear: number): string {
  return `${startYear} — ${endYear}`;
}
