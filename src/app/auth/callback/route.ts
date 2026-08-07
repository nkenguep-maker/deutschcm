import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { syncUserMetadata, type SpaceRole } from "@/lib/roles";
import { reconcileDbUser } from "@/lib/reconcileDbUser";
import { sanitizeInternalNext } from "@/lib/authRedirect";

const ROLE_MAP: Record<string, Role> = {
  STUDENT: Role.STUDENT,
  TEACHER: Role.TEACHER,
  CENTER: Role.CENTER,
  ADMIN: Role.ADMIN,
};

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
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth_callback_failed`);
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const metaRole = user.user_metadata?.role as string | undefined;
      const dbRole: Role = (metaRole && ROLE_MAP[metaRole]) ? ROLE_MAP[metaRole] : Role.STUDENT;

      let dbUser: Awaited<ReturnType<typeof reconcileDbUser>>["user"] | null = null;
      try {
        const res = await reconcileDbUser({
          authUser: user,
          defaultRole: dbRole as SpaceRole,
        });
        dbUser = res.user;
        if (res.path !== "matched_supabase_id") {
          console.info(`[auth/callback] reconcile path=${res.path} for supabaseId=${user.id}`);
        }
      } catch (e) {
        console.error("[auth/callback] reconcileDbUser FAIL", e);
      }

      if (dbUser) {
        try {
          await syncUserMetadata({ supabaseId: user.id, activeSpace: dbRole as SpaceRole });
        } catch (e) {
          console.error("[auth/callback] syncUserMetadata FAIL", e);
        }
      }

      const onboardingDone = dbUser?.onboardingDone ?? false;
      const cookieRole = metaRole || "STUDENT";

      let redirectUrl: string;
      const nextIsMeaningful = next !== "/dashboard";
      if (nextIsMeaningful) {
        redirectUrl = next;
      } else if (onboardingDone) {
        redirectUrl = dbRole === Role.ADMIN ? "/admin"
          : dbRole === Role.TEACHER ? "/teacher"
          : dbRole === Role.CENTER ? "/center"
          : "/dashboard";
      } else {
        redirectUrl = dbRole === Role.ADMIN ? "/admin"
          : dbRole === Role.TEACHER ? "/onboarding/teacher"
          : dbRole === Role.CENTER ? "/onboarding/center"
          : "/onboarding";
      }

      const redirectResponse = NextResponse.redirect(`${origin}${redirectUrl}`);
      redirectResponse.cookies.set("user_role", cookieRole, { path: "/", maxAge: 2592000 });
      redirectResponse.cookies.set("onboarding_done", onboardingDone.toString(), { path: "/", maxAge: 2592000 });
      return redirectResponse;
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth_callback_failed`);
}
