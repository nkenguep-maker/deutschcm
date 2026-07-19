import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { grantRole, markRoleOnboarded, syncUserMetadata, type SpaceRole } from "@/lib/roles"

// Fin d'onboarding — marque UserRole.onboarded=true pour CE rôle uniquement,
// sans toucher aux autres rôles. Sync user_metadata pour que le middleware
// arrête de rediriger vers l'onboarding.

const VALID: SpaceRole[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"]

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 })

    let role: SpaceRole | undefined
    let profileData: Record<string, string | null | undefined> = {}
    let cap: string | undefined
    let activeLanguage: string | undefined
    let personalGoal: string | undefined
    let availability: string | undefined

    try {
      const body = await req.json()
      const bodyRole = body.role as string | undefined
      if (bodyRole && VALID.includes(bodyRole as SpaceRole)) role = bodyRole as SpaceRole
      profileData = body.profileData ?? {}
      cap = typeof body.cap === "string" ? body.cap : undefined
      activeLanguage = typeof body.activeLanguage === "string" ? body.activeLanguage : undefined
      personalGoal = typeof body.personalGoal === "string" ? body.personalGoal : undefined
      availability = typeof body.availability === "string" ? body.availability : undefined
    } catch {
      // pas de body — on tombera sur le fallback ci-dessous
    }

    // Fallback rôle : legacy cookie, user_metadata.role, ou STUDENT.
    const effectiveRole: SpaceRole =
      role ||
      (cookieStore.get("user_role")?.value as SpaceRole | undefined) ||
      (user.user_metadata?.role as SpaceRole | undefined) ||
      "STUDENT"

    const updated = await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: {
        onboardingDone: true, // legacy flag conservé pour compat
        ...(profileData.fullName ? { fullName: profileData.fullName } : {}),
        phone: profileData.phone ?? undefined,
        city: profileData.city ?? undefined,
        country: profileData.country ?? undefined,
        bio: profileData.bio ?? undefined,
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
        germanLevel: profileData.germanLevel ?? undefined,
        learningGoal: profileData.learningGoal ?? undefined,
        availability: profileData.availability ?? undefined,
        qualifications: profileData.qualifications ?? undefined,
        teachingLevels: profileData.teachingLevels ?? undefined,
        centerName: profileData.centerName ?? undefined,
        centerAddress: profileData.centerAddress ?? undefined,
        centerCity: profileData.centerCity ?? undefined,
        centerWebsite: profileData.centerWebsite ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        supabaseId: user.id,
        email: user.email!,
        role: effectiveRole,
        onboardingDone: true,
        fullName: profileData.fullName || user.user_metadata?.full_name || "",
        phone: profileData.phone ?? null,
        city: profileData.city ?? null,
        country: profileData.country ?? "Cameroun",
        bio: profileData.bio ?? null,
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
        germanLevel: profileData.germanLevel ?? null,
        learningGoal: profileData.learningGoal ?? null,
        availability: profileData.availability ?? null,
        qualifications: profileData.qualifications ?? null,
        teachingLevels: profileData.teachingLevels ?? null,
        centerName: profileData.centerName ?? null,
        centerAddress: profileData.centerAddress ?? null,
        centerCity: profileData.centerCity ?? null,
        centerWebsite: profileData.centerWebsite ?? null,
      }
    })

    // Multi-rôles : s'assurer que UserRole existe (idempotent), puis marquer onboarded=true.
    await grantRole({ userId: updated.id, role: effectiveRole })
    await markRoleOnboarded(updated.id, effectiveRole)

    // Cap · langue · but perso · disponibilité → user_metadata direct.
    // Ces champs sont utilisés par le dashboard et /pricing pour
    // adapter l'expérience sans requête DB à chaque page.
    if (cap || activeLanguage || personalGoal || availability) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js")
      const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (SERVICE) {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          SERVICE,
          { auth: { autoRefreshToken: false, persistSession: false } },
        )
        const { data: current } = await admin.auth.admin.getUserById(user.id)
        const existing = (current?.user?.user_metadata ?? {}) as Record<string, unknown>
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...existing,
            ...(cap ? { cap } : {}),
            ...(activeLanguage ? { activeLanguage } : {}),
            ...(personalGoal ? { personalGoal } : {}),
            ...(availability ? { availability } : {}),
          },
        })
      }
    }

    // Sync user_metadata pour le middleware (roles + onboarded)
    await syncUserMetadata({ supabaseId: user.id, activeSpace: effectiveRole })

    // Après onboarding STUDENT → dashboard direct. Le cap et la
    // langue pilotent l'affichage. Le test-niveau reste accessible
    // depuis le dashboard pour affiner le point de départ.
    const redirectTo = effectiveRole === "TEACHER"
      ? "/teacher"
      : effectiveRole === "CENTER"
      ? "/center"
      : "/dashboard"

    const response = NextResponse.json({
      success: true,
      userId: updated.id,
      redirectTo,
    })
    // Cookie legacy conservé pour compat
    response.cookies.set("onboarding_done", "true", { path: "/", maxAge: 2592000 })
    response.cookies.set("active_space", effectiveRole, { path: "/", maxAge: 2592000 })
    return response

  } catch (err) {
    console.error("Onboarding complete error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
