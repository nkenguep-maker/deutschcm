import type { NextRequest } from "next/server";

function matchesRequestOrigin(rawUrl: string, req: NextRequest): boolean {
  try {
    return new URL(rawUrl).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Browser mutation requests should come from the exact request origin.
 *
 * Preferred signal is `Origin`. Some clients may omit it, so browser fallback
 * signals are checked before allowing a headerless server-to-server request:
 *
 * 1. Origin, when present, must match scheme + host + port exactly.
 * 2. Sec-Fetch-Site from a browser must be same-origin (or `none` for a
 *    user-initiated/non-fetch navigation).
 * 3. Referer, when present without Origin, must also resolve to the same origin.
 * 4. A non-browser client with none of those headers remains allowed. It does
 *    not create a CSRF primitive because it cannot ambiently attach a user's
 *    browser cookies.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (origin) return matchesRequestOrigin(origin, req);

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  const referer = req.headers.get("referer");
  if (referer) return matchesRequestOrigin(referer, req);

  return true;
}
