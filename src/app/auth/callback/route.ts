import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

const ROLE_MAP: Record<string, Role> = {
  STUDENT: Role.STUDENT,
  TEACHER: Role.TEACHER,
  CENTER_MANAGER: Role.CENTER_MANAGER,
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

      // Find or create DB user
      let dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
      if (!dbUser) {
        try {
          dbUser = await prisma.user.create({
            data: {
              supabaseId: user.id,
              email: user.email!,
              fullName: user.user_metadata?.full_name || "Nouvel utilisateur",
              role: dbRole,
              onboardingDone: false,
            },
          });
        } catch {
          // If creation fails (race condition), try fetching again
          dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
        }
      }

      const onboardingDone = dbUser?.onboardingDone ?? false;
      const cookieRole = metaRole || "STUDENT";

      // Determine redirect destination
      let redirectUrl: string;
      if (onboardingDone) {
        redirectUrl = dbRole === Role.ADMIN ? "/admin"
          : dbRole === Role.TEACHER ? "/teacher"
          : dbRole === Role.CENTER_MANAGER ? "/center"
          : "/dashboard";
      } else {
        redirectUrl = dbRole === Role.ADMIN ? "/admin"
          : dbRole === Role.TEACHER ? "/onboarding/teacher"
          : dbRole === Role.CENTER_MANAGER ? "/onboarding/center"
          : "/onboarding/student";
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
