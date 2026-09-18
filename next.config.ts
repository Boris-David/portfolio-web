import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Static export: `next build` writes `out/`, which Cloudflare serves from its
   * static asset store.
   *
   * The site uses **no** server feature — no middleware, no server action, no
   * route handler, no revalidation, no `cookies()`/`headers()`. Every route was
   * already prerendered before this change. The export therefore takes nothing
   * away: it states a fact.
   *
   * What it buys: Cloudflare's static assets are free, unlimited, and **do not
   * count** towards the quota of 100,000 requests a day. `@opennextjs/cloudflare`
   * would have put the Next server inside a Worker — so one invocation per
   * request — in order to run features this site does not use. The full
   * reasoning is in the README.
   */
  output: "export",

  /**
   * Rendering is entirely static: `X-Powered-By` teaches nobody anything useful,
   * and tells a scanner what the stack is.
   */
  poweredByHeader: false,

  /**
   * Next's image optimiser is a per-request service; it does not exist in a
   * static export. Three ways to live with that, and only one holds up:
   *
   *   - a third-party image service: paid for, and one more network dependency
   *     on the critical path;
   *   - a build-time derivative pipeline (resize + AVIF): that would need
   *     `sharp` and a custom loader;
   *   - **serve the sources as they are**, because they are already sized for
   *     their use: the icons are 132 px for a 44 px display, the screenshots
   *     415 px wide for a display of 300 px at most. The optimiser was therefore
   *     doing barely more than converting the format.
   *
   * Measured, not assumed. On the exported build served compressed — which is
   * what Cloudflare does — desktop stays at **100** with an LCP of 0.4 s
   * (against 0.6 s before), and throttled mobile **goes from 95 to 99**, at
   * almost identical weight (358 KB against 352). The round trips to the
   * optimiser cost more than the conversion gained.
   *
   * The backstop is still the Lighthouse budget: `total-byte-weight` breaks the
   * build beyond 1.8 MB. A heavy image added one day will show up.
   */
  images: { unoptimized: true },
};

export default nextConfig;
