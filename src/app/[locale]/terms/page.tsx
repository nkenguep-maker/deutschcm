"use client"
import Link from "next/link"
import { useT } from "@/hooks/useT"

const EFFECTIVE_DATE = "15 May 2025"
const CONTACT_EMAIL = "legal@yema.app"
const COMPANY = "Yema Languages"

export default function TermsPage() {
  const isEN = typeof window !== "undefined" && window.location.pathname.startsWith("/en")
  if (!isEN) return <TermsFR />
  return <TermsEN />
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

function TermsEN() {
  return (
    <Shell title="Terms of Service">
      <P>
        By accessing or using Yema Languages (&quot;Yema&quot;, &quot;the platform&quot;), you agree to these Terms of Service.
        Please read them carefully. If you do not agree, do not use the platform.
      </P>

      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
        <strong style={{ color: "#f87171" }}>Important:</strong> Yema Languages is an independent platform and is
        not affiliated with the Goethe-Institut, TELC, TestDaF, or any official language certification body.
        Completing Yema courses does not grant any official diploma or certification. Official exams must be
        taken separately through the relevant examination bodies.
      </div>

      <H2>1. Acceptance and eligibility</H2>
      <P>
        You must be at least 16 years old to use Yema. By creating an account, you confirm you meet this requirement
        and that the information you provide is accurate.
      </P>

      <H2>2. Account</H2>
      <Ul items={[
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You may not share your account or allow others to access it.",
        "Notify us immediately at legal@yema.app if you suspect unauthorized access.",
        "One account per person. Multiple accounts may be suspended.",
      ]} />

      <H2>3. Free and paid plans</H2>
      <P>
        Yema offers a free plan with access to A1 content, and premium plans with expanded access.
        Paid subscriptions are processed via Mobile Money (MTN MoMo / Orange Money). Prices are displayed in XAF.
      </P>
      <Ul items={[
        "Subscriptions renew monthly unless cancelled.",
        "No refunds after 48 hours of a billing period starting, except where required by law.",
        "Yema reserves the right to change pricing with 30 days notice.",
      ]} />

      <H2>4. Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul items={[
        "Use the platform for any unlawful purpose",
        "Attempt to reverse-engineer, scrape, or copy platform content at scale",
        "Share class access codes publicly or sell access to others",
        "Upload content that is illegal, harmful, or infringes third-party rights",
        "Impersonate teachers, centers, or platform staff",
      ]} />

      <H2>5. AI features and content</H2>
      <P>
        Yema uses AI (Google Gemini, speech recognition APIs) to generate learning content, correct writing,
        and simulate embassy interviews. AI-generated content may contain errors. Yema does not guarantee the
        accuracy or completeness of AI outputs. Do not rely solely on Yema for official exam preparation
        without consulting licensed educators.
      </P>

      <H2>6. No certification guarantee</H2>
      <P>
        Yema prepares learners for German language proficiency exams (CEFR A1–C1) but does not administer,
        issue, or guarantee any official language certificate. Goethe-Zertifikat, TELC, TestDaF and similar
        certifications are issued by independent bodies. Yema is not affiliated with any of these organizations.
      </P>

      <H2>7. User content</H2>
      <P>
        When you submit content (text responses, audio recordings) through Yema features, you grant Yema a
        limited, non-exclusive license to process this content for the purpose of providing the service.
        Audio is not stored after processing. You retain ownership of your content.
      </P>

      <H2>8. Availability and modifications</H2>
      <Ul items={[
        "Yema is provided 'as is' during beta. We aim for 99% uptime but make no guarantees.",
        "We may modify, suspend, or discontinue features with reasonable notice.",
        "Yema is currently in public beta — some features may be incomplete.",
      ]} />

      <H2>9. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, {COMPANY} shall not be liable for indirect, incidental,
        or consequential damages arising from your use of the platform, including but not limited to failed
        visa applications or exam results. Your use of Yema is at your own risk.
      </P>

      <H2>10. Governing law</H2>
      <P>
        These Terms are governed by the laws of Cameroon. Disputes shall be resolved in the courts of Yaoundé,
        Cameroon, unless applicable law requires otherwise.
      </P>

      <H2>11. Account deletion</H2>
      <P>
        You may delete your account at any time from your settings. Upon deletion, your personal data will be
        erased within 30 days as described in our Privacy Policy.
      </P>

      <H2>12. Changes to these Terms</H2>
      <P>
        We may update these Terms. Material changes will be communicated by email or in-app notification at
        least 14 days before they take effect. Continued use constitutes acceptance.
      </P>
    </Shell>
  )
}

function TermsFR() {
  return (
    <Shell title="Conditions d'utilisation">
      <P>
        En accédant à Yema Languages (&quot;Yema&quot;, &quot;la plateforme&quot;), vous acceptez les présentes
        Conditions d'utilisation. Si vous n'êtes pas d'accord, n'utilisez pas la plateforme.
      </P>

      <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
        <strong style={{ color: "#f87171" }}>Important :</strong> Yema Languages est une plateforme indépendante,
        non affiliée au Goethe-Institut, TELC, TestDaF ou tout autre organisme de certification officiel.
        Compléter les cours Yema ne confère aucun diplôme officiel. Les examens officiels doivent être passés
        séparément auprès des organismes compétents.
      </div>

      <H2>1. Acceptation et éligibilité</H2>
      <P>
        Vous devez avoir au moins 16 ans pour utiliser Yema. En créant un compte, vous confirmez remplir cette
        condition et que les informations fournies sont exactes.
      </P>

      <H2>2. Compte</H2>
      <Ul items={[
        "Vous êtes responsable de la confidentialité de vos identifiants.",
        "Vous ne pouvez pas partager votre compte.",
        "Signalez toute utilisation non autorisée à legal@yema.app.",
        "Un seul compte par personne. Les comptes multiples peuvent être suspendus.",
      ]} />

      <H2>3. Plans gratuit et payants</H2>
      <P>
        Yema propose un plan gratuit (A1) et des plans premium. Les abonnements sont traités via Mobile Money
        (MTN MoMo / Orange Money). Les prix sont en XAF.
      </P>
      <Ul items={[
        "Les abonnements se renouvellent mensuellement sauf résiliation.",
        "Pas de remboursement après 48h du début d'une période, sauf obligation légale.",
        "Yema se réserve le droit de modifier les tarifs avec 30 jours de préavis.",
      ]} />

      <H2>4. Utilisation acceptable</H2>
      <Ul items={[
        "Ne pas utiliser la plateforme à des fins illégales.",
        "Ne pas copier ou extraire le contenu de la plateforme à grande échelle.",
        "Ne pas partager publiquement les codes de classe ou les revendre.",
        "Ne pas télécharger de contenu illégal ou portant atteinte aux droits tiers.",
      ]} />

      <H2>5. Fonctionnalités IA</H2>
      <P>
        Yema utilise des APIs IA (Gemini, reconnaissance vocale) pour générer du contenu, corriger les écrits
        et simuler des entretiens consulaires. Les contenus générés par IA peuvent contenir des erreurs.
        Yema ne garantit pas leur exactitude.
      </P>

      <H2>6. Aucune garantie de certification</H2>
      <P>
        Yema prépare aux examens de langue allemande (CEFR A1–C1) mais ne délivre, n'administre ni ne garantit
        aucun certificat officiel. Les examens officiels (Goethe-Zertifikat, TELC, etc.) sont délivrés par des
        organismes indépendants. Yema n'est affilié à aucun de ces organismes.
      </P>

      <H2>7. Suppression de compte</H2>
      <P>
        Vous pouvez supprimer votre compte à tout moment depuis vos paramètres. Vos données personnelles seront
        effacées dans les 30 jours suivant la suppression, conformément à notre Politique de confidentialité.
      </P>

      <H2>8. Droit applicable</H2>
      <P>
        Les présentes Conditions sont régies par le droit camerounais. Les litiges seront portés devant les
        tribunaux compétents de Yaoundé, Cameroun.
      </P>

      <H2>9. Modifications</H2>
      <P>
        Nous pouvons modifier ces Conditions. Les modifications importantes seront communiquées 14 jours à
        l'avance. La poursuite de l'utilisation vaut acceptation.
      </P>
    </Shell>
  )
}
