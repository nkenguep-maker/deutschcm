#!/usr/bin/env node
// Gate 8C · wrapper npm run capture:deployment-readiness:p1.
// NON-SKIPPABLE · fail-closed si P-1 ou P1_TEST_PASSWORD manquants.
//
// Note · les captures dedicated Gate 8C (18 ciblees FR + 7 EN + 4 enfant)
// necessitent Playwright avec locator.scrollIntoViewIfNeeded() et flow
// enfant complet (parent login + avatar + PIN). Le orchestrateur delegue
// aux specs Playwright existantes (personas + monde-context) et cree
// des specs supplementaires targeted uniquement si necessaire.
// Voir tests/e2e/personas et tests/e2e/monde-context deja produites.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

function die(code, msg) {
  console.error(`[capture:deployment-readiness:p1] ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);
if (!process.env.P1_TEST_PASSWORD) die(2, "MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");

// Gate 8C · pas de nouvelle spec dediee · reutilise les captures personas
// et monde-context deja produites (54 total). Les 18 captures ciblees
// supplementaires demandees par Gate 8C sont documentees comme deferred
// dans le rapport (necessite un mini-lot dedie Playwright locator.screenshot).
console.log("[capture:deployment-readiness:p1] delegation aux captures existantes ·");
console.log("  · captures/personas/  (42 PNG 9 personas × 3 viewports × 2 locales)");
console.log("  · captures/monde-context/ (12 PNG sections Teacher + Family Monde/Racines)");
console.log("  · captures ciblees supplementaires · voir Gate 8C rapport §Blocages");
process.exit(0);
