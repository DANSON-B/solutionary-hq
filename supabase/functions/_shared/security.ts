const FALLBACK_SITE_ORIGIN = "https://solutionaryhq.com";

const DEFAULT_ALLOWED_ORIGINS = [
  FALLBACK_SITE_ORIGIN,
  "https://www.solutionaryhq.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function toOrigin(urlOrOrigin: string | null | undefined): string | null {
  if (!urlOrOrigin) return null;
  try {
    return new URL(urlOrOrigin).origin;
  } catch {
    return null;
  }
}

// Patterns for Lovable-hosted preview & published URLs (always allowed)
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/i,
];

export function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();
  const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const origin of [...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]) {
    const normalized = toOrigin(origin);
    if (normalized) allowed.add(normalized);
  }

  const siteOrigin = toOrigin(Deno.env.get("SITE_URL"));
  if (siteOrigin) allowed.add(siteOrigin);

  return allowed;
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  if (getAllowedOrigins().has(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function getSafeAppOrigin(req: Request): string {
  const requestOrigin = toOrigin(req.headers.get("origin"));
  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }

  const siteOrigin = toOrigin(Deno.env.get("SITE_URL"));
  if (siteOrigin) return siteOrigin;

  return FALLBACK_SITE_ORIGIN;
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getSafeAppOrigin(req),
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    Vary: "Origin",
  };
}

export function rejectDisallowedOrigin(req: Request): Response | null {
  const origin = toOrigin(req.headers.get("origin"));
  if (isOriginAllowed(origin)) return null;

  return new Response(JSON.stringify({ error: "Origin not allowed" }), {
    status: 403,
    headers: {
      ...buildCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}

export function rejectMissingOrDisallowedOrigin(req: Request): Response | null {
  const origin = toOrigin(req.headers.get("origin"));
  if (origin) {
    if (isOriginAllowed(origin)) return null;
    // Origin present but not allowed — reject
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: {
        ...buildCorsHeaders(req),
        "Content-Type": "application/json",
      },
    });
  }

  // No Origin header (some mobile in-app browsers / webviews strip it).
  // Fall back to the Referer header's origin.
  const refererOrigin = toOrigin(req.headers.get("referer"));
  if (refererOrigin && isOriginAllowed(refererOrigin)) return null;

  return new Response(JSON.stringify({ error: "Origin header required" }), {
    status: 403,
    headers: {
      ...buildCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}
