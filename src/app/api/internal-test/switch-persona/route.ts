import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  INTERNAL_TEST_COOKIE_MAX_AGE,
  INTERNAL_TEST_COOKIE_NAME,
  internalPersonaDestination,
  internalPersonaRequiredSpaceRole,
  isInternalPersonaId,
  isInternalTesterEmail,
} from "@/lib/internalTest";
import { ensureInternalTestWorkspace } from "@/lib/internalTestProvisioning";
import { syncUserMetadata } from "@/lib/roles";
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
    await syncUserMetadata({ supabaseId: dbUser.supabaseId, activeSpace: "STUDENT" });
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) console.warn("[internal-test] session refresh after reset failed", refreshError.message);

    const response = NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url), 303);
    response.cookies.set(INTERNAL_TEST_COOKIE_NAME, "", cookieOptions(0));
    response.cookies.set(CHILD_SESSION_COOKIE_NAME, "", cookieOptions(0));
    response.cookies.set("active_space", "STUDENT", cookieOptions(30 * 24 * 60 * 60, false));
    return response;
  }

  if (!isInternalPersonaId(rawPersona)) {
    return NextResponse.json({ error: "PERSONA_INVALID" }, { status: 400 });
  }

  const fixture = await ensureInternalTestWorkspace(dbUser.id);
  const activeSpace = internalPersonaRequiredSpaceRole(rawPersona);
  await syncUserMetadata({ supabaseId: dbUser.supabaseId, activeSpace });

  // Supabase stores roles/active_space in the access-token JWT. Updating
  // user_metadata alone does not refresh the current browser token, so the
  // next request could still be evaluated as STUDENT by the proxy.
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) console.warn("[internal-test] session refresh after persona switch failed", refreshError.message);

  const destination = internalPersonaDestination(rawPersona, locale);
  const response = NextResponse.redirect(new URL(destination, req.url), 303);
  response.cookies.set(INTERNAL_TEST_COOKIE_NAME, rawPersona, cookieOptions(INTERNAL_TEST_COOKIE_MAX_AGE));
  response.cookies.set("active_space", activeSpace, cookieOptions(30 * 24 * 60 * 60, false));
  response.cookies.set(CHILD_SESSION_COOKIE_NAME, "", cookieOptions(0));

  if (rawPersona === "child_monde" || rawPersona === "child_racines") {
    const child = rawPersona === "child_monde" ? fixture.childMonde : fixture.childRacines;
    const value = encodeChildSession(child.id, child.pinUpdatedAt);
    if (!value) return NextResponse.json({ error: "CHILD_SESSION_UNAVAILABLE" }, { status: 500 });
    response.cookies.set(CHILD_SESSION_COOKIE_NAME, value, cookieOptions(CHILD_SESSION_TTL_SECONDS));
  }

  return response;
}
