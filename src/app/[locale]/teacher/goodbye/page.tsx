"use client";

import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import BrandLogo from "@/components/BrandLogo";

const COPY = {
  fr: {
    title: "À bientôt.",
    subtitle: "Votre accompagnement compte. Revenez quand vous voulez continuer à guider vos apprenants.",
    body: "Yema garde votre espace prêt : vos classes, vos corrections et vos prochaines actions vous attendront.",
    trustLine: "L'IA assiste. Vous guidez.",
    ctaLogin: "Se reconnecter",
    ctaHome: "Retour à l'accueil",
    comingSoonTitle: "Bientôt pour les enseignants",
    comingSoon: "Bientôt",
    features: [
      {
        icon: "📊",
        name: "Impact enseignant",
        desc: "Un espace pour montrer les progrès observés, les feedbacks validés et les apprenants accompagnés.",
      },
      {
        icon: "🎓",
        name: "Studio pédagogique",
        desc: "Préparez des brouillons d'activités avec l'aide de l'IA, puis adaptez-les avant publication.",
      },
      {
        icon: "📚",
        name: "Ressources enseignants",
        desc: "Des supports pour motiver les apprenants, préparer vos cours et gagner du temps.",
      },
    ],
  },
  en: {
    title: "See you soon.",
    subtitle: "Your guidance matters. Come back whenever you are ready to continue supporting your learners.",
    body: "Yema keeps your space ready: your classes, corrections and next actions will be waiting.",
    trustLine: "AI assists. You guide.",
    ctaLogin: "Log in again",
    ctaHome: "Back to home",
    comingSoonTitle: "Coming soon for teachers",
    comingSoon: "Coming soon",
    features: [
      {
        icon: "📊",
        name: "Teacher impact",
        desc: "A space to show observed progress, reviewed feedback and learners guided.",
      },
      {
        icon: "🎓",
        name: "Teaching studio",
        desc: "Prepare draft activities with AI support, then adapt them before publishing.",
      },
      {
        icon: "📚",
        name: "Teacher resources",
        desc: "Materials to motivate learners, prepare lessons and save time.",
      },
    ],
  },
};

export default function TeacherGoodbyePage() {
  const locale = useLocale();
  const t = COPY[locale as "fr" | "en"] ?? COPY.fr;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp var(--dur-moment) var(--ease-enter) forwards; }
        .d1 { animation-delay: 0s;    opacity: 0; }
        .d2 { animation-delay: 0.1s;  opacity: 0; }
        .d3 { animation-delay: 0.2s;  opacity: 0; }
        .d4 { animation-delay: 0.32s; opacity: 0; }
        .d5 { animation-delay: 0.44s; opacity: 0; }
        .d6 { animation-delay: 0.56s; opacity: 0; }
        .cta-primary:hover  { background: rgba(16,185,129,0.22) !important; }
        .cta-secondary:hover { background: rgba(255,255,255,0.07) !important; }
        .feature-card:hover { border-color: rgba(16,185,129,0.22) !important; background: rgba(16,185,129,0.04) !important; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#080c10",
        fontFamily: "'DM Mono', monospace",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "flex-start", padding: "60px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>

        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.07), transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        {/* Logo */}
        <div className="fade-up d1" style={{ marginBottom: 52 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <BrandLogo variant="auth" />
          </Link>
        </div>

        {/* Teacher identity badge */}
        <div className="fade-up d1" style={{ marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 20,
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
          }}>
            <span style={{ fontSize: "0.85rem" }}>👨‍🏫</span>
            <span style={{ color: "#10b981", fontSize: "0.7rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              {t.trustLine}
            </span>
          </div>
        </div>

        {/* Main message */}
        <div className="fade-up d2" style={{ textAlign: "center", maxWidth: 500, marginBottom: 48 }}>
          <h1 style={{
            margin: "0 0 14px",
            color: "white",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.4rem, 5vw, 3.2rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            {t.title}
          </h1>
          <p style={{
            margin: "0 0 16px",
            color: "#10b981",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}>
            {t.subtitle}
          </p>
          <p style={{
            margin: 0,
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.85rem",
            lineHeight: 1.7,
          }}>
            {t.body}
          </p>
        </div>

        {/* CTAs */}
        <div className="fade-up d3" style={{
          display: "flex", gap: 12, flexWrap: "wrap",
          justifyContent: "center", marginBottom: 72,
        }}>
          <Link
            href="/login"
            className="cta-primary"
            style={{
              padding: "12px 28px", borderRadius: 12, textDecoration: "none",
              background: "rgba(16,185,129,0.14)",
              border: "1px solid rgba(16,185,129,0.35)",
              color: "#10b981",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              transition: "background var(--dur-touch) var(--ease-enter)",
            }}
          >
            {t.ctaLogin}
          </Link>
          <Link
            href="/"
            className="cta-secondary"
            style={{
              padding: "12px 28px", borderRadius: 12, textDecoration: "none",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.84rem",
              transition: "background var(--dur-touch) var(--ease-enter)",
            }}
          >
            {t.ctaHome}
          </Link>
        </div>

        {/* Coming soon section */}
        <div style={{ width: "100%", maxWidth: 700 }}>

          {/* Section header */}
          <div className="fade-up d4" style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 16px", borderRadius: 20,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
              <span style={{
                color: "#818cf8", fontSize: "0.7rem",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: "0.08em",
              }}>
                {t.comingSoonTitle.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))", gap: 14 }}>
            {t.features.map((f, i) => (
              <div
                key={f.name}
                className={`fade-up feature-card d${i + 4}`}
                style={{
                  padding: "22px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "background var(--dur-touch) var(--ease-enter), border-color var(--dur-touch) var(--ease-enter)",
                  position: "relative",
                }}
              >
                {/* Coming soon badge */}
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  padding: "2px 8px", borderRadius: 6,
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                  color: "#818cf8", fontSize: "0.55rem",
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                }}>
                  {t.comingSoon}
                </div>

                <span style={{ fontSize: "1.4rem", display: "block", marginBottom: 12 }}>{f.icon}</span>
                <p style={{
                  margin: "0 0 8px",
                  color: "white",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                }}>
                  {f.name}
                </p>
                <p style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "0.75rem",
                  lineHeight: 1.65,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Footer trust */}
          <div className="fade-up d6" style={{ marginTop: 48, textAlign: "center" }}>
            <p style={{
              color: "rgba(255,255,255,0.16)", fontSize: "0.65rem",
              fontFamily: "'DM Mono', monospace",
            }}>
              Yema · {locale === "fr" ? "Votre espace vous attend." : "Your space is waiting for you."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
