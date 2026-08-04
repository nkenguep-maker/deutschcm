import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { QA_PERSONAS } from "@/lib/qa/personas";
import { getFlag, listAllFlags } from "@/lib/flags";

// P4.6 Lot 4B · agrégats server-only pour la console Super Admin.
//
// Contraintes de sécurité (brief §11 Lot 4B) :
//   - AUCUNE clé, token, URL signée, mot de passe rendus.
//   - Le projectRef Supabase est acceptable UNIQUEMENT si celui de P-1
//     autorisé (documenté publiquement dans le repo/CLAUDE.md).
//   - Les acteurs de l'audit sont hashés (SHA-256 tronqué) si non anonymes,
//     sinon rendus comme "anonymous".

const ALLOWED_PROJECT_REF = "kzzagbojjkivdzzcrmxn"; // P-1 uniquement, publiable

export interface AdminConsolePersona {
  id: string;
  label: string;
  role: string;
  destination: string;
  available: boolean;
}

export interface AdminConsoleAudit {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorRole: string | null;
  actorHash: string | null; // SHA-256 tronqué à 12 chars, ou null si anonyme
  createdAt: string;
}

export interface AdminConsoleEnvSummary {
  projectRef: string | null;
  nodeEnv: string | null;
  qaModeEnabled: boolean;
  qaSessionMaxMinutes: number;
  flags: Array<{ key: string; enabled: boolean }>;
}

function hashActor(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

export function getAdminPersonas(locale: string): AdminConsolePersona[] {
  return QA_PERSONAS.map((p) => ({
    id: p.id,
    label: locale === "en" ? p.label.en : p.label.fr,
    role: p.role,
    destination: p.destination(locale),
    available: p.available,
  }));
}

export async function getAdminRecentAudit(limit = 20): Promise<AdminConsoleAudit[]> {
  const rows = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      actorRole: true,
      actorUserId: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    action: String(r.action),
    targetType: r.targetType,
    targetId: r.targetId,
    actorRole: r.actorRole,
    actorHash: r.actorUserId ? hashActor(r.actorUserId) : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export function getAdminEnvSummary(): AdminConsoleEnvSummary {
  // Récupération du projectRef à partir de NEXT_PUBLIC_SUPABASE_URL (déjà
  // publiquement accessible via le bundle client — pas un secret). On ne
  // révèle QUE si le ref matche P-1 autorisé ; sinon on retourne null.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  const rawRef = match ? match[1] : null;
  const projectRef = rawRef === ALLOWED_PROJECT_REF ? ALLOWED_PROJECT_REF : null;

  const flags = Object.entries(listAllFlags()).map(([key, enabled]) => ({ key, enabled }));

  return {
    projectRef,
    nodeEnv: process.env.NODE_ENV ?? null,
    qaModeEnabled: getFlag("QA_MODE_ENABLED"),
    qaSessionMaxMinutes: 120, // valeur documentée dans qa/config.ts
    flags,
  };
}
