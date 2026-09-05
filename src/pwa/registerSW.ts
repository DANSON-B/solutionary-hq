// Guarded service worker registration. Only registers in production, on the
// deployed site (not Lovable preview / iframe / dev), and never when the URL
// carries ?sw=off. In any refused context we also unregister any stale SW
// pointing at /sw.js so returning visitors don't get stuck on old builds.

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    // ignore
  }
}

// Holds the "apply update" callback provided by vite-plugin-pwa so the UI
// prompt can trigger a controlled reload when the user accepts the update.
let pendingUpdate: (() => Promise<void>) | null = null;
export function hasPendingUpdate() {
  return pendingUpdate !== null;
}
export async function applyPendingUpdate() {
  if (!pendingUpdate) return;
  const fn = pendingUpdate;
  pendingUpdate = null;
  await fn();
}

function dispatchUpdateAvailable() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("sw:update-available"));
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }
  try {
    const { registerSW } = await import("virtual:pwa-register");
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Auto-apply new builds so returning visitors never get stuck on a
        // cached old bundle. Fall back to a prompt if activation fails.
        pendingUpdate = async () => {
          try {
            await updateSW(true);
          } catch {
            window.location.reload();
          }
        };
        void applyPendingUpdate().catch(() => dispatchUpdateAvailable());
      },
    });
  } catch {
    // vite-plugin-pwa virtual module unavailable — nothing to do
  }
}
