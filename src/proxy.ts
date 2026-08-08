import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import {
  INTERNAL_TEST_COOKIE_NAME,
  resolveInternalPersona,
} from "./lib/internalPersona"

// Multi-rôles YEMA — source de vérité = user_roles (Prisma).
// Le miroir rapide d'autorisation est Supabase app_metadata, écrit uniquement
// par le client admin. user_metadata et les cookies UI sont non fiables.

type SpaceRole = "STUDENT" | "TEACHER" | "CENTER" | "ADMIN"

const PUBLIC_ROUTES = [
  "/", "/login", "/register", "/pricing",
  "/discover", "/auth",
  "/hoeren/demo", "/schreiben/demo",
  "/quiz/demo", "/video/preview",
  "/privacy", "/terms", "/landing",
  "/goodbye", "/teacher/goodbye",
  "/methode", "/histoires", "/manifeste", "/langues", "/enseignants", "/setup-role",
  "/simulateur",
  "/activation",
  "/qa",
]

const PROTECTED_ROUTES: Record<string, SpaceRole[]> = {
  "/onboarding/teacher": ["TEACHER", "ADMIN"],
  "/onboarding/center": ["CENTER", "ADMIN"],
  "/onboarding": ["STUDENT"],
  "/admin": ["ADMIN"],
  "/admin/courses/generate": ["ADMIN"],
  "/admin/roles": ["ADMIN"],
  "/teacher": ["TEACHER", "ADMIN"],
  "/teacher/classroom": ["TEACHER", "ADMIN"],
  "/teacher/students": ["TEACHER", "ADMIN"],
  "/center": ["CENTER", "ADMIN"],
  "/center/teachers": ["CENTER", "ADMIN"],
  "/center/students": ["CENTER", "ADMIN"],
  "/center/billing": ["CENTER", "ADMIN"],
  "/dashboard": ["STUDENT", "TEACHER", "CENTER", "ADMIN"],
  "/courses": ["STUDENT", "TEACHER", "CENTER", "ADMIN"],
  "/progress": ["STUDENT", "TEACHER", "CENTER", "ADMIN"],
  "/family": ["STUDENT", "ADMIN"],
  "/famille": ["STUDENT", "ADMIN"],
  "/decouverte": ["STUDENT"],
  "/activation-intent": ["STUDENT"],
}

function spaceForPath(pathname: string): SpaceRole | null {
  if (pathname.startsWith("/admin")) return "ADMIN"
  if (pathname.startsWith("/teacher")) return "TEACHER"
  if (pathname.startsWith("/center")) return "CENTER"
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/family") ||
    pathname.startsWith("/famille") ||
    pathname.startsWith("/decouverte") ||
    pathname.startsWith("/activation-intent") ||
    pathname.startsWith("/progress")
  ) return "STUDENT"
  return null
}

function canAccessRoute(roles: SpaceRole[], pathname: string): boolean {
  const key = Object.keys(PROTECTED_ROUTES).find(
    k => pathname === k || pathname.startsWith(k + "/"),
  )
  if (!key) return true
  const allowed = PROTECTED_ROUTES[key]
  return roles.some(r => allowed.includes(r))
}

function getDefaultRedirect(roles: SpaceRole[], activeSpace: SpaceRole | undefined, locale: string): string {
  const primary = activeSpace && roles.includes(activeSpace) ? activeSpace : roles[0]
  if (primary === "ADMIN") return `/${locale}/admin`
  if (primary === "TEACHER") return `/${locale}/teacher`
  if (primary === "CENTER") return `/${locale}/center`
  return `/${locale}/dashboard`
}

function getOnboardingRoute(role: SpaceRole, locale: string): string {
  if (role === "TEACHER") return `/${locale}/onboarding/teacher`
  if (role === "CENTER") return `/${locale}/onboarding/center`
  return `/${locale}/onboarding`
}

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const dupLocale = pathname.match(/^\/(fr|en)\/(fr|en)(\/.*)?$/)
  if (dupLocale) {
    const [, first, , rest] = dupLocale
    const target = `/${first}${rest ?? ""}`
    return NextResponse.redirect(new URL(target, request.url))
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next()
  }

  const localePrefix = routing.locales.find(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  const canonicalPath = localePrefix
    ? pathname === `/${localePrefix}` ? "/" : pathname.slice(`/${localePrefix}`.length)
    : pathname
  const locale = localePrefix ?? routing.defaultLocale

  if (PUBLIC_ROUTES.some(r => canonicalPath === r || canonicalPath.startsWith(r + "/"))) {
    return intlMiddleware(request)
  }

  const intlResponse = await intlMiddleware(request)
  if (intlResponse.status !== 200) return intlResponse

  const response = intlResponse

  function loginRedirect() {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    const returnTo = canonicalPath === "/" ? `/${locale}` : `/${locale}${canonicalPath}`
    loginUrl.searchParams.set("next", returnTo)
    return NextResponse.redirect(loginUrl)
  }

  const hasSession = request.cookies.getAll().some(c =>
    /^sb-.+-auth-token(\.\d+)?$/.test(c.name),
  )
  if (!hasSession) {
    if (canonicalPath === "/test-niveau") {
      return NextResponse.redirect(new URL(`/${locale}/register?next=/${locale}/test-niveau`, request.url))
    }
    return loginRedirect()
  }

  let user: {
    email?: string | null
    app_metadata?: Record<string, unknown>
  } | null = null
  try {
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
      },
    )
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return loginRedirect()
  }

  if (!user) {
    return loginRedirect()
  }

  // Authorization is read only from signed app_metadata. Supabase users can
  // edit user_metadata themselves, so it must never grant a route capability.
  const authz = user.app_metadata ?? {}
  const authzRoles = Array.isArray(authz.roles) ? (authz.roles as string[]) : []
  let roles = authzRoles.filter(
    r => ["STUDENT", "TEACHER", "CENTER", "ADMIN"].includes(r),
  ) as SpaceRole[]

  // QA-only overlay: HttpOnly cookie + verified owner email, fail-closed in
  // resolveInternalPersona. This never comes from general user input.
  const internalPersona = resolveInternalPersona(
    request.cookies.get(INTERNAL_TEST_COOKIE_NAME)?.value,
    user.email,
  )
  const personaSpace = internalPersona?.attributes.requiredSpaceRole
  if (personaSpace && !roles.includes(personaSpace)) {
    roles = [...roles, personaSpace]
  }

  if (roles.length === 0) {
    if (canonicalPath === "/setup-role") return response
    return NextResponse.redirect(new URL(`/${locale}/setup-role`, request.url))
  }

  const metadataActiveSpace = (
    typeof authz.active_space === "string" ? authz.active_space : undefined
  ) as SpaceRole | undefined
  const activeSpace = personaSpace ?? metadataActiveSpace
  const onboardedMap = (authz.onboarded_map ?? {}) as Record<string, boolean>

  const targetSpace = spaceForPath(canonicalPath)
  if (targetSpace && roles.includes(targetSpace) && !canonicalPath.startsWith("/onboarding")) {
    if (onboardedMap[targetSpace] === false && personaSpace !== targetSpace) {
      return NextResponse.redirect(new URL(getOnboardingRoute(targetSpace, locale), request.url))
    }
  }

  if (!canAccessRoute(roles, canonicalPath)) {
    return NextResponse.redirect(new URL(getDefaultRedirect(roles, activeSpace, locale), request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
}
