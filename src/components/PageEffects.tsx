"use client";

import { useEffect } from "react";
import { setupActiveSection } from "@/lib/effects/active-section";
import { setupCounters } from "@/lib/effects/counters";
import { setupReveal } from "@/lib/effects/reveal";
import { watchReducedMotion } from "@/lib/effects/reduced-motion";

/**
 * The page's progressive enhancement layer, mounted exactly once.
 *
 * This is the only place on the site where React code touches DOM it did not
 * render, and it is a deliberate call: the alternative — making every section a
 * client component just to give it a `ref` — would send the page's entire markup
 * into the bundle for a 0.9-second fade. These effects are **decorative and
 * removable**; treating them as a layer on top of the rendered document is
 * exactly what they are.
 *
 * None of these effects gate reading: without JavaScript, or under
 * `prefers-reduced-motion`, the page is complete and still.
 */
export function PageEffects() {
  useEffect(() => {
    let teardown: Array<() => void> = [];

    const start = () => {
      teardown.forEach((stop) => stop());
      teardown = [setupReveal(), setupCounters(), setupActiveSection()];
    };

    start();
    // The motion preference can flip mid-session.
    const unwatch = watchReducedMotion(start);

    return () => {
      unwatch();
      teardown.forEach((stop) => stop());
    };
  }, []);

  return null;
}
