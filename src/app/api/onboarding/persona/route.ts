import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import { isAdultPersonaId, resolvePersonaRuntime } from "@/lib/personas/runtime";
import { grantRole, syncUserMetadata } from "@/lib/roles";

function bad(code: string, status = 400) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return bad("ORIGIN_MISMATCH", 403);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("UNAUTHORIZED", 401);

  const raw = await req.json().catch(() => null);
  const persona = raw && typeof raw === "object"
    ? (raw as { persona?: unknown }).persona
    : null;
  if (!isAdultPersonaId(persona)) return bad("PERSONA_INVALID");
  if (persona === "super_admin") return bad("PERSONA_NOT_SELF_SERVICE", 403);

  const { user: dbUser } = await reconcileAuthenticatedUser(user);

  // requested_persona is a UX preference only. Authorization never trusts
  // user_metadata; professional permissions remain DB/admin-controlled.
  const nextUserMetadata: Record<string, unknown> = {
    ...(user.user_metadata ?? {}),
    requested_persona: persona,
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
    const active = await prisma.userRole.findUnique({
      where: { userId_role: { userId: dbUser.id, role } },
      select: { status: true },
    });
    if (!active) {
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

  // RACINES_COACH is an AppRole with no pending state in the current schema.
  // Persist only the non-authorizing request. Admin approval later creates the
  // trusted RACINES_COACH app role.
  await supabase.auth.updateUser({ data: nextUserMetadata });
  return NextResponse.json({
    persona,
    redirectTo: `/onboarding/pending?persona=${encodeURIComponent(persona)}`,
  });
}
