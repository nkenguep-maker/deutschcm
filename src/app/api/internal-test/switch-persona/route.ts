import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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
import { ensureInternalTestWorkspace } from "@/lib/internalTestProvisioning";
import {
  CHILD_SESSION_COOKIE_NAME,
  CHILD_SESSION_TTL_SECONDS,
  encodeChildSession,
} from "@/lib/security/childSession";

export const dynamic = "force-dynamic";

function cookieOptions(maxAge: number, httpOnly = true) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

async function setEffectivePersonaMetadata(
  supabaseId: string,
  persona: InternalPersonaId | null,
): Promise<void> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: current, error: readError } = await admin.auth.admin.getUserById(supabaseId);
  if (readError || !current.user) throw new Error("internal persona metadata read failed");

  const existing = (current.user.user_metadata ?? {}) as Record<string, unknown>;
  const {
    roles: _roles,
    onboarded_map: _onboardedMap,
    active_space: _activeSpace,
    internal_test_persona: _internalPersona,
    ...preserved
  } = existing;

  const nextMetadata = persona
    ? (() => {
        const contract = getInternalPersonaContract(persona);
        return {
          ...preserved,
          roles: [contract.spaceRole],
          onboarded_map: { [contract.spaceRole]: true },
          active_space: contract.spaceRole,
          internal_test_persona: persona,
        };
      })()
    : {
        ...preserved,
        roles: ["STUDENT"],
        onboarded_map: { STUDENT: true },
        active_space: "STUDENT",
      };

  const { error: updateError } = await admin.auth.admin.updateUserById(supabaseId, {
    user_metadata: nextMetadata,
  });
  if (updateError) throw new Error("internal persona metadata update failed");
}

async function refreshBrowserSession(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { error } = await supabase.auth.refreshSession();
  return !error;
}

export async function POST(req: NextRequest) {
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
    select: { id: true, supabaseId: true },
  });
  if (!dbUser) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  if (action === "reset") {
    try {
      await setEffectivePersonaMetadata(dbUser.supabaseId, null);
      if (!(await refreshBrowserSession(supabase))) {
        return NextResponse.json({ error: "SESSION_REFRESH_FAILED" }, { status: 500 });
      }
    } catch {
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
  try {
    fixture = await ensureInternalTestWorkspace(dbUser.id);
    await setEffectivePersonaMetadata(dbUser.supabaseId, rawPersona);
    if (!(await refreshBrowserSession(supabase))) {
      return NextResponse.json({ error: "SESSION_REFRESH_FAILED" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "PERSONA_SWITCH_FAILED" }, { status: 500 });
  }

  const contract = getInternalPersonaContract(rawPersona);
  const destination = internalPersonaDestination(rawPersona, locale);
  const response = NextResponse.redirect(new URL(destination, req.url), 303);
  response.cookies.set(INTERNAL_TEST_COOKIE_NAME, rawPersona, cookieOptions(INTERNAL_TEST_COOKIE_MAX_AGE));
  response.cookies.set("active_space", contract.spaceRole, cookieOptions(30 * 24 * 60 * 60, false));
  response.cookies.set(CHILD_SESSION_COOKIE_NAME, "", cookieOptions(0));

  if (rawPersona === "child_monde" || rawPersona === "child_racines") {
    const child = rawPersona === "child_monde" ? fixture.childMonde : fixture.childRacines;
    const value = encodeChildSession(child.id, child.pinUpdatedAt);
    if (!value) return NextResponse.json({ error: "CHILD_SESSION_UNAVAILABLE" }, { status: 500 });
    response.cookies.set(CHILD_SESSION_COOKIE_NAME, value, cookieOptions(CHILD_SESSION_TTL_SECONDS));
  }

  return response;
}
