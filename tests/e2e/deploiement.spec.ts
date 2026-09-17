import { expect, test } from "@playwright/test";

/**
 * La couche de service Cloudflare.
 *
 * Ces tests n'existaient pas du temps de Vercel, parce qu'ils n'étaient pas
 * testables : les en-têtes vivaient dans `vercel.json`, appliqués par une
 * plateforme qu'on ne pouvait pas faire tourner en local. `wrangler dev`
 * exécute le vrai magasin d'actifs statiques, avec le vrai `_headers` — donc
 * une régression d'en-tête casse désormais un test au lieu de se découvrir au
 * scan de sécurité d'un recruteur.
 */

test.describe("les en-têtes de sécurité", () => {
  test("sont servis sur le document", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  });

  test("portent une politique de sécurité de contenu verrouillée", async ({ page }) => {
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    // Aucun formulaire sur le site : aucune destination d'envoi n'est légitime.
    expect(csp).toContain("form-action 'none'");
    /**
     * `connect-src 'self'` et rien de plus : le contenu est consommé au build
     * (ADR 0002) et le CV est une navigation, pas une requête. Autoriser
     * l'origine de l'API ouvrirait une porte que personne n'emprunte.
     */
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("connect-src 'self' http");
  });

  test("ne servent pas le fichier de configuration lui-même", async ({ request }) => {
    // `_headers` est de la configuration : Cloudflare le lit, il ne le publie pas.
    expect((await request.get("/_headers")).status()).toBe(404);
  });

  test("marquent les actifs empreintés comme immuables", async ({ page }) => {
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

test.describe("la résolution d'URL du magasin d'actifs", () => {
  test("sert les deux langues sans extension ni barre finale", async ({ request }) => {
    expect((await request.get("/")).status()).toBe(200);
    expect((await request.get("/en")).status()).toBe(200);
  });

  test("répond 404 avec la page dédiée, pas celle de Next par défaut", async ({ page }) => {
    const response = await page.goto("/une-adresse-qui-n-existe-pas");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("n'existe pas");
    // La page 404 propose les deux langues : une URL inconnue n'en a aucune.
    await expect(page.getByRole("link", { name: /Retour au portfolio/ })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(page.getByRole("link", { name: /English/ })).toHaveAttribute("href", "/en");
  });

  test("n'indexe pas la page 404, et ne le déclare qu'une fois", async ({ page }) => {
    await page.goto("/une-adresse-qui-n-existe-pas");
    const robots = page.locator('meta[name="robots"]');
    // Une seule balise : Next en émet déjà une, en ajouter une autre duplique.
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute("content", /noindex/);
  });
});

/**
 * Le lien vers le CV traverse deux dépôts : le site le compose, l'API le sert.
 * Ce test tape l'API **réelle**, il est donc désactivé par défaut — une suite
 * qui dépend d'un service extérieur devient rouge pour des raisons qui ne
 * regardent pas ce dépôt.
 *
 * À lancer quand on touche au lien du CV, ou après un déploiement de l'API :
 *
 *   E2E_API=1 npm run test:e2e -- --grep "contrat du CV"
 */
test.describe("le contrat du CV avec l'API", () => {
  test.skip(!process.env.E2E_API, "Lancer avec E2E_API=1 pour taper l'API réelle.");

  for (const [path, lang] of [
    ["/", "fr"],
    ["/en", "en"],
  ]) {
    test(`sert un PDF réel pour ${lang}`, async ({ page, request }) => {
      await page.goto(path);
      const href = await page.getByTestId("cv-link").getAttribute("href");
      expect(href).toBe(`https://api.amissan.dev/v1/cv/amissan.ag-cv-${lang}.pdf`);

      const response = await request.get(href as string);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/pdf");
      // Les octets, pas seulement le type annoncé.
      expect((await response.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");

      // L'ETag doit permettre la revalidation : c'est ce qui rend le CV gratuit
      // à recharger pour un recruteur qui revient.
      const etag = response.headers()["etag"];
      expect(etag).toBeTruthy();
      const revalidated = await request.get(href as string, {
        headers: { "if-none-match": etag },
      });
      expect(revalidated.status()).toBe(304);

      // Le nom sous lequel le fichier arrive chez le recruteur. Les deux voies
      // comptent : `Content-Disposition` pour un navigateur de bureau, et le
      // dernier segment de l'URL pour Safari sur iOS, qui ignore l'en-tête.
      expect(response.headers()["content-disposition"]).toContain(
        `filename="amissan.ag-cv-${lang}.pdf"`,
      );
      expect(new URL(href as string).pathname.split("/").pop()).toBe(
        `amissan.ag-cv-${lang}.pdf`,
      );
    });
  }
});
