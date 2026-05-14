import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import {
  canAccessRoute,
  getDefaultRedirect,
  getOnboardingRoute,
  type UserRole
} from "@/lib/permissions"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques
  const PUBLIC_ROUTES = [
    "/", "/login", "/register", "/pricing",
    "/discover", "/test-niveau", "/auth",
    "/hoeren/demo", "/schreiben/demo",
    "/quiz/demo", "/video/preview"
  ]

  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next()
  }

  // Assets statiques
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") ||
      pathname.includes(".") && !pathname.startsWith("/api")) {
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
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Non connecté → login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Lire le rôle depuis les cookies
  const userRole = (request.cookies.get("user_role")?.value ||
    user.user_metadata?.role || "STUDENT") as UserRole
  const onboardingDone = request.cookies.get("onboarding_done")?.value === "true"

  // Onboarding non complété
  if (!onboardingDone && !pathname.startsWith("/onboarding") && !pathname.startsWith("/api")) {
    const onboardingRoute = getOnboardingRoute(userRole)
    return NextResponse.redirect(new URL(onboardingRoute, request.url))
  }

  // Vérification permissions de route
  if (!canAccessRoute(userRole, pathname)) {
    const redirect = getDefaultRedirect(userRole)
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  return response
}

