// P4.5-B2b3b-b1 Student UI · résolution des 4 états attendus par les
// pages route Student ·
//   feature_disabled   → return "feature_disabled" (placeholder)
//   anonymous          → return "anonymous" (redirect /[locale]/login)
//   role_absent        → return "role_absent" (placeholder canonique)
//   enabled            → return { kind: "enabled", actor }
//
// Le feature gate est contrôlé EN PREMIER (brief §3) · aucune résolution
// session n'est effectuée si le flag est off. Symétrique au Teacher
// `resolveTeacherPage()`.

import "server-only";

import { isAssignmentsActive } from "@/lib/flags";
import {
  resolveStudentActor,
  type StudentActor,
} from "@/lib/permissions/student";
import { PermissionError } from "@/lib/permissions/circle";

export type StudentPageResolution =
  | { kind: "feature_disabled" }
  | { kind: "anonymous" }
  | { kind: "role_absent" }
  | { kind: "enabled"; actor: StudentActor };

export async function resolveStudentPage(): Promise<StudentPageResolution> {
  // brief §3 · feature gate AVANT toute résolution session.
  if (!isAssignmentsActive()) {
    return { kind: "feature_disabled" };
  }
  try {
    const actor = await resolveStudentActor();
    return { kind: "enabled", actor };
  } catch (e) {
    if (e instanceof PermissionError) {
      if (e.code === "UNAUTHORIZED") return { kind: "anonymous" };
      // FORBIDDEN + NOT_FOUND · user authentifié mais rôle Student absent
      // ou binding manquant · placeholder distinct.
      return { kind: "role_absent" };
    }
    throw e;
  }
}
