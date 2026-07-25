// P4.5-B2b3b-b1 Student UI · verrous structurels sur adapter + resolver +
// pages + views + placeholders. Symétrique au fichier Teacher
// `p4-5-b2b3b-teacher-ui-structural.test.ts`.
//
// Aucune dépendance runtime (aucun jsdom, aucun accès Prisma). Les tests
// inspectent le code source pour garantir les propriétés attendues du brief
// P4.5-B2b3b-b1 (§3..§8) ·
//
//   §3   · resolver server-only, feature gate AVANT tout resolveStudentActor
//   §3   · adapter server-only, délégation exclusive services B1, aucune
//          requête Prisma ad hoc, jamais de logique enrollment/ownership
//   §4.1 · liste = PUBLISHED/CLOSED seulement (délégué B1)
//   §4.2 · détail = versions du Student courant + actions draft/nouvelle version
//   §4.3 · submission = draft éditable, submitted read-only, feedbacks
//          PUBLISHED/ADDENDUM uniquement, addenda chronologiques
//   §5   · MAX_MONDE_SUBMISSION_WORDS canonique, allowlist writtenContent
//   §6   · états UI (empty/loading/error/anonymous/role_absent/feature_disabled/notFound)
//   §7   · FR/EN symétriques, terminologie correcte, aucun texte en dur
//   §8   · verrous · pas d'ad hoc Prisma, pas d'Authorization header,
//          pas de userId/studentId/status/version dans body

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO = join(__dirname, "..", "..", "..");
function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf-8");
}

// ── Fichiers sous test ──────────────────────────────────────────────────

const ADAPTER = "src/lib/student/assignmentsAdapter.ts";
const RESOLVER = "src/lib/student/pageResolver.ts";
const B1_SERVICE = "src/lib/assignments/student.ts";
const B1_PERMISSIONS = "src/lib/permissions/student.ts";
const B1_TRANSITIONS = "src/lib/assignments/transitions.ts";
const B1_BODY = "src/lib/assignments/bodyValidators.ts";

const V_LIST = "src/components/student/StudentAssignmentsView.tsx";
const V_DETAIL = "src/components/student/StudentAssignmentDetailView.tsx";
const V_SUB = "src/components/student/StudentSubmissionView.tsx";
const V_WORDCOUNT = "src/components/student/WordCounter.tsx";
const V_FEATURE = "src/components/student/StudentFeaturePlaceholder.tsx";
const V_ROLE = "src/components/student/StudentRoleAbsentPlaceholder.tsx";

const PAGE_LIST = "src/app/[locale]/student/assignments/page.tsx";
const PAGE_DETAIL = "src/app/[locale]/student/assignments/[assignmentId]/page.tsx";
const PAGE_SUB = "src/app/[locale]/student/submissions/[submissionId]/page.tsx";

const ALL_VIEWS = [V_LIST, V_DETAIL, V_SUB];
const ALL_PLACEHOLDERS = [V_FEATURE, V_ROLE];
const ALL_PAGES = [PAGE_LIST, PAGE_DETAIL, PAGE_SUB];

