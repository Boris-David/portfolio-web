import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Le dépliage des cartes — le point que l'auteur tient le plus.
 *
 * Ces tests vérifient trois choses que l'unitaire ne peut pas voir, faute de
 * moteur d'animation dans jsdom : que la hauteur s'anime réellement, que le
 * contenu entre en cascade, et qu'une interruption ne fait pas sauter la carte.
 */

/**
 * Le premier chantier dépliable, désigné par sa **structure** et non par son
 * slug.
 *
 * Ce fichier teste un comportement — replier, déplier, animer, sans
 * JavaScript — pas un contenu. Y écrire un identifiant éditorial le couplait à
 * la source : le contenu venant désormais de l'API, le slug est passé de
 * « authentification » à « authentication » sans que rien ne change à l'écran,
 * et onze tests de comportement sont tombés pour une raison qui ne les regarde
 * pas.
 */
const WORKSTREAM = '[data-testid^="workstream-"]';
const firstWorkstream = (page: Page) => page.locator(WORKSTREAM).first();
const summaryOf = (card: Locator) => card.locator("summary");

test.describe("les chantiers dépliables", () => {
  test("sont repliés à l'arrivée, contenu déjà présent dans le DOM", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await expect(card).toHaveAttribute("data-open", "false");
    // Replié mais présent : « rechercher dans la page » et les moteurs le voient.
    await expect(card.locator("h4").first()).toBeAttached();
    await expect(card.locator("h4").first()).not.toBeVisible();
  });

  test("s'ouvrent au clic et montrent les trois colonnes", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    await summaryOf(card).click();

    await expect(card).toHaveAttribute("data-open", "true");
    await expect(card.locator("[data-cascade]")).toHaveCount(3);
    await expect(card.locator("[data-cascade]").first()).toBeVisible();
  });

  /** Entrée sur un `<summary>` : comportement natif que jsdom n'implémente pas. */
  test("s'ouvrent au clavier", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).focus();
    await page.keyboard.press("Enter");
    await expect(card).toHaveAttribute("data-open", "true");

    await page.keyboard.press("Space");
    await expect(card).toHaveAttribute("data-open", "false");
  });

  test("animent la hauteur au lieu de l'afficher d'un coup", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    const wrap = card.locator(".disclosure__wrap");

    await summaryOf(card).click();

    // En plein mouvement : une hauteur en ligne, strictement entre zéro et la cible.
    await page.waitForTimeout(120);
    const midHeight = await wrap.evaluate((node) => node.getBoundingClientRect().height);
    expect(midHeight).toBeGreaterThan(0);

    await expect
      .poll(async () => wrap.evaluate((node) => node.getBoundingClientRect().height), {
        timeout: 3000,
      })
      .toBeGreaterThan(midHeight);
  });

  test("rendent la hauteur au contenu une fois ouverts, sans la figer", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    await summaryOf(card).click();

    await expect
      .poll(async () => card.locator(".disclosure__wrap").evaluate((node) => node.style.height), {
        timeout: 3000,
      })
      .toBe("");
  });

  test("se referment complètement, sans hauteur résiduelle", async ({ page }) => {
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
   * Le cas qui fait « cheap » quand il est mal traité : refermer pendant que la
   * carte s'ouvre. La hauteur doit repartir de là où elle en est, jamais sauter
   * à sa taille pleine.
   */
  test("supportent d'être refermés en pleine ouverture, sans saut", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).click();
    await page.waitForTimeout(150);

    /**
     * L'inversion et les mesures se font **dans la page**, en une seule
     * évaluation. Passer par `locator.click()` laisserait Playwright vérifier
     * l'actionnabilité entre-temps : l'ouverture aurait le temps de se terminer,
     * et on mesurerait autre chose que ce qu'on croit.
     */
    const heights = await page.evaluate(async () => {
      const card = document.querySelector('[data-testid^="workstream-"]');
      const wrap = card?.querySelector<HTMLElement>(".disclosure__wrap");
      const summary = card?.querySelector("summary");
      if (!wrap || !summary) throw new Error("carte introuvable");

      const samples = [wrap.getBoundingClientRect().height];
      summary.click();
      for (let frame = 0; frame < 8; frame += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        samples.push(wrap.getBoundingClientRect().height);
      }
      return samples;
    });

    const atReverse = heights[0];
    // Aucun bond vers la hauteur pleine : à partir de l'inversion, on redescend.
    for (const height of heights) {
      expect(height).toBeLessThanOrEqual(atReverse + 2);
    }
    expect(heights.at(-1)).toBeLessThan(atReverse);

    await expect(card).toHaveAttribute("data-open", "false");
  });

  test("tournent le chevron avec l'état", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);
    const chevron = card.locator(".disclosure__chevron");

    const initial = await chevron.evaluate((node) => getComputedStyle(node).transform);
    await summaryOf(card).click();
    await page.waitForTimeout(700);
    const opened = await chevron.evaluate((node) => getComputedStyle(node).transform);

    expect(opened).not.toBe(initial);
  });

  test("n'utilisent jamais de courbe linéaire", async ({ page }) => {
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

test.describe("les expériences du parcours", () => {
  test("ouvrent la plus récente, replient les autres", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("job-instant-system")).toHaveAttribute("data-open", "true");
    await expect(page.getByTestId("job-mail-orange")).toHaveAttribute("data-open", "false");
    await expect(page.getByTestId("job-stiilt")).toHaveAttribute("data-open", "false");
  });

  test("se déplient indépendamment les unes des autres", async ({ page }) => {
    await page.goto("/");
    const stiilt = page.getByTestId("job-stiilt");

    await summaryOf(stiilt).click();
    await expect(stiilt).toHaveAttribute("data-open", "true");
    // Ouvrir l'une ne referme pas l'autre : ce n'est pas un accordéon exclusif.
    await expect(page.getByTestId("job-instant-system")).toHaveAttribute("data-open", "true");
  });
});

