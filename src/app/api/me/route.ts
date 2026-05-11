import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

const ROLE_MAP: Record<string, Role> = {
  STUDENT: Role.STUDENT,
  TEACHER: Role.TEACHER,
  CENTER_MANAGER: Role.CENTER_MANAGER,
  ADMIN: Role.ADMIN,
};

export async function GET() {
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
  if (!user) return NextResponse.json({ role: "STUDENT", onboardingDone: false });

  // Auto-create the DB user on first visit — include role from Supabase metadata
  const metaRole = user.user_metadata?.role as string | undefined;
  const dbRole: Role = (metaRole && ROLE_MAP[metaRole]) ? ROLE_MAP[metaRole] : Role.STUDENT;

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    create: {
      supabaseId: user.id,
      email: user.email!,
      fullName: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur",
      role: dbRole,
      onboardingDone: false,
    },
    update: {},
    select: {
      role: true, fullName: true, email: true, onboardingDone: true,
      germanLevel: true, city: true, xpTotal: true, streakDays: true,
      studentType: true, isValidated: true, testAttempts: true,
      groupMemberships: {
        where: { isActive: true },
        select: { groupId: true },
        take: 1,
      },
    },
  });

  // Backfill user_metadata.role from DB if it's missing (old accounts)
  if (!metaRole && dbUser?.role && dbUser.role !== "STUDENT") {
    await supabase.auth.updateUser({
      data: { role: dbUser.role, onboarding_done: dbUser.onboardingDone ?? false },
    });
  }

  return NextResponse.json({
    role: dbUser?.role ?? "STUDENT",
    fullName: dbUser?.fullName,
    email: dbUser?.email,
    onboardingDone: dbUser?.onboardingDone ?? false,
    germanLevel: dbUser?.germanLevel ?? null,
    city: dbUser?.city ?? null,
    xpTotal: dbUser?.xpTotal ?? 0,
    streakDays: dbUser?.streakDays ?? 0,
    studentType: dbUser?.studentType ?? "solo",
    isValidated: dbUser?.isValidated ?? false,
    testAttempts: dbUser?.testAttempts ?? 0,
    groupId: dbUser?.groupMemberships?.[0]?.groupId ?? null,
  });
}
