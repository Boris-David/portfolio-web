import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * L'audit d'accessibilité automatisé.
 *
 * Il ne remplace pas une relecture humaine — aucun outil ne juge si un `alt`
 * dit la bonne chose. Mais il rend **impossible** de régresser sur ce qui se
 * mesure : contraste, noms accessibles, ordre des titres, rôles.
 *
 * Il tourne sur les deux langues et dans les deux thèmes : le contraste du
 * thème sombre est un autre calcul que celui du thème clair, et seul un audit
 * qui les voit tous les deux le garantit.
 */

const analyze = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

/**
 * Terminer toutes les apparitions avant de mesurer quoi que ce soit.
 *
 * Sans cela, on mesure une page en mouvement, et on obtient deux faux positifs
 * bien réels :
 *
 *   - **le contraste** : un texte à mi-apparition est à opacité 0,5, donc
 *     mélangé à son fond. Axe calcule alors le contraste d'une couleur qui
 *     n'existe à aucun moment stable de la page ;
 *   - **les cibles tactiles** : l'apparition applique un `scale(.994)`, qui rend
 *     43,7 px là où le CSS en impose 44.
 *
 * On coupe donc les transitions et on force l'état final. Ce que l'audit doit
 * juger, c'est la page telle qu'on la lit — pas une image intermédiaire.
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
  { path: "/", label: "française" },
  { path: "/en", label: "anglaise" },
]) {
  test.describe(`la page ${label}`, () => {
    test("ne présente aucune violation WCAG 2.1 AA en thème clair", async ({ page }) => {
      await page.goto(path);
      await forceTheme(page, "light");
      const results = await analyze(page);
      expect(results.violations).toEqual([]);
    });

    test("ne présente aucune violation WCAG 2.1 AA en thème sombre", async ({ page }) => {
      await page.goto(path);
      await forceTheme(page, "dark");
      const results = await analyze(page);
      expect(results.violations).toEqual([]);
    });

    test("reste conforme une fois les cartes dépliées", async ({ page }) => {
      await page.goto(path);
      for (const summary of await page.locator("details > summary").all()) {
        await summary.click();
      }
      await page.waitForTimeout(900);
      await settleReveals(page);

      const results = await analyze(page);
      expect(results.violations).toEqual([]);
    });

    test("n'a qu'un seul <h1> et une hiérarchie de titres continue", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      const levels = await page
        .locator("h1, h2, h3, h4")
        .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));

      for (let index = 1; index < levels.length; index += 1) {
        // Un niveau ne se saute jamais vers le bas : h2 → h4 est une rupture.
        expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
      }
    });

    test("donne un alt à chaque image, vide si l'image est décorative", async ({ page }) => {
      await page.goto(path);
      const missing = await page
        .locator("img")
        .evaluateAll((nodes) => nodes.filter((node) => node.getAttribute("alt") === null).length);
      expect(missing).toBe(0);
    });

    test("expose un lien d'évitement en premier au clavier", async ({ page }) => {
      await page.goto(path);
      await page.keyboard.press("Tab");

      const focused = page.locator(":focus");
      await expect(focused).toHaveClass(/skip-link/);
      await expect(focused).toBeVisible();

      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#contenu$/);
    });

    test("respecte 44 px de cible tactile sur tous les contrôles", async ({ page }) => {
      await page.goto(path);
      await settleReveals(page);
      const tooSmall = await page
        .locator("a, button, summary")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const style = getComputedStyle(node);
              if (style.display === "none" || style.visibility === "hidden") return false;
              // Un lien à l'intérieur d'un paragraphe suit la ligne de texte :
              // la règle des 44 px vise les contrôles, pas les liens en ligne.
              if (node.closest("p") && node.tagName === "A") return false;
              const rect = node.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return false;
              return rect.height < 44 || rect.width < 44;
            })
            .map((node) => `${node.tagName}.${node.className} — ${node.textContent?.trim().slice(0, 40)}`),
        );
      expect(tooSmall).toEqual([]);
    });

    test("rend le focus visible sur chaque contrôle atteint au clavier", async ({ page }) => {
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

test.describe("le responsive", () => {
  test.use({ viewport: { width: 400, height: 850 } });

  /**
   * Les deux langues, et pas seulement le français : « CV » fait deux
   * caractères, « Résumé » en fait six. Une barre qui ne tient que dans la
   * langue courte casse dans l'autre, et c'est exactement ce qui est arrivé.
   */
  for (const path of ["/", "/en"]) {
    test(`ne produit aucun défilement horizontal à 400 px sur ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`ne laisse déborder aucun élément à 400 px sur ${path}`, async ({ page }) => {
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

  test("garde le bouton CV atteignable et nommé, même sans son intitulé", async ({ page }) => {
    await page.goto("/en");
    const cv = page.getByTestId("cv-link");

    await expect(cv).toBeVisible();
    // L'intitulé disparaît, le nom accessible reste entier.
    await expect(cv).toHaveAttribute("aria-label", /résumé/i);
    const box = await cv.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("ne produit pas de défilement horizontal cartes dépliées", async ({ page }) => {
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
