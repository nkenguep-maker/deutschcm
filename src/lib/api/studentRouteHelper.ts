// P4.5-B2a · helper commun pour les routes Student · miroir de
// teacherRouteHelper. Résout Student, wrappe SSI retry, mappe HTTP.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { resolveStudentActor, type StudentActor } from "@/lib/permissions/student";
import { withSerializableRetry, type ConcurrentUpdateCode } from "@/lib/db/retry";
import { mapAssignmentErrorToResponse } from "@/lib/api/assignmentErrors";
import { emitAssignmentAuditFromError } from "@/lib/audit/assignmentEvents";
import { assignmentsFlagOr404 } from "@/lib/api/assignmentsGate";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface StudentRouteOptions {
  errorCode?: ConcurrentUpdateCode;
  writeTx?: boolean;
}

export async function runStudentRoute<T>(
  fn: (tx: TxClient, actor: StudentActor) => Promise<T>,
  opts: StudentRouteOptions = {},
): Promise<NextResponse> {
  const gate = assignmentsFlagOr404();
  if (gate) return gate;

  let actor: StudentActor | null = null;
  try {
    actor = await resolveStudentActor();
    if (opts.writeTx) {
      const result = await withSerializableRetry(
        () =>
          prisma.$transaction(
            async (tx) => fn(tx as TxClient, actor as StudentActor),
            { isolationLevel: "Serializable" },
          ),
        { errorCode: opts.errorCode ?? "concurrent_submission_update" },
      );
      return NextResponse.json(result);
    }
    const result = await fn(prisma as unknown as TxClient, actor);
    return NextResponse.json(result);
  } catch (e) {
    await emitAssignmentAuditFromError({
      error: e,
      actorUserId: actor?.userId ?? null,
      actorRole: "STUDENT",
      scopeType: "StudentWorkspace",
      scopeId: null,
    }).catch(() => {});
    return mapAssignmentErrorToResponse(e);
  }
}
