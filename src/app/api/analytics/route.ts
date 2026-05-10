import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "student"

    if (type === "student") {
      const profile = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: {
          moduleProgress: {
            include: { module: { include: { course: true } } },
            orderBy: { updatedAt: "desc" }
          },
          conversationSessions: {
            orderBy: { startedAt: "desc" },
            take: 20
          },
          quizAttempts: {
            orderBy: { createdAt: "desc" },
            take: 20
          },
          enrollments: {
            include: { course: true }
          },
          badges: {
            include: { badge: true }
          }
        }
      })

      if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 })

      const completedModules = profile.moduleProgress.filter(m => m.status === "COMPLETED").length
      const totalModules = profile.moduleProgress.length
      const avgScore = profile.quizAttempts.length > 0
        ? profile.quizAttempts.reduce((sum, q) => sum + q.score, 0) / profile.quizAttempts.length
        : 0
      const avgConvScore = profile.conversationSessions.filter(s => s.scoreGlobal).length > 0
        ? profile.conversationSessions
            .filter(s => s.scoreGlobal)
            .reduce((sum, s) => sum + (s.scoreGlobal || 0), 0) /
            profile.conversationSessions.filter(s => s.scoreGlobal).length
        : 0

      return NextResponse.json({
        success: true,
        data: {
          overview: {
            xpTotal: profile.xpTotal,
            streakDays: profile.streakDays,
            level: profile.germanLevel,
            completedModules,
            totalModules,
            completionRate: totalModules > 0 ? Math.round(completedModules / totalModules * 100) : 0,
            avgQuizScore: Math.round(avgScore),
            avgConvScore: Math.round(avgConvScore),
            totalCourses: profile.enrollments.length,
            totalBadges: profile.badges.length,
          },
          weeklyProgress: generateWeeklyData(profile.moduleProgress),
          skillScores: {
            lesen: Math.round(avgScore * 0.9),
            hoeren: Math.round(avgScore * 0.85),
            sprechen: Math.round(avgConvScore),
            schreiben: Math.round(avgScore * 0.8),
            grammatik: Math.round(avgScore * 0.95),
          },
          recentActivity: profile.moduleProgress.slice(0, 10).map(m => ({
            type: "module",
            title: m.module.title,
            course: m.module.course.title,
            status: m.status,
            score: m.score,
            date: m.updatedAt,
          })),
          quizHistory: profile.quizAttempts.slice(0, 10).map(q => ({
            score: q.score,
            isPassed: q.isPassed,
            date: q.createdAt,
          })),
          conversationHistory: profile.conversationSessions.slice(0, 10).map(s => ({
            scenario: s.scenario,
            scoreGlobal: s.scoreGlobal,
            scoreGrammaire: s.scoreGrammaire,
            scoreFluence: s.scoreFluence,
            date: s.startedAt,
            isCompleted: s.isCompleted,
          })),
        }
      })
    }

    return NextResponse.json({ error: "Type non supporté" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function generateWeeklyData(moduleProgress: any[]) {
  const weeks = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i * 7)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const weekModules = moduleProgress.filter(m => {
      const d = new Date(m.updatedAt)
      return d >= weekStart && d < weekEnd
    })

    weeks.push({
      week: `S${7 - i}`,
      modules: weekModules.length,
      score: weekModules.length > 0
        ? Math.round(weekModules.filter(m => m.score).reduce((s, m) => s + (m.score || 0), 0) / weekModules.filter(m => m.score).length || 0)
        : 0,
      xp: weekModules.length * 15,
    })
  }
  return weeks
}
