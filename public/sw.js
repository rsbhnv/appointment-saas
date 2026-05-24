/**
 * Service worker placeholder — PWA-ready structure.
 *
 * To enable offline support:
 * 1. Implement caching strategies here (or use a build plugin such as Serwist).
 * 2. Register from a client component after reviewing security implications.
 * 3. Never cache authenticated API responses without tenant isolation.
 *
 * This file is intentionally minimal until product requirements are defined.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
