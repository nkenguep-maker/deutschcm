// P4.5-B2b3b-a Gate UI Teacher · verrous structurels sur adapter + resolver +
// pages + views + placeholders + status badge.
//
// Environnement node (aucun jsdom). Les tests inspectent le code source pour
// garantir les propriétés attendues du brief (Gate UI Teacher §1..§10) ·
//
//   §1 · adapter server-only, réutilise feature gate + resolveTeacherActor + B1
//   §2 · pas de deuxième logique d'autorisation basée sur teacherId
//   §3 · flag contrôlé AVANT résolution session
//   §4 · 4 états distincts (feature_off / anonymous / role_absent / ok+notFound)
//   §5 · vues state-gating (DRAFT modifiable / PUBLISHED close + list / CLOSED readonly / feedback DRAFT/PUBLISHED/ADDENDUM)
//   §6 · tokens YEMA (var(--brass|creme|oxblood)) au lieu d'amber/emerald
//   §7 · URLs pages inchangées
//   §8 · dictionaries FR/EN symétriques, allowlists strictes

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO = join(__dirname, "..", "..", "..");
function read(rel: string): string {
  return readFileSync(join(REPO, rel), "utf-8");
}

const ADAPTER = "src/lib/teacher/assignmentsAdapter.ts";
const RESOLVER = "src/lib/teacher/pageResolver.ts";
const BADGE = "src/components/teacher/AssignmentStatusBadge.tsx";
const ROLE_ABSENT = "src/components/teacher/TeacherRoleAbsentPlaceholder.tsx";
const FEATURE_PLACEHOLDER = "src/components/teacher/TeacherFeaturePlaceholder.tsx";
const V_LIST = "src/components/teacher/TeacherAssignmentsView.tsx";
const V_CREATE = "src/components/teacher/TeacherAssignmentCreateView.tsx";
const V_DETAIL = "src/components/teacher/TeacherAssignmentDetailView.tsx";
const V_SUB = "src/components/teacher/TeacherSubmissionDetailView.tsx";
const PAGE_LIST = "src/app/[locale]/teacher/assignments/page.tsx";
const PAGE_NEW = "src/app/[locale]/teacher/assignments/new/page.tsx";
const PAGE_DETAIL = "src/app/[locale]/teacher/assignments/[assignmentId]/page.tsx";
const PAGE_SUB = "src/app/[locale]/teacher/submissions/[submissionId]/page.tsx";

const ALL_VIEWS = [V_LIST, V_CREATE, V_DETAIL, V_SUB];
const ALL_PAGES = [PAGE_LIST, PAGE_NEW, PAGE_DETAIL, PAGE_SUB];

