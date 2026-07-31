import "server-only";
import { prisma } from "@/lib/prisma";
import { limitsForActor } from "./limits";
import type { MessagingActor } from "../actor";

// P4.6-C.1 · quota horaire d'uploads audio par acteur.
//
// Compte les MessagingAudioAsset créés dans la dernière heure pour
// l'acteur courant (ownerUserId ou ownerChildProfileId). Comparaison
// vs limitsForActor(actorType).maxUploadsPerHour.
//
// Aucun stockage supplémentaire · réutilise messaging_audio_assets +
// createdAt indexé. Aucun compteur externe.

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function hasReachedAudioUploadQuota(actor: MessagingActor): Promise<boolean> {
  const since = new Date(Date.now() - ONE_HOUR_MS);
  const limit = limitsForActor(actor.actorType).maxUploadsPerHour;
  const where = actor.actorType === "USER"
    ? { ownerUserId: actor.userId!, createdAt: { gte: since } }
    : { ownerChildProfileId: actor.childProfileId!, createdAt: { gte: since } };
  const count = await prisma.messagingAudioAsset.count({ where });
  return count >= limit;
}
