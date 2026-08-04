#!/usr/bin/env node
// Lot 7B.1 · wrapper npm run test:monde-context:p1 · authentifié P-1.
// NON-SKIPPABLE · fail-closed si P-1 ou credentials manquants.
//
// Exige :
//   - NEXT_PUBLIC_SUPABASE_URL contient kzzagbojjkivdzzcrmxn
//   - MONDE_CONTEXT_TEACHER_EMAIL + MONDE_CONTEXT_TEACHER_PASSWORD
//   - MONDE_CONTEXT_FAMILY_EMAIL  + MONDE_CONTEXT_FAMILY_PASSWORD
//
// Ces credentials pointent vers des comptes Supabase Auth QA scoped P-1
// (Teacher QA + Family QA) qui doivent être provisionnés par un lot de
// fixtures dédié · Lot 7B.1 ne crée AUCUN compte, ne modifie AUCUNE
// donnée production ni P-1 hors des learningGoal QA du test.

import { spawn } from "node:child_process";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const BLOCKED = new Set([
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
]);

function die(code, msg) {
  console.error(`[test:monde-context:p1] ${msg}`);
  process.exit(code);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(P1_REF)) die(2, `URL non-P1 · refusé (${url || "vide"})`);
for (const b of BLOCKED) if (url.includes(b)) die(2, `URL blocklisted · ${b}`);

// Lot 7B.2 · defaults canoniques · les comptes test_yema_qa_teacher et
// test_yema_qa_family existent déjà côté P-1 · P1_TEST_PASSWORD partagé
// par toutes les suites P-1 (voir scripts/test-baseline/_common.mjs).
process.env.MONDE_CONTEXT_TEACHER_EMAIL ||= "test_yema_qa_teacher@example.com";
process.env.MONDE_CONTEXT_FAMILY_EMAIL  ||= "test_yema_qa_family@example.com";
process.env.MONDE_CONTEXT_FAMILY2_EMAIL ||= "test_yema_qa_family2@example.com";
process.env.MONDE_CONTEXT_TEACHER_PASSWORD ||= process.env.P1_TEST_PASSWORD || "";
process.env.MONDE_CONTEXT_FAMILY_PASSWORD  ||= process.env.P1_TEST_PASSWORD || "";
process.env.MONDE_CONTEXT_FAMILY2_PASSWORD ||= process.env.P1_TEST_PASSWORD || "";

if (!process.env.P1_TEST_PASSWORD && !process.env.MONDE_CONTEXT_TEACHER_PASSWORD) {
  die(2, "MISSING P1_TEST_PASSWORD · NON-SKIPPABLE");
}
const required = [
  "MONDE_CONTEXT_TEACHER_EMAIL",
  "MONDE_CONTEXT_TEACHER_PASSWORD",
  "MONDE_CONTEXT_FAMILY_EMAIL",
  "MONDE_CONTEXT_FAMILY_PASSWORD",
];
for (const k of required) {
  if (!process.env[k]) die(2, `MISSING ${k} · NON-SKIPPABLE`);
}

const child = spawn("node", [
  "scripts/test-baseline/run-p4-5-b2-p1.mjs",
  "--flag", "on", "--",
  "node", "scripts/orchestrate-monde-context-p1.mjs",
], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
