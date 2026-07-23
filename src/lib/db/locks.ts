// P4.2 hardening · Verrous transactionnels PostgreSQL (advisory locks).
//
// Serializable Snapshot Isolation ne détecte pas systématiquement les phantom
// reads du type "COUNT + INSERT" (deux TX qui comptent 1 adulte puis insèrent
// un nouvel adulte chacune → 3 adultes finaux). Un `pg_advisory_xact_lock`
// pris tôt dans la TX serialise strictement les opérations concurrentes sur
// le même Circle sans coût de contention entre Circles différents.
//
// L'ID passé à `pg_advisory_xact_lock` doit être un bigint. On dérive un
// hash entier depuis le cuid du Circle pour rester déterministe.

import type { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/** Convertit un cuid en bigint stable pour pg_advisory_lock. */
function cuidToLockId(id: string): bigint {
  // 8 octets = int64. On prend les 8 premiers octets du SHA-1.
  const buf = createHash("sha1").update(id, "utf8").digest();
  // BigInt lecture · signed int64 en two's complement.
  return buf.readBigInt64BE(0);
}

/**
 * Prend un verrou exclusif sur le Circle pour toute la durée de la TX.
 * Deux TX concurrentes qui appellent cette fonction sur le même Circle
 * s'exécutent séquentiellement · aucun impact sur les autres Circles.
 */
export async function acquireCircleLock(tx: TxClient, circleId: string): Promise<void> {
  const id = cuidToLockId(circleId);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${id})`;
}
