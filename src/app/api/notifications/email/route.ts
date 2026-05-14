import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  sendEmail,
  emailWelcome,
  emailJoinRequest,
  emailRequestAccepted,
  emailStreakReminder,
  emailBadgeEarned
} from "@/lib/resend"

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

    const body = await req.json()
    const { type, to, data } = body

    let result

    switch (type) {
      case "welcome":
        result = await sendEmail({
          to,
          subject: `Bienvenue sur DeutschCM, ${data.name}! 🇩🇪`,
          html: emailWelcome(data.name, data.role)
        })
        break

      case "join_request":
        result = await sendEmail({
          to,
          subject: `📩 ${data.studentName} veut rejoindre votre classe`,
          html: emailJoinRequest(
            data.teacherName,
            data.studentName,
            data.className,
            data.message,
            data.acceptUrl,
            data.refuseUrl
          )
        })
        break

      case "request_accepted":
        result = await sendEmail({
          to,
          subject: `✅ Votre demande pour ${data.className} a été acceptée !`,
          html: emailRequestAccepted(
            data.studentName,
            data.teacherName,
            data.className,
            data.classUrl
          )
        })
        break

      case "streak_reminder":
        result = await sendEmail({
          to,
          subject: `🔥 Ne perdez pas votre série de ${data.streak} jours !`,
          html: emailStreakReminder(data.name, data.streak)
        })
        break

      case "badge_earned":
        result = await sendEmail({
          to,
          subject: `🏆 Nouveau badge : ${data.badgeName} !`,
          html: emailBadgeEarned(data.name, data.badgeName, data.badgeIcon)
        })
        break

      default:
        return NextResponse.json({ error: "Type d'email inconnu" }, { status: 400 })
    }

    return NextResponse.json({ success: result.success, id: result.id })

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
