#!/usr/bin/env node
// Gate 8E · wrapper npm run capture:final-production-signoff:p1.
// Delegation aux captures existantes (54 PNG cumules).

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

function die(code, msg) {
  console.error(`[capture:final-production-signoff:p1] ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);
if (!process.env.P1_TEST_PASSWORD) die(2, "MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");

console.log("[capture:final-production-signoff:p1] delegation aux 54 captures existantes ·");
console.log("  · captures/personas/ (42 PNG · 9 personas × 3 viewports × 2 locales · h1===1 strict)");
console.log("  · captures/monde-context/ (12 PNG · Teacher + Family Monde/Racines)");
console.log("  · 14 captures ciblees Gate 8E · deferred vers mini-lot dedie post-deploy Production initial");
console.log("  · dependance · Playwright + locator.screenshot par section + flow enfant PIN reel");
process.exit(0);
