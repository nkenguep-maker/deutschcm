// P4.5-B2b3b-b2 Gate final · manifeste canonique des 20 opérations API
// Monde (P4.5-B). Chaque entrée = (HTTP method, chemin). Aucun doublon.
//
// Source · grep exhaustif de `src/app/api/{student,teacher}/**/route.ts`
// (exports `GET|POST|PATCH|PUT|DELETE`). Filtrage · uniquement les routes
// couvertes par `assignmentsFlagOr404()` (workflow assignments/submissions/
// feedback). Les routes Teacher workspace hors Monde (`/api/teacher/{me,
// dashboard,classes,students,schedule}` + legacy `/api/teacher`) restent
// hors périmètre b2.
//
// Utilisation · consommé par `flag-off.spec.ts` (§17) et disponible pour
// tout futur test qui doit énumérer précisément la surface API Monde.

import { FIXTURE_IDS } from "./personas";

export type HttpMethod = "GET" | "POST" | "PATCH";

export interface MondeApiOperation {
  method: HttpMethod;
  path: string;
  /** Étiquette humaine pour lecture rapide dans les rapports. */
  label: string;
}

// ── Student · 8 opérations ──────────────────────────────────────────────

const STUDENT_OPERATIONS: MondeApiOperation[] = [
  {
    method: "GET",
    path: "/api/student/assignments",
    label: "student:list assignments",
  },
  {
    method: "GET",
    path: `/api/student/assignments/${FIXTURE_IDS.asmPubA}`,
    label: "student:get assignment",
  },
  {
    method: "GET",
    path: `/api/student/assignments/${FIXTURE_IDS.asmPubA}/submissions`,
    label: "student:list own submissions for assignment",
  },
  {
    method: "POST",
    path: `/api/student/assignments/${FIXTURE_IDS.asmPubA}/submissions`,
    label: "student:create submission draft",
  },
  {
    method: "PATCH",
    path: `/api/student/submissions/${FIXTURE_IDS.subDraftA}`,
    label: "student:update submission draft",
  },
  {
    method: "POST",
    path: `/api/student/submissions/${FIXTURE_IDS.subDraftA}/submit`,
    label: "student:submit submission",
  },
  {
    method: "POST",
    path: `/api/student/submissions/${FIXTURE_IDS.subSubmittedA}/versions`,
    label: "student:create new submission version",
  },
  {
    method: "GET",
    path: `/api/student/submissions/${FIXTURE_IDS.subSubmittedA}/feedback`,
    label: "student:list feedback for submission",
  },
];

// ── Teacher Monde · 12 opérations ───────────────────────────────────────

const TEACHER_OPERATIONS: MondeApiOperation[] = [
  {
    method: "GET",
    path: `/api/teacher/classes/${FIXTURE_IDS.classroomA}/assignments`,
    label: "teacher:list assignments for classroom",
  },
  {
    method: "POST",
    path: `/api/teacher/classes/${FIXTURE_IDS.classroomA}/assignments`,
    label: "teacher:create assignment",
  },
  {
    method: "GET",
    path: `/api/teacher/assignments/${FIXTURE_IDS.asmPubA}`,
    label: "teacher:get assignment",
  },
  {
    method: "PATCH",
    path: `/api/teacher/assignments/${FIXTURE_IDS.asmPubA}`,
    label: "teacher:update assignment draft",
  },
  {
    method: "POST",
    path: `/api/teacher/assignments/${FIXTURE_IDS.asmDraftA}/publish`,
    label: "teacher:publish assignment",
  },
  {
    method: "POST",
    path: `/api/teacher/assignments/${FIXTURE_IDS.asmPubA}/close`,
    label: "teacher:close assignment",
  },
  {
    method: "GET",
    path: `/api/teacher/assignments/${FIXTURE_IDS.asmPubA}/submissions`,
    label: "teacher:list submissions for assignment",
  },
  {
    method: "GET",
    path: `/api/teacher/submissions/${FIXTURE_IDS.subSubmittedA}`,
    label: "teacher:get submission",
  },
  {
    method: "POST",
    path: `/api/teacher/submissions/${FIXTURE_IDS.subSubmittedA}/feedback`,
    label: "teacher:create feedback draft",
  },
  {
    method: "PATCH",
    path: "/api/teacher/feedback/tf_dummy_p4_5_b_gate",
    label: "teacher:update feedback draft",
  },
  {
    method: "POST",
    path: "/api/teacher/feedback/tf_dummy_p4_5_b_gate/publish",
    label: "teacher:publish feedback",
  },
  {
    method: "POST",
    path: "/api/teacher/feedback/tf_dummy_p4_5_b_gate/addendum",
    label: "teacher:add feedback addendum",
  },
];

export const MONDE_API_OPERATIONS: MondeApiOperation[] = [
  ...STUDENT_OPERATIONS,
  ...TEACHER_OPERATIONS,
];

// Verrous statiques · violation = protocole non respecté.
if (MONDE_API_OPERATIONS.length !== 20) {
  throw new Error(
    `MONDE_API_OPERATIONS must count exactly 20 · got ${MONDE_API_OPERATIONS.length}`,
  );
}

const seen = new Set<string>();
for (const op of MONDE_API_OPERATIONS) {
  const key = `${op.method} ${op.path}`;
  if (seen.has(key)) throw new Error(`Duplicate manifest entry: ${key}`);
  seen.add(key);
}
