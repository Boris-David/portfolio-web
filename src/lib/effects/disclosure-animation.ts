import { animate } from "motion/mini";
import { readEasing } from "./design-runtime";

/**
 * The disclosure animation — the point the author cares about most.
 *
 * Three requirements, and each one settles a detail of this file:
 *
 * **1. No height jump.** We never animate towards `auto`: neither the Web
 * Animations API nor a CSS transition can do it. We measure the content's real
 * height, animate in pixels, then hand back to `auto` on arrival — without
 * which the card would stay frozen at its measured height and cut off its
 * content on the first resize.
 *
 * **2. Never `linear`.** The curves come from the tokens, read out of the
 * computed CSS: `--e-io` for the height (in-out, which is what you expect from
 * a disclosure), `--e-soft` for the content (long deceleration).
 *
 * **3. Interruptible.** Closing a card mid-opening must start again from the
 * current height, not from the beginning. Hence stopping the previous animation
 * and measuring the **real** height at the moment of reversal.
 *
 * We use `motion/mini` — the `animate` built on the Web Animations API, two
 * kilobytes — because that is all we need. Motion's full engine would bring
 * springs, layout animations and gestures: enough to weigh every page down for
 * features none of these cards use.
 */

const HEIGHT_MS = 620;
const CASCADE_MS = 500;
const CASCADE_START_MS = 140;
const CASCADE_STEP_MS = 80;
const CASCADE_TRAVEL_PX = 14;

export interface Animation {
  /** Resolved at the end, whether natural or brought about by `stop()`. */
  readonly finished: Promise<void>;
  /** True if the animation was interrupted — so if its target was not reached. */
  readonly wasStopped: () => boolean;
  stop(): void;
}

/**
 * jsdom does not implement the Web Animations API, and neither does a very old
 * browser. We do not degrade the experience there: we drop the animation, and
 * the disclosure stays instant and perfectly functional.
 */
export function canAnimate(element: Element | null): element is HTMLElement {
  return element !== null && typeof (element as HTMLElement).animate === "function";
}

const SETTLED: Animation = {
  finished: Promise.resolve(),
  wasStopped: () => false,
  stop: () => {},
};

function run(
  element: HTMLElement,
  keyframes: Parameters<typeof animate>[1],
  options: Parameters<typeof animate>[2],
): Animation {
  const controls = animate(element, keyframes, options);
  let stopped = false;
  return {
    // `stop()` leaves Motion's promise pending: we neutralise it here.
    finished: controls.then(
      () => {},
      () => {},
    ),
    wasStopped: () => stopped,
    stop: () => {
      stopped = true;
      controls.stop();
    },
  };
}

/** Expands `wrap` from its current height to the natural height of `body`. */
export function expandHeight(wrap: HTMLElement, body: HTMLElement): Animation {
  if (!canAnimate(wrap)) return SETTLED;

  const from = wrap.getBoundingClientRect().height;
  const animation = run(
    wrap,
    { height: [`${from}px`, `${body.scrollHeight}px`] },
    { duration: HEIGHT_MS / 1000, ease: readEasing("--e-io") },
  );

  void animation.finished.then(() => {
    /**
     * Only if the opening ran to completion. If a close interrupted it, handing
     * the height back to `auto` would make the card jump to its full size in
     * the middle of the collapse.
     */
    if (!animation.wasStopped()) wrap.style.height = "";
  });

  return animation;
}

/** Collapses `wrap` from its current height down to zero. */
export function collapseHeight(wrap: HTMLElement): Animation {
  if (!canAnimate(wrap)) return SETTLED;
  const from = wrap.getBoundingClientRect().height;
  return run(
    wrap,
    { height: [`${from}px`, "0px"] },
    { duration: HEIGHT_MS / 1000, ease: readEasing("--e-io") },
  );
}

/**
 * The content cascades in behind the height.
 *
 * The starting delay lets the card open before the text arrives: if both left
 * together, you would be reading text that is still moving. The step is
 * deliberately short — three columns at 80 ms is perceptible without ever
 * making anyone wait.
 */
export function cascadeIn(items: readonly HTMLElement[]): Animation[] {
  return items.filter(canAnimate).map((item, index) =>
    run(
      item,
      { opacity: [0, 1], transform: [`translateY(${CASCADE_TRAVEL_PX}px)`, "translateY(0px)"] },
      {
        duration: CASCADE_MS / 1000,
        delay: (CASCADE_START_MS + index * CASCADE_STEP_MS) / 1000,
        ease: readEasing("--e-soft"),
      },
    ),
  );
}
