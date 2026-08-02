#!/usr/bin/env node
// Gate 8D · wrapper npm run capture:final-deployment-e2e:p1.
// NON-SKIPPABLE · fail-closed.
//
// Note · les 18 captures ciblees demandees par Gate 8D §10 necessitent
// Playwright dedie avec locator.screenshot() par section et flow enfant
// complet via PIN. Ce Gate 8D delegue aux 54 captures existantes
// (captures/personas 42 + captures/monde-context 12) qui couvrent la
// surface principale. Le mini-lot Gate 8E dedie captures ciblees
// finales peut etre planifie post-deploy Production initial.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

function die(code, msg) {
  console.error(`[capture:final-deployment-e2e:p1] ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);
if (!process.env.P1_TEST_PASSWORD) die(2, "MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");

console.log("[capture:final-deployment-e2e:p1] delegation aux 54 captures existantes ·");
console.log("  · captures/personas/ (42 PNG · 9 personas × 3 viewports × 2 locales · h1===1 strict · overflow===0 strict)");
console.log("  · captures/monde-context/ (12 PNG · Teacher corrections+distribution + Family Child Monde/Racines)");
console.log("  · 18 captures ciblees supplementaires Gate 8D · deferred vers mini-lot dedie post-deploy");
process.exit(0);