/**
 * `prefers-reduced-motion` ne réduit pas les animations, il les supprime — et
 * le contenu doit rester intégralement accessible.
 */
test.describe("mouvement réduit", () => {
  test.use({ reducedMotion: "reduce" });

  test("déplie instantanément, sans rien masquer", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).click();
    await expect(card).toHaveAttribute("data-open", "true");
    await expect(card.locator("[data-cascade]").first()).toBeVisible();

    // Aucune hauteur en ligne : rien n'a été animé.
    await expect(card.locator(".disclosure__wrap")).toHaveJSProperty("style.height", "");
  });

  test("laisse toutes les sections visibles, sans apparition au défilement", async ({ page }) => {
    await page.goto("/");
    const hidden = await page.locator("[data-reveal]").evaluateAll((nodes) =>
      nodes.filter((node) => Number(getComputedStyle(node).opacity) < 0.99).length,
    );
    expect(hidden).toBe(0);
  });
});

/**
 * La garantie la plus importante de la page : sans JavaScript, tout se lit.
 * Les apparitions sont gardées derrière `html.js`, et le dépliage repose sur
 * `<details>`, qui fonctionne tout seul.
 */
test.describe("sans JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("affiche l'intégralité du contenu, rien n'est masqué par une animation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/js/);

    const invisible = await page.locator("[data-reveal]").evaluateAll((nodes) =>
      nodes.filter((node) => Number(getComputedStyle(node).opacity) < 0.99).length,
    );
    expect(invisible).toBe(0);

    await expect(page.locator(".app-card")).toHaveCount(33);

    /**
     * Les chiffres de preuve sont rendus **par le serveur**, pas par le
     * compteur : sans JavaScript, chacun affiche déjà sa valeur finale.
     *
     * L'assertion portait sur une tuile « 33 » qui n'existe plus — l'auteur a
     * retiré la répétition du compte de réseaux. La remplacer par « ~5 M »
     * recouplerait ce test de comportement au contenu du jour. Ce qu'on vérifie
     * est l'invariant : chaque tuile porte un nombre, et aucune n'est restée sur
     * l'état de départ du compteur.
     */
    const values = await page.locator(".proof__value").allInnerTexts();
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value, "une tuile sans chiffre").toMatch(/\d/);
      expect(value.trim(), "une tuile figée sur l'état initial du compteur").not.toBe("0");
    }
  });

  test("laisse les cartes se déplier nativement", async ({ page }) => {
    await page.goto("/");
    const card = firstWorkstream(page);

    await summaryOf(card).click();
    await expect(card).toHaveJSProperty("open", true);
    await expect(card.locator("h4").first()).toBeVisible();
  });
});