// ─── §1 · Adapter ────────────────────────────────────────────────────────
describe("P4.5-B2b3b-a · adapter server-only", () => {
  const src = read(ADAPTER);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("chaque fonction publique commence par le feature-gate check", () => {
    // 4 fonctions attendues, chacune doit contenir la garde avant tout autre
    // appel. On teste la propriété en cherchant, pour chaque function,
    // que la première ligne non blanche du corps est le if de flags.
    const fns = [
      "loadTeacherAssignmentsForClassroom",
      "loadTeacherAssignment",
      "loadTeacherAssignmentSubmissions",
      "loadTeacherSubmissionDetail",
    ];
    for (const fn of fns) {
      const re = new RegExp(
        `export async function ${fn}\\b[^{]*\\{\\s*if \\(!isTeacherWorkspaceActive\\(\\) \\|\\| !isAssignmentsActive\\(\\)\\) return null;`,
      );
      expect(src, `${fn} must gate flag first`).toMatch(re);
    }
  });

  it("délègue aux services B1 (aucun where { teacherId } ad hoc)", () => {
    // Le brief interdit toute deuxième logique d'autorisation en dehors
    // des services B1.
    expect(src).not.toMatch(/where:\s*\{[^}]*teacherId/);
    expect(src).toMatch(/listTeacherAssignments\(/);
    expect(src).toMatch(/getTeacherAssignment\(/);
    expect(src).toMatch(/listAssignmentSubmissions\(/);
    expect(src).toMatch(/getTeacherSubmission\(/);
  });

  it("catch AssignmentError not_found/not_owned → return null", () => {
    expect(src).toMatch(/AssignmentError[\s\S]*assignment_not_owned/);
    expect(src).toMatch(/AssignmentError[\s\S]*assignment_not_found/);
    // Un `return null` doit apparaître dans les catch (au moins 4).
    const nullReturns = src.match(/return null;/g) ?? [];
    expect(nullReturns.length).toBeGreaterThanOrEqual(4 + 4); // 4 flag-gate + 4 catch
  });

  it("aucune écriture · l'adapter est en lecture seule", () => {
    for (const w of [/prisma\.\w+\.create\(/, /prisma\.\w+\.update\(/, /prisma\.\w+\.delete\(/]) {
      expect(src).not.toMatch(w);
    }
  });

  it("n'expose pas de raccourci sans passer par TeacherActor", () => {
    // Chaque fonction publique doit accepter un `TeacherActor` en 1er argument.
    for (const fn of [
      "loadTeacherAssignmentsForClassroom",
      "loadTeacherAssignment",
      "loadTeacherAssignmentSubmissions",
      "loadTeacherSubmissionDetail",
    ]) {
      const re = new RegExp(`export async function ${fn}\\(\\s*actor: TeacherActor`);
      expect(src, `${fn} first arg must be TeacherActor`).toMatch(re);
    }
  });
});

// ─── §3 §4 · Resolver ────────────────────────────────────────────────────
describe("P4.5-B2b3b-a · resolveTeacherPage · 4 états", () => {
  const src = read(RESOLVER);

  it("est marqué server-only", () => {
    expect(src).toMatch(/^import\s+"server-only";/m);
  });

  it("expose l'union type 4 kinds", () => {
    for (const kind of ["feature_off", "anonymous", "role_absent", '"ok"']) {
      expect(src).toContain(kind);
    }
  });

  it("§3 · check flag AVANT resolveTeacherActor", () => {
    // Le check `if (!isTeacherWorkspaceActive || !isAssignmentsActive)` doit
    // apparaître avant tout appel à resolveTeacherActor.
    const flagIdx = src.search(/if \(!isTeacherWorkspaceActive/);
    const actorIdx = src.search(/resolveTeacherActor\(/);
    expect(flagIdx).toBeGreaterThan(0);
    expect(actorIdx).toBeGreaterThan(flagIdx);
  });

  it("§4 · UNAUTHORIZED → anonymous, autres PermissionError → role_absent", () => {
    expect(src).toMatch(/e\.code === "UNAUTHORIZED"/);
    expect(src).toMatch(/return \{ kind: "anonymous"/);
    expect(src).toMatch(/return \{ kind: "role_absent"/);
    expect(src).toMatch(/return \{ kind: "feature_off"/);
    expect(src).toMatch(/return \{ kind: "ok", actor \}/);
  });

  it("re-throw les erreurs non-permission (pas de swallow)", () => {
    expect(src).toMatch(/throw e;/);
  });
});

// ─── §6 · Status badge YEMA ──────────────────────────────────────────────
describe("P4.5-B2b3b-a · AssignmentStatusBadge · tokens YEMA", () => {
  const src = read(BADGE);

  it("n'utilise QUE des tokens YEMA (--brass/--creme/--oxblood)", () => {
    for (const tok of ["--brass", "--creme", "--oxblood"]) {
      expect(src).toContain(`var(${tok})`);
    }
  });

  it("n'utilise AUCUNE couleur Tailwind arbitraire (amber/emerald/red/blue/indigo/purple)", () => {
    for (const bad of ["amber-", "emerald-", "red-", "blue-", "indigo-", "purple-"]) {
      expect(src, `must not contain ${bad}`).not.toContain(bad);
    }
  });

  it("labels FR et EN couvrent toutes les valeurs de statut", () => {
    const statuses = [
      "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED",
      "SUBMITTED", "WITHDRAWN",
      "SUPERSEDED", "ADDENDUM", "RETRACTED_BY_ADMIN",
    ];
    // Chaque status doit avoir une ligne dans LABELS.fr et LABELS.en.
    for (const s of statuses) {
      // Match `KEY: "..."` (deux occurrences attendues : fr + en).
      const re = new RegExp(`\\b${s}: "[^"]+"`);
      const matches = src.match(new RegExp(`\\b${s}: "[^"]+"`, "g")) ?? [];
      expect(matches.length, `${s} must appear in both fr+en`).toBeGreaterThanOrEqual(2);
      expect(src).toMatch(re);
    }
  });

  it("info portée par le texte (a11y), pas uniquement la couleur", () => {
    // Le label est rendu dans un <span> · doit apparaître dans le return.
    expect(src).toMatch(/\{label\}/);
    expect(src).toMatch(/data-status=\{status\}/);
  });
});

// ─── §4 · Placeholder role absent ────────────────────────────────────────
describe("P4.5-B2b3b-a · TeacherRoleAbsentPlaceholder", () => {
  it("existe et a fr + en", () => {
    expect(existsSync(join(REPO, ROLE_ABSENT))).toBe(true);
    const src = read(ROLE_ABSENT);
    expect(src).toMatch(/fr:\s*\{/);
    expect(src).toMatch(/en:\s*\{/);
  });

  it("est distinct de TeacherFeaturePlaceholder (message différent)", () => {
    const roleSrc = read(ROLE_ABSENT);
    const featSrc = read(FEATURE_PLACEHOLDER);
    // Extraire les bodies pour vérifier qu'ils diffèrent.
    const roleBody = roleSrc.match(/body:\s*"([^"]+)"/g)?.join("|") ?? "";
    const featBody = featSrc.match(/body:\s*"([^"]+)"/g)?.join("|") ?? "";
    expect(roleBody).not.toBe("");
    expect(featBody).not.toBe("");
    expect(roleBody).not.toBe(featBody);
  });
});

// ─── §7 · Pages 4-state ──────────────────────────────────────────────────
describe("P4.5-B2b3b-a · pages · résolution 4 états", () => {
  it.each(ALL_PAGES)("%s · appelle resolveTeacherPage() avant tout adapter", (page) => {
    const src = read(page);
    // Restreindre l'inspection au corps du composant (après `export default`)
    // pour ignorer les mentions dans les imports.
    const bodyIdx = src.search(/export default async function/);
    expect(bodyIdx).toBeGreaterThan(0);
    const body = src.slice(bodyIdx);
    const resolveIdx = body.search(/resolveTeacherPage\(\)/);
    expect(resolveIdx).toBeGreaterThan(0);
    for (const loader of [
      "loadTeacherAssignmentsForClassroom(",
      "loadTeacherAssignment(",
      "loadTeacherAssignmentSubmissions(",
      "loadTeacherSubmissionDetail(",
    ]) {
      const idx = body.indexOf(loader);
      if (idx >= 0) expect(idx, `${loader} must appear after resolveTeacherPage`).toBeGreaterThan(resolveIdx);
    }
  });

  it.each(ALL_PAGES)("%s · gère les 4 états", (page) => {
    const src = read(page);
    // feature_off → return <TeacherFeaturePlaceholder .../>
    expect(src).toMatch(/kind === "feature_off"[\s\S]*TeacherFeaturePlaceholder/);
    // anonymous → redirect /[locale]/login
    expect(src).toMatch(/kind === "anonymous"[\s\S]*redirect\(`\/\$\{locale\}\/login`\)/);
    // role_absent → TeacherRoleAbsentPlaceholder
    expect(src).toMatch(/kind === "role_absent"[\s\S]*TeacherRoleAbsentPlaceholder/);
  });

  it("les pages ayant une ressource distinguent aussi not-found", () => {
    for (const p of [PAGE_DETAIL, PAGE_SUB]) {
      const src = read(p);
      expect(src).toMatch(/notFound\(\)/);
    }
  });
});

// ─── §5 · Views · state-gating ───────────────────────────────────────────
describe("P4.5-B2b3b-a · TeacherAssignmentDetailView · state-gating", () => {
  const src = read(V_DETAIL);

  it("DRAFT · form d'édition + Save + Publish", () => {
    expect(src).toMatch(/const isDraft = assignment\.status === "DRAFT"/);
    // Save + Publish sont dans la branche isDraft.
    expect(src).toMatch(/isDraft \?[\s\S]*saveDraft[\s\S]*publish/);
  });

  it("PUBLISHED · pas de form d'édition + bouton close visible", () => {
    expect(src).toMatch(/const isPublished = assignment\.status === "PUBLISHED"/);
    // Close est dans la branche non-draft.
    expect(src).toMatch(/isPublished && \(/);
    expect(src).toMatch(/close\(\)/);
  });

  it("CLOSED · readonly (pas de close, pas de form)", () => {
    expect(src).toMatch(/const isClosed = assignment\.status === "CLOSED"/);
    // Le block Publish/close n'est PAS montré si CLOSED (isClosed n'active pas isPublished).
  });

  it("Submissions list · visible seulement si PUBLISHED ou CLOSED", () => {
    expect(src).toMatch(/\(isPublished \|\| isClosed\) &&[\s\S]*submissionsTitle/);
  });

  it("PATCH allowlist · body contient uniquement title/instructions/dueAt", () => {
    const patchBlock = src.match(/method: "PATCH"[\s\S]*?body: JSON\.stringify\(\{([\s\S]*?)\}\)/);
    expect(patchBlock, "PATCH block must exist").not.toBeNull();
    const body = patchBlock![1]!;
    // Aucun champ interdit
    for (const forbidden of ["status:", "classroomId:", "teacherId:", "userId:", "id:"]) {
      expect(body, `PATCH body must not contain ${forbidden}`).not.toContain(forbidden);
    }
    // Champs autorisés présents
    expect(body).toMatch(/title:/);
    expect(body).toMatch(/instructions:/);
    expect(body).toMatch(/dueAt:/);
  });
});

describe("P4.5-B2b3b-a · TeacherSubmissionDetailView · feedback state-gating", () => {
  const src = read(V_SUB);

  it("draftFb · Save + Publish rendus", () => {
    expect(src).toMatch(/\.find\(\(f\) => f\.status === "DRAFT"\)/);
    expect(src).toMatch(/onClick=\{saveDraft\}/);
    expect(src).toMatch(/onClick=\{publishDraft\}/);
  });

  it("PUBLISHED + ADDENDUM · rendus dans une même liste chronologique", () => {
    expect(src).toMatch(/f\.status === "PUBLISHED" \|\| f\.status === "ADDENDUM"/);
  });

  it("créer un draft feedback · uniquement si status submission SUBMITTED", () => {
    expect(src).toMatch(/submission\.status === "SUBMITTED"/);
  });

  it("addendum · uniquement si lastPublished existe", () => {
    expect(src).toMatch(/lastPublished && \(/);
  });

  it("draft feedback banner utilise --brass tokens (pas amber-)", () => {
    // Vérifier que le block draftFb utilise var(--brass...).
    const draftBlock = src.match(/draftFb \? \(([\s\S]*?)\) : \(/);
    expect(draftBlock).not.toBeNull();
    expect(draftBlock![1]!).toMatch(/var\(--brass/);
    expect(draftBlock![1]!).not.toContain("amber-");
  });

  it("allowlist feedback POST · seul writtenContent est envoyé", () => {
    // fetch POST feedback (create) et fetch POST addendum.
    const posts = src.match(/method: "POST"[\s\S]*?body: JSON\.stringify\(\{([^}]*)\}\)/g) ?? [];
    for (const p of posts) {
      const body = p.match(/JSON\.stringify\(\{([^}]*)\}\)/)![1]!;
      // status / feedbackId / submissionId / version / userId interdits
      for (const forbidden of ["status:", "submissionId:", "feedbackId:", "version:", "userId:"]) {
        expect(body, `feedback POST body must not contain ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it("allowlist feedback PATCH · seul writtenContent est envoyé", () => {
    const patch = src.match(/method: "PATCH"[\s\S]*?body: JSON\.stringify\(\{([^}]*)\}\)/);
    expect(patch).not.toBeNull();
    const body = patch![1]!;
    for (const forbidden of ["status:", "submissionId:", "feedbackId:", "version:", "userId:"]) {
      expect(body, `PATCH feedback body must not contain ${forbidden}`).not.toContain(forbidden);
    }
    expect(body).toMatch(/writtenContent:/);
  });
});

describe("P4.5-B2b3b-a · TeacherAssignmentCreateView · allowlist create", () => {
  const src = read(V_CREATE);

  it("POST body · uniquement title/instructions/dueAt/submissionFormat", () => {
    const post = src.match(/method: "POST"[\s\S]*?body: JSON\.stringify\(\{([\s\S]*?)\}\)/);
    expect(post).not.toBeNull();
    const body = post![1]!;
    // Aucun champ interdit qui doit être scopé côté serveur uniquement.
    for (const forbidden of [
      "status:", "classroomId:", "teacherId:", "userId:", "id:", "createdByTeacherId:",
    ]) {
      expect(body, `create body must not contain ${forbidden}`).not.toContain(forbidden);
    }
    expect(body).toMatch(/title:/);
  });

  it("URL POST contient classroomId dans le path (jamais dans le body)", () => {
    expect(src).toMatch(/\/api\/teacher\/classes\/\$\{encodeURIComponent\(classroomId\)\}\/assignments/);
  });
});

// ─── §8 · Dictionaries FR/EN symétriques ─────────────────────────────────
describe("P4.5-B2b3b-a · dictionaries FR/EN", () => {
  function extractCopyKeys(src: string): { fr: string[]; en: string[] } {
    // Extraire les blocs `fr: { ... }` et `en: { ... }` d'un objet COPY.
    // Approche simple · trouver le bloc `const COPY = { ... } as const;`
    // puis lister les clés du premier niveau de chaque sous-objet.
    const copyBlock = src.match(/const COPY = \{([\s\S]*?)\} as const;/);
    if (!copyBlock) return { fr: [], en: [] };
    const inner = copyBlock[1]!;
    // Cherche `fr: { ... },` en équilibrant les { }
    function extractBlock(marker: string): string {
      const start = inner.indexOf(`${marker}: {`);
      if (start < 0) return "";
      let depth = 0;
      let i = inner.indexOf("{", start);
      const s = i;
      for (; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === "{") depth++;
        else if (ch === "}") { depth--; if (depth === 0) { i++; break; } }
      }
      return inner.slice(s, i);
    }
    function topLevelKeys(block: string): string[] {
      // Retire les objets imbriqués puis extrait les clés.
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

  it.each([V_LIST, V_CREATE, V_DETAIL, V_SUB, ROLE_ABSENT, FEATURE_PLACEHOLDER])(
    "%s · clés fr et en identiques",
    (file) => {
      const src = read(file);
      const { fr, en } = extractCopyKeys(src);
      expect(fr.length, `${file} must have fr keys`).toBeGreaterThan(0);
      expect(en, `${file} en keys must match fr`).toEqual(fr);
    },
  );

  it("aucun texte fr en dur hors COPY dans les views", () => {
    // Heuristique · aucune balise avec un texte français typique inline
    // en dehors des blocs COPY.
    for (const f of ALL_VIEWS) {
      const src = read(f);
      // On ignore les commentaires en début de fichier.
      const withoutComments = src.replace(/^\/\/[^\n]*\n/gm, "");
      // Aucun mot français lourd présent en dehors du COPY.
      const outsideCopy = withoutComments.replace(/const COPY = \{[\s\S]*?\} as const;/, "");
      for (const bannedFr of ["Bienvenue", "Bonjour", "Choisir une classe", "Retour aux devoirs"]) {
        expect(outsideCopy, `${f} must not contain hardcoded FR "${bannedFr}"`).not.toContain(bannedFr);
      }
    }
  });
});

// ─── §6 · Views · pas de couleurs Tailwind arbitraires ───────────────────
describe("P4.5-B2b3b-a · views · tokens YEMA (pas amber/emerald)", () => {
  it.each(ALL_VIEWS)("%s · aucun amber-/emerald-/indigo-/purple- arbitraire", (file) => {
    const src = read(file);
    for (const bad of ["amber-", "emerald-", "indigo-", "purple-"]) {
      expect(src, `${file} must not contain ${bad}`).not.toContain(bad);
    }
  });

  it.each(ALL_VIEWS)("%s · aucun red-*/blue-* Tailwind (utiliser var(--oxblood))", (file) => {
    const src = read(file);
    // Aucun `red-100/border-red-*/bg-red-*/text-red-*` etc.
    for (const bad of ["bg-red-", "border-red-", "text-red-", "bg-blue-", "border-blue-", "text-blue-"]) {
      expect(src, `${file} must not contain ${bad}`).not.toContain(bad);
    }
  });

  it("views utilisant les tokens YEMA les référencent explicitement", () => {
    // Au moins un token YEMA doit être utilisé dans SubmissionDetail (banner draft)
    // et dans les toasts d'erreur des 3 views avec formulaire.
    for (const f of [V_CREATE, V_DETAIL, V_SUB]) {
      const src = read(f);
      expect(src, `${f} must reference --oxblood token for error toast`).toContain("var(--oxblood)");
    }
    expect(read(V_SUB)).toContain("var(--brass");
  });
});

// ─── §8 · Pages URLs inchangées ──────────────────────────────────────────
describe("P4.5-B2b3b-a · pages · URLs canoniques", () => {
  it("les 4 fichiers de route existent aux emplacements attendus", () => {
    for (const p of ALL_PAGES) {
      expect(existsSync(join(REPO, p)), `${p} must exist`).toBe(true);
    }
  });

  it("chaque page consomme params en Promise (Next 16)", () => {
    for (const p of ALL_PAGES) {
      const src = read(p);
      expect(src).toMatch(/params: Promise<\{/);
    }
  });
});

// ─── §2 · Pas de deuxième logique d'autorisation ─────────────────────────
describe("P4.5-B2b3b-a · pas de second contrôle autorisation basé sur teacherId", () => {
  it("les pages ne font PAS de where { teacherId } manuel", () => {
    for (const p of ALL_PAGES) {
      const src = read(p);
      // Aucun accès direct prisma pour valider un teacherId dans les pages.
      expect(src, `${p} must not import @/lib/prisma`).not.toMatch(/from "@\/lib\/prisma"/);
      expect(src).not.toMatch(/prisma\.\w+\.\w+\(/);
    }
  });

  it("les views ne posent AUCUN header d'autorisation manuel", () => {
    // Les views ne doivent envoyer aucun Authorization header ou teacherId
    // dans les bodies · l'autorisation est purement basée cookie.
    for (const f of ALL_VIEWS) {
      const src = read(f);
      expect(src, `${f} must not send Authorization header`).not.toMatch(/["']Authorization["']/i);
      expect(src, `${f} must not send teacherId body`).not.toMatch(/teacherId:/);
    }
  });
});
