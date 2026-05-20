"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { usePathname } from "next/navigation";
import Layout from "@/components/Layout";
import { useT } from "@/hooks/useT";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Analytics {
  xpTotal: number; streakDays: number; completedModules: number;
  avgQuizScore: number; totalBadges: number; level?: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PillarCard({ label, desc, color, badge }: {
  label: string; desc: string; color: string; badge: string | null;
}) {
  return (
    <div style={{
      flex: 1, padding: "18px 16px", borderRadius: 16,
      background: badge ? "rgba(255,255,255,0.02)" : `${color}08`,
      border: `1px solid ${badge ? "rgba(255,255,255,0.07)" : color + "25"}`,
      opacity: badge ? 0.75 : 1,
    }}>
      <p style={{ margin: "0 0 8px", color: badge ? "rgba(255,255,255,0.45)" : color, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
        {label}
      </p>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.38)", fontSize: "0.73rem", lineHeight: 1.55 }}>
        {desc}
      </p>
      {badge && (
        <span style={{ display: "inline-block", marginTop: 10, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontSize: "0.58rem", padding: "2px 8px", borderRadius: 6, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function ActionCard({ title, text, cta, href, accent }: {
  title: string; text: string; cta: string; href: string; accent: string;
}) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(href)}
      style={{
        flex: 1, padding: "20px 18px", borderRadius: 18, cursor: "pointer",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", gap: 10,
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${accent}33`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
    >
      <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
        {title}
      </p>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", lineHeight: 1.55, flex: 1 }}>
        {text}
      </p>
      <span style={{ color: accent, fontSize: "0.78rem", fontWeight: 600 }}>
        {cta} →
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" as const : "fr" as const;
  const { dashboard: t, nav: tn } = useT();

  const [userData, setUserData] = useState<{
    fullName?: string; germanLevel?: string | null; xpTotal?: number; streakDays?: number;
    city?: string | null; studentType?: string; isValidated?: boolean;
  } | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d) setUserData(d);
    }).catch(() => {});

    fetch("/api/analytics?type=student")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success && d.data?.overview) setAnalytics(d.data.overview); })
      .catch(() => {});
  }, []);

  const firstName = userData?.fullName?.split(" ")[0] ?? "";
  const level = analytics?.level ?? userData?.germanLevel ?? null;
  const xp = analytics?.xpTotal ?? userData?.xpTotal ?? 0;
  const streak = analytics?.streakDays ?? userData?.streakDays ?? 0;

  // Smart CTA logic
  const hasLevel = !!level;
  const hasLessons = analytics ? analytics.completedModules > 0 : false;
  const nextStepTitle = !hasLevel ? t.nextStep1Title : !hasLessons ? t.nextStep2Title : t.nextStep3Title;
  const nextStepText = !hasLevel ? t.nextStep1Text : !hasLessons ? t.nextStep2Text : t.nextStep3Text;
  const nextStepCTA = !hasLevel ? t.nextStep1CTA : !hasLessons ? t.nextStep2CTA : t.nextStep3CTA;
  const nextStepHref = !hasLevel ? "/test-niveau" : "/courses";

  const pillars = [
    { label: t.pillar1Label, desc: t.pillar1Desc, color: "#10b981", badge: null },
    { label: t.pillar2Label, desc: t.pillar2Desc, color: "#6366f1", badge: null },
    { label: t.pillar3Label, desc: t.pillar3Desc, color: "rgba(255,255,255,0.2)", badge: t.pillar3Badge },
  ];

  const headerTitle = firstName ? `${t.greetReturn} ${firstName}` : t.greetReturn;

  return (
    <Layout title={tn.home}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      {/* ── 1. Human welcome ── */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{
          padding: isMobile ? "22px 18px" : "28px 32px", borderRadius: 20,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <h2 style={{ margin: "0 0 6px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? "1.5rem" : "1.8rem", lineHeight: 1.15 }}>
            {headerTitle}
          </h2>
          <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            {t.greetSubtitleReturn}
          </p>
          <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.32)", fontSize: "0.78rem", lineHeight: 1.55 }}>
            {t.greetEmotional}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
            }}>
              <span style={{ fontSize: "0.75rem" }}>✦</span>
              <span style={{ color: "#34d399", fontSize: "0.78rem", fontWeight: 600 }}>{t.encouragementPill}</span>
            </div>
            {streak > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 20,
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
              }}>
                <span style={{ fontSize: "0.75rem" }}>🔥</span>
                <span style={{ color: "#f59e0b", fontSize: "0.78rem" }}>{streak} {t.streakActive}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Next step card (dominant) ── */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{
          padding: isMobile ? "22px 18px" : "28px 32px", borderRadius: 20,
          background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)",
          border: "1px solid rgba(16,185,129,0.22)",
        }}>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
            {t.nextStepCardTitle}
          </p>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 18 : 28, justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 8px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: isMobile ? "1.1rem" : "1.25rem" }}>
                {nextStepTitle}
              </h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                {nextStepText}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "stretch" : "flex-end", gap: 10, flexShrink: 0, width: isMobile ? "100%" : "auto" }}>
              <button
                onClick={() => router.push(nextStepHref)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 24px", borderRadius: 14, cursor: "pointer",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none", color: "white",
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem",
                  boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                }}
              >
                {nextStepCTA} →
              </button>
              <a
                href={`/${locale}/progress`}
                style={{
                  textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem",
                  textDecoration: "none", fontFamily: "'DM Mono', monospace",
                }}
              >
                {t.progressViewProgress}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Three Yema pillars ── */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{ borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
              {t.journeyTitle}
            </p>
          </div>
          <div style={{ padding: "16px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            {pillars.map(p => (
              <PillarCard key={p.label} label={p.label} desc={p.desc} color={p.color} badge={p.badge} />
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Three action cards ── */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14 }}>
          <ActionCard
            title={t.actionLearnTitle}
            text={t.actionLearnText}
            cta={t.actionLearnCTA}
            href="/courses"
            accent="#10b981"
          />
          <ActionCard
            title={t.actionPracticeTitle}
            text={t.actionPracticeText}
            cta={t.actionPracticeCTA}
            href="/simulateur"
            accent="#6366f1"
          />
          <ActionCard
            title={t.actionSupportTitle}
            text={t.actionSupportText}
            cta={t.actionSupportCTA}
            href="/classroom"
            accent="#f59e0b"
          />
        </div>
      </div>

      {/* ── 5. Community coming soon (soft note) ── */}
      <div className="fade-up" style={{ marginBottom: 8 }}>
        <div style={{
          padding: "20px 24px", borderRadius: 18,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
          opacity: 0.75,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: "1.2rem" }}>🌍</span>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>
              {t.communityTitle}
            </p>
          </div>
          <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.35)", fontSize: "0.73rem", lineHeight: 1.55 }}>
            {t.communityText}
          </p>
          <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontSize: "0.6rem", padding: "3px 10px", borderRadius: 6, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
            {t.pillar3Badge}
          </span>
        </div>
      </div>

    </Layout>
  );
}
