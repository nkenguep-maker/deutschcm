// P4.3b hardening · Vérifie l'état RLS sur P-1 après migration.
// Contrôle : RLS activée, helpers présents, policies, grants, AuditAction values.

import { assertNonProduction } from "./_common.mjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

assertNonProduction();

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter, log: ["error"] });

async function q(sql, ...args) {
  return db.$queryRawUnsafe(sql, ...args);
}

async function main() {
  process.stderr.write("═══ P4.3b · verify RLS on P-1 ═══\n\n");

  // 1. RLS activée sur les 4 tables Teacher.
  const rlsRows = await q(
    `SELECT relname, relrowsecurity FROM pg_class
     WHERE relname IN ('teachers', 'classrooms', 'classroom_enrollments', 'class_join_requests')
       AND relnamespace = 'public'::regnamespace
     ORDER BY relname;`
  );
  process.stderr.write("RLS enabled:\n");
  const rlsStatus = {};
  for (const r of rlsRows) {
    rlsStatus[r.relname] = r.relrowsecurity;
    process.stderr.write(`  ${r.relname}: ${r.relrowsecurity ? "✓ ON" : "✗ OFF"}\n`);
  }

  // 2. Helpers SQL présents avec proper security config.
  const helpers = await q(
    `SELECT p.proname,
            CASE p.prosecdef WHEN true THEN 'DEFINER' ELSE 'INVOKER' END as security,
            p.proconfig
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('is_teacher', 'is_teacher_for_classroom', 'is_active_student_in_classroom', 'current_app_user_id', 'is_yema_admin')
     ORDER BY p.proname;`
  );
  process.stderr.write("\nHelpers:\n");
  const helperSecurity = {};
  for (const h of helpers) {
    helperSecurity[h.proname] = h.security;
    const searchPath = (h.proconfig ?? []).find((c) => c.startsWith("search_path="));
    process.stderr.write(`  ${h.proname}: security=${h.security}, ${searchPath ?? "no search_path"}\n`);
  }

  // 3. Policies.
  const policies = await q(
    `SELECT tablename, policyname, cmd, roles::text as roles, qual
     FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('teachers', 'classrooms', 'classroom_enrollments', 'class_join_requests')
     ORDER BY tablename, policyname;`
  );
  process.stderr.write("\nPolicies:\n");
  const policyCount = {};
  for (const p of policies) {
    policyCount[p.tablename] = (policyCount[p.tablename] ?? 0) + 1;
    process.stderr.write(`  ${p.tablename}.${p.policyname} · cmd=${p.cmd} · roles=${p.roles}\n`);
  }

  // 4. Grants sur les helpers (REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO authenticated).
  const grants = await q(
    `SELECT r.rolname, p.proname, has_function_privilege(r.rolname, (p.oid)::regprocedure, 'EXECUTE') as can_execute
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     CROSS JOIN pg_roles r
     WHERE n.nspname = 'public'
       AND p.proname IN ('is_teacher', 'is_teacher_for_classroom', 'is_active_student_in_classroom')
       AND r.rolname IN ('authenticated', 'anon', 'public')
     ORDER BY p.proname, r.rolname;`
  );
  process.stderr.write("\nHelper grants:\n");
  const grantStatus = {};
  for (const g of grants) {
    grantStatus[`${g.proname}:${g.rolname}`] = g.can_execute;
    process.stderr.write(`  ${g.proname} · ${g.rolname}: ${g.can_execute ? "EXECUTE" : "-"}\n`);
  }

  // 5. Table grants (SELECT authenticated).
  const tableGrants = await q(
    `SELECT table_name, grantee, privilege_type
     FROM information_schema.role_table_grants
     WHERE table_schema = 'public'
       AND table_name IN ('teachers', 'classrooms', 'classroom_enrollments', 'class_join_requests')
       AND grantee IN ('authenticated', 'anon')
       AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
     ORDER BY table_name, grantee, privilege_type;`
  );
  process.stderr.write("\nTable grants:\n");
  const anonGrants = tableGrants.filter((g) => g.grantee === "anon");
  const authGrants = tableGrants.filter((g) => g.grantee === "authenticated");
  process.stderr.write(`  authenticated grants: ${authGrants.length}\n`);
  for (const g of authGrants) process.stderr.write(`    ${g.table_name} · ${g.privilege_type}\n`);
  process.stderr.write(`  anon grants: ${anonGrants.length}\n`);

  // 6. AuditAction values.
  const enumValues = await q(
    `SELECT enumlabel FROM pg_enum
     WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')
       AND enumlabel LIKE 'TEACHER%'
     ORDER BY enumlabel;`
  );
  process.stderr.write("\nAuditAction (TEACHER_*):\n");
  const enumSet = new Set();
  for (const e of enumValues) {
    enumSet.add(e.enumlabel);
    process.stderr.write(`  ${e.enumlabel}\n`);
  }
  const required = ["TEACHER_ACCESS_DENIED", "TEACHER_CLASS_ACCESS_DENIED", "TEACHER_STUDENT_ACCESS_DENIED", "TEACHER_SCOPE_AMBIGUOUS"];
  const missing = required.filter((v) => !enumSet.has(v));

  // 7. Summary.
  process.stderr.write("\n═══ Verdict ═══\n");
  const checks = [
    ["RLS teachers", rlsStatus.teachers === true],
    ["RLS classrooms", rlsStatus.classrooms === true],
    ["RLS classroom_enrollments", rlsStatus.classroom_enrollments === true],
    ["RLS class_join_requests", rlsStatus.class_join_requests === true],
    ["helper is_teacher SECURITY INVOKER", helperSecurity.is_teacher === "INVOKER"],
    ["helper is_teacher_for_classroom SECURITY INVOKER", helperSecurity.is_teacher_for_classroom === "INVOKER"],
    ["helper is_active_student_in_classroom SECURITY INVOKER", helperSecurity.is_active_student_in_classroom === "INVOKER"],
    ["policy teachers ≥ 1", (policyCount.teachers ?? 0) >= 1],
    ["policy classrooms ≥ 1", (policyCount.classrooms ?? 0) >= 1],
    ["policy classroom_enrollments ≥ 1", (policyCount.classroom_enrollments ?? 0) >= 1],
    ["policy class_join_requests ≥ 1", (policyCount.class_join_requests ?? 0) >= 1],
    ["is_teacher · authenticated EXECUTE", grantStatus["is_teacher:authenticated"]],
    ["is_teacher_for_classroom · authenticated EXECUTE", grantStatus["is_teacher_for_classroom:authenticated"]],
    ["is_active_student_in_classroom · authenticated EXECUTE", grantStatus["is_active_student_in_classroom:authenticated"]],
    ["is_teacher · public NOT EXECUTE", !grantStatus["is_teacher:public"]],
    ["is_teacher · anon NOT EXECUTE", !grantStatus["is_teacher:anon"]],
    ["AuditAction TEACHER_ACCESS_DENIED", enumSet.has("TEACHER_ACCESS_DENIED")],
    ["AuditAction TEACHER_CLASS_ACCESS_DENIED", enumSet.has("TEACHER_CLASS_ACCESS_DENIED")],
    ["AuditAction TEACHER_STUDENT_ACCESS_DENIED", enumSet.has("TEACHER_STUDENT_ACCESS_DENIED")],
    ["AuditAction TEACHER_SCOPE_AMBIGUOUS", enumSet.has("TEACHER_SCOPE_AMBIGUOUS")],
    ["anon no table grants", anonGrants.length === 0],
  ];
  let allPass = true;
  for (const [label, pass] of checks) {
    process.stderr.write(`  ${pass ? "✓" : "✗"} ${label}\n`);
    if (!pass) allPass = false;
  }
  process.stderr.write(`\n${allPass ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}\n`);
  if (missing.length) process.stderr.write(`Missing enum values: ${missing.join(", ")}\n`);
  await db.$disconnect();
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
