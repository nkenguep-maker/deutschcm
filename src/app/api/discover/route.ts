import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const teacherProfiles = await prisma.teacher.findMany({
      where: { user: { onboardingDone: true } },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            city: true,
            bio: true,
            teachingLevels: true,
            qualifications: true,
          }
        },
        classrooms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            level: true,
            code: true,
            maxStudents: true,
            _count: { select: { enrollments: true } }
          }
        }
      },
      take: 20
    })

    const teachers = teacherProfiles.map(t => ({
      id: t.user.id,
      fullName: t.user.fullName,
      city: t.user.city,
      bio: t.user.bio,
      teachingLevels: t.user.teachingLevels,
      qualifications: t.user.qualifications,
      classrooms: t.classrooms.map(c => ({
        id: c.id,
        name: c.name,
        level: c.level,
        code: c.code,
        maxStudents: c.maxStudents,
        enrollments: c._count.enrollments,
      }))
    }))

    const centers = await prisma.user.findMany({
      where: {
        role: "CENTER_MANAGER",
        onboardingDone: true
      },
      select: {
        id: true,
        fullName: true,
        centerName: true,
        centerCity: true,
        centerAddress: true,
        centerWebsite: true,
        bio: true,
      },
      take: 10
    })

    return NextResponse.json({
      success: true,
      teachers,
      centers,
      groups: [] // Phase 2
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
