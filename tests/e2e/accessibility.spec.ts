import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The automated accessibility audit.
 *
 * It does not replace a human review — no tool judges whether an `alt` says the
 * right thing. But it makes it **impossible** to regress on what can be
 * measured: contrast, accessible names, heading order, roles.
 *
 * It runs on both languages and in both themes: the dark theme's contrast is a
 * different calculation from the light theme's, and only an audit that sees both
 * guarantees it.
 */

const analyze = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

/**
 * Finish every reveal before measuring anything.
 *
 * Without this we measure a page in motion, and get two very real false
 * positives:
 *
 *   - **contrast**: text mid-reveal is at opacity 0.5, so blended into its
 *     background. Axe then computes the contrast of a colour that exists at no
 *     stable moment of the page;
 *   - **touch targets**: the reveal applies a `scale(.994)`, which yields
 *     43.7 px where the CSS requires 44.
 *
 * So we cut the transitions and force the final state. What the audit has to
 * judge is the page as it is read — not an intermediate frame.
 */
const settleReveals = async (page: Page) => {
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = "*,*::before,*::after{transition:none!important;animation:none!important}";
    document.head.append(style);

    document.querySelectorAll("[data-reveal]").forEach((node) => {
      node.setAttribute("data-reveal", "in");
      (node as HTMLElement).style.transitionDelay = "0ms";
    });
    document.querySelectorAll("[data-stagger]").forEach((node) => {
      node.setAttribute("data-stagger", "in");
      Array.from(node.children).forEach((child) => {
        (child as HTMLElement).style.transitionDelay = "0ms";
      });
    });
  });
  await page.waitForTimeout(100);
};

const forceTheme = async (page: Page, theme: "light" | "dark") => {
  await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
  await settleReveals(page);
};

for (const { path, label } of [
  { path: "/", label: "French" },
  { path: "/en", label: "English" },
]) {
  test.describe(`the ${label} page`, () => {
    test("has no WCAG 2.1 AA violation in the light theme", async ({ page }) => {
      await page.goto(path);
      await forceTheme(page, "light");
      const results = await analyze(page);
      expect(results.violations).toEqual([]);
    });

    test("has no WCAG 2.1 AA violation in the dark theme", async ({ page }) => {
      await page.goto(path);
      await forceTheme(page, "dark");
      const results = await analyze(page);
      expect(results.violations).toEqual([]);
    });

    test("stays conformant once the cards are expanded", async ({ page }) => {
      await page.goto(path);
      for (const summary of await page.locator("details > summary").all()) {
        await summary.click();
      }
      await page.waitForTimeout(900);
      await settleReveals(page);

      const results = await analyze(page);
      expect(results.violations).toEqual([]);
    });

    test("has exactly one <h1> and an unbroken heading hierarchy", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      const levels = await page
        .locator("h1, h2, h3, h4")
        .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));

      for (let index = 1; index < levels.length; index += 1) {
        // A level is never skipped on the way down: h2 → h4 is a break.
        expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
      }
    });

    test("gives every image an alt, empty when the image is decorative", async ({ page }) => {
      await page.goto(path);
      const missing = await page
        .locator("img")
        .evaluateAll((nodes) => nodes.filter((node) => node.getAttribute("alt") === null).length);
      expect(missing).toBe(0);
    });

    test("exposes a skip link first from the keyboard", async ({ page }) => {
      await page.goto(path);
      await page.keyboard.press("Tab");

      const focused = page.locator(":focus");
      await expect(focused).toHaveClass(/skip-link/);
      await expect(focused).toBeVisible();

      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#contenu$/);
    });

    test("honours a 44 px touch target on every control", async ({ page }) => {
      await page.goto(path);
      await settleReveals(page);
      const tooSmall = await page
        .locator("a, button, summary")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const style = getComputedStyle(node);
              if (style.display === "none" || style.visibility === "hidden") return false;
              // A link inside a paragraph follows the line of text: the 44 px
              // rule targets controls, not inline links.
              if (node.closest("p") && node.tagName === "A") return false;
              const rect = node.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return false;
              return rect.height < 44 || rect.width < 44;
            })
            .map((node) => `${node.tagName}.${node.className} — ${node.textContent?.trim().slice(0, 40)}`),
        );
      expect(tooSmall).toEqual([]);
    });

    test("makes focus visible on every control reached from the keyboard", async ({ page }) => {
      await page.goto(path);
      for (let index = 0; index < 12; index += 1) {
        await page.keyboard.press("Tab");
        const outline = await page.locator(":focus").evaluate((node) => {
          const style = getComputedStyle(node);
          return `${style.outlineStyle} ${style.outlineWidth}`;
        });
        expect(outline).not.toMatch(/^none/);
      }
    });
  });
}

test.describe("responsiveness", () => {
  test.use({ viewport: { width: 400, height: 850 } });

  /**
   * Both languages, and not only French: "CV" is two characters, "Résumé" is
   * six. A bar that only fits in the short language breaks in the other, and
   * that is exactly what happened.
   */
  for (const path of ["/", "/en"]) {
    test(`produces no horizontal scrolling at 400 px on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`lets no element overflow at 400 px on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflowing = await page.locator("body *").evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.right > window.innerWidth + 1 && rect.width > 0;
          })
          .map((node) => `${node.tagName}.${node.className}`)
          .slice(0, 10),
      );
      expect(overflowing).toEqual([]);
    });
  }

  test("keeps the résumé button reachable and named, even without its label", async ({ page }) => {
    await page.goto("/en");
    const cv = page.getByTestId("cv-link");

    await expect(cv).toBeVisible();
    // The label disappears, the accessible name stays whole.
    await expect(cv).toHaveAttribute("aria-label", /résumé/i);
    await expect(cv).toHaveAttribute("aria-label", /new tab/i);
    const box = await cv.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("produces no horizontal scrolling with the cards expanded", async ({ page }) => {
    await page.goto("/");
    for (const summary of await page.locator("details > summary").all()) {
      await summary.click();
    }
    await page.waitForTimeout(800);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
