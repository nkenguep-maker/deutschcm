"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import Layout from "@/components/Layout";
import { useTranslations } from "next-intl";
import { SCENARIOS as SIM_SCENARIOS } from "@/types/ambassade";
import type { AmbassadeScenario } from "@/types/ambassade";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Badge {
  id: string;
  icon: string;
  label: string;
  earned: boolean;
}

const BADGE_DEFS: Badge[] = [
  { id: "1", icon: "🔥", label: "7 jours",   earned: false },
  { id: "2", icon: "⭐", label: "Premier A",  earned: false },
  { id: "3", icon: "🎯", label: "Précision",  earned: false },
  { id: "4", icon: "🏆", label: "Champion",   earned: false },
  { id: "5", icon: "💎", label: "Diamant",    earned: false },
  { id: "6", icon: "🚀", label: "Rocket",     earned: false },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LevelBar({ level, percent }: { level: string; percent: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(percent), 300);
    return () => clearTimeout(t);
  }, [percent]);

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
            Niveau actuel
          </p>
          <p style={{ margin: "4px 0 0", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2rem" }}>
            {level}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "2.2rem" }}>
            {percent}%
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
            vers {level === "A1" ? "A2" : level === "A2" ? "B1" : "B2"}
          </p>
        </div>
      </div>
      <div style={{ height: 10, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.06)", position: "relative" }}>
        <div style={{
          position: "absolute", inset: "0 auto 0 0",
          width: `${animated}%`,
          background: "linear-gradient(90deg, #059669, #10b981, #34d399)",
          boxShadow: "0 0 14px rgba(16,185,129,0.6)",
          borderRadius: 99,
          transition: "width 1s ease-out",
        }} />
        <div style={{
          position: "absolute", inset: "0 auto 0 0",
          left: `${animated - 4}%`, width: "4%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
          borderRadius: 99, opacity: 0.6,
          transition: "left 1s ease-out",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>650 XP</span>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem" }}>1000 XP</span>
      </div>
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

function SimulateurCard({ scenario, onTap }: { scenario: AmbassadeScenario; onTap: () => void }) {
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
        background: "rgba(16,185,129,0.12)",
        border: "1px solid rgba(16,185,129,0.2)",
      }}>
        {scenario.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {scenario.label}
        </p>
        <p style={{ margin: "3px 0 6px", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {scenario.description}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: "0.65rem", padding: "2px 7px", borderRadius: 6 }}>
            {scenario.defaultLevel}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>{scenario.legalRef}</span>
        </div>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.2)",
        color: "#10b981", fontSize: "0.75rem",
      }}>
        →
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Analytics {
  xpTotal: number;
  streakDays: number;
  completedModules: number;
  avgQuizScore: number;
  totalBadges: number;
  skillScores?: { lesen?: number; hoeren?: number; sprechen?: number; schreiben?: number; grammatik?: number };
}

