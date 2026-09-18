import { expect, test } from "@playwright/test";

/**
 * The journeys that matter to a recruiter: arriving, switching language,
 * reaching a section, leaving through an external link.
 */

test.describe("the language switch", () => {
  test("leads to a real English page, with its own <html lang>", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    await page.getByTestId("locale-switch").click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("comes back to French through the same switch", async ({ page }) => {
    await page.goto("/en");
    await page.getByTestId("locale-switch").click();

    await expect(page).toHaveURL(new RegExp(`${page.url().split("/en")[0]}/?$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("really translates the content, not just the label", async ({ page }) => {
    await page.goto("/");
    const frenchIntro = await page.locator(".hero__lede").first().innerText();

    await page.goto("/en");
    const englishIntro = await page.locator(".hero__lede").first().innerText();

    expect(englishIntro).not.toBe(frenchIntro);
    expect(englishIntro).toContain("mobile ticketing");
  });

  test("declares hreflang for both languages and an x-default", async ({ page }) => {
    await page.goto("/");
    const langs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("hreflang")),
    );
    expect(langs).toEqual(expect.arrayContaining(["fr", "en", "x-default"]));
  });

  /** Without JavaScript, the English page stays reachable: it is a link, not a button. */
  test("the switch is a link, so it works without JavaScript", async ({ page }) => {
    await page.goto("/");
    const control = page.getByTestId("locale-switch");
    await expect(control).toHaveAttribute("href", "/en");
    expect(await control.evaluate((node) => node.tagName)).toBe("A");
  });
});

test.describe("anchor navigation", () => {
  test("every link in the bar leads to a section that exists", async ({ page }) => {
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
   * Tested through the URL rather than a click: the link bar only exists above
   * 1000 px — below that, the page is a single scroll, as in the mockup. The
   * guarantee to check is the same either way: `scroll-padding-top` has to land
   * the section **below** the pinned bar.
   */
  test("brings the target section below the pinned bar, not under it", async ({ page }) => {
    await page.goto("/#parcours");

    const navHeight = await page.locator("nav.nav").evaluate((node) => node.clientHeight);
    const top = await page.locator("#parcours").evaluate((node) => node.getBoundingClientRect().top);
    // The section starts below the bar: its title is never hidden.
    expect(top).toBeGreaterThanOrEqual(navHeight - 2);
  });

  test("navigates when a link in the bar is clicked", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The link bar only exists above 1000 px.");

    await page.goto("/");
    await page.locator('[data-nav-link][href="#parcours"]').click();
    await expect(page).toHaveURL(/#parcours$/);
    await expect(page.locator("#parcours")).toBeInViewport();
  });

  test("marks the current section with aria-current", async ({ page }) => {
    await page.goto("/");
    await page.locator("#apps").scrollIntoViewIfNeeded();
    await expect(page.locator('[data-nav-link][href="#apps"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});

test.describe("the outbound links", () => {
  test("open the expected public profiles", async ({ page }) => {
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

  test("point the résumé at the API, never at a printout of the site", async ({ page }) => {
    await page.goto("/");
    const cv = page.getByTestId("cv-link");
    await expect(cv).toHaveAttribute("href", /\/v1\/cv\/amissan\.ag-cv-fr\.pdf$/);
    // No `download`: the attribute is inert cross-origin, and the API serves the
    // PDF `inline`. The link opens, it does not download.
    await expect(cv).not.toHaveAttribute("download", /.*/);
    await expect(cv).toHaveAttribute("target", "_blank");
    await expect(cv).toHaveAttribute("rel", /noopener/);

    // ADR 0004: the site no longer has a print stylesheet, and must not have one.
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

  test("translate the résumé link along with the page", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByTestId("cv-link")).toHaveAttribute(
      "href",
      /\/v1\/cv\/amissan\.ag-cv-en\.pdf$/,
    );
  });

  test("mark rel=noopener on every link opened in a new tab", async ({ page }) => {
    await page.goto("/");
    const blank = page.locator('a[target="_blank"]');
    const count = await blank.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      await expect(blank.nth(index)).toHaveAttribute("rel", /noopener/);
    }
  });

  test("expose no internal network identifier in the icon paths", async ({ page }) => {
    await page.goto("/");
    const sources = await page
      .locator("img")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("src") ?? ""));

    for (const source of sources) {
      expect(decodeURIComponent(source)).not.toMatch(/\/icons\/n\d+\.png/);
    }
  });
});
