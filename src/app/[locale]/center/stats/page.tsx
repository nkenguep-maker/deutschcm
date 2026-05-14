"use client";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import CenterLayout from "@/components/CenterLayout";

// ─── Mock data ────────────────────────────────────────────────────────────────

const RETENTION = [
  { periode: "J-7",  rétention: 88 },
  { periode: "J-14", rétention: 82 },
  { periode: "J-30", rétention: 74 },
  { periode: "J-60", rétention: 61 },
  { periode: "J-90", rétention: 52 },
];

const PROGRESSION_NIVEAUX = [
  { niveau: "A1", score: 7.4, completion: 78, eleves: 52 },
  { niveau: "A2", score: 6.9, completion: 65, eleves: 38 },
  { niveau: "B1", score: 7.8, completion: 71, eleves: 29 },
  { niveau: "B2", score: 7.1, completion: 58, eleves: 16 },
  { niveau: "C1", score: 8.2, completion: 45, eleves: 7  },
];

const PIE_NIVEAUX = [
  { name: "A1", value: 52, color: "#10b981" },
  { name: "A2", value: 38, color: "#34d399" },
  { name: "B1", value: 29, color: "#6366f1" },
  { name: "B2", value: 16, color: "#8b5cf6" },
  { name: "C1", value: 7,  color: "#eab308" },
];

const TOP_STUDENTS = [
  { rank: 1, name: "Olivia Tchamba",  xp: 3200, streak: 30, avgScore: 9.4, level: "B1" },
  { rank: 2, name: "Diane Biya",      xp: 2100, streak: 21, avgScore: 9.1, level: "B1" },
  { rank: 3, name: "Marie Nguemo",    xp: 1850, streak: 12, avgScore: 8.2, level: "A1" },
  { rank: 4, name: "Sandrine Kamga",  xp: 1560, streak: 7,  avgScore: 7.4, level: "A1" },
  { rank: 5, name: "Marc Essono",     xp: 1100, streak: 5,  avgScore: 6.1, level: "B2" },
  { rank: 6, name: "Brice Ondoua",    xp: 780,  streak: 4,  avgScore: 6.8, level: "A2" },
  { rank: 7, name: "Jean Mbarga",     xp: 680,  streak: 2,  avgScore: 5.8, level: "A2" },
  { rank: 8, name: "Paul Atangana",   xp: 920,  streak: 3,  avgScore: 4.5, level: "A1" },
  { rank: 9, name: "Fatiha Moussa",   xp: 460,  streak: 1,  avgScore: 3.8, level: "A1" },
  { rank: 10, name: "Eric Fotso",     xp: 430,  streak: 0,  avgScore: 3.2, level: "B2" },
];

const TOP_TEACHERS = [
  { rank: 1, name: "Sophie Tanda",       classes: 4, students: 52, avgScore: 8.7, completion: 82 },
  { rank: 2, name: "Dr. Beatrice Momo",  classes: 3, students: 48, avgScore: 8.4, completion: 78 },
  { rank: 3, name: "Jean-Pierre Nkolo",  classes: 2, students: 31, avgScore: 7.9, completion: 71 },
  { rank: 4, name: "Arsène Biyong",      classes: 2, students: 28, avgScore: 7.2, completion: 64 },
  { rank: 5, name: "Claudine Ewane",     classes: 1, students: 11, avgScore: 6.8, completion: 55 },
];

const MONTHLY_REVENUE = [
  { mois: "Nov", xaf: 75000 },
  { mois: "Déc", xaf: 75000 },
  { mois: "Jan", xaf: 75000 },
  { mois: "Fév", xaf: 75000 },
  { mois: "Mar", xaf: 75000 },
  { mois: "Avr", xaf: 75000 },
  { mois: "Mai", xaf: 75000 },
];

