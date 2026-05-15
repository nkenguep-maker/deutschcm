"use client"
import Link from "next/link"
import { useT } from "@/hooks/useT"

const EFFECTIVE_DATE = "15 May 2025"
const CONTACT_EMAIL = "privacy@yema.app"
const COMPANY = "Yema Languages"

export default function PrivacyPage() {
  const { nav: tNav } = useT()
  const isEN = typeof window !== "undefined" && window.location.pathname.startsWith("/en")

  if (!isEN) return <PrivacyFR />
  return <PrivacyEN />
}

function Shell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#060d09", color: "white", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}>
        <Link href="/" style={{ color: "#10b981", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 40 }}>
          ← Back to Yema
        </Link>
        <div style={{ borderBottom: "1px solid rgba(16,185,129,0.15)", paddingBottom: 32, marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: "#10b981", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
            Legal
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{title}</h1>
          <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            Effective: {EFFECTIVE_DATE} · Last updated: {EFFECTIVE_DATE}
          </p>
        </div>
        <div style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.8)", fontSize: 15 }}>
          {children}
        </div>
        <div style={{ marginTop: 60, padding: "24px", borderRadius: 12, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Questions? Contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#10b981" }}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      </div>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.15rem", marginTop: 40, marginBottom: 12 }}>{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 16px" }}>{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, margin: "0 0 16px" }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
    </ul>
  )
}

function PrivacyEN() {
  return (
    <Shell title="Privacy Policy">
      <P>
        {COMPANY} (&quot;Yema&quot;, &quot;we&quot;, &quot;us&quot;) is committed to protecting your personal data.
        This Privacy Policy explains what data we collect, how we use it, and your rights — in compliance with
        Cameroon Law No. 2024/017 on Personal Data Protection and GDPR best practices.
      </P>
      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
        <strong style={{ color: "#10b981" }}>Independence notice:</strong> Yema Languages is an independent
        language learning platform and is not affiliated with, endorsed by, or officially connected to the
        Goethe-Institut or any official certification body.
      </div>

      <H2>1. Data we collect</H2>
      <P>When you use Yema, we may collect:</P>
      <Ul items={[
        "Account data: name, email address, chosen role (student, teacher, center manager)",
        "Learning data: lesson progress, quiz scores, XP points, streak, badge history",
        "Voice & audio data: audio recordings submitted during pronunciation exercises and embassy simulator sessions — processed in real time and not stored permanently",
        "Usage data: pages visited, features used, session duration (via anonymized analytics)",
        "Payment data: Mobile Money transaction references — processed by MTN / Orange Money, not stored by Yema",
        "Device data: browser type, operating system, approximate country (via IP, not stored)",
      ]} />

      <H2>2. How we use your data</H2>
      <Ul items={[
        "Provide and improve the learning platform",
        "Personalize your learning experience",
        "Process AI-powered voice analysis and writing correction",
        "Send account-related emails (confirmation, notifications) — with your consent",
        "Generate anonymous platform usage statistics",
        "Comply with legal obligations",
      ]} />

      <H2>3. AI and voice processing</H2>
      <P>
        The Embassy Simulator and Voice Recognition features process audio input using third-party AI APIs
        (Google Cloud Speech, Gemini). Audio is transmitted securely via HTTPS and is not stored after processing.
        By using these features, you consent to this real-time processing.
      </P>

      <H2>4. Data sharing</H2>
      <P>We do not sell your personal data. We may share data with:</P>
      <Ul items={[
        "Supabase (database and authentication infrastructure, hosted in the EU)",
        "Google Cloud / Gemini API (AI features — data not used to train models)",
        "Vercel (hosting infrastructure)",
        "Your teacher or center manager (learning progress only, if you are enrolled in a class)",
      ]} />

      <H2>5. Data retention</H2>
      <Ul items={[
        "Account data: retained while your account is active",
        "Learning data: retained for 36 months after last activity",
        "Voice recordings: deleted immediately after processing (not stored)",
        "Deleted accounts: all personal data erased within 30 days of deletion request",
      ]} />

      <H2>6. Your rights</H2>
      <P>You have the right to:</P>
      <Ul items={[
        "Access your personal data",
        "Correct inaccurate data",
        "Delete your account and all associated data",
        "Withdraw consent for email notifications or analytics at any time",
        "Request a copy of your data (data portability)",
        "Lodge a complaint with Cameroon's personal data protection authority",
      ]} />
      <P>
        To exercise these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#10b981" }}>{CONTACT_EMAIL}</a> or
        use the &quot;Delete my account&quot; option in your account settings.
      </P>

      <H2>7. Cookies and analytics</H2>
      <P>
        Yema uses minimal, privacy-respecting analytics (no cross-site tracking). We do not use advertising cookies.
        Session cookies are required for authentication. You can disable non-essential cookies in your browser.
      </P>

      <H2>8. Children</H2>
      <P>
        Yema is not directed at children under 16. If you believe a child has provided us with personal data
        without parental consent, please contact us immediately.
      </P>

      <H2>9. Changes to this policy</H2>
      <P>
        We may update this policy. We will notify you by email for material changes. Continued use of Yema
        after changes constitutes acceptance.
      </P>
    </Shell>
  )
}

function PrivacyFR() {
  return (
    <Shell title="Politique de confidentialité">
      <P>
        {COMPANY} (&quot;Yema&quot;, &quot;nous&quot;) s'engage à protéger vos données personnelles.
        Cette politique explique les données collectées, leur utilisation et vos droits — conformément à
        la Loi camerounaise n°2024/017 sur la protection des données personnelles et aux bonnes pratiques RGPD.
      </P>
      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
        <strong style={{ color: "#10b981" }}>Notice d'indépendance :</strong> Yema Languages est une plateforme
        d'apprentissage indépendante, non affiliée au Goethe-Institut ni à aucun organisme de certification officiel.
      </div>

      <H2>1. Données collectées</H2>
      <Ul items={[
        "Données de compte : nom, email, rôle (élève, enseignant, responsable de centre)",
        "Données d'apprentissage : progression, scores, XP, streak, badges",
        "Données vocales : enregistrements audio traités en temps réel lors des exercices de prononciation et du simulateur — non stockés",
        "Données d'utilisation : pages visitées, fonctionnalités utilisées (analytics anonymisés)",
        "Données de paiement : références Mobile Money traitées par MTN/Orange, non stockées par Yema",
      ]} />

      <H2>2. Utilisation des données</H2>
      <Ul items={[
        "Fournir et améliorer la plateforme",
        "Personnaliser votre apprentissage",
        "Traitement IA (voix, écriture) — avec votre consentement",
        "Envoi d'emails liés au compte (avec votre accord)",
        "Statistiques anonymes d'utilisation",
        "Respect des obligations légales",
      ]} />

      <H2>3. Traitement IA et voix</H2>
      <P>
        Le simulateur ambassade et la reconnaissance vocale utilisent des APIs IA tierces (Google Cloud, Gemini).
        L'audio est transmis en HTTPS et non stocké après traitement. En utilisant ces fonctionnalités, vous consentez à ce traitement.
      </P>

      <H2>4. Vos droits</H2>
      <Ul items={[
        "Accéder à vos données",
        "Corriger vos données",
        "Supprimer votre compte et toutes les données associées",
        "Retirer votre consentement aux emails ou analytics",
        "Demander une copie de vos données (portabilité)",
        "Déposer une réclamation auprès de l'autorité compétente au Cameroun",
      ]} />
      <P>
        Contactez-nous à <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#10b981" }}>{CONTACT_EMAIL}</a> ou
        utilisez l'option &quot;Supprimer mon compte&quot; dans vos paramètres.
      </P>

      <H2>5. Conservation des données</H2>
      <Ul items={[
        "Données de compte : conservées tant que le compte est actif",
        "Données d'apprentissage : conservées 36 mois après dernière activité",
        "Enregistrements vocaux : supprimés immédiatement après traitement",
        "Comptes supprimés : toutes données effacées dans les 30 jours",
      ]} />

      <H2>6. Modifications</H2>
      <P>
        Nous pouvons mettre à jour cette politique. Pour les modifications importantes, vous serez notifié par email.
        La poursuite de l'utilisation de Yema vaut acceptation.
      </P>
    </Shell>
  )
}
