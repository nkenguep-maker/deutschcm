"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { usePathname } from "next/navigation";
import Layout from "@/components/Layout";
import { useT } from "@/hooks/useT";
import { SCENARIOS as SIM_SCENARIOS } from "@/types/ambassade";
import type { AmbassadeScenario } from "@/types/ambassade";

// ─── Scenario locale overrides ────────────────────────────────────────────────

const SCENARIO_OVERRIDES: Record<"fr" | "en", Record<string, { label: string; description: string }>> = {
  fr: {
    visa_etudiant:  { label: "Visa étudiant",          description: "Pratique pour vos études en Allemagne" },
    visa_travail:   { label: "Visa de travail",         description: "Simulation pour un emploi qualifié" },
    visa_touriste:  { label: "Court séjour",            description: "Voyage et découverte" },
    visa_famille:   { label: "Regroupement familial",   description: "Rejoindre votre famille en Allemagne" },
    renouvellement: { label: "Renouvellement de titre", description: "Prolonger votre séjour" },
  },
  en: {
    visa_etudiant:  { label: "Student visa",            description: "Practice for studying in Germany" },
    visa_travail:   { label: "Work visa",               description: "Simulation for a skilled job application" },
    visa_touriste:  { label: "Short stay",              description: "Travel and discovery" },
    visa_famille:   { label: "Family reunification",    description: "Join your family in Germany" },
    renouvellement: { label: "Permit renewal",          description: "Extend your stay" },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Badge { id: string; icon: string; label: string; earned: boolean }
interface Analytics {
  xpTotal: number; streakDays: number; completedModules: number;
  avgQuizScore: number; totalBadges: number; level?: string | null;
  skillScores?: { lesen?: number; hoeren?: number; sprechen?: number; schreiben?: number; grammatik?: number };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LevelBar({ level, percent, currentLabel, towardsLabel, confirmLabel }: {
  level: string | null; percent: number;
  currentLabel: string; towardsLabel: string; confirmLabel: string;
}) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(level ? percent : 0), 300);
    return () => clearTimeout(timer);
  }, [percent, level]);

  const displayLevel = level ?? confirmLabel;
  const nextLevel = level === "A1" ? "A2" : level === "A2" ? "B1" : level === "B1" ? "B2" : level === "B2" ? "C1" : "—";

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      borderRadius: 18, padding: "20px 24px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{
        position: "absolute", top: -30, right: -30, width: 120, height: 120,
        borderRadius: "50%", opacity: 0.15,
        background: "radial-gradient(circle, #10b981, transparent)",
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {currentLabel}
          </p>
          <p style={{ margin: "4px 0 0", color: level ? "#10b981" : "rgba(255,255,255,0.4)", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: level ? "2rem" : "1.1rem" }}>
            {displayLevel}
          </p>
        </div>
        {level && (
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "2.2rem" }}>
              {percent}%
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
              {towardsLabel} {nextLevel}
            </p>
          </div>
        )}
      </div>
      <div style={{ height: 10, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.06)", position: "relative" }}>
        <div style={{
          position: "absolute", inset: "0 auto 0 0",
          width: `${animated}%`,
          background: level ? "linear-gradient(90deg, #059669, #10b981, #34d399)" : "rgba(255,255,255,0.06)",
          boxShadow: level ? "0 0 14px rgba(16,185,129,0.6)" : "none",
          borderRadius: 99, transition: "width 1s ease-out",
        }} />
        {level && (
          <div style={{
            position: "absolute", inset: "0 auto 0 0",
            left: `${animated - 4}%`, width: "4%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            borderRadius: 99, opacity: 0.6, transition: "left 1s ease-out",
          }} />
        )}
      </div>
      {level && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>0 XP</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>1000 XP</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 6, padding: "20px 12px", borderRadius: 16,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.3rem" }}>{value}</span>
      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", textAlign: "center" }}>{label}</span>
    </div>
  );
}

