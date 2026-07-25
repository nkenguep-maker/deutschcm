// QA-b1 · protection CSRF pour les routes QA mutant l'état (impersonate,
// logout). Vérifie POST + Content-Type JSON + Origin match host + header
// Sec-Fetch-Site acceptable.
//
// Aucun token CSRF stocké côté client · on s'appuie sur les invariants
// Origin/Sec-Fetch-Site (SameSite cookie + Origin header).

import "server-only";
import type { NextRequest } from "next/server";
import { normalizeHost } from "@/lib/qa/host";

export type CsrfCheckResult =
  | { ok: true }
  | { ok: false; reason: CsrfCheckError };

export type CsrfCheckError =
  | "method_not_allowed"
  | "content_type_invalid"
  | "origin_missing"
  | "origin_mismatch"
  | "sec_fetch_site_cross_site";

export function checkCsrf(request: NextRequest): CsrfCheckResult {
  if (request.method !== "POST") return { ok: false, reason: "method_not_allowed" };

  const ct = (request.headers.get("content-type") || "").toLowerCase();
  // Content-Type doit être application/json (avec charset optionnel).
  // Un formulaire multipart / form-urlencoded serait un signal CSRF classique.
  if (!ct.startsWith("application/json")) {
    return { ok: false, reason: "content_type_invalid" };
  }

  const origin = request.headers.get("origin");
  if (!origin) return { ok: false, reason: "origin_missing" };
  let originHost = "";
  try { originHost = normalizeHost(new URL(origin).host); }
  catch { return { ok: false, reason: "origin_mismatch" }; }
  const requestHost = normalizeHost(request.headers.get("host") || new URL(request.url).host);
  if (originHost !== requestHost) return { ok: false, reason: "origin_mismatch" };

  // Sec-Fetch-Site (browsers modernes) · accepter same-origin/same-site,
  // refuser cross-site. `none` = navigation directe (typing URL) →
  // acceptable pour navigation top-level mais pour une POST fetch(),
  // le browser envoie same-origin en cas d'appel from-same-page.
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site") {
    // Refuse cross-site, cross-origin (case connue: iframe malicieuse).
    if (secFetchSite === "cross-site" || secFetchSite === "cross-origin") {
      return { ok: false, reason: "sec_fetch_site_cross_site" };
    }
  }

  return { ok: true };
}
