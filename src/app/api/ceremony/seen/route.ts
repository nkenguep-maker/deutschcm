import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// POST /api/ceremony/seen
// Body : { historyId: string }
//
// Marque LevelHistory.ceremonySeen=true pour éviter la double cérémonie.
// Le front POST cette route après avoir affiché <LevelUp/>. Idempotent :
// si déjà vue, retourne ok sans erreur.

export async function POST(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let historyId: string | undefined;
  try {
    const body = await request.json();
    historyId = body.historyId;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!historyId) {
    return NextResponse.json({ error: "historyId required" }, { status: 400 });
  }

  // Vérifier appartenance (un user ne peut marquer que ses propres cérémonies)
  const history = await prisma.levelHistory.findUnique({
    where: { id: historyId },
    select: { userId: true, ceremonySeen: true },
  });
  if (!history || history.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!history.ceremonySeen) {
    await prisma.levelHistory.update({
      where: { id: historyId },
      data: { ceremonySeen: true },
    });
  }

  return NextResponse.json({ ok: true });
}
