"use client"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Layout from "@/components/Layout"
import { StateBlock } from "@/components/StateBlock"
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PolarRadiusAxis
} from "recharts"

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  fr: {
    title: "Ma Progression",
    backToDashboard: "← Tableau de bord",
    levelLabel: "Niveau",
    xpLabel: "XP total",
    streakLabel: "Série (j.)",
    modulesLabel: "Modules",
    quizLabel: "Quiz moy.",
    badgesLabel: "Badges",
    tabOverview: "📈 Vue d'ensemble",
    tabSkills: "🎯 Compétences",
    tabHistory: "📋 Historique",
    tabBadges: "🏆 Badges",
    noDataTitle: "Pas encore de données",
    noDataText: "Complétez une leçon ou un quiz pour voir votre progression ici.",
    noBadge: "Votre premier badge vous attend.",
    noActivity: "Aucune activité pour l'instant. Commencez votre première leçon !",
    noQuiz: "Aucun quiz complété pour l'instant.",
    noSession: "Aucune session de pratique pour l'instant.",
    noSkills: "Vos scores de compétences apparaîtront après vos premières leçons.",
    weeklyTitle: "Progression hebdomadaire",
    xpWeeklyTitle: "XP par semaine",
    activityTitle: "Activité récente",
    quizHistoryTitle: "Historique Quiz",
    sessionHistoryTitle: "Sessions de pratique",
    skillsTitle: "Profil de compétences",
    skillsDetailTitle: "Scores détaillés",
    badgesObtained: "badge(s) obtenu(s)",
    scoreTrend: "Évolution des scores Quiz",
    encourage: "Votre parcours commence ici. Chaque étape compte.",
    startA1: "Commencer A1 →",
    testLevel: "Tester mon niveau →",
    levelUnknown: "À confirmer",
    progressTo: "Progression vers",
    statusDone: "Terminé",
    statusProgress: "En cours",
    skillLesen: "Lesen (Lecture)",
    skillHoeren: "Hören (Écoute)",
    skillSprechen: "Sprechen (Expression)",
    skillSchreiben: "Schreiben (Écriture)",
    skillGrammatik: "Grammatik (Grammaire)",
    loading: "Chargement...",
    gramLabel: "Gram.",
    fluLabel: "Fluence",
  },
  en: {
    title: "My Progress",
    backToDashboard: "← Dashboard",
    levelLabel: "Level",
    xpLabel: "Total XP",
    streakLabel: "Streak (d.)",
    modulesLabel: "Modules",
    quizLabel: "Quiz avg.",
    badgesLabel: "Badges",
    tabOverview: "📈 Overview",
    tabSkills: "🎯 Skills",
    tabHistory: "📋 History",
    tabBadges: "🏆 Badges",
    noDataTitle: "No data yet",
    noDataText: "Complete a lesson or quiz to see your progress here.",
    noBadge: "Your first badge is waiting.",
    noActivity: "No activity yet. Start your first lesson!",
    noQuiz: "No quiz completed yet.",
    noSession: "No practice session yet.",
    noSkills: "Your skill scores will appear after your first lessons.",
    weeklyTitle: "Weekly progress",
    xpWeeklyTitle: "XP per week",
    activityTitle: "Recent activity",
    quizHistoryTitle: "Quiz history",
    sessionHistoryTitle: "Practice sessions",
    skillsTitle: "Skills profile",
    skillsDetailTitle: "Detailed scores",
    badgesObtained: "badge(s) earned",
    scoreTrend: "Quiz score trends",
    encourage: "Your journey starts here. Every step matters.",
    startA1: "Start A1 →",
    testLevel: "Test my level →",
    levelUnknown: "To confirm",
    progressTo: "Progress toward",
    statusDone: "Done",
    statusProgress: "In progress",
    skillLesen: "Lesen (Reading)",
    skillHoeren: "Hören (Listening)",
    skillSprechen: "Sprechen (Speaking)",
    skillSchreiben: "Schreiben (Writing)",
    skillGrammatik: "Grammatik (Grammar)",
    loading: "Loading...",
    gramLabel: "Gram.",
    fluLabel: "Fluency",
  },
} as const;
type TT = typeof T.fr;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressData {
  overview: {
    xpTotal: number;
    streakDays: number;
    level: string | null;
    completedModules: number;
    totalModules: number;
    completionRate: number;
    avgQuizScore: number;
    avgConvScore: number;
    totalCourses: number;
    totalBadges: number;
    earnedBadges: Array<{ name: string; description: string; iconUrl: string | null }>;
  };
  weeklyProgress: Array<{ week: string; modules: number; score: number; xp: number }>;
  skillScores: { lesen: number; hoeren: number; sprechen: number; schreiben: number; grammatik: number };
  recentActivity: Array<{ type: string; title: string; course: string; status: string; score: number | null; date: string }>;
  quizHistory: Array<{ score: number; isPassed: boolean; date: string }>;
  conversationHistory: Array<{ scenario: string; scoreGlobal: number | null; scoreGrammaire: number | null; scoreFluence: number | null; date: string; isCompleted: boolean }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) => s >= 80 ? "var(--brass)" : s >= 60 ? "#f59e0b" : "var(--oxblood)"