export default function StudentDashboard() {
  const router = useRouter();
  const t = useTranslations("dashboard");
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

  const firstName = userData?.fullName?.split(" ")[0] ?? "Apprenant";
  const level = userData?.germanLevel ?? "A1";
  const xp = analytics?.xpTotal ?? userData?.xpTotal ?? 0;
  const streak = analytics?.streakDays ?? userData?.streakDays ?? 0;
  const greet = new Date().getHours() < 12 ? "Guten Morgen" : new Date().getHours() < 18 ? "Guten Tag" : "Guten Abend";

  const dynamicStats = [
    { icon: "⚡", value: xp > 1000 ? `${(xp/1000).toFixed(1)}K` : String(xp), label: "Points XP" },
    { icon: "✅", value: analytics ? String(analytics.completedModules) : "—", label: "Leçons" },
    { icon: "🎯", value: analytics ? `${analytics.avgQuizScore}%` : "—", label: "Score moy." },
    { icon: "🔥", value: String(streak), label: "Jours streak" },
    { icon: "🏆", value: analytics ? String(analytics.totalBadges) : "—", label: "Badges" },
    { icon: "📖", value: level, label: "Niveau actuel" },
  ];

  const skills = analytics?.skillScores
    ? [
        { label: "Grammaire",    icon: "📝", score: analytics.skillScores.grammatik ?? 0 },
        { label: "Vocabulaire",  icon: "📖", score: analytics.skillScores.lesen ?? 0 },
        { label: "Prononciation",icon: "🗣️", score: analytics.skillScores.sprechen ?? 0 },
        { label: "Compréhension",icon: "👂", score: analytics.skillScores.hoeren ?? 0 },
      ]
    : null;

  const earnedCount = analytics?.totalBadges ?? 0;
  const badges = BADGE_DEFS.map((b, i) => ({ ...b, earned: i < earnedCount }));

  return (
    <Layout title="Dashboard">

      {/* ── Welcome row ── */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div style={{
          display: "flex", flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between", gap: isMobile ? 16 : 0,
          padding: isMobile ? "16px 18px" : "20px 24px", borderRadius: 18,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {greet} 👋
            </p>
            <h2 style={{ margin: "6px 0 10px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? "1.4rem" : "1.8rem" }}>
              {firstName}
            </h2>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 10,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)",
            }}>
              <span>🔥</span>
              <span style={{ color: "#34d399", fontSize: "0.78rem" }}>{streak > 0 ? `${streak} jours consécutifs — continuez !` : "Connectez-vous chaque jour pour démarrer votre série"}</span>
            </div>
          </div>
          <button
            onClick={() => router.push("/simulateur")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: isMobile ? "12px 18px" : "14px 22px", borderRadius: 14, cursor: "pointer",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none", color: "white",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem",
              boxShadow: "0 4px 24px rgba(16,185,129,0.35)",
              width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "center" : "flex-start",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>🎙️</span>
            Lancer une simulation
          </button>
        </div>
      </div>

      {/* ── Stats grid (6 cols) ── */}
      <div className="fade-up card-delay-1" style={{
        display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 28,
      }}>
        {dynamicStats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── Main grid (2 cols) ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: 24, alignItems: "start" }}>

        {/* ── Left col ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Level bar */}
          <div className="fade-up card-delay-2">
            <LevelBar level={level} percent={Math.min(Math.round((xp % 1000) / 10), 99)} />
          </div>

          {/* Simulateurs IA */}
          <div className="fade-up card-delay-3" style={{
            borderRadius: 18, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Simulateurs d'ambassade
                </p>
                <p style={{ margin: "4px 0 0", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                  Conversations IA avec Herr Bauer
                </p>
              </div>
              <span style={{ fontSize: "1.4rem" }}>🤖</span>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {SIM_SCENARIOS.map(s => (
                <SimulateurCard
                  key={s.id}
                  scenario={s}
                  onTap={() => router.push(`/simulateur?scenario=${s.id}&niveau=${s.defaultLevel}`)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right col ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Skills progress */}
          <div className="fade-up card-delay-2" style={{
            borderRadius: 18, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {t("skills")}
              </p>
              <p style={{ margin: "4px 0 0", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {t("detailedProgress")}
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
                      height: "100%", borderRadius: 99,
                      width: `${skill.score}%`,
                      background: "linear-gradient(90deg, #059669, #10b981)",
                      boxShadow: "0 0 8px rgba(16,185,129,0.4)",
                    }} />
                  </div>
                </div>
              )) : (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", textAlign: "center", padding: "16px 0" }}>
                  {t("noSkills")}
                </p>
              )}
            </div>
          </div>

          {/* Join class widget — solo students only */}
          {(!userData || userData.studentType === "solo") && (
            <div className="fade-up card-delay-3" style={{ borderRadius: 18, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", padding: "20px 20px 18px" }}>
              <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {t("joinClassLabel")}
              </p>
              <p style={{ margin: "0 0 14px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.92rem" }}>
                {t("joinClassTitle")}
              </p>
              <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", lineHeight: 1.5 }}>
                {t("joinClassDesc")}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={classJoinCode}
                  onChange={e => setClassJoinCode(e.target.value.toUpperCase())}
                  placeholder="DEUTSCH-A1-XXXX"
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
                >
                  →
                </button>
              </div>
            </div>
          )}

          {/* Pending validation notice */}
          {userData?.studentType === "classroom" && !userData.isValidated && (
            <div className="fade-up card-delay-3" style={{ borderRadius: 18, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.25)", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.4rem" }}>⏳</span>
                <div>
                  <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.88rem" }}>Inscription en attente</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", marginTop: 2 }}>
                    Votre enseignant doit valider votre demande.
                  </div>
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
                Récompenses
              </p>
              <p style={{ margin: "4px 0 0", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                Badges obtenus
              </p>
            </div>
            {earnedCount === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", margin: 0 }}>
                  Complétez votre première leçon pour gagner un badge
                </p>
              </div>
            ) : (
              <div style={{
                padding: "16px", display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
              }}>
                {badges.map(badge => (
                  <div
                    key={badge.id}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "14px 8px", borderRadius: 14,
                      background: badge.earned ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                      border: badge.earned ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      opacity: badge.earned ? 1 : 0.4,
                    }}
                  >
                    <span style={{ fontSize: "1.6rem" }}>{badge.icon}</span>
                    <span style={{ color: badge.earned ? "#34d399" : "rgba(255,255,255,0.3)", fontSize: "0.62rem", textAlign: "center" }}>
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social — Découvrir */}
          <div className="fade-up card-delay-3" style={{
            borderRadius: 18, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {t("communityLabel")}
              </p>
              <p style={{ margin: "4px 0 0", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                {t("discoverLabel")}
              </p>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🏫", label: t("classesAvailable"), desc: t("classesJoin"), href: "/discover?tab=classes" },
                { icon: "👥", label: t("groupsLabel"), desc: t("studyGroup"), href: "/discover?tab=groups" },
                { icon: "🤝", label: t("findPartner"), desc: t("soloStudents"), href: "/discover?tab=students" },
              ].map(item => (
                <a key={item.href} href={item.href} style={{
                  display: "flex", gap: 10, alignItems: "center", padding: "10px 12px",
                  borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  textDecoration: "none", transition: "background 0.15s",
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{item.desc}</div>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
}
