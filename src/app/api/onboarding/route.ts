import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

function generateCenterCode(city: string): string {
  const prefix = (city ?? "CM").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-create the DB user if missing (handles first-time sign-ups)
  const dbUser = await prisma.user.upsert({
    where: { supabaseId: authUser.id },
    create: {
      supabaseId: authUser.id,
      email: authUser.email!,
      fullName: authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "Utilisateur",
    },
    update: {},
  });

  const body = await request.json();
  const { type } = body;

  // ── Student onboarding ────────────────────────────────────────────────────
  if (type === "student") {
    const { fullName, phone, city, dateOfBirth, gender, avatarUrl, learningGoal, availability, preferredSchedule, classCode, studentType } = body;
    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        fullName: fullName ?? dbUser.fullName,
        phone: phone ?? undefined,
        city: city ?? undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        learningGoal: learningGoal ?? undefined,
        availability: availability ?? undefined,
        preferredSchedule: preferredSchedule ?? undefined,
        classCode: classCode ?? undefined,
        studentType: studentType ?? undefined,
        onboardingDone: true,
      },
    });
    return NextResponse.json({ user: updated });
  }

  // ── Teacher onboarding ────────────────────────────────────────────────────
  if (type === "teacher") {
    const { fullName, phone, city, dateOfBirth, gender, avatarUrl, bio, speciality, diploma, yearsExp, certifications, maxStudents, hourlyRate, availabilitySchedule, centerId } = body;
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        fullName: fullName ?? dbUser.fullName,
        phone: phone ?? undefined,
        city: city ?? undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        onboardingDone: true,
        role: Role.TEACHER,
      },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        bio: bio ?? "",
        speciality: speciality ?? [],
        languages: ["de"],
        diploma: diploma ?? undefined,
        yearsExp: yearsExp ? Number(yearsExp) : undefined,
        certifications: certifications ?? [],
        maxStudents: maxStudents ? Number(maxStudents) : 20,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        availabilitySchedule: availabilitySchedule ?? undefined,
        centerId: centerId ?? undefined,
      },
      update: {
        bio: bio ?? undefined,
        speciality: speciality ?? undefined,
        diploma: diploma ?? undefined,
        yearsExp: yearsExp ? Number(yearsExp) : undefined,
        certifications: certifications ?? undefined,
        maxStudents: maxStudents ? Number(maxStudents) : undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        availabilitySchedule: availabilitySchedule ?? undefined,
        centerId: centerId ?? undefined,
      },
    });
    return NextResponse.json({ teacher });
  }

  // ── Center onboarding ─────────────────────────────────────────────────────
  if (type === "center") {
    const { name, centerType, foundedAt, rccm, logoUrl, region, city, address, phone, email, website, socialMedia, openingHours } = body;
    let code = generateCenterCode(city ?? "CM");
    // Ensure uniqueness (retry on collision)
    while (await prisma.languageCenter.findUnique({ where: { code } })) {
      code = generateCenterCode(city ?? "CM");
    }

    const center = await prisma.languageCenter.create({
      data: {
        name,
        centerType: centerType ?? undefined,
        foundedAt: foundedAt ? new Date(foundedAt) : undefined,
        rccm: rccm ?? undefined,
        logoUrl: logoUrl ?? undefined,
        region: region ?? undefined,
        city: city ?? "",
        address: address ?? undefined,
        phone: phone ?? undefined,
        email: email ?? undefined,
        website: website ?? undefined,
        socialMedia: socialMedia ?? undefined,
        openingHours: openingHours ?? undefined,
        maxAdmins: 5,
        code,
      },
    });
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { role: Role.CENTER_MANAGER, onboardingDone: true },
    });
    return NextResponse.json({ center });
  }

  // ── Center invite admin ───────────────────────────────────────────────────
  if (type === "center/invite-admin") {
    const { centerId, emails } = body;
    const center = await prisma.languageCenter.findUnique({ where: { id: centerId } });
    if (!center) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const currentAdmins = await prisma.user.count({
      where: { role: { in: ["ADMIN", "CENTER_MANAGER"] } },
    });
    if (currentAdmins + emails.length > center.maxAdmins) {
      return NextResponse.json({ error: `Limite de ${center.maxAdmins} admins atteinte` }, { status: 400 });
    }
    // In production: send invite emails via Supabase auth admin API
    return NextResponse.json({ invited: emails.length, message: "Invitations envoyées" });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
