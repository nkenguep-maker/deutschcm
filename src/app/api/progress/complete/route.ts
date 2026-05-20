import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const xpEarned = typeof body?.xpEarned === "number" ? Math.min(Math.max(body.xpEarned, 0), 500) : 0;
  if (xpEarned <= 0) return NextResponse.json({ error: "Invalid xpEarned" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: profile.id },
    data: { xpTotal: { increment: xpEarned }, lastActiveAt: new Date() },
    select: { xpTotal: true },
  });

  return NextResponse.json({ ok: true, xpTotal: updated.xpTotal });
}