function SimulateurCard({ scenario, label, description, onTap }: {
  scenario: AmbassadeScenario; label: string; description: string; onTap: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onTap}
      style={{
        width: "100%", textAlign: "left", padding: "14px 16px",
        borderRadius: 16, cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: "all 0.15s ease",
        display: "flex", alignItems: "center", gap: 14,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem",
        background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)",
      }}>
        {scenario.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </p>
        <p style={{ margin: "3px 0 6px", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {description}
        </p>
        <span style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: "0.65rem", padding: "2px 7px", borderRadius: 6 }}>
          {scenario.defaultLevel}
        </span>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
        color: "#10b981", fontSize: "0.75rem",
      }}>→</div>
    </button>
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
  const [classJoinCode, setClassJoinCode] = useState("");
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

  const scenarioOverrides = SCENARIO_OVERRIDES[locale];

  const badgeDefs: Badge[] = [
    { id: "1", icon: "🔥", label: t.badgeStreak,    earned: false },
    { id: "2", icon: "⭐", label: t.badgeFirstA,    earned: false },
    { id: "3", icon: "🎯", label: t.badgePrecision, earned: false },
    { id: "4", icon: "🏆", label: t.badgeChampion,  earned: false },
    { id: "5", icon: "💎", label: t.badgeDiamond,   earned: false },
    { id: "6", icon: "🚀", label: t.badgeRocket,    earned: false },
  ];

  const skills = analytics?.skillScores ? [
    { label: t.grammar,       icon: "📝", score: analytics.skillScores.grammatik ?? 0 },
    { label: t.vocabulary,    icon: "📖", score: analytics.skillScores.lesen ?? 0 },
    { label: t.pronunciation, icon: "🗣️", score: analytics.skillScores.sprechen ?? 0 },
    { label: t.comprehension, icon: "👂", score: analytics.skillScores.hoeren ?? 0 },
  ] : null;

  const earnedCount = analytics?.totalBadges ?? 0;
  const earnedBadges = badgeDefs.map((b, i) => ({ ...b, earned: i < earnedCount }));

  // Smart CTA: test level → first lesson → continue
  const hasLevel = !!level;
  const hasLessons = analytics ? analytics.completedModules > 0 : false;

  const isLoaded = userData !== null;
  const isNewUser = isLoaded && xp === 0 && !hasLessons && !hasLevel;
  const headerTitle = isNewUser ? t.greetNew : firstName ? `${t.greetReturn} ${firstName}` : t.greetReturn;
  const headerSubtitle = isNewUser ? t.greetSubtitleNew : t.greetSubtitleReturn;
  const nextStepTitle = !hasLevel ? t.nextStep1Title : !hasLessons ? t.nextStep2Title : t.nextStep3Title;
  const nextStepText = !hasLevel ? t.nextStep1Text : !hasLessons ? t.nextStep2Text : t.nextStep3Text;
  const nextStepCTA = !hasLevel ? t.nextStep1CTA : !hasLessons ? t.nextStep2CTA : t.nextStep3CTA;
  const nextStepHref = !hasLevel ? "/test-niveau" : "/courses";

  const pillars = [
    { label: t.pillar1Label, desc: t.pillar1Desc, color: "#10b981", badge: null },
    { label: t.pillar2Label, desc: t.pillar2Desc, color: "#6366f1", badge: null },
    { label: t.pillar3Label, desc: t.pillar3Desc, color: "rgba(255,255,255,0.2)", badge: t.pillar3Badge },
  ];

  return (
    <Layout title={tn.home}>

      {/* ── 1. Human header ── */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{
          padding: isMobile ? "20px 18px" : "24px 28px", borderRadius: 20,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 6px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? "1.4rem" : "1.7rem", lineHeight: 1.2 }}>
              {headerTitle}
            </h2>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", lineHeight: 1.55 }}>
              {headerSubtitle}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
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
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{
          padding: isMobile ? "20px 18px" : "24px 28px", borderRadius: 20,
          background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)",
          border: "1px solid rgba(16,185,129,0.22)",
        }}>
          <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {t.nextStepCardTitle}
          </p>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 24, justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 6px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: isMobile ? "1.05rem" : "1.15rem" }}>
                {nextStepTitle}
              </h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", lineHeight: 1.55 }}>
                {nextStepText}
              </p>
            </div>
            <button
              onClick={() => router.push(nextStepHref)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
                padding: "13px 22px", borderRadius: 14, cursor: "pointer",
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none", color: "white",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem",
                boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                width: isMobile ? "100%" : "auto", justifyContent: "center",
              }}
            >
              {nextStepCTA} →
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Progress widget ── */}
      <div id="progress" className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{
          borderRadius: 20, padding: isMobile ? "18px" : "22px 26px",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              📊 {t.progressWidgetTitle}
            </p>
            <a href={`/${locale}/progress`} style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", textDecoration: "none" }}>
              {t.progressViewDetail} →
            </a>
          </div>
          {(!isLoaded || (xp === 0 && !hasLessons && !hasLevel)) ? (
            <div style={{ padding: "8px 0 4px" }}>
              <p style={{ margin: "0 0 4px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {t.progressZeroTitle}
              </p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
                {t.progressZeroText}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.progressLevelLabel}</p>
                <p style={{ margin: 0, color: level ? "#10b981" : "rgba(255,255,255,0.4)", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: level ? "1.3rem" : "0.85rem" }}>
                  {level ?? t.levelConfirm}
                </p>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.progressXpLabel}</p>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>{xp}</p>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.progressModulesLabel}</p>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>{analytics?.completedModules ?? 0}</p>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.progressDaysLabel}</p>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>{streak}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* ── Left col ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Learn / Prepare / Belong */}
          <div className="fade-up card-delay-2" style={{
            borderRadius: 18, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {t.journeyTitle}
              </p>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
              {pillars.map(pillar => (
                <div key={pillar.label} style={{
                  flex: 1, padding: "16px 14px", borderRadius: 14,
                  background: pillar.badge ? "rgba(255,255,255,0.02)" : `${pillar.color}08`,
                  border: `1px solid ${pillar.badge ? "rgba(255,255,255,0.07)" : pillar.color + "25"}`,
                  opacity: pillar.badge ? 0.7 : 1,
                }}>
                  <p style={{ margin: "0 0 8px", color: pillar.badge ? "rgba(255,255,255,0.45)" : pillar.color, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>
                    {pillar.label}
                  </p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", lineHeight: 1.5 }}>
                    {pillar.desc}
                  </p>
                  {pillar.badge && (
                    <span style={{ display: "inline-block", marginTop: 10, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)", fontSize: "0.58rem", padding: "2px 8px", borderRadius: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {pillar.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Speaking practice */}
          <div className="fade-up card-delay-3" style={{
            borderRadius: 18, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  🎙️ {t.simPracticeTitle}
                </p>
                <p style={{ margin: "0 0 10px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                  {t.simPracticeDesc}
                </p>
                <button
                  onClick={() => router.push("/simulateur")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                    color: "#10b981", fontSize: "0.78rem", fontWeight: 600,
                  }}
                >
                  {t.simCTA} →
                </button>
              </div>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {SIM_SCENARIOS.map(s => {
                const override = scenarioOverrides[s.id] ?? { label: s.label, description: s.description };
                return (
                  <SimulateurCard
                    key={s.id}
                    scenario={s}
                    label={override.label}
                    description={override.description}
                    onTap={() => router.push(`/simulateur?scenario=${s.id}&niveau=${s.defaultLevel}`)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right col ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Level bar */}
          <div className="fade-up card-delay-2">
            <LevelBar
              level={level}
              percent={level ? Math.min(Math.round((xp % 1000) / 10), 99) : 0}
              currentLabel={t.levelCurrentLabel}
              towardsLabel={t.levelTowardsLabel}
              confirmLabel={t.levelConfirm}
            />
          </div>

          {/* Skills progress */}
          <div className="fade-up card-delay-2" style={{
            borderRadius: 18, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {t.skills}
              </p>
              <p style={{ margin: "4px 0 0", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {t.detailedProgress}
              </p>
            </div>
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              {skills ? skills.map(skill => (
                <div key={skill.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>
                      {skill.icon} {skill.label}
                    </span>
                    <span style={{ color: "#10b981", fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: "0.82rem" }}>
                      {skill.score}%
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                    <div style={{
                      height: "100%", borderRadius: 99, width: `${skill.score}%`,
                      background: "linear-gradient(90deg, #059669, #10b981)",
                      boxShadow: "0 0 8px rgba(16,185,129,0.4)",
                    }} />
                  </div>
                </div>
              )) : (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", textAlign: "center", padding: "16px 0" }}>
                  {t.noSkills}
                </p>
              )}
            </div>
          </div>

          {/* Classes / Support card (solo students + pending validation) */}
          {(!userData || userData.studentType === "solo") && (
            <div className="fade-up card-delay-3" style={{ borderRadius: 18, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", padding: "20px" }}>
              <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {t.joinClassLabel}
              </p>
              <p style={{ margin: "0 0 8px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                {t.classCardTitle}
              </p>
              <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.38)", fontSize: "0.75rem", lineHeight: 1.55 }}>
                {t.classCardText}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={classJoinCode}
                  onChange={e => setClassJoinCode(e.target.value.toUpperCase())}
                  placeholder={t.joinCodePlaceholder}
                  onKeyDown={e => { if (e.key === "Enter" && classJoinCode.length >= 6) router.push(`/classroom/join?code=${encodeURIComponent(classJoinCode)}`); }}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10, padding: "10px 12px", color: "#f1f5f9", fontSize: "0.78rem",
                    fontFamily: "monospace", letterSpacing: "0.04em", outline: "none",
                  }}
                />
                <button
                  onClick={() => classJoinCode.length >= 6 && router.push(`/classroom/join?code=${encodeURIComponent(classJoinCode)}`)}
                  style={{
                    background: classJoinCode.length >= 6 ? "#6366f1" : "rgba(255,255,255,0.05)",
                    color: classJoinCode.length >= 6 ? "#fff" : "rgba(255,255,255,0.2)",
                    border: "none", borderRadius: 10, padding: "10px 16px",
                    cursor: classJoinCode.length >= 6 ? "pointer" : "default",
                    fontSize: "0.8rem", fontWeight: 700, transition: "all 0.2s", flexShrink: 0,
                  }}
                >→</button>
              </div>
            </div>
          )}

          {userData?.studentType === "classroom" && !userData.isValidated && (
            <div className="fade-up card-delay-3" style={{ borderRadius: 18, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.25)", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.4rem" }}>⏳</span>
                <div>
                  <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.88rem" }}>{t.pendingTitle}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", marginTop: 2 }}>{t.pendingDesc}</div>
                </div>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="fade-up card-delay-3" style={{
            borderRadius: 18, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {t.rewardsLabel}
              </p>
              <p style={{ margin: "4px 0 0", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {t.badgesTitle}
              </p>
            </div>
            {earnedCount === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", margin: 0 }}>{t.noBadge}</p>
              </div>
            ) : (
              <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {earnedBadges.map(badge => (
                  <div key={badge.id} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "14px 8px", borderRadius: 14,
                    background: badge.earned ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                    border: badge.earned ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    opacity: badge.earned ? 1 : 0.4,
                  }}>
                    <span style={{ fontSize: "1.6rem" }}>{badge.icon}</span>
                    <span style={{ color: badge.earned ? "#34d399" : "rgba(255,255,255,0.3)", fontSize: "0.62rem", textAlign: "center" }}>
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Community preview */}
          <div className="fade-up card-delay-3" style={{
            borderRadius: 18, padding: "20px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            opacity: 0.75,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>🌍</span>
              <div>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
                  {t.communityCardTitle}
                </p>
              </div>
            </div>
            <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.38)", fontSize: "0.73rem", lineHeight: 1.55 }}>
              {t.communityCardText}
            </p>
            <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontSize: "0.6rem", padding: "3px 10px", borderRadius: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {t.pillar3Badge}
            </span>
          </div>

        </div>
      </div>

    </Layout>
  );
}
