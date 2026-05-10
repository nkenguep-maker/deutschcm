import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

const ROLE_MAP: Record<string, Role> = {
  TEACHER: Role.TEACHER,
  CENTER_MANAGER: Role.CENTER_MANAGER,
  STUDENT: Role.STUDENT,
  ADMIN: Role.ADMIN,
};

export async function POST(request: Request) {
  const { role } = await request.json() as { role?: string };
  if (!role || !ROLE_MAP[role]) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

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
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await Promise.all([
    supabase.auth.updateUser({
      data: { role, onboarding_done: true },
    }),
    prisma.user.upsert({
      where: { supabaseId: user.id },
      create: {
        supabaseId: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur",
        role: ROLE_MAP[role],
        onboardingDone: true,
      },
      update: { role: ROLE_MAP[role], onboardingDone: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
