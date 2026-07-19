// GET/PATCH /api/admin/applications — Sprint 8bis.
// Vue admin des demandes enseignant·e·s et centres.
// Reserved to ADMIN role (check via UserRole).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { userRoles: { where: { status: "ACTIVE", role: "ADMIN" }, select: { id: true } } },
  });
  return admin && admin.userRoles.length > 0 ? user : null;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");

  if (kind === "teacher") {
    const items = await prisma.teacherApplication.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ items });
  }
  if (kind === "center") {
    const items = await prisma.centerApplication.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ items });
  }
  return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
}

interface PatchPayload {
  kind: "teacher" | "center";
  id: string;
  status?: string;
  notes?: string;
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = (await request.json()) as PatchPayload;
  if (!body.id || !body.kind) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const data: { status?: string; notes?: string } = {};
  if (body.status) data.status = body.status;
  if (typeof body.notes === "string") data.notes = body.notes;

  try {
    if (body.kind === "teacher") {
      // Prisma-typed status
      await prisma.teacherApplication.update({
        where: { id: body.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
    } else {
      await prisma.centerApplication.update({
        where: { id: body.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
    }
  } catch (e) {
    console.error("[admin/applications] PATCH error:", e);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
