import { prefersReducedMotion } from "./reduced-motion";

/**
 * The proof figures count up when they come into view.
 *
 * The movement conveys a quantity: watching "33" climb from zero makes you feel
 * thirty-three apps, where the number sitting still merely asserts it.
 *
 * Two guarantees hold this effect together:
 *
 *   - **the final value is the one rendered by the server.** We read it back out
 *     of the DOM and write it as is at the end, instead of reformatting it. A
 *     counter that reformats ends up showing "99.8" on a French page;
 *   - **without JavaScript, the figure is already there.** The animation only
 *     temporarily replaces text that is already correct.
 */

const DURATION_MS = 900;

/** Cubic deceleration: fast at the start, long on arrival. */
const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

interface CounterTarget {
  readonly element: HTMLElement;
  readonly finalText: string;
  readonly target: number;
  readonly decimals: number;
}

function read(element: HTMLElement): CounterTarget | null {
  const raw = element.dataset.count;
  if (raw === undefined) return null;
  const target = Number(raw);
  if (!Number.isFinite(target)) return null;
  return {
    element,
    finalText: element.textContent ?? raw,
    target,
    decimals: (raw.split(".")[1] ?? "").length,
  };
}

function animate(counter: CounterTarget, locale: string) {
  const format = new Intl.NumberFormat(locale, {
    minimumFractionDigits: counter.decimals,
    maximumFractionDigits: counter.decimals,
  });
  const start = performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - start) / DURATION_MS, 1);
    if (progress >= 1) {
      // The server's text takes over again: no formatting divergence.
      counter.element.textContent = counter.finalText;
      return;
    }
    counter.element.textContent = format.format(counter.target * easeOutCubic(progress));
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

export function setupCounters({ root = document }: { root?: ParentNode } = {}): () => void {
  const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"))
    .map(read)
    .filter((counter): counter is CounterTarget => counter !== null);

  if (counters.length === 0) return () => {};
  if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) return () => {};

  const locale = document.documentElement.lang || "fr";
  const observer = new IntersectionObserver(
    (entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const counter = counters.find((candidate) => candidate.element === entry.target);
        if (counter) animate(counter, locale);
        self.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );

  counters.forEach((counter) => observer.observe(counter.element));
  return () => observer.disconnect();
}
