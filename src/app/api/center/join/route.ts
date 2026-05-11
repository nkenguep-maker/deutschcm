import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const center = await prisma.languageCenter.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, name: true },
  });
  if (!center) {
    return NextResponse.json({ error: "Code de centre invalide" }, { status: 404 });
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (!dbUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { centerId: center.id },
  });

  return NextResponse.json({ success: true, centerId: center.id, centerName: center.name });
}
