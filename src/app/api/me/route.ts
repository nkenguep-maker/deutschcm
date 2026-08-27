import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

function splitName(fullName: string | null | undefined): { firstName: string | null; lastName: string | null } {
  const normalized = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return { firstName: null, lastName: null };
  const [firstName, ...rest] = normalized.split(" ");
  return { firstName, lastName: rest.length ? rest.join(" ") : null };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const reconciled = await reconcileAuthenticatedUser(user);
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      role: true,
      fullName: true,
      email: true,
      phone: true,
      onboardingDone: true,
      germanLevel: true,
      city: true,
      country: true,
      xpTotal: true,
      streakDays: true,
      studentType: true,
      isValidated: true,
      testAttempts: true,
      plan: true,
      userRoles: {
        where: { status: "ACTIVE" },
        select: { role: true, onboarded: true },
        orderBy: { createdAt: "asc" },
      },
      appRoles: {
        select: { role: true },
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
      learningPaths: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: { id: true, universe: true, language: true, currentLevel: true },
      },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found", code: "USER_NOT_FOUND" }, { status: 404 });
  }

  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });
  const fallbackName = splitName(dbUser.fullName);
  const firstName = typeof user.user_metadata?.first_name === "string"
    ? user.user_metadata.first_name.trim() || fallbackName.firstName
    : fallbackName.firstName;
  const lastName = typeof user.user_metadata?.last_name === "string"
    ? user.user_metadata.last_name.trim() || fallbackName.lastName
    : fallbackName.lastName;

  const activeLanguage = (user.user_metadata?.activeLanguage as string | undefined) ?? "deutsch";
  const supportedLanguages = Array.isArray(user.user_metadata?.supportedLanguages)
    ? (user.user_metadata.supportedLanguages as string[])
    : [activeLanguage];
  const selectedAddons = Array.isArray(user.user_metadata?.selected_addons)
    ? user.user_metadata.selected_addons.filter((value: unknown): value is string => typeof value === "string")
    : [];

  return NextResponse.json({
    id: dbUser.id,
    persona: runtime.persona,
    homeRoute: runtime.homeRoute,
    onboardingRoute: runtime.onboardingRoute,
    universe: runtime.universe,
    role: dbUser.role,
    roles: dbUser.userRoles.map((r) => r.role),
    appRoles: dbUser.appRoles.map((r) => r.role),
    activeSpace: reconciled.activeSpace,
    firstName,
    lastName,
    fullName: dbUser.fullName,
    email: dbUser.email,
    phone: dbUser.phone,
    city: dbUser.city,
    country: dbUser.country,
    onboardingDone: dbUser.onboardingDone,
    activeLanguage,
    supportedLanguages,
    selectedPlan: typeof user.user_metadata?.selected_plan === "string"
      ? user.user_metadata.selected_plan
      : null,
    selectedAddons,
    teacherAddonRequested: user.user_metadata?.teacher_addon_requested === true,
    cap: (user.user_metadata?.cap as string | undefined) ?? null,
    personalGoal: (user.user_metadata?.personalGoal as string | undefined) ?? null,
    availability: (user.user_metadata?.availability as string | undefined) ?? null,
    germanLevel: dbUser.germanLevel,
    xpTotal: dbUser.xpTotal,
    streakDays: dbUser.streakDays,
    studentType: dbUser.studentType ?? "solo",
    isValidated: dbUser.isValidated,
    testAttempts: dbUser.testAttempts,
    groupId: dbUser.groupMemberships[0]?.groupId ?? null,
    plan: dbUser.plan,
    hasClassroom: dbUser.classroomEnrollments.length > 0,
    learningPaths: dbUser.learningPaths,
  });
}
