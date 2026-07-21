// POST /api/dev/inject-orphan  (dev-only)
// Crée une ligne users Prisma orpheline (email X, supabaseId bidon)
// pour tester la réconciliation dans /api/learning-paths + /api/onboarding/complete.
//
// Body : { email: string }
// Retour : { id, supabaseId, email }
//
// Bloqué en production par NODE_ENV.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Crée la ligne orpheline (supabaseId aléatoire — simule un ancien compte
  // supprimé côté Supabase mais dont la trace Prisma persiste).
  const orphan = await prisma.user.create({
    data: {
      supabaseId: `orphan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      fullName: "Ancien compte fantôme",
      role: "STUDENT",
    },
  });
  return NextResponse.json({ id: orphan.id, supabaseId: orphan.supabaseId, email: orphan.email });
}
