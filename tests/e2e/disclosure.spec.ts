import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The card disclosure — the point the author cares about most.
 *
 * These tests check three things the unit suite cannot see, for want of an
 * animation engine in jsdom: that the height really animates, that the content
 * cascades in, and that an interruption does not make the card jump.
 */

/**
 * The first expandable workstream, identified by its **structure** and not by
 * its slug.
 *
 * This file tests a behaviour — collapse, expand, animate, work without
 * JavaScript — not a piece of content. Writing an editorial identifier into it
 * coupled it to the source: with the content now coming from the API, the slug
 * went from "authentification" to "authentication" without anything changing on
 * screen, and eleven behaviour tests fell over for a reason that was none of
 * their business.
 */
const WORKSTREAM = '[data-testid^="workstream-"]';
const firstWorkstream = (page: Page) => page.locator(WORKSTREAM).first();
const summaryOf = (card: Locator) => card.locator("summary");

test.describe("the expandable workstreams", () => {
  test("arrive collapsed, with the content already in the DOM", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await expect(card).toHaveAttribute("data-open", "false");
    // Collapsed but present: find-in-page and search engines see it.
    await expect(card.locator("h4").first()).toBeAttached();
    await expect(card.locator("h4").first()).not.toBeVisible();
  });

  test("open on click and show the three columns", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    await summaryOf(card).click();

    await expect(card).toHaveAttribute("data-open", "true");
    await expect(card.locator("[data-cascade]")).toHaveCount(3);
    await expect(card.locator("[data-cascade]").first()).toBeVisible();
  });

  /** Enter on a `<summary>`: native behaviour that jsdom does not implement. */
  test("open from the keyboard", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).focus();
    await page.keyboard.press("Enter");
    await expect(card).toHaveAttribute("data-open", "true");

    await page.keyboard.press("Space");
    await expect(card).toHaveAttribute("data-open", "false");
  });

  test("animate the height instead of showing it all at once", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    const wrap = card.locator(".disclosure__wrap");

    await summaryOf(card).click();

    // Mid-movement: an inline height, strictly between zero and the target.
    await page.waitForTimeout(120);
    const midHeight = await wrap.evaluate((node) => node.getBoundingClientRect().height);
    expect(midHeight).toBeGreaterThan(0);

    await expect
      .poll(async () => wrap.evaluate((node) => node.getBoundingClientRect().height), {
        timeout: 3000,
      })
      .toBeGreaterThan(midHeight);
  });

  test("hand the height back to the content once open, without freezing it", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    await summaryOf(card).click();

    await expect
      .poll(async () => card.locator(".disclosure__wrap").evaluate((node) => node.style.height), {
        timeout: 3000,
      })
      .toBe("");
  });

  test("close completely, with no residual height", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).click();
    await expect(card).toHaveAttribute("data-open", "true");
    await page.waitForTimeout(800);

    await summaryOf(card).click();
    await expect(card).toHaveAttribute("data-open", "false");
    await expect.poll(async () => card.evaluate((node) => (node as HTMLDetailsElement).open), {
      timeout: 3000,
    }).toBe(false);
  });

  /**
   * The case that "feels cheap" when it is handled badly: closing while the card
   * is opening. The height has to start again from where it is, never jump to
   * its full size.
   */
  test("cope with being closed mid-opening, without a jump", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).click();
    await page.waitForTimeout(150);

    /**
     * The reversal and the measurements happen **inside the page**, in a single
     * evaluation. Going through `locator.click()` would let Playwright check
     * actionability in between: the opening would have time to finish, and we
     * would be measuring something other than what we think.
     */
    const heights = await page.evaluate(async () => {
      const card = document.querySelector('[data-testid^="workstream-"]');
      const wrap = card?.querySelector<HTMLElement>(".disclosure__wrap");
      const summary = card?.querySelector("summary");
      if (!wrap || !summary) throw new Error("card not found");

      const samples = [wrap.getBoundingClientRect().height];
      summary.click();
      for (let frame = 0; frame < 8; frame += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        samples.push(wrap.getBoundingClientRect().height);
      }
      return samples;
    });

    const atReverse = heights[0];
    // No leap to the full height: from the reversal onwards, it comes back down.
    for (const height of heights) {
      expect(height).toBeLessThanOrEqual(atReverse + 2);
    }
    expect(heights.at(-1)).toBeLessThan(atReverse);

    await expect(card).toHaveAttribute("data-open", "false");
  });

  test("turn the chevron with the state", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    const chevron = card.locator(".disclosure__chevron");

    const initial = await chevron.evaluate((node) => getComputedStyle(node).transform);
    await summaryOf(card).click();
    await page.waitForTimeout(700);
    const opened = await chevron.evaluate((node) => getComputedStyle(node).transform);

    expect(opened).not.toBe(initial);
  });

  test("never use a linear curve", async ({ page }) => {
    await page.goto("/");
    const easings = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return ["--e-out", "--e-soft", "--e-io", "--e-back"].map((name) =>
        root.getPropertyValue(name).trim(),
      );
    });

    expect(easings).toHaveLength(4);
    for (const easing of easings) {
      expect(easing).toMatch(/^cubic-bezier\(/);
    }
  });
});

