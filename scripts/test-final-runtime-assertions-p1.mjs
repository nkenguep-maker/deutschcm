#!/usr/bin/env node
// Gate 8L · wrapper npm run test:final-runtime-assertions:p1.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

function die(code, msg) { console.error(`[test:final-runtime-assertions:p1] ${msg}`); process.exit(code); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);
if (!process.env.P1_TEST_PASSWORD) die(2, "MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) die(2, "MISSING SUPABASE_SERVICE_ROLE_KEY · NON-SKIPPABLE");

const child = spawn("npx", ["tsx", "scripts/orchestrate-final-runtime-assertions-p1.ts"], {
  stdio: "inherit",
  env: {
    ...process.env,
    YEMA_COACH_WORKSPACE_ENABLED: "true",
    YEMA_ROOTS_COACH_RLS_CONFIRMED: "true",
  },
});
child.on("exit", (code) => process.exit(code ?? 1));
