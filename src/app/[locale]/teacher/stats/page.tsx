"use client";

import TeacherLayout from "@/components/TeacherLayout";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const WEEKLY = [
  { name: "Sem 1", A1: 6.2, A2: 5.8, B1: 7.1 },
  { name: "Sem 2", A1: 6.8, A2: 6.3, B1: 7.4 },
  { name: "Sem 3", A1: 7.1, A2: 6.9, B1: 7.8 },
  { name: "Sem 4", A1: 7.4, A2: 7.2, B1: 8.1 },
];

const MODULE_COMPLETION = [
  { module: "Lektion 1", A1: 95, A2: 88 },
  { module: "Lektion 2", A1: 82, A2: 74 },
  { module: "Lektion 3", A1: 70, A2: 61 },
  { module: "Lektion 4", A1: 55, A2: 45 },
  { module: "Lektion 5", A1: 28, A2: 18 },
];

const SUMMARY = [
  { label: "Score moyen global", value: "7.8/10",  color: "#10b981" },
  { label: "Taux de complétion", value: "53%",      color: "#6366f1" },
  { label: "Sessions simulateur", value: "86",      color: "#f59e0b" },
  { label: "Quiz complétés",      value: "247",     color: "#e879f9" },
  { label: "Élèves actifs/semaine", value: "41/47", color: "#14b8a6" },
  { label: "Devoirs corrigés",    value: "5/6",     color: "#fb923c" },
];

const TT = { contentStyle: { background: "#0d1a12", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 12, fontFamily: "DM Mono" }, labelStyle: { color: "#10b981" }, itemStyle: { color: "rgba(255,255,255,0.7)" } };

export default function StatsPage() {
  return (
    <TeacherLayout title="Statistiques">
      <div style={{ maxWidth: 900 }}>
        {/* Summary grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
          {SUMMARY.map(s => (
            <div key={s.label} style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderTop: `2px solid ${s.color}` }}>
              <div style={{ color: s.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Score progression chart */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 20px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
            Progression des scores — 4 semaines
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={WEEKLY} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[5, 10]} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingTop: 8 }} />
              <Line type="monotone" dataKey="A1" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="A1 Matin" />
              <Line type="monotone" dataKey="A2" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="A2 Soir" />
              <Line type="monotone" dataKey="B1" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="B1 CEFR" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Module completion chart */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 style={{ margin: "0 0 20px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
            Complétion par lektion (A1 vs A2)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MODULE_COMPLETION} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="module" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip {...TT} formatter={(v) => [`${v}%`, ""]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingTop: 8 }} />
              <Bar dataKey="A1" fill="#10b981" radius={[4, 4, 0, 0]} name="A1 Matin" />
              <Bar dataKey="A2" fill="#6366f1" radius={[4, 4, 0, 0]} name="A2 Soir" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </TeacherLayout>
  );
}
