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
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      role: true,
      onboardingDone: true,
      fullName: true,
      teacher: { select: { id: true } },
    },
  });

  const dbRole = profile?.role as string | undefined;
  const metaRole = user.user_metadata?.role as string | undefined;
  const hasTeacherRecord = !!profile?.teacher;

  // Determine effective role using reliable signals:
  // - ADMIN: trust DB (never corrupted by old bugs)
  // - CENTER_MANAGER: trust DB if DB says CENTER_MANAGER; otherwise trust metadata
  //   (old fix-role bug only targeted TEACHER, never CENTER_MANAGER)
  // - TEACHER: require DB.role=TEACHER + Teacher record exists (ground truth)
  //   Exception: new teacher who just registered has no record yet but onboardingDone=false
  // - STUDENT: everything else (safe default)
  let effectiveRole: string;

  if (dbRole === "ADMIN") {
    effectiveRole = "ADMIN";
  } else if (dbRole === "CENTER_MANAGER") {
    effectiveRole = "CENTER_MANAGER";
  } else if (dbRole === "TEACHER" && hasTeacherRecord) {
    // Real teacher with onboarding done
    effectiveRole = "TEACHER";
  } else if (dbRole === "TEACHER" && !hasTeacherRecord && !profile?.onboardingDone) {
    // New teacher who registered but hasn't completed onboarding yet (no Teacher record created yet)
    effectiveRole = "TEACHER";
  } else if ((!dbRole || dbRole === "STUDENT") && metaRole === "CENTER_MANAGER") {
    // DB was incorrectly set to STUDENT but user registered as CENTER_MANAGER
    effectiveRole = "CENTER_MANAGER";
  } else {
    // DB=TEACHER + no Teacher record + onboardingDone=true → corrupted student account
    // DB=STUDENT → student
    effectiveRole = "STUDENT";
  }

  // Auto-heal DB role if wrong
  if (profile && dbRole !== effectiveRole && ROLE_MAP[effectiveRole]) {
    prisma.user.update({
      where: { supabaseId: user.id },
      data: { role: ROLE_MAP[effectiveRole] },
    }).catch(() => {});
  }

  // onboardingDone: for CENTER_MANAGER/TEACHER with existing DB row, force true
  // to avoid re-onboarding old accounts where the flag was never flipped
  let onboardingDone = profile?.onboardingDone ?? false;
  if (!onboardingDone && profile && (effectiveRole === "CENTER_MANAGER")) {
    onboardingDone = true;
    prisma.user.update({
      where: { supabaseId: user.id },
      data: { onboardingDone: true },
    }).catch(() => {});
  }

  return NextResponse.json({
    role: effectiveRole,
    onboardingDone,
    fullName: profile?.fullName || user.user_metadata?.full_name || "",
  });
}
