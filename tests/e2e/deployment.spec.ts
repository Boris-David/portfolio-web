import { expect, test } from "@playwright/test";

/**
 * The Cloudflare serving layer.
 *
 * These tests did not exist in the Vercel days, because they were not testable:
 * the headers lived in `vercel.json`, applied by a platform we could not run
 * locally. `wrangler dev` runs the real static asset store, with the real
 * `_headers` — so a header regression now breaks a test instead of being
 * discovered in a recruiter's security scan.
 */

test.describe("the security headers", () => {
  test("are served on the document", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  });

  test("carry a locked-down content security policy", async ({ page }) => {
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    // No form on the site: no submission destination is legitimate.
    expect(csp).toContain("form-action 'none'");
    /**
     * `connect-src 'self'` and nothing more: the content is consumed at build
     * time (ADR 0002) and the résumé is a navigation, not a request. Allowing
     * the API's origin would open a door nobody walks through.
     */
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("connect-src 'self' http");
  });

  test("do not serve the configuration file itself", async ({ request }) => {
    // `_headers` is configuration: Cloudflare reads it, it does not publish it.
    expect((await request.get("/_headers")).status()).toBe(404);
  });

  test("mark the fingerprinted assets as immutable", async ({ page }) => {
    const responses: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/_next/static/")) {
        responses.push(response.headers()["cache-control"] ?? "");
      }
    });
    await page.goto("/");
    expect(responses.length).toBeGreaterThan(0);
    for (const cacheControl of responses) {
      expect(cacheControl).toContain("immutable");
    }
  });
});

test.describe("the asset store's URL resolution", () => {
  test("serves both languages with no extension and no trailing slash", async ({ request }) => {
    expect((await request.get("/")).status()).toBe(200);
    expect((await request.get("/en")).status()).toBe(200);
  });

  test("answers 404 with the dedicated page, not Next's default one", async ({ page }) => {
    const response = await page.goto("/an-address-that-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("n'existe pas");
    // The 404 page offers both languages: an unknown URL belongs to neither.
    await expect(page.getByRole("link", { name: /Retour au portfolio/ })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(page.getByRole("link", { name: /English/ })).toHaveAttribute("href", "/en");
  });

  test("does not index the 404 page, and declares it only once", async ({ page }) => {
    await page.goto("/an-address-that-does-not-exist");
    const robots = page.locator('meta[name="robots"]');
    // A single tag: Next already emits one, adding another duplicates it.
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute("content", /noindex/);
  });
});

/**
 * The universal links association file.
 *
 * iOS says **nothing** when it is served wrongly: the link simply opens in
 * Safari instead of the app, and you go looking for the problem in the app. All
 * three requirements are therefore checked here, on the server that will serve
 * in production.
 */
test.describe("the universal links", () => {
  const PATH = "/.well-known/apple-app-site-association";

  test("is served as JSON, with no redirect", async ({ request }) => {
    const response = await request.get(PATH, { maxRedirects: 0 });

    expect(response.status(), "iOS refuses any redirect on this file").toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
  });

  test("declares the app with its team identifier", async ({ request }) => {
    const association = await (await request.get(PATH)).json();
    const details = association.applinks.details;

    expect(details).toHaveLength(1);
    // `TEAMID.identifier` — a mistake here breaks the association silently.
    expect(details[0].appIDs).toEqual(["R55L6Z8K6R.dev.amissan.portfolio"]);
    expect(details[0].components.length).toBeGreaterThan(0);
  });
});

/**
 * The link to the résumé crosses two repositories: the site composes it, the API
 * serves it. This test hits the **real** API, so it is disabled by default — a
 * suite that depends on an outside service goes red for reasons that have
 * nothing to do with this repository.
 *
 * Run it when touching the résumé link, or after an API deployment:
 *
 *   E2E_API=1 npm run test:e2e -- --grep "résumé contract"
 */
test.describe("the résumé contract with the API", () => {
  test.skip(!process.env.E2E_API, "Run with E2E_API=1 to hit the real API.");

  for (const [path, lang] of [
    ["/", "fr"],
    ["/en", "en"],
  ]) {
    test(`serves a real PDF for ${lang}`, async ({ page, request }) => {
      await page.goto(path);
      const href = await page.getByTestId("cv-link").getAttribute("href");
      expect(href).toBe(`https://api.amissan.dev/v1/cv/amissan.ag-cv-${lang}.pdf`);

      const response = await request.get(href as string);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/pdf");
      // The bytes, not just the advertised type.
      expect((await response.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

      // The ETag must allow revalidation: that is what makes the résumé free to
      // reload for a recruiter who comes back.
      const etag = response.headers()["etag"];
      expect(etag).toBeTruthy();
      const revalidated = await request.get(href as string, {
        headers: { "if-none-match": etag },
      });
      expect(revalidated.status()).toBe(304);

      // The name the file arrives under on the recruiter's machine. Both routes
      // matter: `Content-Disposition` for a desktop browser, and the last
      // segment of the URL for Safari on iOS, which ignores the header.
      expect(response.headers()["content-disposition"]).toContain(
        `filename="amissan.ag-cv-${lang}.pdf"`,
      );
      expect(new URL(href as string).pathname.split("/").pop()).toBe(
        `amissan.ag-cv-${lang}.pdf`,
      );
    });
  }
});
