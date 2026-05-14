import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

type UserRole = "STUDENT" | "TEACHER" | "CENTER_MANAGER" | "ADMIN"

const PUBLIC_ROUTES = [
  "/", "/login", "/register", "/pricing",
  "/discover", "/test-niveau", "/auth",
  "/hoeren/demo", "/schreiben/demo",
  "/quiz/demo", "/video/preview",
]

const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["ADMIN"],
  "/admin/courses/generate": ["ADMIN"],
  "/teacher": ["TEACHER", "ADMIN"],
  "/teacher/classroom": ["TEACHER", "ADMIN"],
  "/teacher/students": ["TEACHER", "ADMIN"],
  "/center": ["CENTER_MANAGER", "ADMIN"],
  "/center/teachers": ["CENTER_MANAGER", "ADMIN"],
  "/center/students": ["CENTER_MANAGER", "ADMIN"],
  "/center/billing": ["CENTER_MANAGER", "ADMIN"],
  "/dashboard": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
  "/courses": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
  "/simulateur": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
  "/progress": ["STUDENT", "TEACHER", "CENTER_MANAGER", "ADMIN"],
}

function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowed = PROTECTED_ROUTES[pathname]
  return !allowed || allowed.includes(role)
}

function getDefaultRedirect(role: UserRole): string {
  if (role === "ADMIN") return "/admin"
  if (role === "TEACHER") return "/teacher"
  if (role === "CENTER_MANAGER") return "/center"
  return "/dashboard"
}

function getOnboardingRoute(role: UserRole): string {
  if (role === "TEACHER") return "/onboarding/teacher"
  if (role === "CENTER_MANAGER") return "/onboarding/center"
  return "/onboarding/student"
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const userRole = (request.cookies.get("user_role")?.value ||
    user.user_metadata?.role || "STUDENT") as UserRole
  const onboardingDone = request.cookies.get("onboarding_done")?.value === "true"

  if (!onboardingDone && !pathname.startsWith("/onboarding") && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL(getOnboardingRoute(userRole), request.url))
  }

  if (!canAccessRoute(userRole, pathname)) {
    return NextResponse.redirect(new URL(getDefaultRedirect(userRole), request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
}
