import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — never blocked
  const PUBLIC = ["/", "/login", "/register", "/pricing", "/discover", "/test-niveau", "/auth", "/landing"];
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Read cookies set by register/auth-callback/onboarding-complete
  const userRole = request.cookies.get("user_role")?.value;
  const onboardingDone = request.cookies.get("onboarding_done")?.value === "true";

  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → /login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but onboarding not completed
  if (!onboardingDone) {
    const role = userRole || user.user_metadata?.role || "STUDENT";

    // Already on onboarding — let through
    if (pathname.startsWith("/onboarding")) return response;

    if (role === "TEACHER") return NextResponse.redirect(new URL("/onboarding/teacher", request.url));
    if (role === "CENTER_MANAGER") return NextResponse.redirect(new URL("/onboarding/center", request.url));
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.redirect(new URL("/onboarding/student", request.url));
  }

  // Role-based route protection
  const role = userRole || user.user_metadata?.role || "STUDENT";

  // Redirect TEACHER/CENTER_MANAGER away from /dashboard to their own space
  if (onboardingDone && pathname === "/dashboard") {
    if (role === "CENTER_MANAGER") return NextResponse.redirect(new URL("/center", request.url));
    if (role === "TEACHER")        return NextResponse.redirect(new URL("/teacher", request.url));
  }

  if (pathname.startsWith("/teacher") && role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname.startsWith("/center") && role !== "CENTER_MANAGER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Exclude static files, images, and API routes from middleware
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.png$).*)"],
};
