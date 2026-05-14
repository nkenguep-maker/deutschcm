import createMiddleware from "next-intl/middleware"
import { routing } from "./src/i18n/routing"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

type UserRole = "STUDENT" | "TEACHER" | "CENTER_MANAGER" | "ADMIN"

// Routes that don't require auth (without locale prefix)
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

// Create the intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next()
  }

  // Run intl middleware first — handles locale detection & redirects (e.g., / → /fr/)
  const intlResponse = await intlMiddleware(request)

  // DEBUG: expose what intlMiddleware returned
  const dbgStatus = String(intlResponse.status)
  const dbgLoc = intlResponse.headers.get("location") ?? "none"

  // If it's a redirect (locale prefix addition), return it immediately
  if (intlResponse.status !== 200) {
    const r2 = new NextResponse(intlResponse.body, intlResponse)
    r2.headers.set("x-dbg-stage", "intl-redirect")
    r2.headers.set("x-dbg-intl-status", dbgStatus)
    r2.headers.set("x-dbg-intl-loc", dbgLoc)
    return r2
  }

  // Strip the locale prefix to get the canonical path for auth checking
  // e.g., /fr/dashboard → /dashboard, /en/login → /login
  const localePrefix = routing.locales.find(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  const canonicalPath = localePrefix
    ? pathname === `/${localePrefix}` ? "/" : pathname.slice(`/${localePrefix}`.length)
    : pathname
  const locale = localePrefix ?? routing.defaultLocale

  // Check if this is a public route
  if (PUBLIC_ROUTES.some(r => canonicalPath === r || canonicalPath.startsWith(r + "/"))) {
    const r2 = new NextResponse(intlResponse.body, intlResponse)
    r2.headers.set("x-dbg-stage", "public-route")
    r2.headers.set("x-dbg-canonical", canonicalPath)
    r2.headers.set("x-dbg-locale", locale)
    return r2
  }

  // Auth check for protected routes
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
    const redirectUrl = new URL(`/${locale}/login`, request.url)
    const r2 = NextResponse.redirect(redirectUrl)
    r2.headers.set("x-dbg-stage", "no-user")
    r2.headers.set("x-dbg-canonical", canonicalPath)
    r2.headers.set("x-dbg-locale", locale)
    r2.headers.set("x-dbg-intl-status", dbgStatus)
    return r2
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
