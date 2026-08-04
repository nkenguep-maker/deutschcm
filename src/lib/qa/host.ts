// QA-b1 · normalisation stricte du host pour le binding token/cookie.
//
// Règle · minuscules, sans protocole, sans port par défaut (80/443),
// sans query, sans slash final.

import "server-only";

export function normalizeHost(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input).trim().toLowerCase();
  // Retire protocole
  s = s.replace(/^https?:\/\//, "");
  // Retire trailing slash + query + fragment
  s = s.split("?")[0]!.split("#")[0]!;
  s = s.replace(/\/+$/, "");
  // Retire port par défaut (:443 pour https, :80 pour http)
  s = s.replace(/:(?:80|443)$/, "");
  return s;
}
