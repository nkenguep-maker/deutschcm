import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { reconcileAuthenticatedUser } from "@/lib/auth/reconcileAuthenticatedUser";
import { sanitizeInternalNext } from "@/lib/authRedirect";

function loginPathFor(next: string): string {
  const locale = next.match(/^\/(fr|en)(?:\/|$)/)?.[1];
  return locale ? `/${locale}/login` : "/login";
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
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
      let dbUser: Awaited<ReturnType<typeof reconcileAuthenticatedUser>>["user"] | null = null;
      let activeSpace: "STUDENT" | "TEACHER" | "CENTER" | "ADMIN" = "STUDENT";
      try {
        const res = await reconcileAuthenticatedUser(user);
        dbUser = res.user;
        activeSpace = res.activeSpace;
        if (res.path !== "matched_supabase_id") {
          console.info(`[auth/callback] reconcile path=${res.path} for supabaseId=${user.id}`);
        }
        // The current access token predates the admin app_metadata write.
        // Refresh once so the next protected request carries the signed mirror.
        await supabase.auth.refreshSession();
      } catch (e) {
        console.error("[auth/callback] reconcileAuthenticatedUser FAIL", e);
      }

      const onboardingDone = dbUser?.onboardingDone ?? false;

      let redirectUrl: string;
      const nextIsMeaningful = next !== "/dashboard";
      if (nextIsMeaningful) {
        redirectUrl = next;
      } else if (onboardingDone) {
        redirectUrl = activeSpace === "ADMIN" ? "/admin"
          : activeSpace === "TEACHER" ? "/teacher"
          : activeSpace === "CENTER" ? "/center"
          : "/dashboard";
      } else {
        redirectUrl = activeSpace === "ADMIN" ? "/admin"
          : activeSpace === "TEACHER" ? "/onboarding/teacher"
          : activeSpace === "CENTER" ? "/onboarding/center"
          : "/onboarding";
      }

      const redirectResponse = NextResponse.redirect(`${origin}${redirectUrl}`);
      // Legacy display cookie only. Authorization no longer reads this value.
      redirectResponse.cookies.set("user_role", activeSpace, { path: "/", maxAge: 2592000 });
      redirectResponse.cookies.set("onboarding_done", onboardingDone.toString(), { path: "/", maxAge: 2592000 });
      return redirectResponse;
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth_callback_failed`);
}
