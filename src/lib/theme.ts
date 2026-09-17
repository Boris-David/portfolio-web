/**
 * Le thème, posé avant la première peinture.
 *
 * Un thème choisi côté React arriverait après le premier rendu : la page
 * s'afficherait en clair puis basculerait en sombre, ce clignotement blanc que
 * tout le monde reconnaît. Le script ci-dessous est donc inline et **bloquant**,
 * placé dans le `<head>` — quelques centaines d'octets exécutés avant tout.
 *
 * Il fait aussi une seconde chose, plus importante encore : il pose `js` sur
 * `<html>`. Toute la feuille de style d'animation est gardée derrière cette
 * classe, si bien que l'état initial « caché » d'une apparition au défilement
 * n'existe **que** si le script tourne. Sans JavaScript, rien n'est masqué —
 * ce qui est la seule façon honnête d'animer une apparition.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "amissan-theme";

/**
 * Minifié à la main, et volontairement lisible malgré tout : il est visible dans
 * la source de la page, sur un dépôt public.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light')r.setAttribute('data-theme',t)}catch(e){}})()`;
