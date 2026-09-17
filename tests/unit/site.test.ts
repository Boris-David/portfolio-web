import { describe, expect, it } from "vitest";
import { cvUrl, DEFAULT_LOCALE, isLocale, LOCALES, otherLocale, pathForLocale } from "@/lib/site";

describe("le routage par langue", () => {
  it("sert le français à la racine", () => {
    expect(DEFAULT_LOCALE).toBe("fr");
    expect(pathForLocale("fr")).toBe("/");
  });

  it("donne à l'anglais sa propre route", () => {
    expect(pathForLocale("en")).toBe("/en");
  });

  it("produit une route distincte par langue", () => {
    const paths = LOCALES.map(pathForLocale);
    expect(new Set(paths).size).toBe(LOCALES.length);
  });

  it("bascule vers l'autre langue", () => {
    expect(otherLocale("fr")).toBe("en");
    expect(otherLocale("en")).toBe("fr");
  });

  it("reconnaît une langue supportée et rejette les autres", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

/**
 * ADR 0004 : le CV est un PDF produit par l'API, un fichier unique servi au web
 * comme à l'app iOS. Le site n'en fabrique aucun — il relaie un lien.
 */
describe("le lien vers le CV", () => {
  it("pointe hors du site, vers l'API", () => {
    expect(cvUrl("fr")).toMatch(/^https?:\/\//);
    expect(new URL(cvUrl("fr")).pathname).toBe("/v1/cv/fr.pdf");
  });

  it("distingue les deux langues", () => {
    expect(cvUrl("fr")).not.toBe(cvUrl("en"));
    expect(new URL(cvUrl("en")).pathname).toBe("/v1/cv/en.pdf");
  });

  it("sert les deux langues depuis la même origine", () => {
    expect(new URL(cvUrl("fr")).origin).toBe(new URL(cvUrl("en")).origin);
  });
});
