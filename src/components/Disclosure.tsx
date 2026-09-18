"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  cascadeIn,
  canAnimate,
  collapseHeight,
  expandHeight,
  type Animation,
} from "@/lib/effects/disclosure-animation";
import { prefersReducedMotion } from "@/lib/effects/reduced-motion";

/**
 * An expandable card, built **on top of** `<details>` rather than instead of it.
 *
 * The classic problem: `<details>` cuts off dead — the browser hides its content
 * the instant `open` goes to `false`, which rules out any closing animation. The
 * fix is to separate two things the browser conflates:
 *
 *   - `open` — is the content in the flow? It has to stay true **during** the
 *     close, until the height reaches zero;
 *   - the visual state — chevron, background, number — which flips immediately,
 *     because a control that does not react to a click looks broken.
 *
 * Hence the small state machine below. It also has the merit of making the
 * impossible states unreachable: there is no such thing as "closed but
 * opening".
 *
 * What stays native, and therefore does not have to be rewritten: the ARIA
 * role, `aria-expanded`, Enter and Space on the keyboard, find-in-page over
 * collapsed content, and expanding fully before printing.
 */

type State = "closed" | "opening" | "open" | "closing";

const isVisuallyOpen = (state: State) => state === "opening" || state === "open";

export interface DisclosureProps {
  /** The `<summary>` content: title, subtitle, chevron. */
  readonly summary: ReactNode;
  readonly children: ReactNode;
  readonly defaultOpen?: boolean;
  readonly className?: string;
  readonly summaryClassName?: string;
  /** Rendered on the `<details>` element, so a test can target it. */
  readonly testId?: string;
}

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  testId,
}: DisclosureProps) {
  const [state, setState] = useState<State>(defaultOpen ? "open" : "closed");

  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const heightAnimation = useRef<Animation | null>(null);
  const cascadeAnimations = useRef<Animation[]>([]);
  /** The first render must animate nothing: `defaultOpen` is already on screen. */
  const mounted = useRef(false);
  /** The previous state decides where the height restarts from — see below. */
  const previousState = useRef<State>(state);

  const stopAll = useCallback(() => {
    heightAnimation.current?.stop();
    heightAnimation.current = null;
    cascadeAnimations.current.forEach((animation) => animation.stop());
    cascadeAnimations.current = [];
    /**
     * Motion writes the current value into the style at the moment it stops.
     * For the height that is exactly what we want — it is where the reverse
     * animation starts from. For the cascade it is not: an opacity frozen at
     * 0.4 would leave the text half erased. We hand it back to the CSS.
     */
    bodyRef.current?.querySelectorAll<HTMLElement>("[data-cascade]").forEach((item) => {
      item.style.opacity = "";
      item.style.transform = "";
    });
  }, []);

  useLayoutEffect(() => {
    const previous = previousState.current;
    previousState.current = state;

    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const wrap = wrapRef.current;
    const body = bodyRef.current;
    if (!wrap || !body) return;

    const reduced = prefersReducedMotion() || !canAnimate(wrap);

    if (state === "opening") {
      stopAll();
      if (reduced) {
        wrap.style.height = "";
        setState("open");
        return;
      }
      /**
       * `<details>` has just opened: the content already takes up its full
       * height. We bring it back to zero before measuring, inside a *layout*
       * effect — so before the first paint, with no flicker.
       *
       * When we interrupt a close, on the other hand, we must absolutely not
       * restart from zero: stopping the previous animation left the current
       * height inline, and that is where the expansion has to pick up again.
       */
      if (previous === "closed") wrap.style.height = "0px";
      const animation = expandHeight(wrap, body);
      heightAnimation.current = animation;
      cascadeAnimations.current = cascadeIn(
        Array.from(body.querySelectorAll<HTMLElement>("[data-cascade]")),
      );
      void animation.finished.then(() => {
        if (!animation.wasStopped()) setState("open");
      });
      return;
    }

    if (state === "closing") {
      stopAll();
      if (reduced) {
        wrap.style.height = "";
        setState("closed");
        return;
      }
      const animation = collapseHeight(wrap);
      heightAnimation.current = animation;
      void animation.finished.then(() => {
        if (animation.wasStopped()) return;
        // The inline height goes away: `<details>` takes display back over.
        wrap.style.height = "";
        setState("closed");
      });
    }
  }, [state, stopAll]);

  useEffect(() => stopAll, [stopAll]);

  /**
   * We prevent the native toggle so we can drive it ourselves. `<summary>` turns
   * Enter and Space into a `click`, so the keyboard goes through here too —
   * without a single key handler to write.
   */
  const onSummaryClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setState((current) => (isVisuallyOpen(current) ? "closing" : "opening"));
  };

  return (
    <details
      className={className}
      data-open={isVisuallyOpen(state)}
      data-testid={testId}
      /**
       * Open as soon as the state is not "closed": that is what keeps the
       * content on screen for the whole closing animation.
       */
      open={state !== "closed"}
      /** Driven by the click: React requires a handler, ours lives elsewhere. */
      onToggle={() => {}}
    >
      <summary className={summaryClassName} onClick={onSummaryClick}>
        {summary}
      </summary>
      <div className="disclosure__wrap" ref={wrapRef}>
        <div ref={bodyRef}>{children}</div>
      </div>
    </details>
  );
}
