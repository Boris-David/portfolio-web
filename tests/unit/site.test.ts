import { describe, expect, it } from "vitest";
import type { Locale } from "@/content/types";
import { cvUrl, DEFAULT_LOCALE, isLocale, LOCALES, otherLocale, pathForLocale } from "@/lib/site";

describe("routing by locale", () => {
  it("serves French at the root", () => {
    expect(DEFAULT_LOCALE).toBe("fr");
    expect(pathForLocale("fr")).toBe("/");
  });

  it("gives English its own route", () => {
    expect(pathForLocale("en")).toBe("/en");
  });

  it("produces a distinct route per locale", () => {
    const paths = LOCALES.map(pathForLocale);
    expect(new Set(paths).size).toBe(LOCALES.length);
  });

  it("switches to the other locale", () => {
    expect(otherLocale("fr")).toBe("en");
    expect(otherLocale("en")).toBe("fr");
  });

  it("recognises a supported locale and rejects the others", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

/**
 * ADR 0004: the résumé is a PDF produced by the API, a single file served to the
 * web and to the iOS app alike. The site builds none of its own — it relays a
 * link.
 */
describe("the link to the résumé", () => {
  /** The filename as the user will see it: the last segment of the path. */
  const fileName = (locale: Locale) => new URL(cvUrl(locale)).pathname.split("/").pop() ?? "";

  it("points off site, at the API", () => {
    expect(cvUrl("fr")).toMatch(/^https?:\/\//);
    expect(new URL(cvUrl("fr")).pathname).toBe("/v1/cv/amissan.ag-cv-fr.pdf");
  });

  it("tells the two locales apart", () => {
    expect(cvUrl("fr")).not.toBe(cvUrl("en"));
    expect(new URL(cvUrl("en")).pathname).toBe("/v1/cv/amissan.ag-cv-en.pdf");
  });

  it("serves both locales from the same origin", () => {
    expect(new URL(cvUrl("fr")).origin).toBe(new URL(cvUrl("en")).origin);
  });

  /**
   * Safari on iOS ignores `Content-Disposition` and names the share after the
   * last segment of the URL. Served at `/v1/cv/fr.pdf`, the résumé turned up in
   * the share sheet under the name "fr" — observed on an iPhone on 2026-09-16.
   * What this test protects is not a string, it is the name a recruiter reads:
   * meaningful, and different from one language to the other.
   */
  it.each(LOCALES)("gives the file a name a recruiter can read (%s)", (locale) => {
    const name = fileName(locale);
    expect(name).toMatch(/\.pdf$/);
    expect(name).toContain("amissan.ag");
    expect(name.replace(/\.pdf$/, "").length).toBeGreaterThan(4);
  });

  it("does not give both locales the same filename", () => {
    expect(fileName("fr")).not.toBe(fileName("en"));
  });
});
