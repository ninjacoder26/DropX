import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement scrolling — stub it so route-change scroll
// restoration doesn't spam "not implemented" noise in tests.
if (typeof window !== 'undefined' && !window.scrollTo.toString().includes('[native code]')) {
  Object.defineProperty(window, 'scrollTo', { value: () => undefined, writable: true });
}
