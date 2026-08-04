// P4.5-B2a · helper commun pour les routes Teacher · résout Teacher, wrappe
// avec `withSerializableRetry`, gère audit + mapper HTTP centralisé.
//
// Le pattern extrait la répétition commune des 12 handlers Teacher.
// Chaque route reste dans son propre `route.ts` (contrainte Next 16) mais
// délègue le "trunk" ici.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { resolveTeacherActor, type TeacherActor } from "@/lib/permissions/teacher";
import { withSerializableRetry, type ConcurrentUpdateCode } from "@/lib/db/retry";
import { mapAssignmentErrorToResponse } from "@/lib/api/assignmentErrors";
import { emitAssignmentAuditFromError } from "@/lib/audit/assignmentEvents";
import { assignmentsFlagOr404 } from "@/lib/api/assignmentsGate";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface TeacherRouteOptions {
  /** Concurrency errorCode si SSI retries épuisés · défaut `concurrent_assignment_update`. */
  errorCode?: ConcurrentUpdateCode;
  /**
   * Si `true`, exécute sous $transaction Serializable avec retry. Si
   * `false` (défaut lecture), exécute une passe sans tx (le prisma
   * fourni est le client global · pas un `TxClient` réel mais typé
   * comme tel via cast contrôlé).
   */
  writeTx?: boolean;
}

/**
 * Point d'entrée pour un handler Teacher · résout, wrappe, mappe.
 * `fn` reçoit un client Prisma (dans une tx si `writeTx=true`) et
 * l'actor Teacher résolu. Sur erreur, émet l'audit de refus dérivé
 * puis retourne la réponse HTTP mappée.
 */
export async function runTeacherRoute<T>(
  fn: (tx: TxClient, actor: TeacherActor) => Promise<T>,
  opts: TeacherRouteOptions = {},
): Promise<NextResponse> {
  const gate = assignmentsFlagOr404();
  if (gate) return gate;

  let actor: TeacherActor | null = null;
  try {
    actor = await resolveTeacherActor();
    if (opts.writeTx) {
      const result = await withSerializableRetry(
        () =>
          prisma.$transaction(
            async (tx) => fn(tx as TxClient, actor as TeacherActor),
            { isolationLevel: "Serializable" },
          ),
        { errorCode: opts.errorCode ?? "concurrent_assignment_update" },
      );
      return NextResponse.json(result);
    }
    const result = await fn(prisma as unknown as TxClient, actor);
    return NextResponse.json(result);
  } catch (e) {
    await emitAssignmentAuditFromError({
      error: e,
      actorUserId: actor?.userId ?? null,
      actorRole: "TEACHER",
      scopeType: "TeacherWorkspace",
      scopeId: null,
    }).catch(() => {});
    return mapAssignmentErrorToResponse(e);
  }
}
