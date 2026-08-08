import "server-only";

import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { hashInviteEmail, hashInviteToken } from "@/lib/beta/invite";

export interface StoredBetaInvitation {
  id: string;
  expiresAt: Date;
}

export async function storeBetaInvitation(params: {
  token: string;
  email: string;
  issuedByUserId: string;
  expiresAt: Date;
}): Promise<StoredBetaInvitation> {
  const id = randomUUID();
  const tokenHash = hashInviteToken(params.token);
  const emailHash = hashInviteEmail(params.email);

  await prisma.$executeRaw`
    INSERT INTO public.beta_invitations
      (id, "tokenHash", "emailHash", status, "issuedByUserId", "expiresAt")
    VALUES
      (${id}, ${tokenHash}, ${emailHash}, 'PENDING'::public."InvitationStatus", ${params.issuedByUserId}, ${params.expiresAt})
  `;

  return { id, expiresAt: params.expiresAt };
}

export async function claimBetaInvitation(params: {
  token: string;
  email: string;
  now?: Date;
}): Promise<{ id: string } | null> {
  const tokenHash = hashInviteToken(params.token);
  const emailHash = hashInviteEmail(params.email);
  const now = params.now ?? new Date();

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE public.beta_invitations
    SET status = 'ACCEPTED'::public."InvitationStatus",
        "acceptedAt" = ${now}
    WHERE "tokenHash" = ${tokenHash}
      AND "emailHash" = ${emailHash}
      AND status = 'PENDING'::public."InvitationStatus"
      AND "expiresAt" > ${now}
    RETURNING id
  `;

  return rows[0] ?? null;
}

export async function finalizeBetaInvitation(params: {
  invitationId: string;
  acceptedByUserId: string;
}): Promise<void> {
  const count = await prisma.$executeRaw`
    UPDATE public.beta_invitations
    SET "acceptedByUserId" = ${params.acceptedByUserId}
    WHERE id = ${params.invitationId}
      AND status = 'ACCEPTED'::public."InvitationStatus"
      AND "acceptedByUserId" IS NULL
  `;
  if (count !== 1) throw new Error("beta_invitation_finalize_failed");
}

export async function releaseBetaInvitationClaim(invitationId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE public.beta_invitations
    SET status = 'PENDING'::public."InvitationStatus",
        "acceptedAt" = NULL
    WHERE id = ${invitationId}
      AND status = 'ACCEPTED'::public."InvitationStatus"
      AND "acceptedByUserId" IS NULL
      AND "revokedAt" IS NULL
  `;
}

export async function revokeBetaInvitation(params: {
  invitationId: string;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();
  const count = await prisma.$executeRaw`
    UPDATE public.beta_invitations
    SET status = 'REVOKED'::public."InvitationStatus",
        "revokedAt" = ${now}
    WHERE id = ${params.invitationId}
      AND status = 'PENDING'::public."InvitationStatus"
  `;
  return count === 1;
}
