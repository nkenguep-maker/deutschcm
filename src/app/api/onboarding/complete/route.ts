import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { markRoleOnboarded, syncUserMetadata, type SpaceRole } from "@/lib/roles"
import { reconcileDbUser } from "@/lib/reconcileDbUser"
import { prisma } from "@/lib/prisma"

// Fin d'onboarding — reconcile la ligne Prisma (idempotent, tolérant à
// un état partiel : mauvais supabaseId, users row orpheline avec même
// email, absence de UserRole, etc.), marque UserRole.onboarded=true, et
// sync user_metadata pour que le proxy arrête de rediriger vers /onboarding.
//
// Réponses :
//   200  { success, userId, redirectTo }
//   400  { error, code: "VALIDATION_ERROR" }
//   401  { error, code: "UNAUTHORIZED" }
//   500  { error, code: "DB_CONFLICT" | "INTERNAL" }

const VALID: SpaceRole[] = ["STUDENT", "TEACHER", "CENTER", "ADMIN"]

function err(code: string, message: string, status: number, detail?: unknown) {
  return NextResponse.json({ error: message, code, ...(detail ? { detail } : {}) }, { status });
}

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
    if (!user) return err("UNAUTHORIZED", "Not signed in", 401)

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

    // 1) Réconcilie la ligne users Prisma (crée / adopte l'orpheline / met à jour).
    //    reconcileDbUser gère aussi la création idempotente du UserRole.
    const { user: dbUser, path: reconcilePath } = await reconcileDbUser({
      authUser: user,
      defaultRole: effectiveRole,
      patch: {
        onboardingDone: true,
        fullName: profileData.fullName ?? undefined,
      },
    });
    if (reconcilePath !== "matched_supabase_id") {
      console.info(`[onboarding/complete] reconcile path=${reconcilePath} for supabaseId=${user.id}`);
    }

    // 2) Applique le patch profil complet (le reconcile ne fait qu'un patch minimal)
    if (Object.keys(profileData).length > 0) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
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
        }
      })
    }

    // 3) Marque onboarded=true pour ce rôle (upsert · idempotent).
    await markRoleOnboarded(dbUser.id, effectiveRole)

    // 4) Cap · langue · but perso · disponibilité → user_metadata direct.
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

    // 5) Sync user_metadata pour le proxy (roles + onboarded)
    await syncUserMetadata({ supabaseId: user.id, activeSpace: effectiveRole })

    // Après onboarding STUDENT → dashboard direct.
    const redirectTo = effectiveRole === "TEACHER"
      ? "/teacher"
      : effectiveRole === "CENTER"
      ? "/center"
      : "/dashboard"

    const response = NextResponse.json({
      success: true,
      userId: dbUser.id,
      redirectTo,
    })
    // Cookie legacy conservé pour compat
    response.cookies.set("onboarding_done", "true", { path: "/", maxAge: 2592000 })
    response.cookies.set("active_space", effectiveRole, { path: "/", maxAge: 2592000 })
    return response

  } catch (e) {
    const errObj = e as { code?: string; message?: string; meta?: unknown };
    console.error("[onboarding/complete] FAIL", {
      code: errObj.code,
      message: errObj.message,
      meta: errObj.meta,
      stack: e instanceof Error ? e.stack : undefined,
    });
    if (errObj.code === "P2002") {
      return err("DB_CONFLICT", "unique constraint violation", 500, { meta: errObj.meta });
    }
    return err("INTERNAL", errObj.message ?? "internal error", 500)
  }
}
