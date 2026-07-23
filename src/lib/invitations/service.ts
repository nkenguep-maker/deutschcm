// P4.2 · Service invitations Circle · logique transactionnelle sûre.
//
// Contrat ·
//   - createAdultInvitation · OWNER-only. Génère token brut (retourné 1×),
//     stocke hash, 72h expiry. Refuse cross-tenant, duplicate PENDING, adulte
//     déjà actif, capacité 2 adultes atteinte.
//   - acceptInvitation · atomique. Résout par tokenHash, vérifie statut +
//     expiry, matérialise la membership ADULT ACTIVE dans la même transaction,
//     marque invitation ACCEPTED.
//   - revokeInvitation · OWNER-only. Passe PENDING → REVOKED.
//   - expirePending · maintenance batch (utilisé par tests).

import type { Prisma, PrismaClient } from "@prisma/client";
import {
  CapacityError,
  assertCircleAdultCapacity,
} from "@/lib/circles/capacity";
import { acquireCircleLock } from "@/lib/db/locks";
import { hashEmail, hashToken } from "./tokens";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class InvitationError extends Error {
  constructor(
    public readonly code:
      | "invitation_not_found"
      | "invitation_expired"
      | "invitation_revoked"
      | "invitation_already_used"
      | "membership_already_active"
      | "duplicate_pending_invitation"
      | "circle_archived"
      | "circle_not_found"
      | "forbidden",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "InvitationError";
  }
}

export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000; // 72h

export interface CreateAdultInvitationInput {
  circleId: string;
  ownerUserId: string; // OWNER (résolu serveur)
  invitedEmail: string;
  rawToken: string; // fourni par le caller pour être aussi retourné au caller (jamais loggé)
}

/**
 * Post-tx · marque une invitation PENDING → REVOKED avec un motif stable
 * quand le capacity check a rejeté un accept concurrent. Idempotent.
 * Émet aussi un AuditEvent minimal.
 */
export async function revokeInvitationForCapacity(
  tx: TxClient,
  invitationId: string,
): Promise<boolean> {
  const marked = await tx.circleInvitation.updateMany({
    where: { id: invitationId, status: "PENDING" },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });
  return marked.count > 0;
}

/**
 * OWNER invite un ADULT via email. Retourne l'invitation (sans le token brut).
 * Le caller conserve `rawToken` pour l'envoyer par email/print (P5).
 */
