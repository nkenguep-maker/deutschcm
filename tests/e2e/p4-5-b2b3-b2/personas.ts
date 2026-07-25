// P4.5-B2b3b-b2 · référence unique des personas P-1 utilisés par les specs.
// Le mot de passe est LU depuis process.env (fourni par le wrapper P-1).
// Ne JAMAIS committer un mot de passe en dur.

export const PREFIX = "test_p4_5_b_";

export interface PersonaSpec {
  key:
    | "teacherA"
    | "teacherB"
    | "teacherNoBind"
    | "studentA"
    | "studentB"
    | "studentRemoved"
    | "studentNoEnroll"
    | "centerAdmin"
    | "rootsCoach"
    | "yemaAdminNoBind";
  email: string;
  storageStateFile: string;
}

const authDir = ".playwright/.auth";

export const PERSONAS: Record<PersonaSpec["key"], PersonaSpec> = {
  teacherA: {
    key: "teacherA",
    email: `${PREFIX}teacher_a@example.com`,
    storageStateFile: `${authDir}/teacher-a.json`,
  },
  teacherB: {
    key: "teacherB",
    email: `${PREFIX}teacher_b@example.com`,
    storageStateFile: `${authDir}/teacher-b.json`,
  },
  teacherNoBind: {
    key: "teacherNoBind",
    email: `${PREFIX}teacher_no_bind@example.com`,
    storageStateFile: `${authDir}/teacher-no-bind.json`,
  },
  studentA: {
    key: "studentA",
    email: `${PREFIX}student_a@example.com`,
    storageStateFile: `${authDir}/student-a.json`,
  },
  studentB: {
    key: "studentB",
    email: `${PREFIX}student_b@example.com`,
    storageStateFile: `${authDir}/student-b.json`,
  },
  studentRemoved: {
    key: "studentRemoved",
    email: `${PREFIX}student_removed@example.com`,
    storageStateFile: `${authDir}/student-removed.json`,
  },
  studentNoEnroll: {
    key: "studentNoEnroll",
    email: `${PREFIX}student_no_enroll@example.com`,
    storageStateFile: `${authDir}/student-no-enroll.json`,
  },
  centerAdmin: {
    key: "centerAdmin",
    email: `${PREFIX}center_admin@example.com`,
    storageStateFile: `${authDir}/center-admin.json`,
  },
  rootsCoach: {
    key: "rootsCoach",
    email: `${PREFIX}roots_coach@example.com`,
    storageStateFile: `${authDir}/roots-coach.json`,
  },
  yemaAdminNoBind: {
    key: "yemaAdminNoBind",
    email: `${PREFIX}yema_admin_no_bind@example.com`,
    storageStateFile: `${authDir}/yema-admin-no-bind.json`,
  },
};

export function requirePassword(): string {
  const pwd = process.env.P1_TEST_PASSWORD;
  if (!pwd || pwd.length < 12) {
    throw new Error(
      "REFUSED: P1_TEST_PASSWORD missing or too short. Wrapper P-1 must set it via .env.p1-baseline.",
    );
  }
  return pwd;
}

// Fixture ids exposés à l'application · reproduisent ceux créés par
// `scripts/test-baseline/p4-5-b-fixtures.mjs`. Les tests n'ont besoin
// que des ids pour visiter des URLs canoniques.
export const FIXTURE_IDS = {
  classroomA: `${PREFIX}classroom_a`,
  classroomB: `${PREFIX}classroom_b`,
  asmDraftA: `${PREFIX}assignment_a_draft`,
  asmPubA: `${PREFIX}assignment_a_published`,
  asmClosedA: `${PREFIX}assignment_a_closed`,
  asmPubB: `${PREFIX}assignment_b_published`,
  subDraftA: `${PREFIX}submission_a_v2_draft`,
  subSubmittedA: `${PREFIX}submission_a_submitted`,
  subSupersededA: `${PREFIX}submission_a_superseded`,
} as const;
