/**
 * The theme, set before the first paint.
 *
 * A theme picked on the React side would arrive after the first render: the
 * page would show in light mode and then flip to dark — that white flash
 * everybody recognises. The script below is therefore inline and **blocking**,
 * placed in the `<head>` — a few hundred bytes executed before anything else.
 *
 * It also does a second thing, more important still: it puts `js` on `<html>`.
 * The whole animation stylesheet sits behind that class, so that the initial
 * "hidden" state of a scroll reveal exists **only** if the script runs. Without
 * JavaScript, nothing is hidden — which is the only honest way to animate a
 * reveal.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "amissan-theme";

/**
 * Minified by hand, and deliberately readable anyway: it is visible in the
 * page source, in a public repository.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light')r.setAttribute('data-theme',t)}catch(e){}})()`;
