#!/usr/bin/env node
// Gate 8L · wrapper capture · delegue au test orchestrator.
import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set(["sbjhvlrkbyjckdxujjsk", "mamofhrurksyuuolucea", "qggwvonfumuimjfsgpdz"]);

function die(code, msg) { console.error(`[capture:final-runtime-assertions:p1] ${msg}`); process.exit(code); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);
if (!process.env.P1_TEST_PASSWORD) die(2, "MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");

const child = spawn("node", ["scripts/test-final-runtime-assertions-p1.mjs"], {
  stdio: "inherit", env: { ...process.env },
});
child.on("exit", (code) => process.exit(code ?? 1));