// EmptyState local — délègue à StateBlock (empty, compact, centered).
// Le titre devient la ligne d'âme, on n'a pas de fragment brass
// donc on met un point final simple. Le texte reste en body.
function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <StateBlock kind="empty" compact centered soul={title} body={text} />
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#0f1a14", border: "1px solid var(--brass-edge)",
        borderRadius: 8, padding: "8px 12px"
      }}>
        <p style={{ color: "var(--brass)", fontSize: 11, margin: "0 0 4px", fontWeight: 700 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontSize: 11, margin: 0 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const pathname = usePathname()
  const locale = pathname.startsWith("/en") ? "en" as const : "fr" as const
  const t = T[locale] as TT

  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "history" | "badges">("overview")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/analytics?type=student")
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            // Ensure earnedBadges exists (older API response compatibility)
            if (!json.data.overview.earnedBadges) {
              json.data.overview.earnedBadges = []
            }
            setData(json.data)
          }
        }
      } catch {
        // Silent failure — show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Loading state ──
  if (loading) {
    return (
      <Layout title={t.title}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <p style={{ color: "var(--creme-mute)", fontFamily: "var(--font-fraunces),sans-serif" }}>{t.loading}</p>
        </div>
      </Layout>
    )
  }

  // ── No data state ──
  if (!loading && !data) {
    return (
      <Layout title={t.title}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
          <a href={`/${locale}/dashboard`} style={{ color: "var(--creme-mute)", fontSize: 12, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>{t.backToDashboard}</a>
          <h1 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 28, fontWeight: 800, margin: "0 0 32px" }}>📊 {t.title}</h1>
          <EmptyState title={t.noDataTitle} text={t.encourage} />
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <a href={`/${locale}/test-niveau`} style={{ padding: "10px 18px", borderRadius: 12, background: "linear-gradient(135deg,var(--brass),var(--brass-deep))", color: "white", fontFamily: "var(--font-fraunces),sans-serif", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
              {t.testLevel}
            </a>
            <a href={`/${locale}/courses`} style={{ padding: "10px 18px", borderRadius: 12, background: "var(--brass-glow)", border: "1px solid var(--brass-edge)", color: "var(--brass)", fontFamily: "var(--font-fraunces),sans-serif", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
              {t.startA1}
            </a>
          </div>
        </div>
      </Layout>
    )
  }

  // TypeScript assertion — we know data is not null here
  const d = data!
  const { overview } = d

  const hasActivity = d.weeklyProgress.some(w => w.modules > 0)
  const hasSkills = Object.values(d.skillScores).some(v => v > 0)
  const hasQuiz = d.quizHistory.length > 0
  const hasConv = d.conversationHistory.length > 0
  const hasActivity2 = d.recentActivity.length > 0

  const nextLevel = overview.level === "A1" ? "A2"
    : overview.level === "A2" ? "B1"
    : overview.level === "B1" ? "B2"
    : overview.level === "B2" ? "C1"
    : "—"

  const skillRadarData = [
    { skill: "Lesen",    score: d.skillScores.lesen,    fullMark: 100 },
    { skill: "Hören",    score: d.skillScores.hoeren,   fullMark: 100 },
    { skill: "Sprechen", score: d.skillScores.sprechen, fullMark: 100 },
    { skill: "Schreiben",score: d.skillScores.schreiben,fullMark: 100 },
    { skill: "Grammatik",score: d.skillScores.grammatik,fullMark: 100 },
  ]

  const tabs = [
    { key: "overview", label: isMobile ? "📈" : t.tabOverview },
    { key: "skills",   label: isMobile ? "🎯" : t.tabSkills },
    { key: "history",  label: isMobile ? "📋" : t.tabHistory },
    { key: "badges",   label: isMobile ? "🏆" : t.tabBadges },
  ]

  return (
    <Layout title={t.title}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Back link */}
        <a href={`/${locale}/dashboard`} style={{ color: "var(--creme-mute)", fontSize: 12, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>
          {t.backToDashboard}
        </a>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 28, fontWeight: 800, margin: "0 0 6px" }}>
            📊 {t.title}
          </h1>
          <p style={{ color: "var(--creme-mute)", fontSize: 13, margin: 0 }}>
            {`${t.levelLabel}: ${overview.level ?? t.levelUnknown} · ${overview.streakDays} ${t.streakLabel} 🔥 · ${overview.xpTotal} XP`}
          </p>
        </div>

        {/* Stats globales */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: t.xpLabel,      value: overview.xpTotal.toLocaleString(), icon: "⚡", color: "var(--brass)" },
            { label: t.streakLabel,  value: `${overview.streakDays}j`,         icon: "🔥", color: "#f59e0b" },
            { label: t.modulesLabel, value: `${overview.completedModules}/${overview.totalModules}`, icon: "✅", color: "#60a5fa" },
            { label: t.quizLabel,    value: `${overview.avgQuizScore}%`,        icon: "🎯", color: "#a78bfa" },
            { label: t.badgesLabel,  value: String(overview.totalBadges),       icon: "🏆", color: "#f472b6" },
            { label: t.levelLabel,   value: overview.level ?? t.levelUnknown,  icon: "📖", color: "#34d399" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "16px 20px", borderRadius: 16, textAlign: "center",
              background: "rgba(244, 235, 220, 0.04)", border: "1px solid var(--creme-hair)"
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-fraunces),sans-serif", color: stat.color, marginBottom: 2 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, color: "var(--creme-mute)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Barre progression niveau */}
        <div style={{
          padding: "20px 24px", borderRadius: 16, marginBottom: 28,
          background: "rgba(244, 235, 220, 0.04)", border: "1px solid var(--creme-hair)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <span style={{ color: "var(--creme-mute)", fontSize: 11 }}>{t.progressTo} </span>
              <span style={{ color: "var(--brass)", fontWeight: 700 }}>{nextLevel}</span>
            </div>
            <span style={{ color: "var(--brass)", fontWeight: 700 }}>{overview.completionRate}%</span>
          </div>
          <div style={{ height: 8, background: "var(--creme-hair)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${overview.completionRate}%`,
              background: "linear-gradient(90deg,var(--brass-deep),var(--brass),#34d399)",
              boxShadow: "0 0 10px rgba(16,185,129,0.5)",
              borderRadius: 99, transition: "width var(--dur-moment) var(--ease-enter)"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 9, color: "var(--creme-hair)" }}>0 XP</span>
            <span style={{ fontSize: 9, color: "var(--creme-hair)" }}>1000 XP</span>
          </div>
        </div>

        {/* Onglets */}
        <div style={{
          display: "flex", gap: 4, padding: 4,
          background: "rgba(244, 235, 220, 0.04)", border: "1px solid var(--creme-hair)",
          borderRadius: 14, marginBottom: 24
        }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                flex: 1, padding: "9px 8px", borderRadius: 10,
                fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                background: activeTab === tab.key
                  ? "linear-gradient(135deg,var(--brass-edge),rgba(5,150,105,0.1))"
                  : "transparent",
                color: activeTab === tab.key ? "var(--brass)" : "var(--creme-mute)",
                outline: activeTab === tab.key ? "1px solid var(--brass-edge)" : "none",
                fontFamily: "var(--font-fraunces),sans-serif"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Onglet Vue d'ensemble ── */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16 }}>

            {hasActivity ? (
              <div style={{
                padding: "20px 24px", borderRadius: 16,
                background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
              }}>
                <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                  📈 {t.weeklyTitle}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={d.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--creme-hair)" />
                    <XAxis dataKey="week" stroke="var(--creme-mute)" fontSize={11} />
                    <YAxis stroke="var(--creme-mute)" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" stroke="var(--brass)" strokeWidth={2} dot={{ fill: "var(--brass)", r: 4 }} name="Score" />
                    <Line type="monotone" dataKey="modules" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 4 }} name="Modules" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t.noDataTitle} text={t.noActivity} />
            )}

            {hasActivity ? (
              <div style={{
                padding: "20px 24px", borderRadius: 16,
                background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
              }}>
                <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                  ⚡ {t.xpWeeklyTitle}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--creme-hair)" />
                    <XAxis dataKey="week" stroke="var(--creme-mute)" fontSize={11} />
                    <YAxis stroke="var(--creme-mute)" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="xp" fill="var(--brass)" radius={[4, 4, 0, 0]} name="XP" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            <div style={{
              gridColumn: "1 / -1",
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
            }}>
              <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 16px" }}>
                🕐 {t.activityTitle}
              </h3>
              {hasActivity2 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {d.recentActivity.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)"
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: item.status === "COMPLETED" ? "var(--brass)" : "#f59e0b", flexShrink: 0
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "white", fontSize: 13, margin: 0, fontWeight: 600 }}>{item.title}</p>
                        <p style={{ color: "var(--creme-mute)", fontSize: 10, margin: 0 }}>{item.course}</p>
                      </div>
                      {item.score !== null && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(item.score) }}>
                          {item.score}%
                        </span>
                      )}
                      <span style={{
                        fontSize: 9, padding: "2px 8px", borderRadius: 99,
                        background: item.status === "COMPLETED" ? "var(--brass-glow)" : "rgba(245,158,11,0.12)",
                        color: item.status === "COMPLETED" ? "var(--brass)" : "#f59e0b"
                      }}>
                        {item.status === "COMPLETED" ? t.statusDone : t.statusProgress}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={t.noDataTitle} text={t.noActivity} />
              )}
            </div>
          </div>
        )}

        {/* ── Onglet Compétences ── */}
        {activeTab === "skills" && (
          hasSkills ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div style={{
                padding: "20px 24px", borderRadius: 16,
                background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
              }}>
                <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                  🎯 {t.skillsTitle}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={skillRadarData}>
                    <PolarGrid stroke="var(--creme-hair)" />
                    <PolarAngleAxis dataKey="skill" stroke="var(--creme-mute)" fontSize={12} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--creme-hair)" fontSize={9} />
                    <Radar name="Score" dataKey="score" stroke="var(--brass)" fill="var(--brass)" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                padding: "20px 24px", borderRadius: 16,
                background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
              }}>
                <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                  📊 {t.skillsDetailTitle}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: t.skillLesen,    key: "lesen" as const,    icon: "📖" },
                    { label: t.skillHoeren,   key: "hoeren" as const,   icon: "👂" },
                    { label: t.skillSprechen, key: "sprechen" as const, icon: "🗣️" },
                    { label: t.skillSchreiben,key: "schreiben" as const,icon: "✍️" },
                    { label: t.skillGrammatik,key: "grammatik" as const,icon: "📝" },
                  ].map((skill) => {
                    const score = d.skillScores[skill.key] ?? 0
                    return (
                      <div key={skill.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "var(--creme-soft)" }}>
                            {skill.icon} {skill.label}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score) }}>{score}%</span>
                        </div>
                        <div style={{ height: 6, background: "var(--creme-hair)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${score}%`,
                            background: score >= 80 ? "linear-gradient(90deg,var(--brass-deep),var(--brass))"
                              : score >= 60 ? "linear-gradient(90deg,#d97706,#f59e0b)"
                              : "linear-gradient(90deg,#dc2626,var(--oxblood))",
                            borderRadius: 99, transition: "width var(--dur-moment) var(--ease-enter)"
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title={t.noDataTitle} text={t.noSkills} />
          )
        )}

        {/* ── Onglet Historique ── */}
        {activeTab === "history" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
            }}>
              <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 16px" }}>
                🎯 {t.quizHistoryTitle}
              </h3>
              {hasQuiz ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {d.quizHistory.map((q, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16 }}>{q.isPassed ? "✅" : "❌"}</span>
                        <span style={{ fontSize: 12, color: "var(--creme-soft)" }}>
                          Quiz #{d.quizHistory.length - i}
                        </span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(q.score) }}>
                        {q.score}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={t.noDataTitle} text={t.noQuiz} />
              )}
            </div>

            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
            }}>
              <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 16px" }}>
                🤖 {t.sessionHistoryTitle}
              </h3>
              {hasConv ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {d.conversationHistory.map((s, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: 10,
                      background: "rgba(244, 235, 220, 0.02)", border: "1px solid var(--creme-hair)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "white", fontWeight: 600 }}>{s.scenario}</span>
                        {s.scoreGlobal !== null && (
                          <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.scoreGlobal * 10) }}>
                            {s.scoreGlobal}/10
                          </span>
                        )}
                      </div>
                      {s.scoreGrammaire !== null && s.scoreFluence !== null && (
                        <div style={{ display: "flex", gap: 12 }}>
                          <span style={{ fontSize: 10, color: "var(--creme-mute)" }}>{t.gramLabel}: {s.scoreGrammaire}/10</span>
                          <span style={{ fontSize: 10, color: "var(--creme-mute)" }}>{t.fluLabel}: {s.scoreFluence}/10</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={t.noDataTitle} text={t.noSession} />
              )}
            </div>

            {hasQuiz && (
              <div style={{
                gridColumn: "1 / -1",
                padding: "20px 24px", borderRadius: 16,
                background: "rgba(244, 235, 220, 0.03)", border: "1px solid var(--creme-hair)"
              }}>
                <h3 style={{ fontFamily: "var(--font-fraunces),sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                  📈 {t.scoreTrend}
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={d.quizHistory.map((q, i) => ({ index: `#${i + 1}`, score: q.score }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--creme-hair)" />
                    <XAxis dataKey="index" stroke="var(--creme-mute)" fontSize={11} />
                    <YAxis stroke="var(--creme-mute)" fontSize={11} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 4 }} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Badges ── */}
        {activeTab === "badges" && (
          <div>
            <p style={{ color: "var(--creme-mute)", fontSize: 12, marginBottom: 20 }}>
              {overview.totalBadges} {t.badgesObtained}
            </p>
            {overview.earnedBadges.length === 0 ? (
              <EmptyState title={t.noDataTitle} text={t.noBadge} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
                {overview.earnedBadges.map((badge, i) => (
                  <div key={i} style={{
                    padding: "20px 16px", borderRadius: 16, textAlign: "center",
                    background: "var(--brass-glow)",
                    border: "1px solid var(--brass-edge)",
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>
                      {badge.iconUrl ? (
                        <img src={badge.iconUrl} alt={badge.name} style={{ width: 36, height: 36, objectFit: "contain" }} />
                      ) : "🏆"}
                    </div>
                    <p style={{
                      fontFamily: "var(--font-fraunces),sans-serif", fontSize: 13, fontWeight: 700, margin: "0 0 4px",
                      color: "white"
                    }}>
                      {badge.name}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--creme-mute)", margin: 0 }}>{badge.description}</p>
                    <div style={{
                      marginTop: 10, display: "inline-block",
                      padding: "2px 10px", borderRadius: 99,
                      background: "var(--brass-glow)", color: "var(--brass)", fontSize: 9, fontWeight: 700
                    }}>
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  )
}
