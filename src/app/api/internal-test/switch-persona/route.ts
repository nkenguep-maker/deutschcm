import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  INTERNAL_TEST_COOKIE_MAX_AGE,
  INTERNAL_TEST_COOKIE_NAME,
  getInternalPersonaContract,
  internalPersonaDestination,
  isInternalPersonaId,
  isInternalTesterEmail,
  type InternalPersonaId,
} from "@/lib/internalTest";
import { isInternalTestEnvironment } from "@/lib/internalTestEnvironment";
import { ensureInternalTestWorkspace } from "@/lib/internalTestProvisioning";
import { verifyInternalPersonaFixture } from "@/lib/internalPersonaVerification";
import { getUserRoles } from "@/lib/roles";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import {
  CHILD_SESSION_COOKIE_NAME,
  CHILD_SESSION_TTL_SECONDS,
  encodeChildSession,
} from "@/lib/security/childSession";

export const dynamic = "force-dynamic";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function cookieOptions(maxAge: number, httpOnly = true) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

async function setEffectivePersonaMetadata(params: {
  supabase: ServerSupabaseClient;
  userId: string;
  currentMetadata: Record<string, unknown>;
  persona: InternalPersonaId | null;
}): Promise<void> {
  const {
    roles: _roles,
    onboarded_map: _onboardedMap,
    active_space: _activeSpace,
    internal_test_persona: _internalPersona,
    internal_test_app_role: _internalAppRole,
    internal_test_universe: _internalUniverse,
    ...preserved
  } = params.currentMetadata;

  let nextMetadata: Record<string, unknown>;
  if (params.persona) {
    const contract = getInternalPersonaContract(params.persona);
    nextMetadata = {
      ...preserved,
      roles: [contract.spaceRole],
      onboarded_map: { [contract.spaceRole]: true },
      active_space: contract.spaceRole,
      internal_test_persona: params.persona,
      internal_test_app_role: contract.appRole,
      internal_test_universe: contract.universe,
    };
  } else {
    const roles = await getUserRoles(params.userId);
    const roleList = roles.map((role) => role.role);
    const restoredRoles = roleList.length > 0 ? roleList : ["STUDENT"];
    const onboardedMap = Object.fromEntries(
      roles.map((role) => [role.role, role.onboarded]),
    );
    nextMetadata = {
      ...preserved,
      roles: restoredRoles,
      onboarded_map: Object.keys(onboardedMap).length > 0
        ? onboardedMap
        : { STUDENT: true },
      active_space: restoredRoles.includes("STUDENT") ? "STUDENT" : restoredRoles[0],
    };
  }

  const { data, error } = await params.supabase.auth.updateUser({
    data: nextMetadata,
  });
  if (error || !data.user) {
    const code = error && "code" in error ? String(error.code) : "unknown";
    throw new Error(`internal persona metadata update failed (${code})`);
  }
}

async function refreshBrowserSession(supabase: ServerSupabaseClient): Promise<boolean> {
  const { error } = await supabase.auth.refreshSession();
  return !error;
}

export async function POST(req: NextRequest) {
  // This endpoint can mutate persona fixtures and temporarily overlay route
  // authorization. It is deliberately unavailable on Production or on any
  // Supabase project other than the canonical P-1 baseline.
  if (!isInternalTestEnvironment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "BAD_FORM" }, { status: 400 });

  const locale = form.get("locale") === "en" ? "en" : "fr";
  const action = form.get("action");
  const rawPersona = form.get("persona");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isInternalTesterEmail(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const currentMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  if (action === "reset") {
    try {
      await setEffectivePersonaMetadata({
        supabase,
        userId: dbUser.id,
        currentMetadata,
        persona: null,
      });
      if (!(await refreshBrowserSession(supabase))) {
        return NextResponse.json({ error: "SESSION_REFRESH_FAILED" }, { status: 500 });
      }
    } catch (error) {
      console.error("[internal-test] persona reset failed", error);
      return NextResponse.json({ error: "PERSONA_RESET_FAILED" }, { status: 500 });
    }

    const response = NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url), 303);
    response.cookies.set(INTERNAL_TEST_COOKIE_NAME, "", cookieOptions(0));
    response.cookies.set(CHILD_SESSION_COOKIE_NAME, "", cookieOptions(0));
    response.cookies.set("active_space", "STUDENT", cookieOptions(30 * 24 * 60 * 60, false));
    return response;
  }

  if (!isInternalPersonaId(rawPersona)) {
    return NextResponse.json({ error: "PERSONA_INVALID" }, { status: 400 });
  }

  let fixture: Awaited<ReturnType<typeof ensureInternalTestWorkspace>>;
  let childSessionValue: string | null = null;
  try {
    fixture = await ensureInternalTestWorkspace(dbUser.id);
    await verifyInternalPersonaFixture({
      persona: rawPersona,
      userId: dbUser.id,
      fixture,
    });

    if (rawPersona === "child_monde" || rawPersona === "child_racines") {
      const child = rawPersona === "child_monde" ? fixture.childMonde : fixture.childRacines;
      childSessionValue = encodeChildSession(child.id, child.pinUpdatedAt);
      if (!childSessionValue) {
        return NextResponse.json({ error: "CHILD_SESSION_UNAVAILABLE" }, { status: 500 });
      }
    }

    await setEffectivePersonaMetadata({
      supabase,
      userId: dbUser.id,
      currentMetadata,
      persona: rawPersona,
    });
    if (!(await refreshBrowserSession(supabase))) {
      return NextResponse.json({ error: "SESSION_REFRESH_FAILED" }, { status: 500 });
    }
  } catch (error) {
    console.error("[internal-test] persona switch failed", error);
    return NextResponse.json({ error: "PERSONA_SWITCH_FAILED" }, { status: 500 });
  }

  const contract = getInternalPersonaContract(rawPersona);
  const destination = internalPersonaDestination(rawPersona, locale);
  const response = NextResponse.redirect(new URL(destination, req.url), 303);
  response.cookies.set(INTERNAL_TEST_COOKIE_NAME, rawPersona, cookieOptions(INTERNAL_TEST_COOKIE_MAX_AGE));
  response.cookies.set("active_space", contract.spaceRole, cookieOptions(30 * 24 * 60 * 60, false));
  response.cookies.set(CHILD_SESSION_COOKIE_NAME, "", cookieOptions(0));

  if (childSessionValue) {
    response.cookies.set(CHILD_SESSION_COOKIE_NAME, childSessionValue, cookieOptions(CHILD_SESSION_TTL_SECONDS));
  }

  return response;
}
