// Helpers HTTP · à utiliser dans les route handlers Next pour
// gater une capacité par getEntitlements(). Retourne soit un
// NextResponse d'erreur prêt à return, soit { dbUser, path? } utilisable.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getEntitlements, type EntitlementRequest } from "./index";
import type { User, LearningPath } from "@prisma/client";

type OkCtx = { dbUser: User; path: LearningPath | null; grantId?: string };
type Result = { ok: true; ctx: OkCtx } | { ok: false; response: NextResponse };

/**
 * requireCapability · à appeler tout en haut d'un route handler.
 * Retourne le contexte {dbUser, path} si autorisé, sinon un NextResponse
 * 401/403/404 prêt à return.
 */
export async function requireCapability(params: {
  capability: EntitlementRequest["capability"];
  learningPathId?: string | null;
  actorType?: EntitlementRequest["actorType"];
}): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return { ok: false, response: NextResponse.json({ error: "no profile" }, { status: 404 }) };

  // Path optionnel · si non fourni, on prend l'ACTIF le plus récent
  let path: LearningPath | null = null;
  if (params.learningPathId) {
    path = await prisma.learningPath.findUnique({ where: { id: params.learningPathId } });
  } else {
    path = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  }

  const r = await getEntitlements({
    userId: dbUser.id,
    learningPathId: path?.id,
    capability: params.capability,
    actorType: params.actorType,
  });
  if (!r.allowed) {
    return { ok: false, response: NextResponse.json({ error: r.reason ?? "forbidden" }, { status: 403 }) };
  }
  return { ok: true, ctx: { dbUser, path, grantId: r.limits?.grantId } };
}
