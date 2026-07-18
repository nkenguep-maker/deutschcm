import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { grantRole, syncUserMetadata, type SpaceRole } from "@/lib/roles";

// Rôle de base au register : crée le User + une ligne UserRole ACTIVE
// (onboarded=false — l'onboarding se déclenche à l'entrée dans l'espace).

const VALID: SpaceRole[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"];

export async function POST(request: Request) {
  const { role } = (await request.json()) as { role?: string };
  if (!role || !VALID.includes(role as SpaceRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    create: {
      supabaseId: user.id,
      email: user.email!,
      fullName:
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "Utilisateur",
      role: role as SpaceRole,
    },
    update: {},
    select: { id: true },
  });

  await grantRole({ userId: dbUser.id, role: role as SpaceRole });
  await syncUserMetadata({ supabaseId: user.id, activeSpace: role as SpaceRole });

  return NextResponse.json({ ok: true });
}
