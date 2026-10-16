// Node 22+ ships an experimental global `localStorage` that shadows jsdom's
// (and is undefined unless Node is started with --localstorage-file). Point the
// global back at jsdom's implementation so tests behave like the browser.
Object.defineProperty(globalThis, 'localStorage', {
  value: globalThis.jsdom.window.localStorage,
  configurable: true,
});
