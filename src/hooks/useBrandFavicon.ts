import { useEffect } from "react";

const ICON_SELECTORS = [
  'link[rel="icon"]',
  'link[rel="shortcut icon"]',
  'link[rel="apple-touch-icon"]',
];

function snapshot() {
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>(ICON_SELECTORS.join(",")));
  return links.map((l) => ({ el: l, href: l.getAttribute("href") || "" }));
}

/**
 * Applies a tenant business's logo as the browser favicon, apple-touch-icon and
 * PWA manifest icon so branding matches everywhere the customer sees the app
 * (browser tab, installed home-screen icon, share cards).
 * Reverts to the Solutionary HQ defaults on unmount.
 */
export function useBrandFavicon(logoUrl?: string | null, name?: string | null) {
  useEffect(() => {
    if (!logoUrl) return;

    const original = snapshot();
    original.forEach(({ el }) => el.setAttribute("href", logoUrl));

    // Dynamic manifest so an installed PWA uses the business logo + name.
    const manifestEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const originalManifest = manifestEl?.getAttribute("href") || null;
    let blobUrl: string | null = null;

    try {
      const manifest = {
        name: name || "Book Now",
        short_name: (name || "Book").slice(0, 12),
        start_url: window.location.pathname,
        scope: window.location.pathname,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0F2A4A",
        icons: [
          { src: logoUrl, sizes: "192x192", type: "image/png" },
          { src: logoUrl, sizes: "512x512", type: "image/png" },
          { src: logoUrl, sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      };
      blobUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }));
      if (manifestEl) {
        manifestEl.setAttribute("href", blobUrl);
      } else {
        const link = document.createElement("link");
        link.rel = "manifest";
        link.href = blobUrl;
        link.dataset.tenantManifest = "true";
        document.head.appendChild(link);
      }
    } catch {
      // Non-fatal: branding falls back to defaults.
    }

    return () => {
      original.forEach(({ el, href }) => el.setAttribute("href", href));
      const current = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (current?.dataset.tenantManifest === "true") {
        current.remove();
      } else if (current && originalManifest) {
        current.setAttribute("href", originalManifest);
      }
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [logoUrl, name]);
}

export default useBrandFavicon;