test.describe("the background experiences", () => {
  test("open the most recent one and keep the others collapsed", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("job-instant-system")).toHaveAttribute("data-open", "true");
    await expect(page.getByTestId("job-mail-orange")).toHaveAttribute("data-open", "false");
    await expect(page.getByTestId("job-stiilt")).toHaveAttribute("data-open", "false");
  });

  test("expand independently of one another", async ({ page }) => {
    await page.goto("/");
    const stiilt = page.getByTestId("job-stiilt");

    await summaryOf(stiilt).click();
    await expect(stiilt).toHaveAttribute("data-open", "true");
    // Opening one does not close the other: this is not an exclusive accordion.
    await expect(page.getByTestId("job-instant-system")).toHaveAttribute("data-open", "true");
  });
});

/**
 * `prefers-reduced-motion` does not reduce animations, it removes them — and the
 * content has to stay entirely accessible.
 */
test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("expands instantly, hiding nothing", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).click();
    await expect(card).toHaveAttribute("data-open", "true");
    await expect(card.locator("[data-cascade]").first()).toBeVisible();

    // No inline height: nothing was animated.
    await expect(card.locator(".disclosure__wrap")).toHaveJSProperty("style.height", "");
  });

  test("leaves every section visible, with no scroll reveal", async ({ page }) => {
    await page.goto("/");
    const hidden = await page.locator("[data-reveal]").evaluateAll((nodes) =>
      nodes.filter((node) => Number(getComputedStyle(node).opacity) < 0.99).length,
    );
    expect(hidden).toBe(0);
  });
});

/**
 * The page's most important guarantee: without JavaScript, everything reads.
 * The reveals are guarded behind `html.js`, and the disclosure rests on
 * `<details>`, which works on its own.
 */
test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the content in full, with nothing hidden by an animation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/js/);

    const invisible = await page.locator("[data-reveal]").evaluateAll((nodes) =>
      nodes.filter((node) => Number(getComputedStyle(node).opacity) < 0.99).length,
    );
    expect(invisible).toBe(0);

    await expect(page.locator(".app-card")).toHaveCount(33);

    /**
     * The proof figures are rendered **by the server**, not by the counter:
     * without JavaScript, each already shows its final value.
     *
     * The assertion used to cover a "33" tile that no longer exists — the author
     * removed the repetition of the network count. Replacing it with "~5 M"
     * would recouple this behaviour test to today's content. What we check is
     * the invariant: every tile carries a number, and none has stayed on the
     * counter's starting state.
     */
    const values = await page.locator(".proof__value").allInnerTexts();
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value, "a tile with no figure").toMatch(/\d/);
      expect(value.trim(), "a tile stuck on the counter's initial state").not.toBe("0");
    }
  });

  test("lets the cards expand natively", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).click();
    await expect(card).toHaveJSProperty("open", true);
    await expect(card.locator("h4").first()).toBeVisible();
  });
});
