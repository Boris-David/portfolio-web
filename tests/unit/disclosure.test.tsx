import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Disclosure } from "@/components/Disclosure";

/**
 * jsdom does not implement the Web Animations API. That is exactly the
 * environment we want to test here: the disclosure has to stay **functional**
 * without animation. If these tests only passed thanks to a stubbed
 * `Element.animate`, they would say nothing about the browser that lacks it.
 */
describe("Disclosure", () => {
  const renderOne = (defaultOpen = false) =>
    render(
      <Disclosure
        className="disclosure"
        summaryClassName="disclosure__summary"
        defaultOpen={defaultOpen}
        testId="card"
        summary={<span>The workstream title</span>}
      >
        <p>The detail that expands.</p>
      </Disclosure>,
    );

  it("builds on a native <details> — so it works without JavaScript", () => {
    renderOne();
    const details = screen.getByTestId("card");
    expect(details.tagName).toBe("DETAILS");
    expect(details.querySelector("summary")).not.toBeNull();
  });

  it("renders its content in the DOM even when collapsed, for search and indexing", () => {
    renderOne();
    expect(screen.getByText("The detail that expands.")).toBeInTheDocument();
  });

  it("is collapsed by default", () => {
    renderOne();
    const details = screen.getByTestId("card") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details).toHaveAttribute("data-open", "false");
  });

  it("opens when the summary is clicked", async () => {
    const user = userEvent.setup();
    renderOne();
    await user.click(screen.getByText("The workstream title"));

    const details = screen.getByTestId("card") as HTMLDetailsElement;
    expect(details.open).toBe(true);
    expect(details).toHaveAttribute("data-open", "true");
  });

  it("closes on the second click", async () => {
    const user = userEvent.setup();
    renderOne();
    const summary = screen.getByText("The workstream title");

    await user.click(summary);
    await user.click(summary);

    const details = screen.getByTestId("card") as HTMLDetailsElement;
    expect(details).toHaveAttribute("data-open", "false");
    expect(details.open).toBe(false);
  });

  /**
   * The summary is focusable **without** a `tabindex`: it is the browser that
   * makes it reachable from the keyboard, because it is a `<summary>`. Rewriting
   * it as a `<div onClick>` would break that property silently.
   *
   * The activation itself — Enter and Space translated into a `click` — is a
   * browser behaviour jsdom does not implement. Checking it here would test
   * jsdom; it is therefore covered by the end-to-end test, in a real Chromium.
   */
  it("exposes a summary reachable from the keyboard, with no tabindex added", async () => {
    const user = userEvent.setup();
    renderOne();

    const summary = screen.getByTestId("card").querySelector("summary");
    expect(summary).not.toHaveAttribute("tabindex");

    await user.tab();
    expect(summary).toHaveFocus();
  });

  it("honours a default-open card without animating anything on mount", () => {
    renderOne(true);
    const details = screen.getByTestId("card") as HTMLDetailsElement;
    expect(details.open).toBe(true);
    expect(details).toHaveAttribute("data-open", "true");
    // No inline height: the content takes up its natural size.
    expect(details.querySelector<HTMLElement>(".disclosure__wrap")?.style.height).toBe("");
  });

  it("leaves no frozen height behind after a round trip", async () => {
    const user = userEvent.setup();
    renderOne();
    const summary = screen.getByText("The workstream title");

    await user.click(summary);
    await user.click(summary);

    const wrap = screen.getByTestId("card").querySelector<HTMLElement>(".disclosure__wrap");
    expect(wrap?.style.height).toBe("");
  });
});
