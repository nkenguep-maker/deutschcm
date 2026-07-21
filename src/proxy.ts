import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Multi-rôles YEMA — le proxy lit user_metadata.roles (miroir DB).
// Source de vérité = table user_roles (Prisma). Le proxy n'interroge
// pas la DB pour rester rapide sur les routes protégées.
//
// ⚠️ Next 16 · Ce fichier DOIT s'appeler proxy.ts (pas middleware.ts) ET
// vivre dans src/ (à côté de app/). Un middleware.ts à la racine ou un
// proxy.ts à la racine avec layout src/app/ sont SILENCIEUSEMENT ignorés
// → tous les gardes d'auth tombent sans erreur visible.
// Voir mémoire ~/.claude/projects/-Users-paulnkengue/memory/lesson_nextjs_src_middleware.md

type SpaceRole = "STUDENT" | "TEACHER" | "CENTER" | "ADMIN"

const PUBLIC_ROUTES = [
  "/", "/login", "/register", "/pricing",
  "/discover", "/auth",
  "/hoeren/demo", "/schreiben/demo",
  "/quiz/demo", "/video/preview",
  "/privacy", "/terms", "/landing", "/demo",
  "/goodbye", "/teacher/goodbye",
  "/methode", "/histoires", "/manifeste", "/langues", "/setup-role",
  // /activation : écran de passage post-paiement. Le page shell est
  // vide de données ; la sécurité est portée par /api/activation-status
  // (auth + ownership check). Si un anon arrive ici, la page fetche
  // l'endpoint, reçoit 401, et redirige vers /login (voir page.tsx).
  "/activation",
]

// Routes protégées → rôle requis pour l'espace parent.
const PROTECTED_ROUTES: Record<string, SpaceRole[]> = {
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
  "/simulateur": ["STUDENT", "TEACHER", "CENTER", "ADMIN"],
  "/progress": ["STUDENT", "TEACHER", "CENTER", "ADMIN"],
}

// À quel espace appartient un pathname donné ? (pour déterminer le rôle
// dont dépend l'onboarding requis)
function spaceForPath(pathname: string): SpaceRole | null {
  if (pathname.startsWith("/admin")) return "ADMIN"
  if (pathname.startsWith("/teacher")) return "TEACHER"
  if (pathname.startsWith("/center")) return "CENTER"
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/simulateur") ||
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
  // STUDENT et ADMIN : /onboarding est un router qui aiguille selon
  // user_metadata.universe (ou learning_paths existants) vers /monde
  // ou /racines. La route /onboarding/student n'existe pas ; l'ancien
  // fallback envoyait sur un 404.
  return `/${locale}/onboarding`
}

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Garde-fou · empêche /fr/fr/..., /fr/en/..., /en/fr/..., /en/en/...
  // Bug next-intl · un helper localisé + un chemin déjà localisé
  // produit une double locale. On strip la seconde et on redirige.
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

  const hasSession = request.cookies.getAll().some(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))
  if (!hasSession) {
    if (canonicalPath === "/test-niveau") {
      return NextResponse.redirect(new URL(`/${locale}/register?next=/${locale}/test-niveau`, request.url))
    }
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  let user: { user_metadata?: Record<string, unknown> } | null = null
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
      }
    )
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
  }

  // Extract multi-rôles depuis user_metadata (miroir DB synchronisé par /api/*).
  const meta = user.user_metadata ?? {}
  const metaRoles = Array.isArray(meta.roles) ? (meta.roles as string[]) : []
  let roles = metaRoles.filter(r => ["STUDENT", "TEACHER", "CENTER", "ADMIN"].includes(r)) as SpaceRole[]

  // Fallback : legacy cookie ou single role si user_metadata.roles pas encore sync
  if (roles.length === 0) {
    const legacyRole = (request.cookies.get("user_role")?.value || meta.role) as SpaceRole | undefined
    if (legacyRole) roles = [legacyRole]
  }

  // Aucun rôle → forcer setup
  if (roles.length === 0) {
    if (canonicalPath === "/setup-role") return response
    return NextResponse.redirect(new URL(`/${locale}/setup-role`, request.url))
  }

  const activeSpace = (typeof meta.active_space === "string" ? meta.active_space : undefined) as SpaceRole | undefined
  const onboardedMap = (meta.onboarded_map ?? {}) as Record<string, boolean>

  // Onboarding par rôle : si on entre dans un espace dont le rôle
  // n'a pas encore été onboardé, rediriger vers son onboarding.
  const targetSpace = spaceForPath(canonicalPath)
  if (targetSpace && roles.includes(targetSpace) && !canonicalPath.startsWith("/onboarding")) {
    if (onboardedMap[targetSpace] === false) {
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
