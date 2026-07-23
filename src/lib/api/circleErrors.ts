// P4.2 · Mapping erreurs typées → HTTP status + code stable.
//
// Convention · toute route Circle P4.2 utilise ce mapper pour convertir
// les throws typés (PermissionError, InvitationError, MembershipError,
// CapacityError) en réponses HTTP cohérentes.

import { NextResponse } from "next/server";
import { PermissionError } from "@/lib/permissions/circle";
import { InvitationError } from "@/lib/invitations/service";
import { MembershipError, CapacityError } from "@/lib/circles/memberships";
import { ConcurrentUpdateError } from "@/lib/db/retry";
import { writeAuditEvent } from "@/lib/audit/events";

export function err(code: string, message: string, status: number, detail?: unknown) {
  return NextResponse.json(
    { error: message, code, ...(detail ? { detail } : {}) },
    { status },
  );
}

export function mapErrorToResponse(e: unknown): NextResponse {
  if (e instanceof PermissionError) {
    const status =
      e.code === "UNAUTHORIZED" ? 401 :
      e.code === "FORBIDDEN" ? 403 :
      e.code === "CONFLICT" ? 409 :
      404;
    return err(e.code, e.message, status);
  }
  if (e instanceof InvitationError) {
    const statusByCode: Record<string, number> = {
      invitation_not_found: 404,
      invitation_expired: 410,
      invitation_revoked: 410,
      invitation_already_used: 410,
      membership_already_active: 409,
      duplicate_pending_invitation: 409,
      circle_archived: 410,
      circle_not_found: 404,
      forbidden: 403,
    };
    return err(e.code, e.message, statusByCode[e.code] ?? 400, e.detail);
  }
  if (e instanceof MembershipError) {
    const statusByCode: Record<string, number> = {
      forbidden: 403,
      circle_not_found: 404,
      circle_archived: 410,
      child_not_in_household: 403,
      child_membership_removed: 410,
      membership_not_found: 404,
      membership_already_active: 409,
      owner_cannot_leave: 403,
      coach_already_assigned: 409,
    };
    return err(e.code, e.message, statusByCode[e.code] ?? 400, e.detail);
  }
  if (e instanceof CapacityError) {
    return err(e.code, e.message, 409, e.detail);
  }
  if (e instanceof ConcurrentUpdateError) {
    return err(e.code, e.message, 409);
  }
  // Prisma unique violation
  if ((e as { code?: string })?.code === "P2002") {
    return err("conflict", "conflict", 409, {
      target: (e as { meta?: { target?: string[] } }).meta?.target,
    });
  }
  // Postgres 40001 / Prisma P2034 · conflit sérialisation non retry'able
  // (peut arriver hors withSerializableRetry). Mapping stable.
  const raw = e as { code?: string; message?: string };
  if (
    raw?.code === "40001" ||
    raw?.code === "P2034" ||
    /serialization_failure|could not serialize/i.test(raw?.message ?? "")
  ) {
    return err("concurrent_membership_update", "concurrent update, please retry", 409);
  }
  console.error("[api/circles] unhandled error", e);
  return err("INTERNAL", "internal error", 500);
}

/**
 * Fire-and-forget · émet un `MEMBERSHIP_ACCESS_DENIED` pour les refus
 * sensibles (cross-tenant, coach non assigné, action OWNER-only tentée
 * par un adulte, etc). Metadata limitée aux IDs + reasonCode. Ne bloque
 * jamais la réponse en cas d'échec d'écriture audit.
 */
export async function auditAccessDenied(input: {
  actorUserId: string | null;
  actorRole: string | null;
  circleId?: string | null;
  targetType: string;
  targetId?: string | null;
  reasonCode: string;
}): Promise<void> {
  try {
    await writeAuditEvent({
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: "MEMBERSHIP_ACCESS_DENIED",
      targetType: input.targetType,
      targetId: input.targetId ?? "unknown",
      scopeType: input.circleId ? "Circle" : null,
      scopeId: input.circleId ?? null,
      metadata: { reasonCode: input.reasonCode },
    });
  } catch (e) {
    console.warn("[audit] MEMBERSHIP_ACCESS_DENIED write failed:", (e as Error).message);
  }
}
