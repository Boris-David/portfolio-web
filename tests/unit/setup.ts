import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * jsdom implements neither `matchMedia` nor the Web Animations API.
 *
 * We do not stub them out to "make the tests pass": we leave them absent when
 * that is the behaviour under test. `matchMedia`, on the other hand, is called
 * by code that has to answer "no preference" by default — without it the
 * component would crash instead of testing what we want to test.
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
