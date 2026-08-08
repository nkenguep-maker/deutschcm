import type { NextRequest } from "next/server";

/**
 * Browser mutation requests should come from the exact request origin.
 *
 * `Origin` may legitimately be absent for server-to-server requests and some
 * non-browser clients, so absence is not treated as CSRF by itself. When the
 * browser supplies it, however, scheme + host + port must match exactly.
 * This intentionally rejects suffix lookalikes such as
 * `evil-deutschcm.vercel.app` for `deutschcm.vercel.app`.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}
