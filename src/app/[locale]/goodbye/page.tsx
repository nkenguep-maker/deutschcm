"use client";

import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import BrandLogo from "@/components/BrandLogo";

const COPY = {
  fr: {
    title: "À bientôt.",
    subtitle: "Votre progression est sauvegardée.",
    body: "Vous faites toujours partie de l'aventure Yema. Revenez quand vous êtes prêt — votre parcours en allemand vous attend exactement là où vous l'avez laissé.",
    ctaHome: "Retour à l'accueil",
    ctaLogin: "Se reconnecter",
    comingSoon: "Bientôt disponible",
    features: [
      {
        icon: "🤖",
        name: "Yema Coach",
        desc: "Votre tuteur IA personnel. Des corrections en temps réel, des explications adaptées à votre niveau, disponible 24h/24.",
      },
      {
        icon: "🌍",
        name: "Yema Community",
        desc: "Rejoignez des milliers d'apprenants francophones. Pratiquez, échangez, progressez ensemble.",
      },
      {
        icon: "🏫",
        name: "Yema + École",
        desc: "Intégration directe avec votre établissement. Zéro friction entre la classe et la plateforme.",
      },
    ],
  },
  en: {
    title: "See you soon.",
    subtitle: "Your progress is saved.",
    body: "You're still part of the Yema journey. Come back whenever you're ready — your German path is waiting exactly where you left it.",
    ctaHome: "Back to home",
    ctaLogin: "Sign back in",
    comingSoon: "Coming soon",
    features: [
      {
        icon: "🤖",
        name: "Yema Coach",
        desc: "Your personal AI tutor. Real-time corrections, level-matched explanations, available around the clock.",
      },
      {
        icon: "🌍",
        name: "Yema Community",
        desc: "Join thousands of learners. Practice, connect, and grow your German together.",
      },
      {
        icon: "🏫",
        name: "Yema + School",
        desc: "Direct integration with your institution. Zero friction between the classroom and the platform.",
      },
    ],
  },
};

export default function GoodbyePage() {
  const locale = useLocale();
  const t = COPY[locale as "fr" | "en"] ?? COPY.fr;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s ease forwards; }
        .d1 { animation-delay: 0s; opacity: 0; }
        .d2 { animation-delay: 0.1s; opacity: 0; }
        .d3 { animation-delay: 0.2s; opacity: 0; }
        .d4 { animation-delay: 0.32s; opacity: 0; }
        .d5 { animation-delay: 0.44s; opacity: 0; }
        .d6 { animation-delay: 0.56s; opacity: 0; }
        .cta-primary:hover { background: rgba(16,185,129,0.22) !important; }
        .cta-secondary:hover { background: rgba(255,255,255,0.07) !important; }
        .feature-card:hover { border-color: rgba(16,185,129,0.25) !important; background: rgba(16,185,129,0.04) !important; }
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
          background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        {/* Logo */}
        <div className="fade-up d1" style={{ marginBottom: 56 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <BrandLogo variant="auth" />
          </Link>
        </div>

        {/* Main message */}
        <div className="fade-up d2" style={{ textAlign: "center", maxWidth: 480, marginBottom: 48 }}>
          <h1 style={{
            margin: "0 0 12px",
            color: "white",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.2rem, 5vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            {t.title}
          </h1>
          <p style={{
            margin: "0 0 20px",
            color: "#10b981",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            letterSpacing: "0.02em",
          }}>
            {t.subtitle}
          </p>
          <p style={{
            margin: 0,
            color: "rgba(255,255,255,0.68)",
            fontSize: "0.88rem",
            lineHeight: 1.7,
          }}>
            {t.body}
          </p>
        </div>

        {/* CTAs */}
        <div className="fade-up d3" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 72 }}>
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
              transition: "background 0.15s ease",
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
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.84rem",
              transition: "background 0.15s ease",
            }}
          >
            {t.ctaHome}
          </Link>
        </div>

        {/* Coming soon section */}
        <div style={{ width: "100%", maxWidth: 680 }}>
          <div className="fade-up d4" style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 20,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.18)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              <span style={{ color: "#10b981", fontSize: "0.84rem", fontWeight: 700, letterSpacing: "0.08em" }}>
                {t.comingSoon.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))", gap: 14 }}>
            {t.features.map((f, i) => (
              <div
                key={f.name}
                className={`fade-up feature-card d${i + 4}`}
                style={{
                  padding: "20px 18px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }}
              >
                <span style={{ fontSize: "1.4rem", display: "block", marginBottom: 10 }}>{f.icon}</span>
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
                  color: "rgba(255,255,255,0.62)",
                  fontSize: "0.82rem",
                  lineHeight: 1.65,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
