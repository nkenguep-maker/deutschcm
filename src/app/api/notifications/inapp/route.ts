import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET() {
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

    const profile = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    })

    const unreadCount = profile?.notifications.filter(n => !n.isRead).length || 0

    return NextResponse.json({
      success: true,
      notifications: profile?.notifications || [],
      unreadCount
    })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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

    const { notificationId, markAllRead } = await req.json()

    const profile = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 })

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: profile.id, isRead: false },
        data: { isRead: true }
      })
    } else if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
