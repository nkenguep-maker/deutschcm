import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { reconcileDbUser, ReconcileError } from "@/lib/reconcileDbUser";
import { hasActiveRole } from "@/lib/roles";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";

function generateCenterCode(city: string): string {
  const prefix = (city ?? "CM").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function forbidden(code = "ROLE_NOT_GRANTED") {
  return NextResponse.json({ error: code }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbidden("ORIGIN_MISMATCH");

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let dbUser;
  try {
    const { user } = await reconcileDbUser({ authUser, defaultRole: "STUDENT" });
    dbUser = user;
  } catch (e) {
    if (e instanceof ReconcileError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
    }
    throw e;
  }

  const body = await request.json().catch(() => null) as Record<string, any> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { type } = body;

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
      },
    });
    return NextResponse.json({ user: updated });
  }

  if (type === "teacher") {
    if (!(await hasActiveRole(dbUser.id, "TEACHER"))) return forbidden();
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
        role: "TEACHER",
        centerId: centerId ?? undefined,
      },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        bio: bio ?? "",
        speciality: Array.isArray(speciality) ? speciality : [],
        languages: ["de"],
        diploma: diploma ?? undefined,
        yearsExp: yearsExp ? Number(yearsExp) : undefined,
        certifications: Array.isArray(certifications) ? certifications : [],
        maxStudents: maxStudents ? Number(maxStudents) : 20,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        availabilitySchedule: availabilitySchedule ?? undefined,
        centerId: centerId ?? undefined,
      },
      update: {
        bio: bio ?? undefined,
        speciality: Array.isArray(speciality) ? speciality : undefined,
        diploma: diploma ?? undefined,
        yearsExp: yearsExp ? Number(yearsExp) : undefined,
        certifications: Array.isArray(certifications) ? certifications : undefined,
        maxStudents: maxStudents ? Number(maxStudents) : undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        availabilitySchedule: availabilitySchedule ?? undefined,
        centerId: centerId ?? undefined,
      },
    });
    return NextResponse.json({ teacher });
  }

  if (type === "center") {
    if (!(await hasActiveRole(dbUser.id, "CENTER"))) return forbidden();
    const { name, centerType, foundedAt, rccm, logoUrl, region, city, address, phone, email, website, socialMedia, openingHours } = body;
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "CENTER_NAME_REQUIRED" }, { status: 400 });
    }
    let code = generateCenterCode(city ?? "CM");
    while (await prisma.languageCenter.findUnique({ where: { code } })) {
      code = generateCenterCode(city ?? "CM");
    }

    const center = await prisma.languageCenter.create({
      data: {
        name: name.trim(),
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
      data: { role: "CENTER", centerId: center.id },
    });
    return NextResponse.json({ center });
  }

  if (type === "center/invite-admin") {
    if (!(await hasActiveRole(dbUser.id, "CENTER"))) return forbidden();
    const centerId = typeof body.centerId === "string" ? body.centerId : "";
    const emails = Array.isArray(body.emails) ? body.emails.filter((v: unknown) => typeof v === "string") : [];
    if (!centerId || dbUser.centerId !== centerId) return forbidden("CENTER_OWNERSHIP_REQUIRED");

    const center = await prisma.languageCenter.findUnique({ where: { id: centerId } });
    if (!center) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const currentAdmins = await prisma.user.count({
      where: { centerId, role: "CENTER" },
    });
    if (currentAdmins + emails.length > center.maxAdmins) {
      return NextResponse.json({ error: `Limite de ${center.maxAdmins} admins atteinte` }, { status: 400 });
    }
    return NextResponse.json({ invited: emails.length, message: "Invitations enregistrées" });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
