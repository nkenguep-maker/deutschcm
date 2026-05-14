import { Resend } from "resend"

export interface EmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(params: EmailParams) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { data, error } = await resend.emails.send({
      from: params.from || "Yema <noreply@deutschcm.vercel.app>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    if (error) throw error
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("Resend error:", err)
    return { success: false, error: String(err) }
  }
}

// ─── Templates email ──────────────────────────────────────

export function emailWelcome(name: string, role: string): string {
  const roleLabel: Record<string, string> = {
    STUDENT: "apprenant", TEACHER: "enseignant", CENTER_MANAGER: "responsable de centre"
  }
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#080c10;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:48px;margin-bottom:8px"></div>
      <div style="font-size:28px;font-weight:900;color:white">
        Yema
      </div>
    </div>

    <!-- Card -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.2);border-radius:20px;padding:32px">
      <h1 style="color:white;font-size:24px;font-weight:800;margin:0 0 12px">
        Willkommen, ${name}! 🎉
      </h1>
      <p style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.7;margin:0 0 20px">
        Votre compte ${roleLabel[role] || "utilisateur"} Yema est créé avec succès.
        Commencez votre voyage linguistique dès maintenant !
      </p>

      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:16px;margin-bottom:24px">
        <p style="color:#10b981;font-size:13px;font-weight:700;margin:0 0 8px">🎯 Vos premiers pas :</p>
        <ul style="color:rgba(255,255,255,0.6);font-size:13px;line-height:1.8;margin:0;padding-left:16px">
          <li>Complétez votre profil</li>
          <li>Passez le test de niveau gratuit</li>
          <li>Commencez la Lektion 1 — Guten Tag!</li>
          <li>Essayez le simulateur ambassade IA</li>
        </ul>
      </div>

      <a href="https://deutschcm.vercel.app/dashboard"
        style="display:block;text-align:center;padding:14px 28px;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px">
        🚀 Accéder à mon espace
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px">
      <p style="color:rgba(255,255,255,0.25);font-size:11px">
        Yema · Fait avec ❤️ au Cameroun 🇨🇲<br>
        <a href="https://deutschcm.vercel.app" style="color:#10b981">deutschcm.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export function emailJoinRequest(
  teacherName: string,
  studentName: string,
  className: string,
  message: string,
  acceptUrl: string,
  refuseUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080c10;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:36px;margin-bottom:4px"></div>
      <div style="font-size:22px;font-weight:900;color:white">Yema</div>
    </div>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.2);border-radius:20px;padding:28px">
      <h2 style="color:white;font-size:20px;margin:0 0 12px">📩 Nouvelle demande d'inscription</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 16px">
        Bonjour ${teacherName},<br><br>
        <strong style="color:white">${studentName}</strong> souhaite rejoindre votre classe
        <strong style="color:#10b981">${className}</strong>.
      </p>
      ${message ? `
      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;margin-bottom:20px">
        <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 4px">MESSAGE DE L'ÉLÈVE</p>
        <p style="color:rgba(255,255,255,0.7);font-size:13px;font-style:italic;margin:0">"${message}"</p>
      </div>` : ""}
      <div style="display:flex;gap:10px">
        <a href="${acceptUrl}" style="flex:1;display:block;text-align:center;padding:12px;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px">
          ✅ Accepter
        </a>
        <a href="${refuseUrl}" style="flex:1;display:block;text-align:center;padding:12px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#ef4444;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px">
          ❌ Refuser
        </a>
      </div>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:11px;margin-top:20px">
      Yema · <a href="https://deutschcm.vercel.app" style="color:#10b981">deutschcm.vercel.app</a>
    </p>
  </div>
</body>
</html>`
}

export function emailRequestAccepted(
  studentName: string,
  teacherName: string,
  className: string,
  classUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080c10;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:48px;margin-bottom:8px">🎉</div>
      <div style="font-size:22px;font-weight:900;color:white">Yema</div>
    </div>
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.25);border-radius:20px;padding:28px">
      <h2 style="color:#10b981;font-size:22px;margin:0 0 12px">✅ Demande acceptée !</h2>
      <p style="color:rgba(255,255,255,0.65);font-size:14px;line-height:1.7;margin:0 0 20px">
        Bonjour ${studentName},<br><br>
        <strong style="color:white">Prof. ${teacherName}</strong> a accepté votre demande
        pour rejoindre la classe <strong style="color:#10b981">${className}</strong>.<br><br>
        Vous pouvez maintenant accéder à tous les cours et exercices de la classe !
      </p>
      <a href="${classUrl}" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px">
        🎓 Accéder à ma classe
      </a>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:11px;margin-top:20px">
      Yema · <a href="https://deutschcm.vercel.app" style="color:#10b981">deutschcm.vercel.app</a>
    </p>
  </div>
</body>
</html>`
}

export function emailStreakReminder(name: string, streak: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080c10;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:56px;margin-bottom:8px">🔥</div>
      <div style="font-size:22px;font-weight:900;color:white">Yema</div>
    </div>
    <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:20px;padding:28px;text-align:center">
      <h2 style="color:#f59e0b;font-size:22px;margin:0 0 8px">Ne perdez pas votre streak !</h2>
      <p style="color:rgba(255,255,255,0.65);font-size:14px;line-height:1.7;margin:0 0 16px">
        Bonjour ${name},<br><br>
        Vous avez une série de <strong style="color:#f59e0b">${streak} jours</strong> consécutifs !
        Connectez-vous aujourd'hui pour ne pas la perdre.
      </p>
      <div style="font-size:48px;margin-bottom:16px">🔥 × ${streak}</div>
      <a href="https://deutschcm.vercel.app/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px">
        ⚡ Continuer ma série
      </a>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:11px;margin-top:20px">
      Yema · <a href="https://deutschcm.vercel.app" style="color:#10b981">deutschcm.vercel.app</a>
    </p>
  </div>
</body>
</html>`
}

export function emailBadgeEarned(name: string, badgeName: string, badgeIcon: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080c10;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:64px;margin-bottom:8px">${badgeIcon}</div>
      <div style="font-size:22px;font-weight:900;color:white">Yema</div>
    </div>
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.25);border-radius:20px;padding:28px;text-align:center">
      <h2 style="color:#10b981;font-size:22px;margin:0 0 8px">🏆 Nouveau badge débloqué !</h2>
      <p style="color:rgba(255,255,255,0.65);font-size:14px;line-height:1.7;margin:0 0 16px">
        Félicitations ${name} !<br>
        Vous avez obtenu le badge <strong style="color:white">"${badgeName}"</strong>.
      </p>
      <div style="font-size:72px;margin:16px 0">${badgeIcon}</div>
      <a href="https://deutschcm.vercel.app/progress" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px">
        🏆 Voir mes badges
      </a>
    </div>
    <p style="text-align:center;color:rgba(255,255,255,0.2);font-size:11px;margin-top:20px">
      Yema · <a href="https://deutschcm.vercel.app" style="color:#10b981">deutschcm.vercel.app</a>
    </p>
  </div>
</body>
</html>`
}
