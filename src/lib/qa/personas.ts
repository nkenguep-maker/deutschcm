// P4.5-QA · catalogue des personas QA + destinations d'espace.
//
// Chaque persona référence un email de fixture P-1 préfixé `test_yema_qa_`.
// Les destinations sont des routes RÉELLEMENT présentes dans le repo
// (auditées avant sélection) · aucune route inventée.

import "server-only";

export type QaPersonaId =
  | "super_admin"
  | "teacher"
  | "coach"
  | "center_admin"
  | "student_monde"
  | "student_racines"
  | "family"
  | "child_monde"
  | "child_racines";

export interface QaPersonaSpec {
  id: QaPersonaId;
  label: { fr: string; en: string };
  role: string;
  fixtureEmail: string;
  destination: (locale: string) => string;
  available: boolean;
  unavailableReason?: string;
}

const PREFIX = "test_yema_qa_";

export const QA_PERSONAS: readonly QaPersonaSpec[] = [
  {
    id: "super_admin",
    label: { fr: "Super Admin", en: "Super Admin" },
    role: "YEMA_ADMIN",
    fixtureEmail: `${PREFIX}super_admin@example.com`,
    destination: (locale) => `/${locale}/admin`,
    available: true,
  },
  {
    id: "teacher",
    label: { fr: "Enseignant·e", en: "Teacher" },
    role: "TEACHER",
    fixtureEmail: `${PREFIX}teacher@example.com`,
    destination: (locale) => `/${locale}/teacher`,
    available: true,
  },
  {
    id: "coach",
    label: { fr: "Coach Racines", en: "Racines Coach" },
    role: "RACINES_COACH",
    fixtureEmail: `${PREFIX}coach@example.com`,
    destination: (locale) => `/${locale}/coach/racines`,
    available: true,
  },
  {
    id: "center_admin",
    label: { fr: "Centre (admin)", en: "Center Admin" },
    role: "CENTER_ADMIN",
    fixtureEmail: `${PREFIX}center_admin@example.com`,
    destination: (locale) => `/${locale}/center`,
    available: true,
  },
  {
    id: "student_monde",
    label: { fr: "Élève Monde", en: "Monde Student" },
    role: "STUDENT",
    fixtureEmail: `${PREFIX}student_monde@example.com`,
    // /dashboard rend <DashboardMonde /> quand LP universe=MONDE (audité
    // src/app/[locale]/dashboard/page.tsx). La fixture porte un LP MONDE
    // + DEUTSCH + onboarded=true.
    destination: (locale) => `/${locale}/dashboard`,
    available: true,
  },
  {
    id: "student_racines",
    label: { fr: "Élève Racines", en: "Racines Student" },
    role: "STUDENT",
    fixtureEmail: `${PREFIX}student_racines@example.com`,
    // /dashboard rend <DashboardRacines /> quand LP universe=RACINES.
    // La fixture porte un LP RACINES + WOLOF + onboarded=true.
    destination: (locale) => `/${locale}/dashboard`,
    available: true,
  },
  {
    // P4.6 Lot 4A · persona Famille (FAMILY_GUARDIAN sémantique).
    // Rôle applicatif = AppRole.PARENT existant (audit confirmé). La fixture
    // porte un enfant Monde + un enfant Racines + un grant ROOTS_FAMILY
    // (jusqu'à 4 sièges) — voir seed dédié. AUCUN Passage Monde adulte par
    // défaut : le sélecteur "Mon parcours" n'apparait pas sans grant explicit.
    id: "family",
    label: { fr: "Famille", en: "Family" },
    role: "PARENT",
    fixtureEmail: `${PREFIX}family@example.com`,
    destination: (locale) => `/${locale}/family`,
    available: true,
  },
  {
    // P4.6 Lot 5 · Enfant Monde. L'auth QA passe par le parent family
    // (fixtureEmail identique). L'endpoint /api/qa/child-session set le
    // cookie enfant vers le ChildProfile Monde bakée, puis redirige vers
    // /[locale]/dashboard qui rend ChildMondeDashboard.
    id: "child_monde",
    label: { fr: "Enfant Monde", en: "World child" },
    role: "PARENT",
    fixtureEmail: `${PREFIX}family@example.com`,
    destination: (locale) => `/api/qa/child-session?child=monde&locale=${locale}`,
    available: true,
  },
  {
    // P4.6 Lot 5 · Enfant Racines. Même mécanisme, cible ChildProfile
    // Racines bakée. destination = endpoint QA qui set le cookie enfant.
    id: "child_racines",
    label: { fr: "Enfant Racines", en: "Roots child" },
    role: "PARENT",
    fixtureEmail: `${PREFIX}family@example.com`,
    destination: (locale) => `/api/qa/child-session?child=racines&locale=${locale}`,
    available: true,
  },
] as const;

export function getPersona(id: QaPersonaId): QaPersonaSpec | null {
  return QA_PERSONAS.find((p) => p.id === id) ?? null;
}

export function isQaPersonaId(x: unknown): x is QaPersonaId {
  return typeof x === "string"
    && ["super_admin", "teacher", "coach", "center_admin", "student_monde", "student_racines", "family", "child_monde", "child_racines"].includes(x);
}

/** Label pour affichage cookie/barre (fr par défaut). */
export function personaLabel(id: QaPersonaId, locale: "fr" | "en" = "fr"): string {
  const p = getPersona(id);
  return p ? p.label[locale] : id;
}
