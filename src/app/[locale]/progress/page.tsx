"use client"
import { useState, useEffect } from "react"
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PolarRadiusAxis } from "recharts"

const DEMO_DATA = {
  overview: {
    xpTotal: 1250,
    streakDays: 7,
    level: "A1",
    completedModules: 8,
    totalModules: 24,
    completionRate: 33,
    avgQuizScore: 76,
    avgConvScore: 68,
    totalCourses: 3,
    totalBadges: 4,
  },
  weeklyProgress: [
    { week: "S1", modules: 2, score: 65, xp: 30 },
    { week: "S2", modules: 3, score: 70, xp: 45 },
    { week: "S3", modules: 1, score: 72, xp: 15 },
    { week: "S4", modules: 4, score: 75, xp: 60 },
    { week: "S5", modules: 2, score: 74, xp: 30 },
    { week: "S6", modules: 5, score: 78, xp: 75 },
    { week: "S7", modules: 3, score: 76, xp: 45 },
  ],
  skillScores: {
    lesen: 78,
    hoeren: 65,
    sprechen: 68,
    schreiben: 72,
    grammatik: 82,
  },
  recentActivity: [
    { type: "module", title: "Guten Tag!", course: "Netzwerk neu A1", status: "COMPLETED", score: 85, date: new Date() },
    { type: "module", title: "Meine Familie", course: "Netzwerk neu A1", status: "COMPLETED", score: 72, date: new Date() },
    { type: "module", title: "Essen und Trinken", course: "Netzwerk neu A1", status: "IN_PROGRESS", score: null, date: new Date() },
  ],
  quizHistory: [
    { score: 80, isPassed: true, date: new Date() },
    { score: 65, isPassed: true, date: new Date() },
    { score: 90, isPassed: true, date: new Date() },
    { score: 55, isPassed: false, date: new Date() },
    { score: 75, isPassed: true, date: new Date() },
  ],
  conversationHistory: [
    { scenario: "Visa Étudiant", scoreGlobal: 7.5, scoreGrammaire: 8, scoreFluence: 7, date: new Date(), isCompleted: true },
    { scenario: "Au Restaurant", scoreGlobal: 6.8, scoreGrammaire: 7, scoreFluence: 6.5, date: new Date(), isCompleted: true },
    { scenario: "À la Gare", scoreGlobal: 8.2, scoreGrammaire: 8.5, scoreFluence: 8, date: new Date(), isCompleted: true },
  ]
}

const BADGES = [
  { icon: "🎯", name: "Premier Quiz", desc: "Réussir votre premier quiz", earned: true },
  { icon: "🔥", name: "Semaine de feu", desc: "7 jours consécutifs", earned: true },
  { icon: "📖", name: "Lecteur assidu", desc: "Terminer 5 modules", earned: true },
  { icon: "🗣️", name: "Orateur", desc: "3 sessions simulateur", earned: true },
  { icon: "⚡", name: "Accumulateur", desc: "500 XP cumulés", earned: false },
  { icon: "🏆", name: "Champion A1", desc: "Valider le niveau A1", earned: false },
  { icon: "🌟", name: "Perfectionniste", desc: "Score 100% à un quiz", earned: false },
  { icon: "💬", name: "Bavard", desc: "10 sessions simulateur", earned: false },
]

const scoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "#0f1a14", border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: 8, padding: "8px 12px"
      }}>
        <p style={{ color: "#10b981", fontSize: 11, margin: "0 0 4px", fontWeight: 700 }}>{label}</p>
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

