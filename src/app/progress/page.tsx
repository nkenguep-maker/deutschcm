"use client";

import Layout from "@/components/Layout";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis,
} from "recharts";

const XP_HISTORY = [
  { week: "S1", xp: 120 },
  { week: "S2", xp: 280 },
  { week: "S3", xp: 410 },
  { week: "S4", xp: 600 },
  { week: "S5", xp: 780 },
  { week: "S6", xp: 940 },
  { week: "S7", xp: 1100 },
  { week: "S8", xp: 1340 },
];

const SCORES_BY_SKILL = [
  { skill: "Lesen", score: 8.2 },
  { skill: "Hören", score: 7.4 },
  { skill: "Schreiben", score: 6.8 },
  { skill: "Sprechen", score: 7.1 },
  { skill: "Grammatik", score: 8.6 },
  { skill: "Wortschatz", score: 7.9 },
];

const RADAR_DATA = [
  { skill: "Lesen",      value: 82 },
  { skill: "Hören",      value: 74 },
  { skill: "Schreiben",  value: 68 },
  { skill: "Sprechen",   value: 71 },
  { skill: "Grammaire",  value: 86 },
  { skill: "Vocab",      value: 79 },
];

const BADGES = [
  { icon: "🔥", label: "14 jours",        desc: "Streak actif",      earned: true },
  { icon: "⚡", label: "Vitesse",          desc: "10 quiz en 1h",    earned: true },
  { icon: "🏆", label: "Score parfait",    desc: "20/20 Lektion 1",  earned: true },
  { icon: "🎙️", label: "Orateur",         desc: "5 simulations",    earned: true },
  { icon: "📚", label: "Lecteur",          desc: "20 textes lus",    earned: false },
  { icon: "🌟", label: "A2 validé",        desc: "Passer en A2",     earned: false },
];

const LEVEL_TIMELINE = [
  { level: "A1.1", date: "Jan 2026", done: true },
  { level: "A1.2", date: "Fév 2026", done: true },
  { level: "A1.3", date: "Mar 2026", done: true },
  { level: "A2.1", date: "Mai 2026", done: false, current: true },
  { level: "A2.2", date: "Juil 2026", done: false },
  { level: "B1",   date: "Oct 2026",  done: false },
];

const STATS = [
  { label: "XP Total",       value: "1 340",  color: "#10b981" },
  { label: "Score moyen",    value: "7.6/10", color: "#6366f1" },
  { label: "Streak actuel",  value: "14 j",   color: "#f59e0b" },
  { label: "Quiz complétés", value: "47",     color: "#e879f9" },
];

const TT = {
  contentStyle: { background: "#0d1a12", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 12, fontFamily: "DM Mono" },
  labelStyle: { color: "#10b981" },
  itemStyle: { color: "rgba(255,255,255,0.7)" },
};

export default function ProgressPage() {
  return (
    <Layout title="Progression">
      <div style={{ maxWidth: 900 }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderTop: `2px solid ${s.color}` }}>
              <div style={{ color: s.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Level timeline */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 20px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Parcours de niveaux</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {LEVEL_TIMELINE.map((step, i) => (
              <div key={step.level} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.72rem",
                    background: step.done ? "#10b981" : step.current ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                    border: step.current ? "2px solid #10b981" : step.done ? "none" : "1px solid rgba(255,255,255,0.1)",
                    color: step.done ? "white" : step.current ? "#10b981" : "rgba(255,255,255,0.3)",
                  }}>
                    {step.done ? "✓" : step.level}
                  </div>
                  <div style={{ color: step.current ? "#10b981" : step.done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", fontSize: "0.62rem", marginTop: 6, textAlign: "center" }}>
                    {step.done || step.current ? step.level : step.level}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.58rem" }}>{step.date}</div>
                </div>
                {i < LEVEL_TIMELINE.length - 1 && (
                  <div style={{ height: 2, flex: 1, background: step.done ? "#10b981" : "rgba(255,255,255,0.07)", maxWidth: 40 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* XP chart + Radar side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 style={{ margin: "0 0 18px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>XP cumulé — 8 semaines</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={XP_HISTORY} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} formatter={(v) => [`${v} XP`, "XP"]} />
                <Line type="monotone" dataKey="xp" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 style={{ margin: "0 0 18px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Profil de compétences</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={RADAR_DATA} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
                <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.18} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scores by skill */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 18px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Scores par compétence</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SCORES_BY_SKILL} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 10]} />
              <Tooltip {...TT} formatter={(v) => [`${v}/10`, ""]} />
              <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Badges */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 style={{ margin: "0 0 18px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>Badges obtenus</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {BADGES.map(b => (
              <div key={b.label} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12,
                background: b.earned ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                border: b.earned ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.05)",
                opacity: b.earned ? 1 : 0.45,
              }}>
                <span style={{ fontSize: "1.5rem" }}>{b.icon}</span>
                <div>
                  <div style={{ color: b.earned ? "white" : "rgba(255,255,255,0.4)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem" }}>{b.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem" }}>{b.desc}</div>
                </div>
                {b.earned && <span style={{ marginLeft: "auto", color: "#10b981", fontSize: "0.7rem" }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
