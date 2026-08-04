import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// P4.6-A · projection Metadata Super Admin.
//
// Doctrine sécurité (brief §16) :
//   - Aucun body, transcript, storageKey, signedUrl, texte guidé, ou
//     contenu de carte pédagogique n'est chargé, sélectionné ni sérialisé.
//   - Les identifiants sensibles (conversationId, centerId) sont hashés
//     avant projection (SHA-256 tronqué 12 chars).
//   - Cette projection ne remplace jamais un Message chargé puis masqué
//     en React · la sélection Prisma est écrite pour ne JAMAIS toucher
//     à body/transcript/storageKey.

function hashId(id: string): string {
  return createHash("sha256").update(id).digest("hex").slice(0, 12);
}

export interface AdminConversationMetadata {
  conversationIdHash: string;
  type: string;
  status: string;
  centerIdHash: string | null;
  participantRoles: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  audioDurationMs: number;
  attachmentBytes: number;
}

export async function getAdminMetadataProjection(limit = 100): Promise<AdminConversationMetadata[]> {
  // Sélection stricte · aucune donnée sensible ne fuit ici.
  const conversations = await prisma.messagingConversation.findMany({
    take: Math.min(500, Math.max(1, limit)),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      centerId: true,
      createdAt: true,
      updatedAt: true,
      lastMessageAt: true,
      participants: {
        where: { leftAt: null },
        select: { participantRole: true },
      },
      // messages count sans charger le contenu
      _count: { select: { messages: true } },
    },
  });

  const out: AdminConversationMetadata[] = [];
  for (const c of conversations) {
    // Agrège durée/tailles depuis les attachments/audio SANS toucher au
    // storageKey. On sélectionne uniquement les colonnes techniques.
    const attachmentAgg = await prisma.messagingMessageAttachment.aggregate({
      where: { message: { conversationId: c.id } },
      _sum: { sizeBytes: true },
    });
    const audioAgg = await prisma.messagingAudioAsset.aggregate({
      where: { messages: { some: { conversationId: c.id } } },
      _sum: { durationMs: true },
    });

    out.push({
      conversationIdHash: hashId(c.id),
      type: String(c.type),
      status: String(c.status),
      centerIdHash: c.centerId ? hashId(c.centerId) : null,
      participantRoles: c.participants.map((p) => String(p.participantRole)),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
      messageCount: c._count.messages,
      audioDurationMs: audioAgg._sum.durationMs ?? 0,
      attachmentBytes: attachmentAgg._sum.sizeBytes ?? 0,
    });
  }
  return out;
}
