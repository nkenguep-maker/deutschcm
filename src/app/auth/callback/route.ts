import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { sanitizeInternalNext } from "@/lib/authRedirect";
import { canReconcileClosedBetaIdentity } from "@/lib/beta/access";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

function loginPathFor(next: string): string {
  const locale = next.match(/^\/(fr|en)(?:\/|$)/)?.[1];
  return locale ? `/${locale}/login` : "/login";
}

function betaPathFor(next: string): string {
  const locale = next.match(/^\/(fr|en)(?:\/|$)/)?.[1];
  return locale ? `/${locale}/beta` : "/beta";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next = sanitizeInternalNext(rawNext, "/dashboard");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth_callback_failed`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let admitted = false;
      try {
        admitted = await canReconcileClosedBetaIdentity(user);
      } catch (admissionError) {
        console.error("[auth/callback] beta admission lookup failed", admissionError);
      }

      if (!admitted) {
        await supabase.auth.signOut().catch(() => undefined);
        return NextResponse.redirect(`${origin}${betaPathFor(next)}`);
      }

      let activeSpace: "STUDENT" | "TEACHER" | "CENTER" | "ADMIN";
      let onboardingDone = false;
      try {
        const res = await reconcileAuthenticatedUser(user);
        activeSpace = res.activeSpace;
        onboardingDone = res.user.onboardingDone;
        if (res.path !== "matched_supabase_id") {
          console.info(`[auth/callback] reconcile path=${res.path} for supabaseId=${user.id}`);
        }
        await supabase.auth.refreshSession();
      } catch (e) {
        console.error("[auth/callback] reconcileAuthenticatedUser FAIL", e);
        await supabase.auth.signOut().catch(() => undefined);
        return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth_callback_failed`);
      }

      let redirectUrl: string;
      const nextIsMeaningful = next !== "/dashboard";
      if (nextIsMeaningful) {
        redirectUrl = next;
      } else {
        const runtime = await resolvePersonaRuntime({
          supabaseId: user.id,
          requestedPersona: user.user_metadata?.requested_persona,
        });
        redirectUrl = runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute;
      }

      const redirectResponse = NextResponse.redirect(`${origin}${redirectUrl}`);
      redirectResponse.cookies.set("user_role", activeSpace, { path: "/", maxAge: 2592000 });
      redirectResponse.cookies.set("onboarding_done", onboardingDone.toString(), { path: "/", maxAge: 2592000 });
      return redirectResponse;
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth_callback_failed`);
}