// ─── §3 · Adapter server-only ────────────────────────────────────────────
describe("P4.5-B2b3b-b1 · adapter server-only", () => {
  const src = read(ADAPTER);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("chaque fonction publique commence par le feature-gate check", () => {
    const fns = [
      "loadStudentAssignments",
      "loadStudentAssignmentDetail",
      "loadStudentSubmissionDetail",
    ];
    for (const fn of fns) {
      const re = new RegExp(
        `export async function ${fn}\\b[^{]*\\{[\\s\\S]{0,120}?if \\(!isAssignmentsActive\\(\\)\\) return null;`,
      );
      expect(src, `${fn} must gate ASSIGNMENTS_ENABLED first`).toMatch(re);
    }
  });

  it("délègue exclusivement aux services B1 Student", () => {
    for (const svc of [
      "listStudentAssignments(",
      "getStudentAssignment(",
      "getStudentSubmission(",
      "listStudentSubmissionsForAssignment(",
      "listStudentFeedback(",
    ]) {
      expect(src, `adapter must call B1 service ${svc}`).toContain(svc);
    }
  });

  it("§3 · aucune requête Prisma ad hoc (create/update/delete/findMany/findFirst/findUnique)", () => {
    for (const w of [
      /prisma\.\w+\.create\(/, /prisma\.\w+\.update\(/, /prisma\.\w+\.delete\(/,
      /prisma\.\w+\.findMany\(/, /prisma\.\w+\.findFirst\(/, /prisma\.\w+\.findUnique\(/,
    ]) {
      expect(src, `Student adapter must not call ${w.source}`).not.toMatch(w);
    }
  });

  it("§3 · jamais de logique d'enrollment/ownership recréée (where { userId }, where { studentId }, where { classroomId })", () => {
    // On tolère `userId:` uniquement dans le shape de RETOUR (userId sur l'API,
    // pas dans un where Prisma). La regex cible les `where: { ... userId: ...`.
    expect(src).not.toMatch(/where:\s*\{[^}]*\buserId:/);
    expect(src).not.toMatch(/where:\s*\{[^}]*\bstudentId:/);
    expect(src).not.toMatch(/where:\s*\{[^}]*\bclassroomId:/);
    // Aucun accès aux enrollments hors des services B1 · on inspecte
    // le code EXÉCUTABLE (hors commentaires en ligne).
    const codeOnly = src
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .join("\n");
    expect(codeOnly).not.toMatch(/enrollment/i);
  });

  it("catch AssignmentError/SubmissionError not_found → return null", () => {
    expect(src).toMatch(/AssignmentError[\s\S]*assignment_not_found/);
    expect(src).toMatch(/SubmissionError[\s\S]*submission_not_found/);
    // Return null pattern doit apparaître pour chaque catch + chaque flag-gate
    // (3 flag-gates + 3 catches minimum).
    const nullReturns = src.match(/return null;/g) ?? [];
    expect(nullReturns.length).toBeGreaterThanOrEqual(6);
  });

  it("aucune écriture · l'adapter est en lecture seule", () => {
    for (const w of [/prisma\.\w+\.create\(/, /prisma\.\w+\.update\(/, /prisma\.\w+\.delete\(/]) {
      expect(src).not.toMatch(w);
    }
  });

  it("chaque fonction publique accepte StudentActor en 1er argument", () => {
    for (const fn of [
      "loadStudentAssignments",
      "loadStudentAssignmentDetail",
      "loadStudentSubmissionDetail",
    ]) {
      const re = new RegExp(`export async function ${fn}\\(\\s*actor: StudentActor`);
      expect(src, `${fn} first arg must be StudentActor`).toMatch(re);
    }
  });
});

// ─── §3 · Resolver 4 états ───────────────────────────────────────────────
describe("P4.5-B2b3b-b1 · resolveStudentPage · 4 états", () => {
  const src = read(RESOLVER);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("expose l'union type 4 kinds", () => {
    for (const kind of [
      '"feature_disabled"',
      '"anonymous"',
      '"role_absent"',
      '"enabled"',
    ]) {
      expect(src).toContain(kind);
    }
  });

  it("§3 · check feature gate AVANT resolveStudentActor", () => {
    const flagIdx = src.search(/if \(!isAssignmentsActive/);
    const actorIdx = src.search(/resolveStudentActor\(/);
    expect(flagIdx).toBeGreaterThan(0);
    expect(actorIdx).toBeGreaterThan(flagIdx);
  });

  it("UNAUTHORIZED → anonymous, autres PermissionError → role_absent, flag off → feature_disabled", () => {
    expect(src).toMatch(/e\.code === "UNAUTHORIZED"/);
    expect(src).toMatch(/return \{ kind: "anonymous" \}/);
    expect(src).toMatch(/return \{ kind: "role_absent" \}/);
    expect(src).toMatch(/return \{ kind: "feature_disabled" \}/);
    expect(src).toMatch(/return \{ kind: "enabled", actor \}/);
  });

  it("re-throw les erreurs non-permission (pas de swallow)", () => {
    expect(src).toMatch(/throw e;/);
  });
});

// ─── §4.1 · Service B1 · liste = PUBLISHED/CLOSED enrollments actifs ─────
describe("P4.5-B2b3b-b1 · service B1 · filtres PUBLISHED/CLOSED + enrollments actifs", () => {
  const src = read(B1_SERVICE);

  it("listStudentAssignments · status in PUBLISHED/CLOSED (jamais DRAFT)", () => {
    // Le service filtre en DB par status ∈ {PUBLISHED, CLOSED}.
    expect(src).toMatch(
      /listStudentAssignments[\s\S]*?status: \{ in: \["PUBLISHED", "CLOSED"\] \}/,
    );
    // Aucun status DRAFT dans le filtre principal de listStudentAssignments.
    const fnBlock = src.match(/listStudentAssignments[\s\S]*?orderBy:/)![0];
    expect(fnBlock).not.toMatch(/"DRAFT"/);
  });

  it("listStudentAssignments · enrollments actifs uniquement", () => {
    expect(src).toMatch(
      /listStudentAssignments[\s\S]*?enrollments:\s*\{\s*some:\s*\{\s*userId:[^,]+,\s*isActive:\s*true/,
    );
  });

  it("assertStudentCanAccessAssignment · classroom active + enrollment actif", () => {
    expect(src).toMatch(/isActive:\s*true/);
    expect(src).toMatch(/enrollments:\s*\{\s*some:\s*\{[^}]*isActive:\s*true/);
  });

  it("listStudentFeedback · filtre PUBLISHED + ADDENDUM uniquement (jamais DRAFT)", () => {
    const block = src.match(/listStudentFeedback[\s\S]*?orderBy:[\s\S]*?\}/)![0];
    expect(block).toMatch(/status:\s*\{\s*in:\s*\["PUBLISHED",\s*"ADDENDUM"\]/);
    expect(block).not.toMatch(/"DRAFT"/);
    expect(block).toMatch(/orderBy:\s*\{\s*version:\s*"asc"/);
  });

  it("listStudentSubmissionsForAssignment · scope userId + assignmentId + assertStudentCanAccessAssignment appelée en 1er", () => {
    const block = src.match(/listStudentSubmissionsForAssignment[\s\S]*?orderBy:[\s\S]*?\}/)![0];
    // La 1ère opération est le check accessAssignment.
    expect(block).toMatch(/assertStudentCanAccessAssignment\(/);
    // Puis scope userId
    expect(block).toMatch(/where:\s*\{[^}]*userId:/);
    expect(block).toMatch(/orderBy:\s*\{\s*version:\s*"asc"/);
  });

  it("loadOwnSubmission (interne) · scope userId + throw submission_not_found", () => {
    // Le helper interne applique le check ownership.
    expect(src).toMatch(
      /loadOwnSubmission[\s\S]*?where:\s*\{\s*id:[^,]+,\s*userId:[^\}]+\}/,
    );
    expect(src).toMatch(
      /throw new SubmissionError\(\s*"submission_not_found"/,
    );
  });

  it("permissions Student · enrollment REMOVED (isActive=false) refusé au niveau resolver", () => {
    const perms = read(B1_PERMISSIONS);
    // Le resolver charge classroomEnrollments avec where { isActive: true }.
    expect(perms).toMatch(
      /classroomEnrollments:\s*\{\s*where:\s*\{\s*isActive:\s*true/,
    );
    // Assertion supplémentaire · l'access-check assignment n'utilise QUE
    // activeClassroomIds (filtré par isActive:true côté classroom).
    expect(perms).toMatch(
      /activeClassroomIds:[\s\S]*?filter\(\(e\) => e\.classroom\.isActive\)/,
    );
  });
});

// ─── §5 · Compteur canonique 1000 mots ───────────────────────────────────
describe("P4.5-B2b3b-b1 · compteur canonique MAX_MONDE_SUBMISSION_WORDS", () => {
  const wc = read(V_WORDCOUNT);
  const tx = read(B1_TRANSITIONS);

  it("constante = 1000 mots (canonique)", () => {
    expect(tx).toMatch(/export const MAX_MONDE_SUBMISSION_WORDS = 1000;/);
  });

  it("WordCounter importe la constante ET la fonction de comptage canonique (pas de recount local)", () => {
    expect(wc).toMatch(
      /import\s+\{[\s\S]*?MAX_MONDE_SUBMISSION_WORDS[\s\S]*?countMondeSubmissionWords[\s\S]*?\}\s+from\s+"@\/lib\/assignments\/transitions"/,
    );
  });

  it("countMondeSubmissionWords · split /\\s+/u (unicode) (aligné avec le validator serveur)", () => {
    // Doctrine · le comptage doit être le même sur client (compteur UI) et
    // serveur (validator). Vérifie que le validator serveur utilise la même
    // fonction (source unique).
    expect(tx).toMatch(/split\(\/\\s\+\/u\)/);
    expect(tx).toMatch(/assertMondeSubmissionWordLimit/);
  });

  it("WordCounter · aria-live sur le message pour lecteur d'écran", () => {
    expect(wc).toMatch(/aria-live="polite"/);
    expect(wc).toMatch(/role="status"/);
  });

  it("WordCounter · isOverLimit(text) publique et exportée", () => {
    expect(wc).toMatch(/export function isOverLimit\(/);
    // À 1001 mots, isOverLimit renvoie true — verrouillé par la constante
    // canonique · voir test comportemental ci-dessous.
  });
});

// ─── §5 · Comportement compteur (test fonctionnel léger) ─────────────────
describe("P4.5-B2b3b-b1 · compteur · 1000 vs 1001", async () => {
  const mod = await import("@/lib/assignments/transitions");

  it("1000 mots · sous la limite (count === 1000, no throw)", () => {
    const words = Array.from({ length: 1000 }, () => "mot").join(" ");
    expect(mod.countMondeSubmissionWords(words)).toBe(1000);
    expect(() => mod.assertMondeSubmissionWordLimit(words)).not.toThrow();
  });

  it("1001 mots · au-dessus de la limite (throw submission_too_long)", () => {
    const words = Array.from({ length: 1001 }, () => "mot").join(" ");
    expect(mod.countMondeSubmissionWords(words)).toBe(1001);
    expect(() => mod.assertMondeSubmissionWordLimit(words)).toThrow(/exceeds 1000 words/);
  });

  it("chaîne vide ou espaces uniquement · throw submission_content_required", () => {
    expect(() => mod.assertMondeSubmissionWordLimit("   \t\n  ")).toThrow(/required/);
  });
});

// ─── §5 · Allowlist bodies (client) ──────────────────────────────────────
describe("P4.5-B2b3b-b1 · allowlist writtenContent · client n'envoie QUE writtenContent", () => {
  const forbiddenKeys = [
    "status:", "version:", "assignmentId:", "userId:", "studentId:",
    "submittedAt:", "storageObjectId:", "supersedesSubmissionId:",
    "id:", "createdAt:", "updatedAt:",
  ];

  it("StudentAssignmentDetailView · POST /submissions body (start draft) = { writtenContent }", () => {
    const src = read(V_DETAIL);
    // Localiser le POST vers /api/student/assignments/[id]/submissions
    const post = src.match(
      /\/api\/student\/assignments\/[\s\S]*?\/submissions[\s\S]*?body:\s*JSON\.stringify\(\{([^}]*)\}\)/,
    );
    expect(post, "POST body must exist for start draft").not.toBeNull();
    const body = post![1]!;
    expect(body).toMatch(/writtenContent:/);
    for (const bad of forbiddenKeys) {
      expect(body, `start draft body must not contain ${bad}`).not.toContain(bad);
    }
  });

  it("StudentAssignmentDetailView · POST /versions body (new version) = { writtenContent }", () => {
    const src = read(V_DETAIL);
    const post = src.match(
      /\/api\/student\/submissions\/[\s\S]*?\/versions[\s\S]*?body:\s*JSON\.stringify\(\{([^}]*)\}\)/,
    );
    expect(post, "POST body must exist for new version").not.toBeNull();
    const body = post![1]!;
    expect(body).toMatch(/writtenContent:/);
    for (const bad of forbiddenKeys) {
      expect(body, `new version body must not contain ${bad}`).not.toContain(bad);
    }
  });

  it("StudentSubmissionView · PATCH body (save draft) = { writtenContent }", () => {
    const src = read(V_SUB);
    const patch = src.match(
      /method:\s*"PATCH"[\s\S]*?body:\s*JSON\.stringify\(\{([^}]*)\}\)/g,
    );
    expect(patch, "at least one PATCH must exist").not.toBeNull();
    for (const p of patch!) {
      const body = p.match(/JSON\.stringify\(\{([^}]*)\}\)/)![1]!;
      expect(body).toMatch(/writtenContent:/);
      for (const bad of forbiddenKeys) {
        expect(body, `PATCH body must not contain ${bad}`).not.toContain(bad);
      }
    }
  });

  it("StudentSubmissionView · POST /submit body vide (aucune donnée métier)", () => {
    const src = read(V_SUB);
    // POST /submit ne prend AUCUN body (headers seuls · aucune allowlist à
    // valider côté serveur puisque le body est ignoré). On isole le bloc
    // fetch jusqu'à sa fermeture pour vérifier l'absence de `body:`.
    const submitBlock = src.match(/fetch\(`[^`]*\/submit`[^)]*\)/);
    expect(submitBlock, "submit fetch must exist").not.toBeNull();
    expect(submitBlock![0]!).toMatch(/method:\s*"POST"/);
    expect(submitBlock![0]!, "/submit POST must NOT carry a body").not.toMatch(/body:/);
  });
});

// ─── §5 · Body validator serveur (miroir) ────────────────────────────────
describe("P4.5-B2b3b-b1 · body validators serveur · defense-in-depth", () => {
  const src = read(B1_BODY);

  it("SUBMISSION_ALLOWED_KEYS = uniquement writtenContent", () => {
    expect(src).toMatch(
      /export const SUBMISSION_ALLOWED_KEYS = \["writtenContent"\] as const;/,
    );
  });

  it("SUBMISSION_FORBIDDEN_KEYS · rejette status/version/storageObjectId/assignmentId/userId/submittedAt/withdrawnAt/supersedesSubmissionId/id", () => {
    for (const k of [
      '"status"', '"version"', '"storageObjectId"', '"assignmentId"',
      '"userId"', '"submittedAt"', '"withdrawnAt"',
      '"supersedesSubmissionId"', '"id"',
    ]) {
      expect(src, `SUBMISSION_FORBIDDEN_KEYS must include ${k}`).toContain(k);
    }
  });
});

// ─── §6 · États UI · placeholders + pages ────────────────────────────────
describe("P4.5-B2b3b-b1 · placeholders · feature_disabled + role_absent", () => {
  it.each(ALL_PLACEHOLDERS)("%s existe et a fr + en", (file) => {
    expect(existsSync(join(REPO, file)), `${file} must exist`).toBe(true);
    const src = read(file);
    expect(src).toMatch(/fr:\s*\{/);
    expect(src).toMatch(/en:\s*\{/);
  });

  it("les 2 placeholders ont des messages DISTINCTS", () => {
    const featSrc = read(V_FEATURE);
    const roleSrc = read(V_ROLE);
    const featBody = featSrc.match(/body:\s*"([^"]+)"/g)?.join("|") ?? "";
    const roleBody = roleSrc.match(/body:\s*"([^"]+)"/g)?.join("|") ?? "";
    expect(featBody).not.toBe("");
    expect(roleBody).not.toBe("");
    expect(featBody).not.toBe(roleBody);
  });

  it("StudentFeaturePlaceholder · n'importe RIEN du domaine assignments", () => {
    const src = read(V_FEATURE);
    // Preuve d'appel serveur zéro · le placeholder est purement UI.
    for (const forbidden of [
      "from \"@/lib/assignments/",
      "from '@/lib/assignments/",
      "from \"@/lib/prisma\"",
      "from '@/lib/prisma'",
      "loadStudent",
      "listStudent",
      "getStudent",
      "prisma.",
      "resolveStudentActor",
    ]) {
      expect(src, `feature placeholder must not reference ${forbidden}`).not.toContain(forbidden);
    }
  });
});

// ─── §6 · Pages 4-états ──────────────────────────────────────────────────
describe("P4.5-B2b3b-b1 · pages · 4 états", () => {
  it.each(ALL_PAGES)("%s · appelle resolveStudentPage() avant tout adapter", (page) => {
    const src = read(page);
    const bodyIdx = src.search(/export default async function/);
    expect(bodyIdx).toBeGreaterThan(0);
    const body = src.slice(bodyIdx);
    const resolveIdx = body.search(/resolveStudentPage\(\)/);
    expect(resolveIdx).toBeGreaterThan(0);
    for (const loader of [
      "loadStudentAssignments(",
      "loadStudentAssignmentDetail(",
      "loadStudentSubmissionDetail(",
    ]) {
      const idx = body.indexOf(loader);
      if (idx >= 0) {
        expect(idx, `${loader} must appear after resolveStudentPage`).toBeGreaterThan(resolveIdx);
      }
    }
  });

  it.each(ALL_PAGES)("%s · gère les 4 états attendus", (page) => {
    const src = read(page);
    expect(src).toMatch(/kind === "feature_disabled"[\s\S]*StudentFeaturePlaceholder/);
    expect(src).toMatch(/kind === "anonymous"[\s\S]*redirect\(`\/\$\{locale\}\/login`\)/);
    expect(src).toMatch(/kind === "role_absent"[\s\S]*StudentRoleAbsentPlaceholder/);
  });

  it("les pages ayant une ressource distinguent aussi not-found", () => {
    for (const p of [PAGE_DETAIL, PAGE_SUB]) {
      const src = read(p);
      expect(src).toMatch(/notFound\(\)/);
    }
  });

  it("les pages ne font PAS d'appel prisma direct (§8)", () => {
    for (const p of ALL_PAGES) {
      const src = read(p);
      expect(src, `${p} must not import prisma`).not.toMatch(/from "@\/lib\/prisma"/);
      expect(src).not.toMatch(/prisma\.\w+\.\w+\(/);
    }
  });

  it("les pages sont dynamic (force-dynamic · SSR fresh à chaque requête)", () => {
    for (const p of ALL_PAGES) {
      const src = read(p);
      expect(src).toMatch(/export const dynamic = "force-dynamic";/);
    }
  });
});

// ─── §7 · Params Next 16 async ───────────────────────────────────────────
describe("P4.5-B2b3b-b1 · Next 16 params async", () => {
  it("chaque page consomme params en Promise (Next 16)", () => {
    for (const p of ALL_PAGES) {
      const src = read(p);
      expect(src).toMatch(/params: Promise<\{/);
      expect(src).toMatch(/await params;/);
    }
  });
});

// ─── §4.2 §4.3 · state-gating views ──────────────────────────────────────
describe("P4.5-B2b3b-b1 · StudentAssignmentDetailView · state-gating actions", () => {
  const src = read(V_DETAIL);

  it("actions détectées via `assignment.status === PUBLISHED` (jamais DRAFT côté UI)", () => {
    expect(src).toMatch(/const isPublished = assignment\.status === "PUBLISHED"/);
    // Le brief `assignment DRAFT jamais affiché` est déjà garanti par le
    // service B1 (filtre DB). L'UI ne lit jamais un assignment DRAFT.
    expect(src).not.toMatch(/assignment\.status === "DRAFT"/);
  });

  it("draft courant du Student · détecté via submissions.find(status === DRAFT)", () => {
    expect(src).toMatch(/submissions\.find\(\(s\) => s\.status === "DRAFT"\)/);
  });

  it("versions SUBMITTED · listées avec lien vers la submission", () => {
    // Filter/find sur SUBMITTED puis last.
    expect(src).toMatch(/s\.status === "SUBMITTED"/);
    // Chaque version linke vers /student/submissions/[id].
    expect(src).toMatch(/href=\{`\/\$\{locale\}\/student\/submissions\/\$\{s\.id\}`\}/);
  });

  it("startDraft · autorisé seulement si isPublished && !draft && submissions.length===0", () => {
    expect(src).toMatch(
      /canStartDraft = isPublished && !draft && assignment\.submissions\.length === 0/,
    );
  });

  it("createNewVersion · autorisé seulement si isPublished && lastSubmitted && !draft", () => {
    expect(src).toMatch(
      /canCreateNewVersion = isPublished && lastSubmitted !== null && !draft/,
    );
  });

  it("closedNotice · affiché si l'assignment n'est plus PUBLISHED", () => {
    expect(src).toMatch(/!isPublished && \(/);
    expect(src).toMatch(/closedNotice/);
  });

  it("bouton disabled si over-limit ou saving", () => {
    expect(src).toMatch(/disabled=\{pending \|\| isOverLimit\(newContent\)/);
  });
});

describe("P4.5-B2b3b-b1 · StudentSubmissionView · state-gating édition/lecture", () => {
  const src = read(V_SUB);

  it("détecte DRAFT / SUBMITTED / SUPERSEDED", () => {
    expect(src).toMatch(/const isDraft = submission\.status === "DRAFT"/);
    expect(src).toMatch(/const isSubmitted = submission\.status === "SUBMITTED"/);
    expect(src).toMatch(/const isSuperseded = submission\.status === "SUPERSEDED"/);
  });

  it("branche isDraft · Save + Submit visibles + textarea éditable", () => {
    // Save + Submit dans la branche isDraft ternaire.
    expect(src).toMatch(/isDraft \? \([\s\S]*?onClick=\{saveDraft\}[\s\S]*?onClick=\{submitDraft\}/);
    // textarea seulement dans la branche isDraft.
    expect(src).toMatch(/isDraft \? \([\s\S]*?<textarea/);
  });

  it("branche non-DRAFT · lecture seule (aucun <textarea>, aucun bouton save/submit)", () => {
    // Le bloc après ": (" du ternaire ne contient PAS <textarea>.
    const readonlyBlock = src.match(/\) : \(([\s\S]*?)\)\}[\s\S]*?<\/div>[\s\S]*?<\/section>/);
    expect(readonlyBlock).not.toBeNull();
    expect(readonlyBlock![1]!).not.toContain("<textarea");
    expect(readonlyBlock![1]!).not.toContain("saveDraft");
    expect(readonlyBlock![1]!).not.toContain("submitDraft");
  });

  it("submitDraft · window.confirm requis avant l'appel serveur", () => {
    expect(src).toMatch(/window\.confirm\(c\.submitConfirm\)/);
  });

  it("feedbacks affichés = ceux fournis par l'adapter (PUBLISHED+ADDENDUM déjà filtrés B1)", () => {
    // La vue itère submission.feedbacks · aucune logique de filtrage DRAFT ici.
    expect(src).toMatch(/submission\.feedbacks\.map/);
    // Aucune référence à "DRAFT" dans le rendu feedback.
    const feedbackBlock = src.match(/submission\.feedbacks\.map[\s\S]*?<\/li>/)![0];
    expect(feedbackBlock).not.toContain('"DRAFT"');
  });

  it("addenda · différenciés visuellement (label distinct)", () => {
    // La branche ternaire teste ADDENDUM pour afficher un label distinct.
    expect(src).toMatch(/f\.status === "ADDENDUM" \? c\.addendumLabel : c\.publishedLabel/);
  });
});

// ─── §4.3 · Feedbacks ordonnés (via B1) ──────────────────────────────────
describe("P4.5-B2b3b-b1 · feedbacks chronologiques (via B1 orderBy version asc)", () => {
  const b1 = read(B1_SERVICE);
  const adapter = read(ADAPTER);

  it("service B1 · listStudentFeedback · orderBy version asc", () => {
    expect(b1).toMatch(/listStudentFeedback[\s\S]*?orderBy:\s*\{\s*version:\s*"asc"/);
  });

  it("adapter · ne ré-ordonne pas (respecte l'ordre B1)", () => {
    // L'adapter mappe .map(f => ...) sans .sort().
    const block = adapter.match(/feedbacks: feedbacks\.map[\s\S]*?\}\)\)/);
    expect(block).not.toBeNull();
    expect(block![0]!).not.toContain(".sort(");
    expect(block![0]!).not.toContain(".reverse(");
  });
});

// ─── §7 · Dictionaries FR/EN ─────────────────────────────────────────────
describe("P4.5-B2b3b-b1 · dictionaries FR/EN symétriques", () => {
  function extractCopyKeys(src: string): { fr: string[]; en: string[] } {
    const copyBlock = src.match(/const COPY = \{([\s\S]*?)\} as const;/);
    if (!copyBlock) return { fr: [], en: [] };
    const inner = copyBlock[1]!;
    function extractBlock(marker: string): string {
      const start = inner.indexOf(`${marker}: {`);
      if (start < 0) return "";
      let depth = 0;
      let i = inner.indexOf("{", start);
      const s = i;
      for (; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
      }
      return inner.slice(s, i);
    }
    function topLevelKeys(block: string): string[] {
      let stripped = "";
      let depth = 0;
      for (let i = 1; i < block.length - 1; i++) {
        const ch = block[i];
        if (ch === "{") depth++;
        else if (ch === "}") { depth--; continue; }
        if (depth === 0) stripped += ch;
      }
      const keys = new Set<string>();
      const re = /(?:^|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(stripped)) !== null) keys.add(m[1]!);
      return [...keys].sort();
    }
    return {
      fr: topLevelKeys(extractBlock("fr")),
      en: topLevelKeys(extractBlock("en")),
    };
  }

  it.each([V_LIST, V_DETAIL, V_SUB, V_WORDCOUNT, V_FEATURE, V_ROLE])(
    "%s · clés fr et en identiques",
    (file) => {
      const src = read(file);
      const { fr, en } = extractCopyKeys(src);
      expect(fr.length, `${file} must have fr keys`).toBeGreaterThan(0);
      expect(en, `${file} en keys must match fr`).toEqual(fr);
    },
  );

  it("terminologie FR/EN canonique dans WordCounter (Nombre de mots ↔ Word count)", () => {
    const src = read(V_WORDCOUNT);
    expect(src).toContain('"Nombre de mots"');
    expect(src).toContain('"Word count"');
  });

  it("terminologie FR/EN canonique dans StudentSubmissionView (Retours du professeur ↔ Teacher feedback + Complément ↔ Addendum + Envoyé ↔ Submitted)", () => {
    const src = read(V_SUB);
    expect(src).toContain('"Retours du professeur"');
    expect(src).toContain('"Teacher feedback"');
    expect(src).toContain('"Complément"');
    expect(src).toContain('"Addendum"');
    expect(src).toMatch(/"Envoyé/);
    expect(src).toMatch(/"Submitted/);
  });

  it("terminologie FR/EN canonique dans StudentAssignmentDetailView (Brouillon ↔ Draft + Nouvelle version ↔ New version)", () => {
    const src = read(V_DETAIL);
    expect(src).toContain('"Brouillon"');
    expect(src).toContain('"Draft"');
    expect(src).toMatch(/nouvelle version|Rédiger une nouvelle version/);
    expect(src).toContain('"Write a new version"');
  });
});

// ─── §6 · Views · tokens YEMA ────────────────────────────────────────────
describe("P4.5-B2b3b-b1 · views · tokens YEMA uniquement", () => {
  it.each(ALL_VIEWS)("%s · aucun amber-/emerald-/indigo-/purple- arbitraire", (file) => {
    const src = read(file);
    for (const bad of ["amber-", "emerald-", "indigo-", "purple-"]) {
      expect(src, `${file} must not contain ${bad}`).not.toContain(bad);
    }
  });

  it.each(ALL_VIEWS)("%s · aucun red-*/blue-* Tailwind (utiliser var(--oxblood))", (file) => {
    const src = read(file);
    for (const bad of [
      "bg-red-", "border-red-", "text-red-",
      "bg-blue-", "border-blue-", "text-blue-",
    ]) {
      expect(src, `${file} must not contain ${bad}`).not.toContain(bad);
    }
  });

  it.each(ALL_VIEWS)("%s · utilise au moins un token YEMA (var(--brass|creme|espresso|oxblood))", (file) => {
    const src = read(file);
    expect(src).toMatch(/var\(--(brass|creme|espresso|oxblood)/);
  });

  it("V_DETAIL + V_SUB · toast d'erreur utilise --oxblood token", () => {
    for (const f of [V_DETAIL, V_SUB]) {
      const src = read(f);
      expect(src, `${f} must reference --oxblood for error toast`).toContain("var(--oxblood)");
    }
  });
});

// ─── §8 · Aucun header d'autorisation manuel + pas d'échappement client ──
describe("P4.5-B2b3b-b1 · pas de client-side authority (§8)", () => {
  it("les views ne posent AUCUN header Authorization", () => {
    for (const f of ALL_VIEWS) {
      const src = read(f);
      expect(src, `${f} must not send Authorization header`).not.toMatch(/["']Authorization["']/i);
    }
  });

  it("les views ne référencent JAMAIS `studentId:` / `userId:` / `teacherId:` dans un body ou header", () => {
    for (const f of ALL_VIEWS) {
      const src = read(f);
      expect(src, `${f} must not send studentId body`).not.toMatch(/\bstudentId:/);
      expect(src, `${f} must not send userId body`).not.toMatch(/\buserId:/);
      expect(src, `${f} must not send teacherId body`).not.toMatch(/\bteacherId:/);
    }
  });

  it("les views n'utilisent JAMAIS `next/headers` ou `cookies()` (client)", () => {
    for (const f of ALL_VIEWS) {
      const src = read(f);
      expect(src, `${f} client component must not import next/headers`).not.toMatch(/from "next\/headers"/);
    }
  });
});

// ─── §6 · a11y baseline (statique) ───────────────────────────────────────
describe("P4.5-B2b3b-b1 · a11y baseline (statique)", () => {
  it("WordCounter · role=status + aria-live=polite (annonce SR)", () => {
    const src = read(V_WORDCOUNT);
    expect(src).toMatch(/role="status"/);
    expect(src).toMatch(/aria-live="polite"/);
  });

  it("V_DETAIL / V_SUB · toast d'erreur avec role=alert + aria-live", () => {
    for (const f of [V_DETAIL, V_SUB]) {
      const src = read(f);
      expect(src, `${f} must use role="alert"`).toMatch(/role="alert"/);
      expect(src, `${f} must use aria-live="polite"`).toMatch(/aria-live="polite"/);
    }
  });

  it("V_LIST · état vide accessible (role=status)", () => {
    const src = read(V_LIST);
    expect(src).toMatch(/role="status"/);
  });

  it("boutons submit/save · cibles ≥ 44 px (min-h-[44px])", () => {
    for (const f of [V_DETAIL, V_SUB]) {
      const src = read(f);
      expect(src, `${f} must have 44px min-h touch targets`).toMatch(/min-h-\[44px\]/);
    }
  });

  it("focus visible · focus:ring-2 sur les interactifs principaux", () => {
    for (const f of ALL_VIEWS) {
      const src = read(f);
      expect(src, `${f} must have focus:ring-2`).toMatch(/focus:ring-2/);
    }
  });
});

// ─── §3 · Isolation adapter · types de retour de l'adapter ───────────────
describe("P4.5-B2b3b-b1 · adapter · shapes types cohérentes", () => {
  const src = read(ADAPTER);

  it("expose StudentAssignmentListItem / StudentAssignmentDetailShape / StudentSubmissionDetailShape", () => {
    for (const t of [
      "export interface StudentAssignmentListItem",
      "export interface StudentAssignmentDetailShape",
      "export interface StudentSubmissionDetailShape",
      "export interface StudentAssignmentVersion",
      "export interface StudentFeedbackItem",
    ]) {
      expect(src, `adapter must export ${t}`).toContain(t);
    }
  });

  it("StudentSubmissionDetailShape · feedbacks[].status ∈ FeedbackStatus (union · PUBLISHED/ADDENDUM/DRAFT/RETRACTED_BY_ADMIN)", () => {
    // Le type Prisma est utilisé · le filtre B1 garantit PUBLISHED+ADDENDUM à
    // l'exécution. Vérifie l'import du type Prisma.
    expect(src).toMatch(
      /import type \{[\s\S]*?FeedbackStatus[\s\S]*?\} from "@prisma\/client"/,
    );
  });

  it("StudentAssignmentDetailShape · submissions type = StudentAssignmentVersion[]", () => {
    expect(src).toMatch(/submissions:\s*StudentAssignmentVersion\[\]/);
  });
});
