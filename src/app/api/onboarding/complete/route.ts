import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

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

    let role: string | undefined
    let profileData: Record<string, string | null | undefined> = {}

    try {
      const body = await req.json()
      role = body.role
      profileData = body.profileData ?? {}
    } catch {
      // called without body (legacy) — just mark done
    }

    const updated = await prisma.user.upsert({
      where: { supabaseId: user.id },
      update: {
        onboardingDone: true,
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
        role: (role || user.user_metadata?.role || "STUDENT") as "STUDENT" | "TEACHER" | "CENTER_MANAGER" | "ADMIN",
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

    await supabase.auth.updateUser({ data: { onboarding_done: true } })

    const effectiveRole = role || updated.role
    const redirectTo = effectiveRole === "TEACHER"
      ? "/teacher"
      : effectiveRole === "CENTER_MANAGER"
      ? "/center"
      : "/test-niveau"

    const response = NextResponse.json({
      success: true,
      userId: updated.id,
      redirectTo,
    })
    response.cookies.set("onboarding_done", "true", { path: "/", maxAge: 2592000 })
    return response

  } catch (err) {
    console.error("Onboarding complete error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
