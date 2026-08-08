import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { sanitizeInternalNext } from "@/lib/authRedirect";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import { isAdultPersonaId, resolvePersonaRuntime } from "@/lib/personas/runtime";
import { grantRole, syncUserMetadata } from "@/lib/roles";

const PASSAGE_PLANS = new Set([
  "passage-a1",
  "passage-a2",
  "passage-b1",
  "passage-b2",
  "passage-c1",
]);

function bad(code: string, status = 400) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return bad("ORIGIN_MISMATCH", 403);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("UNAUTHORIZED", 401);

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return bad("INVALID_JSON");
  const body = raw as Record<string, unknown>;
  const persona = body.persona;
  if (!isAdultPersonaId(persona)) return bad("PERSONA_INVALID");
  if (persona === "super_admin") return bad("PERSONA_NOT_SELF_SERVICE", 403);

  const selectedPlan = typeof body.selectedPlan === "string" && PASSAGE_PLANS.has(body.selectedPlan)
    ? body.selectedPlan
    : null;
  const selectedAddon = body.selectedAddon === "roots-solo" ? "roots-solo" : null;
  const teacherAddonRequested = body.teacherAddonRequested === true;
  const postOnboardingNext = typeof body.postOnboardingNext === "string"
    ? sanitizeInternalNext(body.postOnboardingNext, "/dashboard")
    : null;

  const { user: dbUser } = await reconcileAuthenticatedUser(user);

  // These values describe UX/commercial intent only. Authorization and access
  // are still derived from DB roles + AccessGrants, never from user_metadata.
  const nextUserMetadata: Record<string, unknown> = {
    ...(user.user_metadata ?? {}),
    requested_persona: persona,
    selected_plan: selectedPlan,
    selected_addons: selectedAddon ? [selectedAddon] : [],
    teacher_addon_requested: teacherAddonRequested,
    post_onboarding_next: postOnboardingNext,
  };

  if (persona === "student_monde" || persona === "student_racines") {
    await grantRole({ userId: dbUser.id, role: "STUDENT" });
    await prisma.userAppRole.upsert({
      where: { userId_role: { userId: dbUser.id, role: "LEARNER" } },
      create: { userId: dbUser.id, role: "LEARNER" },
      update: {},
    });
    nextUserMetadata.universe = persona === "student_monde" ? "monde" : "racines";
    await supabase.auth.updateUser({ data: nextUserMetadata });
    await syncUserMetadata({ supabaseId: user.id, activeSpace: "STUDENT" });
    return NextResponse.json({
      persona,
      selectedPlan,
      selectedAddons: selectedAddon ? [selectedAddon] : [],
      teacherAddonRequested,
      redirectTo: persona === "student_monde" ? "/onboarding/monde" : "/onboarding/racines",
    });
  }

  if (persona === "family") {
    await grantRole({ userId: dbUser.id, role: "STUDENT" });
    await prisma.userAppRole.upsert({
      where: { userId_role: { userId: dbUser.id, role: "PARENT" } },
      create: { userId: dbUser.id, role: "PARENT" },
      update: {},
    });
    await supabase.auth.updateUser({ data: nextUserMetadata });
    await syncUserMetadata({ supabaseId: user.id, activeSpace: "STUDENT" });
    return NextResponse.json({ persona, redirectTo: "/onboarding/family" });
  }

  if (persona === "teacher" || persona === "center_admin") {
    const role = persona === "teacher" ? "TEACHER" : "CENTER";
    const roleRow = await prisma.userRole.findUnique({
      where: { userId_role: { userId: dbUser.id, role } },
      select: { status: true },
    });
    if (!roleRow) {
      await prisma.userRole.create({
        data: {
          userId: dbUser.id,
          role,
          status: "PENDING",
          onboarded: false,
        },
      });
    }
    await supabase.auth.updateUser({ data: nextUserMetadata });
    const runtime = await resolvePersonaRuntime({
      supabaseId: user.id,
      requestedPersona: persona,
    });
    return NextResponse.json({ persona, redirectTo: runtime.onboardingRoute });
  }

  // RACINES_COACH has no pending AppRole state in the current schema. Persist
  // only the non-authorizing request; trusted approval creates RACINES_COACH.
  await supabase.auth.updateUser({ data: nextUserMetadata });
  return NextResponse.json({
    persona,
    redirectTo: `/onboarding/pending?persona=${encodeURIComponent(persona)}`,
  });
}
