import { expect, test } from "@playwright/test";

/**
 * Les parcours qui comptent pour un recruteur : arriver, changer de langue,
 * atteindre une section, partir vers un lien externe.
 */

test.describe("la bascule de langue", () => {
  test("mène à une vraie page anglaise, avec son propre <html lang>", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    await page.getByTestId("locale-switch").click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("revient au français par la même bascule", async ({ page }) => {
    await page.goto("/en");
    await page.getByTestId("locale-switch").click();

    await expect(page).toHaveURL(new RegExp(`${page.url().split("/en")[0]}/?$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("traduit réellement le contenu, pas seulement l'étiquette", async ({ page }) => {
    await page.goto("/");
    const frenchIntro = await page.locator(".hero__lede").first().innerText();

    await page.goto("/en");
    const englishIntro = await page.locator(".hero__lede").first().innerText();

    expect(englishIntro).not.toBe(frenchIntro);
    expect(englishIntro).toContain("mobile ticketing");
  });

  test("déclare hreflang pour les deux langues et un x-default", async ({ page }) => {
    await page.goto("/");
    const langs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("hreflang")),
    );
    expect(langs).toEqual(expect.arrayContaining(["fr", "en", "x-default"]));
  });

  /** Sans JavaScript, la page anglaise reste atteignable : c'est un lien, pas un bouton. */
  test("la bascule est un lien, donc utilisable sans JavaScript", async ({ page }) => {
    await page.goto("/");
    const control = page.getByTestId("locale-switch");
    await expect(control).toHaveAttribute("href", "/en");
    expect(await control.evaluate((node) => node.tagName)).toBe("A");
  });
});

test.describe("la navigation par ancres", () => {
  test("chaque lien de la barre mène à une section existante", async ({ page }) => {
    await page.goto("/");
    const links = page.locator("[data-nav-link]");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const href = await links.nth(index).getAttribute("href");
      expect(href).toMatch(/^#/);
      await expect(page.locator(href as string)).toHaveCount(1);
    }
  });

  /**
   * Testé par l'URL et non par un clic : la barre de liens n'existe qu'au-delà
   * de 1000 px — en dessous, la page est un seul défilement, comme la maquette.
   * La garantie à vérifier est la même dans les deux cas : `scroll-padding-top`
   * doit poser la section **sous** la barre collante.
   */
  test("amène la section visée sous la barre collante, pas dessous", async ({ page }) => {
    await page.goto("/#parcours");

    const navHeight = await page.locator("nav.nav").evaluate((node) => node.clientHeight);
    const top = await page.locator("#parcours").evaluate((node) => node.getBoundingClientRect().top);
    // La section commence sous la barre : son titre n'est jamais masqué.
    expect(top).toBeGreaterThanOrEqual(navHeight - 2);
  });

  test("navigue au clic sur un lien de la barre", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "La barre de liens n'existe qu'au-delà de 1000 px.");

    await page.goto("/");
    await page.locator('[data-nav-link][href="#parcours"]').click();
    await expect(page).toHaveURL(/#parcours$/);
    await expect(page.locator("#parcours")).toBeInViewport();
  });

  test("signale la section courante par aria-current", async ({ page }) => {
    await page.goto("/");
    await page.locator("#apps").scrollIntoViewIfNeeded();
    await expect(page.locator('[data-nav-link][href="#apps"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});

test.describe("les liens sortants", () => {
  test("ouvrent les profils publics attendus", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "GitHub" }).first()).toHaveAttribute(
      "href",
      "https://github.com/Boris-David",
    );
    await expect(page.getByRole("link", { name: "LinkedIn" }).first()).toHaveAttribute(
      "href",
      /linkedin\.com\/in\/boris-david/,
    );
  });

  test("pointent le CV vers l'API, jamais vers une impression du site", async ({ page }) => {
    await page.goto("/");
    const cv = page.getByTestId("cv-link");
    await expect(cv).toHaveAttribute("href", /\/v1\/cv\/fr\.pdf$/);
    await expect(cv).toHaveAttribute("download", "");

    // ADR 0004 : le site n'a plus de feuille d'impression, et ne doit pas en avoir.
    const printRules = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((sheet) => {
          try {
            return [...sheet.cssRules];
          } catch {
            return [];
          }
        })
        .filter((rule) => rule.cssText.startsWith("@media print")).length,
    );
    expect(printRules).toBe(0);
  });

  test("traduisent le lien du CV avec la page", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByTestId("cv-link")).toHaveAttribute("href", /\/v1\/cv\/en\.pdf$/);
  });

  test("marquent rel=noopener sur chaque lien ouvert dans un nouvel onglet", async ({ page }) => {
    await page.goto("/");
    const blank = page.locator('a[target="_blank"]');
    const count = await blank.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      await expect(blank.nth(index)).toHaveAttribute("rel", /noopener/);
    }
  });

  test("n'expose aucun identifiant de réseau interne dans les chemins d'icônes", async ({ page }) => {
    await page.goto("/");
    const sources = await page
      .locator("img")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));

    for (const source of sources) {
      expect(decodeURIComponent(source)).not.toMatch(/\/icons\/n\d+\.png/);
    }
  });
});
