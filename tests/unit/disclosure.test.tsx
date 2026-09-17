import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Disclosure } from "@/components/Disclosure";

/**
 * jsdom n'implémente pas les Web Animations. C'est exactement l'environnement
 * qu'on veut tester ici : le dépliage doit rester **fonctionnel** sans
 * animation. Si ces tests passaient uniquement grâce à une simulation de
 * `Element.animate`, ils ne diraient rien du navigateur qui ne l'a pas.
 */
describe("Disclosure", () => {
  const renderOne = (defaultOpen = false) =>
    render(
      <Disclosure
        className="disclosure"
        summaryClassName="disclosure__summary"
        defaultOpen={defaultOpen}
        testId="carte"
        summary={<span>Le titre du chantier</span>}
      >
        <p>Le détail qui se déplie.</p>
      </Disclosure>,
    );

  it("s'appuie sur un <details> natif — donc utilisable sans JavaScript", () => {
    renderOne();
    const details = screen.getByTestId("carte");
    expect(details.tagName).toBe("DETAILS");
    expect(details.querySelector("summary")).not.toBeNull();
  });

  it("rend son contenu dans le DOM même replié, pour la recherche et l'indexation", () => {
    renderOne();
    expect(screen.getByText("Le détail qui se déplie.")).toBeInTheDocument();
  });

  it("est replié par défaut", () => {
    renderOne();
    const details = screen.getByTestId("carte") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details).toHaveAttribute("data-open", "false");
  });

  it("s'ouvre au clic sur le résumé", async () => {
    const user = userEvent.setup();
    renderOne();
    await user.click(screen.getByText("Le titre du chantier"));

    const details = screen.getByTestId("carte") as HTMLDetailsElement;
    expect(details.open).toBe(true);
    expect(details).toHaveAttribute("data-open", "true");
  });

  it("se referme au second clic", async () => {
    const user = userEvent.setup();
    renderOne();
    const summary = screen.getByText("Le titre du chantier");

    await user.click(summary);
    await user.click(summary);

    const details = screen.getByTestId("carte") as HTMLDetailsElement;
    expect(details).toHaveAttribute("data-open", "false");
    expect(details.open).toBe(false);
  });

  /**
   * Le résumé est focusable **sans** `tabindex` : c'est le navigateur qui le
   * rend atteignable au clavier, parce que c'est un `<summary>`. Une réécriture
   * en `<div onClick>` casserait cette propriété sans bruit.
   *
   * L'activation elle-même — Entrée et Espace traduits en `click` — est un
   * comportement du navigateur que jsdom n'implémente pas. La vérifier ici
   * testerait jsdom ; elle est donc couverte par le test de bout en bout, dans
   * un vrai Chromium.
   */
  it("expose un résumé atteignable au clavier, sans tabindex ajouté", async () => {
    const user = userEvent.setup();
    renderOne();

    const summary = screen.getByTestId("carte").querySelector("summary");
    expect(summary).not.toHaveAttribute("tabindex");

    await user.tab();
    expect(summary).toHaveFocus();
  });

  it("honore une ouverture par défaut sans rien animer au montage", () => {
    renderOne(true);
    const details = screen.getByTestId("carte") as HTMLDetailsElement;
    expect(details.open).toBe(true);
    expect(details).toHaveAttribute("data-open", "true");
    // Aucune hauteur en ligne : le contenu occupe sa taille naturelle.
    expect(details.querySelector<HTMLElement>(".disclosure__wrap")?.style.height).toBe("");
  });

  it("ne laisse aucune hauteur figée après un aller-retour", async () => {
    const user = userEvent.setup();
    renderOne();
    const summary = screen.getByText("Le titre du chantier");

    await user.click(summary);
    await user.click(summary);

    const wrap = screen.getByTestId("carte").querySelector<HTMLElement>(".disclosure__wrap");
    expect(wrap?.style.height).toBe("");
  });
});
