import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import { syncUserMetadata, type SpaceRole } from "@/lib/roles";

const ROLE_MAP: Record<string, Role> = {
  STUDENT: Role.STUDENT,
  TEACHER: Role.TEACHER,
  CENTER: Role.CENTER,
  ADMIN: Role.ADMIN,
};

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ role: "STUDENT", onboardingDone: false });

  const metaRole = user.user_metadata?.role as string | undefined;
  const dbRole: Role = (metaRole && ROLE_MAP[metaRole]) ? ROLE_MAP[metaRole] : Role.STUDENT;

  try {
    await reconcileDbUser({ authUser: user, defaultRole: dbRole });
  } catch (e) {
    if (e instanceof ReconcileError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true, role: true, fullName: true, email: true, onboardingDone: true,
      germanLevel: true, city: true, xpTotal: true, streakDays: true,
      studentType: true, isValidated: true, testAttempts: true, plan: true,
      userRoles: {
        where: { status: "ACTIVE" },
        select: { role: true, onboarded: true },
        orderBy: { createdAt: "asc" },
      },
      groupMemberships: {
        where: { isActive: true },
        select: { groupId: true },
        take: 1,
      },
      classroomEnrollments: {
        where: { isActive: true },
        select: { id: true },
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

  // Si le backfill vient d'attacher un premier UserRole via reconcile,
  // synchroniser user_metadata pour que le middleware voie l'état DB.
  if (dbUser && dbUser.userRoles.length > 0 && !user.user_metadata?.roles) {
    await syncUserMetadata({ supabaseId: user.id, activeSpace: dbUser.role as SpaceRole });
  }

  const roles = (dbUser?.userRoles ?? []).map(r => r.role);
  const activeSpace = (user.user_metadata?.active_space as SpaceRole | undefined)
    ?? (roles[0] ?? "STUDENT");

  const activeLanguage = (user.user_metadata?.activeLanguage as string | undefined) ?? "deutsch";
  const supportedLanguages = Array.isArray(user.user_metadata?.supportedLanguages)
    ? (user.user_metadata.supportedLanguages as string[])
    : [activeLanguage];
  const cap = (user.user_metadata?.cap as string | undefined) ?? null;
  const personalGoal = (user.user_metadata?.personalGoal as string | undefined) ?? null;
  const availability = (user.user_metadata?.availability as string | undefined) ?? null;

  return NextResponse.json({
    role: dbUser?.role ?? "STUDENT",
    roles,
    activeSpace,
    activeLanguage,
    supportedLanguages,
    cap,
    personalGoal,
    availability,
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
    plan: dbUser?.plan ?? "FREE",
    hasClassroom: (dbUser?.classroomEnrollments?.length ?? 0) > 0,
  });
}
