// QA-b1 · store durable des nonces bootstrap · consommation atomique.
//
// Doctrine · le Map process-scoped n'est plus l'autorité de consommation ·
// la table `qa_bootstrap_nonces` (Prisma model `QaBootstrapNonce`) est la
// source de vérité. La consommation se fait via une seule opération
// atomique · Prisma `updateMany` conditionnel (WHERE nonceHash + consumedAt
// NULL + expiresAt > now + host + emailHash + projectRef) · le compteur
// `result.count` est l'unique preuve (`=== 1` succès, `=== 0` refus).
// Deux requêtes concurrentes → exactement 1 succès, exactement 1 refus
// (grâce à l'unicité de nonce_hash + UPDATE single-statement).
//
// Un cache mémoire subsiste uniquement comme optimisation (fast-path pour
// détecter un replay évident sans hit DB · jamais utilisé pour AUTORISER).

import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function hashNonce(nonce: string): string {
  return createHash("sha256").update(nonce).digest("hex");
}

/** Insertion d'un nonce à la génération du lien QA. */
export interface CreateNonceInput {
  nonce: string;                 // brut · uniquement pour hashage local
  qaAdminEmailHash: string;
  deploymentHost: string;
  projectRef: string;
  issuedAt: Date;
  expiresAt: Date;
}

export async function createNonce(input: CreateNonceInput): Promise<{ nonceHash: string }> {
  const nonceHash = hashNonce(input.nonce);
  await prisma.qaBootstrapNonce.create({
    data: {
      nonceHash,
      qaAdminEmailHash: input.qaAdminEmailHash,
      deploymentHost: input.deploymentHost,
      projectRef: input.projectRef,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
    },
  });
  return { nonceHash };
}

/**
 * Consommation atomique · un seul UPDATE avec les conditions strictes
 * (consumedAt NULL, expiresAt future, host/projectRef/emailHash match).
 * Utilise Prisma `updateMany` puis compte les rows affectées · l'unicité
 * de `nonceHash` garantit qu'un nonce ne peut être matché qu'une fois.
 *
 * Sur PostgreSQL, updateMany génère une UPDATE atomique · les conditions
 * dans le WHERE sont vérifiées avec un row-level lock implicite pendant
 * la transaction.
 */
export interface AtomicConsumeInput {
  nonce: string;
  qaAdminEmailHash: string;
  deploymentHost: string;
  projectRef: string;
  nowSeconds: number;
}

export type AtomicConsumeResult =
  | { ok: true }
  | { ok: false; reason: "nonce_not_found_or_already_consumed" };

export async function atomicConsumeNonce(input: AtomicConsumeInput): Promise<AtomicConsumeResult> {
  const nonceHash = hashNonce(input.nonce);
  const nowDate = new Date(input.nowSeconds * 1000);
  const result = await prisma.qaBootstrapNonce.updateMany({
    where: {
      nonceHash,
      consumedAt: null,
      expiresAt: { gt: nowDate },
      qaAdminEmailHash: input.qaAdminEmailHash,
      deploymentHost: input.deploymentHost,
      projectRef: input.projectRef,
    },
    data: { consumedAt: nowDate },
  });
  if (result.count === 1) return { ok: true };
  // count === 0 · soit nonce inconnu, soit déjà consommé, soit expiré,
  // soit mismatch host/emailHash/projectRef. Ne pas exposer laquelle.
  return { ok: false, reason: "nonce_not_found_or_already_consumed" };
}

/** Cleanup helper · purge nonces expirés + consumed since threshold. */
export async function purgeStaleNonces(retainConsumedForSeconds = 3600): Promise<number> {
  const nowMs = Date.now();
  const cutoff = new Date(nowMs - retainConsumedForSeconds * 1000);
  const res = await prisma.qaBootstrapNonce.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date(nowMs) } },
        { consumedAt: { lt: cutoff } },
      ],
    },
  });
  return res.count;
}