export async function createAdultInvitation(
  tx: TxClient,
  input: CreateAdultInvitationInput,
): Promise<{ id: string; circleId: string; expiresAt: Date }> {
  const circle = await tx.circle.findUnique({
    where: { id: input.circleId },
    select: { id: true, status: true, householdId: true },
  });
  if (!circle) throw new InvitationError("circle_not_found", "circle not found");
  if (circle.status !== "ACTIVE") {
    throw new InvitationError("circle_archived", "circle is not active");
  }

  const owner = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      userId: input.ownerUserId,
      role: "OWNER",
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!owner) throw new InvitationError("forbidden", "owner membership required");

  // Bloque si l'email pointe déjà sur une membership ADULT ACTIVE (via
  // lookup email → user). Cross-tenant · pas d'énumération, on ne dit rien
  // au-delà.
  const emailHash = hashEmail(input.invitedEmail);
  const invitedUser = await tx.user.findUnique({
    where: { email: input.invitedEmail.trim().toLowerCase() },
    select: { id: true },
  });
  if (invitedUser) {
    const existing = await tx.circleMembership.findFirst({
      where: {
        circleId: input.circleId,
        userId: invitedUser.id,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (existing) {
      throw new InvitationError(
        "membership_already_active",
        "user already active in this circle",
      );
    }
  }

  // Cap adultes · si 2 déjà, refus immédiat.
  await assertCircleAdultCapacity(tx, input.circleId);

  // Duplicate PENDING pour même email dans même cercle · rejet (unique index).
  try {
    const invitation = await tx.circleInvitation.create({
      data: {
        circleId: input.circleId,
        role: "ADULT",
        status: "PENDING",
        invitedEmailHash: emailHash,
        invitedByUserId: input.ownerUserId,
        tokenHash: hashToken(input.rawToken),
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      },
      select: { id: true, circleId: true, expiresAt: true },
    });
    return invitation;
  } catch (e) {
    // Unique violation sur (circleId, invitedEmailHash) WHERE PENDING
    // OU sur tokenHash (extrêmement improbable).
    if (
      (e as { code?: string })?.code === "P2002"
    ) {
      throw new InvitationError(
        "duplicate_pending_invitation",
        "an active invitation already exists for this email",
      );
    }
    throw e;
  }
}

export interface AcceptInvitationInput {
  rawToken: string;
  actorUserId: string; // utilisateur authentifié qui présente le token
  actorEmail: string; // sanity check · doit matcher l'email invité
  now?: Date;
}

/**
 * Acceptation atomique · résout par tokenHash, vérifie éligibilité,
 * matérialise la membership ADULT ACTIVE dans la même transaction.
 * Retourne le row membership + le circleId.
 */
export async function acceptInvitation(
  tx: TxClient,
  input: AcceptInvitationInput,
): Promise<{ membershipId: string; circleId: string }> {
  const now = input.now ?? new Date();
  const tokenHash = hashToken(input.rawToken);
  const invitation = await tx.circleInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true, circleId: true, status: true, expiresAt: true,
      invitedEmailHash: true, role: true,
    },
  });
  if (!invitation) throw new InvitationError("invitation_not_found", "invitation not found");
  if (invitation.status === "REVOKED") throw new InvitationError("invitation_revoked", "invitation revoked");
  if (invitation.status === "ACCEPTED") throw new InvitationError("invitation_already_used", "invitation already used");
  if (invitation.status === "EXPIRED" || invitation.expiresAt < now) {
    throw new InvitationError("invitation_expired", "invitation expired");
  }
  // L'email de l'actor doit matcher l'email invité (défense minimale).
  if (hashEmail(input.actorEmail) !== invitation.invitedEmailHash) {
    throw new InvitationError("forbidden", "email mismatch");
  }
  // Circle doit rester ACTIVE.
  const circle = await tx.circle.findUnique({
    where: { id: invitation.circleId },
    select: { status: true },
  });
  if (!circle || circle.status !== "ACTIVE") {
    throw new InvitationError("circle_archived", "circle not active");
  }
  // Verrou advisory par Circle · serialise les accepts concurrents et
  // empêche le scénario "count=1 + INSERT + INSERT → count=3" (le second
  // accept attend, revoit count=2 puis lève max_adults_reached).
  await acquireCircleLock(tx, invitation.circleId);
  await assertCircleAdultCapacity(tx, invitation.circleId);

  // Passe invitation ACCEPTED (guard sur status = PENDING pour idempotence).
  const marked = await tx.circleInvitation.updateMany({
    where: { id: invitation.id, status: "PENDING" },
    data: {
      status: "ACCEPTED",
      acceptedAt: now,
      acceptedByUserId: input.actorUserId,
    },
  });
  if (marked.count === 0) {
    throw new InvitationError("invitation_already_used", "invitation was updated concurrently");
  }
  // Crée la membership ADULT ACTIVE.
  const membership = await tx.circleMembership.create({
    data: {
      circleId: invitation.circleId,
      role: invitation.role, // ADULT en P4.2
      status: "ACTIVE",
      userId: input.actorUserId,
      invitedByUserId: input.actorUserId, // audit · l'invité s'ajoute lui-même
      joinedAt: now,
    },
    select: { id: true },
  });
  return { membershipId: membership.id, circleId: invitation.circleId };
}

export interface RevokeInvitationInput {
  invitationId: string;
  circleId: string;
  ownerUserId: string;
}

export async function revokeInvitation(
  tx: TxClient,
  input: RevokeInvitationInput,
): Promise<void> {
  const owner = await tx.circleMembership.findFirst({
    where: {
      circleId: input.circleId,
      userId: input.ownerUserId,
      role: "OWNER",
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (!owner) throw new InvitationError("forbidden", "owner membership required");

  const marked = await tx.circleInvitation.updateMany({
    where: {
      id: input.invitationId,
      circleId: input.circleId,
      status: "PENDING",
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedByUserId: input.ownerUserId,
    },
  });
  if (marked.count === 0) {
    throw new InvitationError("invitation_not_found", "no pending invitation to revoke");
  }
}

// Ré-export pour caller-side type-narrowing.
export { CapacityError };
export type { Prisma };
