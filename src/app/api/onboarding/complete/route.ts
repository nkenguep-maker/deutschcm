import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { reconcileDbUser } from "@/lib/reconcileDbUser";
import { hasActiveRole, markRoleOnboarded, syncUserMetadata, type SpaceRole } from "@/lib/roles";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import { isAdultPersonaId, resolvePersonaRuntime, type AdultPersonaId } from "@/lib/personas/runtime";

function err(code: string, message: string, status: number, detail?: unknown) {
  return NextResponse.json({ error: message, code, ...(detail ? { detail } : {}) }, { status });
}

function profileString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return err("ORIGIN_MISMATCH", "Forbidden", 403);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return err("VALIDATION_ERROR", "Invalid JSON", 400);

    const requestedRole = typeof body.role === "string" ? body.role : "STUDENT";
    if (!["STUDENT", "TEACHER", "CENTER", "ADMIN"].includes(requestedRole)) {
      return err("VALIDATION_ERROR", "Invalid role", 400);
    }
    const persona: AdultPersonaId | null = isAdultPersonaId(body.persona) ? body.persona : null;
    const profileData = body.profileData && typeof body.profileData === "object"
      ? body.profileData as Record<string, unknown>
      : {};

    // Fresh identities always reconcile as STUDENT. Professional roles are
    // never granted from browser input; they must already be ACTIVE in DB.
    const { user: dbUser, path: reconcilePath } = await reconcileDbUser({
      authUser: user,
      defaultRole: "STUDENT",
      patch: {
        fullName: profileString(profileData.fullName),
      },
    });
    if (reconcilePath !== "matched_supabase_id") {
      console.info(`[onboarding/complete] reconcile path=${reconcilePath} for supabaseId=${user.id}`);
    }

    let effectiveRole: SpaceRole = "STUDENT";
    if (requestedRole === "TEACHER" || requestedRole === "CENTER") {
      const allowed = await hasActiveRole(dbUser.id, requestedRole);
      if (!allowed) {
        return err("ROLE_NOT_GRANTED", "Professional role is not active", 403);
      }
      effectiveRole = requestedRole;
    } else if (requestedRole === "ADMIN") {
      return err("ROLE_NOT_SELF_SERVICE", "Admin onboarding is not self-service", 403);
    }

    if (persona === "coach") {
      const coachRole = await prisma.userAppRole.findUnique({
        where: { userId_role: { userId: dbUser.id, role: "RACINES_COACH" } },
        select: { id: true },
      });
      if (!coachRole) return err("ROLE_NOT_GRANTED", "Coach role is not active", 403);
    }

    if (persona === "family") {
      await prisma.userAppRole.upsert({
        where: { userId_role: { userId: dbUser.id, role: "PARENT" } },
        create: { userId: dbUser.id, role: "PARENT" },
        update: {},
      });
    }
    if (persona === "student_monde" || persona === "student_racines") {
      await prisma.userAppRole.upsert({
        where: { userId_role: { userId: dbUser.id, role: "LEARNER" } },
        create: { userId: dbUser.id, role: "LEARNER" },
        update: {},
      });
    }

    const firstName = profileString(profileData.firstName);
    const lastName = profileString(profileData.lastName);
    const fullName = profileString(profileData.fullName)
      ?? (firstName && lastName ? `${firstName} ${lastName}` : undefined);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        onboardingDone: true,
        fullName: fullName ?? undefined,
        phone: profileString(profileData.phone),
        city: profileString(profileData.city),
        country: profileString(profileData.country),
        bio: profileString(profileData.bio),
        dateOfBirth: profileString(profileData.dateOfBirth)
          ? new Date(String(profileData.dateOfBirth))
          : undefined,
        germanLevel: profileString(profileData.germanLevel),
        learningGoal: profileString(profileData.learningGoal),
        availability: profileString(profileData.availability),
        qualifications: profileString(profileData.qualifications),
        teachingLevels: profileString(profileData.teachingLevels),
        centerName: profileString(profileData.centerName),
        centerAddress: profileString(profileData.centerAddress),
        centerCity: profileString(profileData.centerCity),
        centerWebsite: profileString(profileData.centerWebsite),
      },
    });

    await markRoleOnboarded(dbUser.id, effectiveRole);

    // Profile metadata is convenient for UI and survives confirmation flows,
    // but it never grants authorization. app_metadata remains admin-only.
    const metadataPatch: Record<string, unknown> = {
      ...(user.user_metadata ?? {}),
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(persona ? { requested_persona: persona } : {}),
      ...(typeof body.activeLanguage === "string" ? { activeLanguage: body.activeLanguage } : {}),
      ...(typeof body.cap === "string" ? { cap: body.cap } : {}),
      ...(typeof body.personalGoal === "string" ? { personalGoal: body.personalGoal } : {}),
      ...(typeof body.availability === "string" ? { availability: body.availability } : {}),
    };
    await supabase.auth.updateUser({ data: metadataPatch });
    await syncUserMetadata({ supabaseId: user.id, activeSpace: effectiveRole });

    const runtime = await resolvePersonaRuntime({
      supabaseId: user.id,
      requestedPersona: persona ?? user.user_metadata?.requested_persona,
    });
    const redirectTo = runtime.homeRoute;

    const response = NextResponse.json({
      success: true,
      userId: dbUser.id,
      persona: runtime.persona,
      redirectTo,
    });
    response.cookies.set("onboarding_done", "true", { path: "/", maxAge: 2592000, sameSite: "lax" });
    response.cookies.set("active_space", effectiveRole, { path: "/", maxAge: 2592000, sameSite: "lax" });
    return response;
  } catch (e) {
    const errObj = e as { code?: string; message?: string; meta?: unknown };
    console.error("[onboarding/complete] FAIL", {
      code: errObj.code,
      message: errObj.message,
      meta: errObj.meta,
    });
    if (errObj.code === "P2002") {
      return err("DB_CONFLICT", "unique constraint violation", 500, { meta: errObj.meta });
    }
    return err("INTERNAL", errObj.message ?? "internal error", 500);
  }
}
