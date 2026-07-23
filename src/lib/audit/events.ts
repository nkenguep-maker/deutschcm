// P4.1 · Écriture append-only d'AuditEvent.
//
// Doctrine · YEMA_P4_THREAT_MODEL.md §7. Ne JAMAIS stocker corps de message,
// transcription audio, secret, ni URL signée. Uniquement identifiants et
// transitions d'état.

import type { AuditAction, PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export interface AuditRecord {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  targetType: string;
  targetId: string;
  scopeType?: string | null;
  scopeId?: string | null;
  metadata?: Record<string, unknown> | null;
}

const FORBIDDEN_METADATA_KEYS = new Set([
  "body",
  "message",
  "audioUrl",
  "signedUrl",
  "token",
  "password",
  "transcription",
]);

function sanitizeMetadata(md: Record<string, unknown> | null | undefined) {
  if (!md) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(md)) {
    if (FORBIDDEN_METADATA_KEYS.has(k)) continue;
    if (typeof v === "string" && v.length > 500) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Écrit un événement d'audit. Utilise `tx` si fourni (utile pour rester
 * dans la même transaction que l'action auditée), sinon la connexion
 * standard.
 */
export async function writeAuditEvent(
  rec: AuditRecord,
  tx?: TxClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.auditEvent.create({
    data: {
      actorUserId: rec.actorUserId ?? null,
      actorRole: rec.actorRole ?? null,
      action: rec.action,
      targetType: rec.targetType,
      targetId: rec.targetId,
      scopeType: rec.scopeType ?? null,
      scopeId: rec.scopeId ?? null,
      metadata: (sanitizeMetadata(rec.metadata) ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}
