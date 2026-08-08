import "server-only";

import prisma from "@/lib/prisma";
import { hashInviteEmail, hashInviteToken } from "@/lib/beta/invite";

export interface StoredBetaInvitation {
  id: string;
  expiresAt: Date;
}

const STALE_CLAIM_MS = 10 * 60 * 1000;

export async function storeBetaInvitation(params: {
  token: string;
  email: string;
  issuedByUserId: string;
  expiresAt: Date;
}): Promise<StoredBetaInvitation> {
  return prisma.betaInvitation.create({
    data: {
      tokenHash: hashInviteToken(params.token),
      emailHash: hashInviteEmail(params.email),
      issuedByUserId: params.issuedByUserId,
      expiresAt: params.expiresAt,
    },
    select: { id: true, expiresAt: true },
  });
}

export async function claimBetaInvitation(params: {
  token: string;
  email: string;
  now?: Date;
}): Promise<{ id: string } | null> {
  const tokenHash = hashInviteToken(params.token);
  const emailHash = hashInviteEmail(params.email);
  const now = params.now ?? new Date();

  const invitation = await prisma.betaInvitation.findUnique({
    where: { tokenHash },
    select: { id: true },
  });
  if (!invitation) return null;

  // A server crash after claiming but before finalization must not permanently
  // burn a valid invitation. Only incomplete claims older than 10 minutes can
  // be returned to PENDING, and only for the same token/email pair.
  await prisma.betaInvitation.updateMany({
    where: {
      id: invitation.id,
      tokenHash,
      emailHash,
      status: "ACCEPTED",
      acceptedByUserId: null,
      revokedAt: null,
      acceptedAt: { lte: new Date(now.getTime() - STALE_CLAIM_MS) },
      expiresAt: { gt: now },
    },
    data: {
      status: "PENDING",
      acceptedAt: null,
    },
  });

  const claim = await prisma.betaInvitation.updateMany({
    where: {
      id: invitation.id,
      tokenHash,
      emailHash,
      status: "PENDING",
      expiresAt: { gt: now },
    },
    data: {
      status: "ACCEPTED",
      acceptedAt: now,
    },
  });

  return claim.count === 1 ? invitation : null;
}

export async function finalizeBetaInvitation(params: {
  invitationId: string;
  acceptedByUserId: string;
}): Promise<void> {
  const result = await prisma.betaInvitation.updateMany({
    where: {
      id: params.invitationId,
      status: "ACCEPTED",
      acceptedByUserId: null,
    },
    data: { acceptedByUserId: params.acceptedByUserId },
  });
  if (result.count !== 1) throw new Error("beta_invitation_finalize_failed");
}

export async function releaseBetaInvitationClaim(invitationId: string): Promise<void> {
  await prisma.betaInvitation.updateMany({
    where: {
      id: invitationId,
      status: "ACCEPTED",
      acceptedByUserId: null,
      revokedAt: null,
    },
    data: {
      status: "PENDING",
      acceptedAt: null,
    },
  });
}

export async function revokeBetaInvitation(params: {
  invitationId: string;
  now?: Date;
}): Promise<boolean> {
  const result = await prisma.betaInvitation.updateMany({
    where: {
      id: params.invitationId,
      status: "PENDING",
    },
    data: {
      status: "REVOKED",
      revokedAt: params.now ?? new Date(),
    },
  });
  return result.count === 1;
}
