import createMiddleware from "next-intl/middleware"
import { routing } from "./src/i18n/routing"
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

function getDefaultRedirect(role: UserRole, locale: string): string {
  if (role === "ADMIN") return `/${locale}/admin`
  if (role === "TEACHER") return `/${locale}/teacher`
  if (role === "CENTER_MANAGER") return `/${locale}/center`
  return `/${locale}/dashboard`
}

function getOnboardingRoute(role: UserRole, locale: string): string {
  if (role === "TEACHER") return `/${locale}/onboarding/teacher`
  if (role === "CENTER_MANAGER") return `/${locale}/onboarding/center`
  return `/${locale}/onboarding/student`
}

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next()
  }

  // Strip the locale prefix to get the canonical path
  const localePrefix = routing.locales.find(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  const canonicalPath = localePrefix
    ? pathname === `/${localePrefix}` ? "/" : pathname.slice(`/${localePrefix}`.length)
    : pathname
  const locale = localePrefix ?? routing.defaultLocale

  // Public routes: run intl middleware and return
  if (PUBLIC_ROUTES.some(r => canonicalPath === r || canonicalPath.startsWith(r + "/"))) {
    return intlMiddleware(request)
  }

  // Protected routes: auth check first, then intl
  const intlResponse = await intlMiddleware(request)
  if (intlResponse.status !== 200) return intlResponse

  let response = intlResponse

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
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  const userRole = (request.cookies.get("user_role")?.value ||
    user.user_metadata?.role || "STUDENT") as UserRole
  const onboardingDone = request.cookies.get("onboarding_done")?.value === "true"

  if (!onboardingDone && !canonicalPath.startsWith("/onboarding") && !canonicalPath.startsWith("/api")) {
    return NextResponse.redirect(new URL(getOnboardingRoute(userRole, locale), request.url))
  }

  if (!canAccessRoute(userRole, canonicalPath)) {
    return NextResponse.redirect(new URL(getDefaultRedirect(userRole, locale), request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
}