const MEDAL = ["🥇", "🥈", "🥉"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CenterStatsPage() {
  return (
    <CenterLayout title="Statistiques avancées">

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Rétention 30j", value: "74%", icon: "🔄", color: "#10b981", trend: "-4pts vs mois dernier" },
          { label: "Score moyen global", value: "7.5/10", icon: "📊", color: "#6366f1", trend: "+0.3 vs mois dernier" },
          { label: "Sessions simulateur", value: "387", icon: "🎙️", color: "#eab308", trend: "Ce mois" },
          { label: "Quiz complétés", value: "1 204", icon: "✅", color: "#f59e0b", trend: "Total cumulé" },
        ].map((k, i) => (
          <div key={i} style={{
            background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 16px", borderTop: `2px solid ${k.color}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{k.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{k.trend}</span>
            </div>
            <div style={{ color: k.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, marginBottom: 4 }}>{k.value}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Retention + Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>

        {/* Retention chart */}
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            Taux de rétention des élèves
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 20 }}>
            % d&apos;élèves encore actifs après N jours
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={RETENTION}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="periode" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[40, 100]} />
              <Tooltip contentStyle={{ background: "#161b22", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "#e2e8f0" }}
                formatter={(v) => [`${v ?? ""}%`, "Rétention"] as [string, string]} />
              <Line type="monotone" dataKey="rétention" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution par niveau pie */}
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Élèves par niveau
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PIE_NIVEAUX} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {PIE_NIVEAUX.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0" }}
                formatter={(v, name) => [v, name] as [number, string]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {PIE_NIVEAUX.map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.name}</span>
                <span style={{ color: p.color, fontWeight: 700 }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Progression + Revenue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Progression par niveau */}
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Progression moyenne par niveau
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={PROGRESSION_NIVEAUX}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="niveau" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0" }}
                formatter={(v) => [`${v ?? ""}%`, "Complétion"] as [string, string]} />
              <Bar dataKey="completion" fill="#6366f1" radius={[4, 4, 0, 0]} name="Complétion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly revenue */}
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
            Revenus mensuels (XAF)
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mois" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "#161b22", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, color: "#e2e8f0" }}
                formatter={(v) => [typeof v === "number" ? `${v.toLocaleString("fr-FR")} XAF` : String(v ?? ""), "Revenus"] as [string, string]} />
              <Bar dataKey="xaf" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Top students + Top teachers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Top 10 élèves */}
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            Top 10 élèves les plus actifs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TOP_STUDENTS.map(s => (
              <div key={s.rank} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, textAlign: "center", fontSize: s.rank <= 3 ? 18 : 12, color: s.rank <= 3 ? undefined : "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  {s.rank <= 3 ? MEDAL[s.rank - 1] : `#${s.rank}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: s.rank <= 3 ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                    {s.level} · {s.streak}🔥 · {s.xp.toLocaleString()} XP
                  </div>
                </div>
                <span style={{
                  color: s.avgScore >= 8 ? "#10b981" : s.avgScore >= 6 ? "#f59e0b" : "#ef4444",
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  {s.avgScore}/10
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher ranking */}
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>
          <div style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            Classement enseignants par performance
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {TOP_TEACHERS.map(t => (
              <div key={t.rank} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 28, textAlign: "center", fontSize: t.rank <= 3 ? 18 : 12, color: t.rank <= 3 ? undefined : "rgba(255,255,255,0.3)", flexShrink: 0, marginTop: 2 }}>
                  {t.rank <= 3 ? MEDAL[t.rank - 1] : `#${t.rank}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: t.rank <= 3 ? 700 : 400, marginBottom: 4 }}>
                    {t.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                      {t.classes} classes · {t.students} élèves
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Score</span>
                        <span style={{ color: "#eab308", fontSize: 10, fontWeight: 700 }}>{t.avgScore}/10</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 3, height: 4 }}>
                        <div style={{ width: `${(t.avgScore / 10) * 100}%`, height: "100%", background: "#eab308", borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Complétion</span>
                        <span style={{ color: "#10b981", fontSize: 10, fontWeight: 700 }}>{t.completion}%</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 3, height: 4 }}>
                        <div style={{ width: `${t.completion}%`, height: "100%", background: "#10b981", borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CenterLayout>
  );
}
