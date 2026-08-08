import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { sanitizeInternalNext } from "@/lib/authRedirect";
import { isInternalTestEnvironment } from "@/lib/internalTestEnvironment";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import { isAdultPersonaId, resolvePersonaRuntime, type AdultPersonaId } from "@/lib/personas/runtime";
import { grantRole, syncUserMetadata } from "@/lib/roles";

const WORLD_PASSAGE_PLANS = new Set([
  "passage-a1",
  "passage-a2",
  "passage-b1",
  "passage-b2",
  "passage-c1",
]);
const ROOTS_PLANS = new Set(["racines-solo", "racines-famille"]);

function bad(code: string, status = 400) {
  return NextResponse.json({ error: code }, { status });
}

function compatibleOfferIntent(params: {
  persona: AdultPersonaId;
  rawPlan: unknown;
  rawAddon: unknown;
  rawTeacherAddon: unknown;
}) {
  const rawPlan = typeof params.rawPlan === "string" ? params.rawPlan : null;

  if (params.persona === "student_monde") {
    return {
      selectedPlan: rawPlan && WORLD_PASSAGE_PLANS.has(rawPlan) ? rawPlan : null,
      selectedAddon: params.rawAddon === "roots-solo" ? "roots-solo" : null,
      teacherAddonRequested: params.rawTeacherAddon === true,
    } as const;
  }

  if (params.persona === "student_racines") {
    return {
      selectedPlan: rawPlan === "racines-solo" && ROOTS_PLANS.has(rawPlan) ? rawPlan : null,
      selectedAddon: null,
      teacherAddonRequested: false,
    } as const;
  }

  if (params.persona === "family") {
    return {
      selectedPlan: rawPlan === "racines-famille" && ROOTS_PLANS.has(rawPlan) ? rawPlan : null,
      selectedAddon: null,
      teacherAddonRequested: false,
    } as const;
  }

  // Professional personas never inherit learner/family commercial intent.
  return {
    selectedPlan: null,
    selectedAddon: null,
    teacherAddonRequested: false,
  } as const;
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

  const offer = compatibleOfferIntent({
    persona,
    rawPlan: body.selectedPlan,
    rawAddon: body.selectedAddon,
    rawTeacherAddon: body.teacherAddonRequested,
  });
  const postOnboardingNext = typeof body.postOnboardingNext === "string"
    ? sanitizeInternalNext(body.postOnboardingNext, "/dashboard")
    : null;

  const { user: dbUser } = await reconcileAuthenticatedUser(user);
  const p1TechnicalQa = isInternalTestEnvironment();

  // These values describe UX/commercial intent only. Authorization and access
  // are still derived from DB roles + AccessGrants, never from user_metadata.
  const nextUserMetadata: Record<string, unknown> = {
    ...(user.user_metadata ?? {}),
    requested_persona: persona,
    selected_plan: offer.selectedPlan,
    // Compatibility alias for the existing Monde/Racines onboarding labels.
    // It carries presentation intent only and is never trusted for access.
    plan: offer.selectedPlan,
    selected_addons: offer.selectedAddon ? [offer.selectedAddon] : [],
    teacher_addon_requested: offer.teacherAddonRequested,
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
      selectedPlan: offer.selectedPlan,
      selectedAddons: offer.selectedAddon ? [offer.selectedAddon] : [],
      teacherAddonRequested: offer.teacherAddonRequested,
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
    return NextResponse.json({
      persona,
      selectedPlan: offer.selectedPlan,
      redirectTo: "/onboarding/family",
    });
  }

  if (persona === "teacher" || persona === "center_admin") {
    const role = persona === "teacher" ? "TEACHER" : "CENTER";
    const roleRow = await prisma.userRole.findUnique({
      where: { userId_role: { userId: dbUser.id, role } },
      select: { status: true },
    });

    if (p1TechnicalQa) {
      // P-1 only: separate QA accounts must be able to exercise the complete
      // professional onboarding/dashboard. Production never enters this path.
      await grantRole({ userId: dbUser.id, role });
      await supabase.auth.updateUser({ data: nextUserMetadata });
      await syncUserMetadata({ supabaseId: user.id, activeSpace: role });
      return NextResponse.json({
        persona,
        qaAutoApproved: true,
        redirectTo: persona === "teacher" ? "/onboarding/teacher" : "/onboarding/center",
      });
    }

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

  if (persona === "coach") {
    if (p1TechnicalQa) {
      await prisma.userAppRole.upsert({
        where: { userId_role: { userId: dbUser.id, role: "RACINES_COACH" } },
        create: { userId: dbUser.id, role: "RACINES_COACH" },
        update: {},
      });
      await supabase.auth.updateUser({ data: nextUserMetadata });
      await syncUserMetadata({ supabaseId: user.id, activeSpace: "STUDENT" });
      return NextResponse.json({ persona, qaAutoApproved: true, redirectTo: "/onboarding/coach" });
    }

    // RACINES_COACH has no pending AppRole state in the current schema.
    // Persist only the non-authorizing request; trusted approval creates it.
    await supabase.auth.updateUser({ data: nextUserMetadata });
    return NextResponse.json({
      persona,
      redirectTo: `/onboarding/pending?persona=${encodeURIComponent(persona)}`,
    });
  }

  return bad("PERSONA_INVALID");
}
