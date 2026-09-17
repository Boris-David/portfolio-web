import { describe, expect, it } from "vitest";
import type { Locale } from "@/content/types";
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
  /** Le nom de fichier tel que l'utilisateur le verra : dernier segment du chemin. */
  const fileName = (locale: Locale) => new URL(cvUrl(locale)).pathname.split("/").pop() ?? "";

  it("pointe hors du site, vers l'API", () => {
    expect(cvUrl("fr")).toMatch(/^https?:\/\//);
    expect(new URL(cvUrl("fr")).pathname).toBe("/v1/cv/amissan.ag-cv-fr.pdf");
  });

  it("distingue les deux langues", () => {
    expect(cvUrl("fr")).not.toBe(cvUrl("en"));
    expect(new URL(cvUrl("en")).pathname).toBe("/v1/cv/amissan.ag-cv-en.pdf");
  });

  it("sert les deux langues depuis la même origine", () => {
    expect(new URL(cvUrl("fr")).origin).toBe(new URL(cvUrl("en")).origin);
  });

  /**
   * Safari sur iOS ignore `Content-Disposition` et nomme le partage d'après le
   * dernier segment de l'URL. Servi sur `/v1/cv/fr.pdf`, le CV arrivait dans la
   * feuille de partage sous le nom « fr » — constaté sur iPhone le 2026-09-16.
   * Ce que ce test protège n'est pas une chaîne, c'est le nom que lit un
   * recruteur : porteur, et distinct d'une langue à l'autre.
   */
  it.each(LOCALES)("donne au fichier un nom lisible par un recruteur (%s)", (locale) => {
    const name = fileName(locale);
    expect(name).toMatch(/\.pdf$/);
    expect(name).toContain("amissan.ag");
    expect(name.replace(/\.pdf$/, "").length).toBeGreaterThan(4);
  });

  it("ne donne pas le même nom de fichier aux deux langues", () => {
    expect(fileName("fr")).not.toBe(fileName("en"));
  });
});
