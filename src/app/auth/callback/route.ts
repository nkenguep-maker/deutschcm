import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { syncUserMetadata, type SpaceRole } from "@/lib/roles";
import { reconcileDbUser } from "@/lib/reconcileDbUser";

const ROLE_MAP: Record<string, Role> = {
  STUDENT: Role.STUDENT,
  TEACHER: Role.TEACHER,
  CENTER: Role.CENTER,
  ADMIN: Role.ADMIN,
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // Get the authenticated user (fresh from Supabase, not just JWT)
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const metaRole = user.user_metadata?.role as string | undefined;
      const dbRole: Role = (metaRole && ROLE_MAP[metaRole]) ? ROLE_MAP[metaRole] : Role.STUDENT;

      // Réconcilie via le mécanisme unique (idempotent, tolérant orphelines,
      // race conditions et crée UserRole automatiquement).
      // Si l'appel throw, on log mais on continue vers /login pour ne pas
      // bloquer complètement l'utilisateur.
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

      // Determine redirect destination.
      // Règle : le param `next` fourni par le tunnel de signup est
      // TOUJOURS respecté s'il pointe vers une route interne (préfixée /),
      // qu'on soit onboardé ou pas. C'est le tunnel qui sait où il veut
      // remettre l'utilisateur — le callback ne doit pas court-circuiter.
      // Le fallback s'applique uniquement si `next` est absent ou pointe
      // vers /dashboard (valeur par défaut historique = pas de contexte).
      let redirectUrl: string;
      const nextIsMeaningful = !!next && next !== "/dashboard" && next.startsWith("/");
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

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