export default function ProgressPage() {
  const [data, setData] = useState(DEMO_DATA)
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
          if (json.success) setData(json.data)
        }
      } catch {
        // Utilise les données démo
      }
    }
    fetchData()
  }, [])

  const { overview } = data

  const skillRadarData = [
    { skill: "Lesen", score: data.skillScores?.lesen ?? 78, fullMark: 100 },
    { skill: "Hören", score: data.skillScores?.hoeren ?? 65, fullMark: 100 },
    { skill: "Sprechen", score: data.skillScores?.sprechen ?? 68, fullMark: 100 },
    { skill: "Schreiben", score: data.skillScores?.schreiben ?? 72, fullMark: 100 },
    { skill: "Grammatik", score: data.skillScores?.grammatik ?? 82, fullMark: 100 },
  ]

  return (
    <div style={{
      minHeight: "100vh", background: "#080c10",
      fontFamily: "'DM Mono', monospace", color: "white"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono&display=swap');
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, margin: "0 0 6px" }}>
            📊 Ma Progression
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
            Niveau {overview.level} · {overview.streakDays} jours consécutifs 🔥 · {overview.xpTotal} XP
          </p>
        </div>

        {/* Stats globales */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "XP Total", value: overview.xpTotal.toLocaleString(), icon: "⚡", color: "#10b981" },
            { label: "Streak", value: `${overview.streakDays}j`, icon: "🔥", color: "#f59e0b" },
            { label: "Modules", value: `${overview.completedModules}/${overview.totalModules}`, icon: "✅", color: "#60a5fa" },
            { label: "Quiz moyen", value: `${overview.avgQuizScore}%`, icon: "🎯", color: "#a78bfa" },
            { label: "Badges", value: overview.totalBadges, icon: "🏆", color: "#f472b6" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "16px 20px", borderRadius: 16, textAlign: "center",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{
                fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif",
                color: stat.color, marginBottom: 2
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Barre progression niveau */}
        <div style={{
          padding: "20px 24px", borderRadius: 16, marginBottom: 28,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Progression vers </span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>
                {overview.level === "A1" ? "A2" : overview.level === "A2" ? "B1" : "B2"}
              </span>
            </div>
            <span style={{ color: "#10b981", fontWeight: 700 }}>{overview.completionRate}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${overview.completionRate}%`,
              background: "linear-gradient(90deg,#059669,#10b981,#34d399)",
              boxShadow: "0 0 10px rgba(16,185,129,0.5)",
              borderRadius: 99, transition: "width 1s ease"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>0 XP</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>1000 XP</span>
          </div>
        </div>

        {/* Onglets */}
        <div style={{
          display: "flex", gap: 4, padding: 4,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, marginBottom: 24
        }}>
          {[
            { key: "overview", label: isMobile ? "📈" : "📈 Vue d'ensemble" },
            { key: "skills", label: isMobile ? "🎯" : "🎯 Compétences" },
            { key: "history", label: isMobile ? "📋" : "📋 Historique" },
            { key: "badges", label: isMobile ? "🏆" : "🏆 Badges" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1, padding: "9px 8px", borderRadius: 10,
                fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                background: activeTab === tab.key
                  ? "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.1))"
                  : "transparent",
                color: activeTab === tab.key ? "#10b981" : "rgba(255,255,255,0.4)",
                outline: activeTab === tab.key ? "1px solid rgba(16,185,129,0.2)" : "none",
                fontFamily: "'Syne',sans-serif"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Onglet Vue d'ensemble */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16 }}>
            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                📈 Progression hebdomadaire
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} name="Score" />
                  <Line type="monotone" dataKey="modules" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 4 }} name="Modules" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                ⚡ XP par semaine
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="xp" fill="#10b981" radius={[4, 4, 0, 0]} name="XP" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              gridColumn: "1 / -1",
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 16px" }}>
                🕐 Activité récente
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.recentActivity.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)"
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: item.status === "COMPLETED" ? "#10b981" : "#f59e0b", flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "white", fontSize: 13, margin: 0, fontWeight: 600 }}>{item.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>{item.course}</p>
                    </div>
                    {item.score && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(item.score) }}>
                        {item.score}%
                      </span>
                    )}
                    <span style={{
                      fontSize: 9, padding: "2px 8px", borderRadius: 99,
                      background: item.status === "COMPLETED" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                      color: item.status === "COMPLETED" ? "#10b981" : "#f59e0b"
                    }}>
                      {item.status === "COMPLETED" ? "Terminé" : "En cours"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Compétences */}
        {activeTab === "skills" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                🎯 Profil de compétences
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={skillRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="skill" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} />
                  <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                📊 Scores détaillés
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Lesen (Lecture)", key: "lesen", icon: "📖" },
                  { label: "Hören (Écoute)", key: "hoeren", icon: "👂" },
                  { label: "Sprechen (Expression orale)", key: "sprechen", icon: "🗣️" },
                  { label: "Schreiben (Écriture)", key: "schreiben", icon: "✍️" },
                  { label: "Grammatik (Grammaire)", key: "grammatik", icon: "📝" },
                ].map((skill) => {
                  const score = (data.skillScores as any)?.[skill.key] ?? 0
                  return (
                    <div key={skill.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                          {skill.icon} {skill.label}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score) }}>{score}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${score}%`,
                          background: score >= 80 ? "linear-gradient(90deg,#059669,#10b981)"
                            : score >= 60 ? "linear-gradient(90deg,#d97706,#f59e0b)"
                            : "linear-gradient(90deg,#dc2626,#ef4444)",
                          borderRadius: 99, transition: "width 0.8s ease"
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Historique */}
        {activeTab === "history" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 16px" }}>
                🎯 Historique Quiz
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.quizHistory.map((q, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{q.isPassed ? "✅" : "❌"}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                        Quiz #{data.quizHistory.length - i}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(q.score) }}>
                      {q.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 16px" }}>
                🤖 Sessions Simulateur
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.conversationHistory.map((s, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "white", fontWeight: 600 }}>{s.scenario}</span>
                      {s.scoreGlobal && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.scoreGlobal * 10) }}>
                          {s.scoreGlobal}/10
                        </span>
                      )}
                    </div>
                    {s.scoreGrammaire && s.scoreFluence && (
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Gram: {s.scoreGrammaire}/10</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Fluence: {s.scoreFluence}/10</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              gridColumn: "1 / -1",
              padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, margin: "0 0 20px" }}>
                📈 Évolution des scores Quiz
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.quizHistory.map((q, i) => ({ index: `#${i + 1}`, score: q.score }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="index" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 4 }} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Onglet Badges */}
        {activeTab === "badges" && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 20 }}>
              {overview.totalBadges} badge{overview.totalBadges > 1 ? "s" : ""} obtenus sur {BADGES.length}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
              {BADGES.map((badge, i) => (
                <div key={i} style={{
                  padding: "20px 16px", borderRadius: 16, textAlign: "center",
                  background: badge.earned ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                  border: badge.earned ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.05)",
                  opacity: badge.earned ? 1 : 0.4
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10, filter: badge.earned ? "none" : "grayscale(1)" }}>
                    {badge.icon}
                  </div>
                  <p style={{
                    fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, margin: "0 0 4px",
                    color: badge.earned ? "white" : "rgba(255,255,255,0.4)"
                  }}>
                    {badge.name}
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{badge.desc}</p>
                  {badge.earned && (
                    <div style={{
                      marginTop: 10, display: "inline-block",
                      padding: "2px 10px", borderRadius: 99,
                      background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: 9, fontWeight: 700
                    }}>
                      OBTENU
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
