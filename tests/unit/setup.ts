import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * jsdom n'implémente ni `matchMedia` ni les Web Animations.
 *
 * On ne les simule pas pour « faire passer » les tests : on les laisse absents
 * quand c'est le comportement à vérifier. `matchMedia` est en revanche appelé
 * par du code qui doit répondre « pas de préférence » par défaut — sans lui, le
 * composant planterait au lieu de tester ce qu'on veut tester.
 */
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

afterEach(cleanup);
