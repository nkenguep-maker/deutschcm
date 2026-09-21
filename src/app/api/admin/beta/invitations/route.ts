import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { isClosedBetaEnabled } from "@/lib/beta/invite";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isClosedBetaEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      userRoles: {
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!admin || admin.userRoles.length === 0) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const rows = await prisma.betaInvitation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      createdAt: true,
      acceptedByUserId: true,
      issuedByUserId: true,
    },
  });

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      acceptedAt: row.acceptedAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      finalized: Boolean(row.acceptedByUserId),
      issuedByMe: row.issuedByUserId === admin.id,
    })),
  }, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
