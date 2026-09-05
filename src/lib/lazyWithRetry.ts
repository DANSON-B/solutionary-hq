import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "chunk-reload-at";

/**
 * React.lazy wrapper that survives stale chunk hashes after a new deploy.
 * If a dynamic import fails (old asset filename no longer exists), we bust
 * caches and reload once instead of showing a blank screen.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      const now = Date.now();

      // Only auto-reload once per 10s to avoid infinite reload loops.
      if (now - last > 10_000) {
        sessionStorage.setItem(RELOAD_KEY, String(now));
        try {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
        } catch {
          // ignore cache cleanup failures
        }
        window.location.reload();
        // Keep the promise pending while the page reloads.
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}
