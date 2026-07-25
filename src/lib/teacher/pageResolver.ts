// P4.5-B2b3b-a Gate UI Teacher · résolution des 4 états attendus par
// les pages route (§4 brief) ·
//   anonymous          → redirect /[locale]/login
//   rôle Teacher absent → return "role_absent" (page render un placeholder canonique)
//   ressource étrangère → return "not_found" (page render notFound())
//   feature off         → return "feature_off" (page render TeacherFeaturePlaceholder)
//   OK                  → return { kind: "ok", actor }
//
// Le flag est contrôlé EN PREMIER (§3 brief) · aucune résolution de
// session n'est effectuée si le flag est off.

import "server-only";

import { isAssignmentsActive, isTeacherWorkspaceActive } from "@/lib/flags";
import {
  resolveTeacherActor,
  type TeacherActor,
} from "@/lib/permissions/teacher";
import { PermissionError } from "@/lib/permissions/circle";

export type TeacherPageResolution =
  | { kind: "feature_off" }
  | { kind: "anonymous" }
  | { kind: "role_absent" }
  | { kind: "ok"; actor: TeacherActor };

export async function resolveTeacherPage(): Promise<TeacherPageResolution> {
  // §3 · feature gate AVANT toute résolution session.
  if (!isTeacherWorkspaceActive() || !isAssignmentsActive()) {
    return { kind: "feature_off" };
  }
  try {
    const actor = await resolveTeacherActor();
    return { kind: "ok", actor };
  } catch (e) {
    if (e instanceof PermissionError) {
      // §4 · distinguer anonymous vs rôle absent.
      if (e.code === "UNAUTHORIZED") return { kind: "anonymous" };
      // FORBIDDEN + NOT_FOUND · le user est authentifié mais n'a pas
      // le binding Teacher requis. Page render un placeholder distinct.
      return { kind: "role_absent" };
    }
    throw e;
  }
}
