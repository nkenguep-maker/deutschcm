"use client";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLocale } from "next-intl";
import CenterLayout from "@/components/CenterLayout";
import { IconChart, IconGroup, IconMic, IconCheck } from "@/components/landing/icons";

const RETENTION = [
  { periode: "J-7",  taux: 88 },
  { periode: "J-14", taux: 82 },
  { periode: "J-30", taux: 74 },
  { periode: "J-60", taux: 61 },
  { periode: "J-90", taux: 52 },
];

const PROGRESSION = [
  { niveau: "A1", completion: 78, eleves: 52 },
  { niveau: "A2", completion: 65, eleves: 38 },
  { niveau: "B1", completion: 71, eleves: 29 },
  { niveau: "B2", completion: 58, eleves: 16 },
  { niveau: "C1", completion: 45, eleves: 7  },
];

const BRASS_TIER = [
  "var(--brass)",         // brass
  "rgba(184, 135, 62, 0.75)",
  "rgba(184, 135, 62, 0.55)",
  "rgba(184, 135, 62, 0.38)",
  "rgba(184, 135, 62, 0.22)",
];

const PIE_LEVELS = [
  { name: "A1", value: 52 },
  { name: "A2", value: 38 },
  { name: "B1", value: 29 },
  { name: "B2", value: 16 },
  { name: "C1", value: 7  },
];

const TOP_STUDENTS = [
  { rank: 1,  name: "Olivia Tchamba", xp: 3200, streak: 30, avgScore: 9.4, level: "B1" },
  { rank: 2,  name: "Diane Biya",     xp: 2100, streak: 21, avgScore: 9.1, level: "B1" },
  { rank: 3,  name: "Marie Nguemo",   xp: 1850, streak: 12, avgScore: 8.2, level: "A1" },
  { rank: 4,  name: "Sandrine Kamga", xp: 1560, streak: 7,  avgScore: 7.4, level: "A1" },
  { rank: 5,  name: "Marc Essono",    xp: 1100, streak: 5,  avgScore: 6.1, level: "B2" },
  { rank: 6,  name: "Brice Ondoua",   xp: 780,  streak: 4,  avgScore: 6.8, level: "A2" },
  { rank: 7,  name: "Jean Mbarga",    xp: 680,  streak: 2,  avgScore: 5.8, level: "A2" },
  { rank: 8,  name: "Paul Atangana",  xp: 920,  streak: 3,  avgScore: 4.5, level: "A1" },
  { rank: 9,  name: "Fatiha Moussa",  xp: 460,  streak: 1,  avgScore: 3.8, level: "A1" },
  { rank: 10, name: "Eric Fotso",     xp: 430,  streak: 0,  avgScore: 3.2, level: "B2" },
];

const TOP_TEACHERS = [
  { rank: 1, name: "Sophie Tanda",       classes: 4, students: 52, avgScore: 8.7, completion: 82 },
  { rank: 2, name: "Dr. Beatrice Momo",  classes: 3, students: 48, avgScore: 8.4, completion: 78 },
  { rank: 3, name: "Jean-Pierre Nkolo",  classes: 2, students: 31, avgScore: 7.9, completion: 71 },
  { rank: 4, name: "Arsène Biyong",      classes: 2, students: 28, avgScore: 7.2, completion: 64 },
  { rank: 5, name: "Claudine Ewane",     classes: 1, students: 11, avgScore: 6.8, completion: 55 },
];

const REVENUE = [
  { mois: "Nov", xaf: 75000 },
  { mois: "Déc", xaf: 75000 },
  { mois: "Jan", xaf: 75000 },
  { mois: "Fév", xaf: 75000 },
  { mois: "Mar", xaf: 75000 },
  { mois: "Avr", xaf: 75000 },
  { mois: "Mai", xaf: 75000 },
];

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  kpi: [
    { label: string; val: string; sub: string },
    { label: string; val: string; sub: string },
    { label: string; val: string; sub: string },
    { label: string; val: string; sub: string },
  ];
  retentionH: string;
  retentionSub: string;
  levelsH: string;
  progressH: string;
  revenueH: string;
  topStuH: string;
  topTeachH: string;
  labelScore: string;
  labelCompletion: string;
  labelClasses: (n: number) => string;
  labelStudents: (n: number) => string;
  labelStreak: string;
  labelXP: string;
}

const FR: Copy = {
  title: "Statistiques",
  eye: "Statistiques",
  h: "Lire ton centre en un coup d'œil.",
  sub: "Chiffres du mois, tendances, classements. Rien n'est optimisé pour flatter — tout est là pour piloter.",
  kpi: [
    { label: "Rétention 30 j", val: "74%", sub: "-4 pts vs mois passé" },
    { label: "Score moyen",    val: "7,5",   sub: "+0,3 vs mois passé" },
    { label: "Sessions simulateur", val: "387", sub: "Ce mois-ci" },
    { label: "Quiz complétés", val: "1 204", sub: "Total cumulé" },
  ],
  retentionH: "Rétention des apprenant·e·s",
  retentionSub: "% d'apprenant·e·s encore actif·ve·s après N jours.",
  levelsH: "Distribution par niveau",
  progressH: "Progression moyenne par niveau (%)",
  revenueH: "Revenus mensuels (XAF)",
  topStuH: "Top 10 apprenant·e·s les plus actif·ve·s",
  topTeachH: "Classement enseignant·e·s",
  labelScore: "Score",
  labelCompletion: "Complétion",
  labelClasses: (n) => `${n} classe${n > 1 ? "s" : ""}`,
  labelStudents: (n) => `${n} apprenant·e·s`,
  labelStreak: "j de série",
  labelXP: "XP",
};

const EN: Copy = {
  title: "Statistics",
  eye: "Statistics",
  h: "Read your center at a glance.",
  sub: "Monthly numbers, trends, rankings. Nothing tuned to flatter — everything's here to steer.",
  kpi: [
    { label: "30-day retention", val: "74%", sub: "-4 pts vs last month" },
    { label: "Avg. score",       val: "7.5",  sub: "+0.3 vs last month" },
    { label: "Simulator sessions", val: "387", sub: "This month" },
    { label: "Quizzes completed", val: "1,204", sub: "All-time" },
  ],
  retentionH: "Learner retention",
  retentionSub: "% of learners still active after N days.",
  levelsH: "Level distribution",
  progressH: "Average completion by level (%)",
  revenueH: "Monthly revenue (XAF)",
  topStuH: "Top 10 most active learners",
  topTeachH: "Teacher performance ranking",
  labelScore: "Score",
  labelCompletion: "Completion",
  labelClasses: (n) => `${n} class${n > 1 ? "es" : ""}`,
  labelStudents: (n) => `${n} learners`,
  labelStreak: "d streak",
  labelXP: "XP",
};

const CHART_TOOLTIP = {
  background: "var(--espresso-2)",
  border: "1px solid var(--brass-edge)",
  borderRadius: 8,
  color: "var(--creme)",
  fontFamily: "var(--font-jetbrains, monospace)",
  fontSize: 12,
};

export default function CenterStatsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const kpiIcons = [<IconChart size={16} key="c" />, <IconCheck size={16} key="k" />, <IconMic size={16} key="m" />, <IconGroup size={16} key="g" />];

  return (
    <CenterLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
        </header>

        <section className="dash-stats">
          {t.kpi.map((k, i) => (
            <div key={k.label} className="dash-stat">
              <p className="dash-stat-lbl">
                <span className="dash-stat-icon" aria-hidden="true">{kpiIcons[i]}</span>
                {k.label}
              </p>
              <p className="dash-stat-val">{k.val}</p>
              <p className="dash-stat-sub">{k.sub}</p>
            </div>
          ))}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }} className="stats-grid-1">
          <ChartCard title={t.retentionH} subtitle={t.retentionSub}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={RETENTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--creme-hair)" />
                <XAxis dataKey="periode" stroke="var(--creme-mute)" tick={{ fontSize: 11, fontFamily: "var(--font-jetbrains, monospace)" }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--creme-mute)" tick={{ fontSize: 11, fontFamily: "var(--font-jetbrains, monospace)" }} tickLine={false} axisLine={false} domain={[40, 100]} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`${v}%`, t.retentionH]} />
                <Line type="monotone" dataKey="taux" stroke="var(--brass)" strokeWidth={2.5} dot={{ fill: "var(--brass)", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t.levelsH}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={PIE_LEVELS} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {PIE_LEVELS.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BRASS_TIER[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 10 }}>
              {PIE_LEVELS.map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: BRASS_TIER[i] }} aria-hidden="true" />
                  <span style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11, color: "var(--creme-soft)" }}>
                    {p.name} · {p.value}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="stats-grid-2">
          <ChartCard title={t.progressH}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={PROGRESSION}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--creme-hair)" />
                <XAxis dataKey="niveau" stroke="var(--creme-mute)" tick={{ fontSize: 12, fontFamily: "var(--font-jetbrains, monospace)" }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--creme-mute)" tick={{ fontSize: 11, fontFamily: "var(--font-jetbrains, monospace)" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`${v}%`, t.labelCompletion]} />
                <Bar dataKey="completion" fill="var(--brass)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t.revenueH}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--creme-hair)" />
                <XAxis dataKey="mois" stroke="var(--creme-mute)" tick={{ fontSize: 12, fontFamily: "var(--font-jetbrains, monospace)" }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--creme-mute)" tick={{ fontSize: 10, fontFamily: "var(--font-jetbrains, monospace)" }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={CHART_TOOLTIP}
                         formatter={(v) => [typeof v === "number" ? `${v.toLocaleString()} XAF` : String(v), t.revenueH]} />
                <Bar dataKey="xaf" fill="var(--brass)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="stats-grid-2">
          <div style={{
            background: "var(--espresso-2)",
            border: "1px solid var(--creme-hair)",
            borderRadius: 14,
            padding: 22,
          }}>
            <h3 style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 16,
              color: "var(--creme)",
              margin: "0 0 16px",
              fontWeight: 400,
            }}>{t.topStuH}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TOP_STUDENTS.map((s) => (
                <div key={s.rank} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 24,
                    textAlign: "center",
                    fontFamily: "var(--font-jetbrains, monospace)",
                    fontSize: 11,
                    color: s.rank <= 3 ? "var(--brass)" : "var(--creme-mute)",
                    fontWeight: s.rank <= 3 ? 700 : 500,
                    flexShrink: 0,
                  }}>#{s.rank}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: 13.5,
                      color: "var(--creme)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>{s.name}</p>
                    <p style={{
                      color: "var(--creme-mute)",
                      fontSize: 11,
                      fontFamily: "var(--font-jetbrains, monospace)",
                      margin: "2px 0 0",
                    }}>
                      {s.level} · {s.streak} {t.labelStreak} · {s.xp.toLocaleString()} {t.labelXP}
                    </p>
                  </div>
                  <span className={`score-cell ${s.avgScore >= 8 ? "high" : s.avgScore >= 6 ? "mid" : "low"}`}>
                    {s.avgScore}/10
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: "var(--espresso-2)",
            border: "1px solid var(--creme-hair)",
            borderRadius: 14,
            padding: 22,
          }}>
            <h3 style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 16,
              color: "var(--creme)",
              margin: "0 0 16px",
              fontWeight: 400,
            }}>{t.topTeachH}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {TOP_TEACHERS.map((teach) => (
                <div key={teach.rank} style={{ display: "flex", gap: 12 }}>
                  <span style={{
                    width: 24,
                    textAlign: "center",
                    fontFamily: "var(--font-jetbrains, monospace)",
                    fontSize: 11,
                    color: teach.rank <= 3 ? "var(--brass)" : "var(--creme-mute)",
                    fontWeight: teach.rank <= 3 ? 700 : 500,
                    flexShrink: 0,
                    paddingTop: 2,
                  }}>#{teach.rank}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: 13.5,
                      color: "var(--creme)",
                      margin: 0,
                    }}>{teach.name}</p>
                    <p style={{
                      color: "var(--creme-mute)",
                      fontSize: 11,
                      fontFamily: "var(--font-jetbrains, monospace)",
                      margin: "2px 0 8px",
                    }}>
                      {t.labelClasses(teach.classes)} · {t.labelStudents(teach.students)}
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <MiniBar label={t.labelScore} value={(teach.avgScore / 10) * 100} display={`${teach.avgScore}/10`} />
                      <MiniBar label={t.labelCompletion} value={teach.completion} display={`${teach.completion}%`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .stats-grid-1 { grid-template-columns: 1fr !important; }
          .stats-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </CenterLayout>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--espresso-2)",
      border: "1px solid var(--creme-hair)",
      borderRadius: 14,
      padding: 22,
    }}>
      <h3 style={{
        fontFamily: "var(--font-fraunces), Georgia, serif",
        fontSize: 15.5,
        color: "var(--creme)",
        margin: "0 0 4px",
        fontWeight: 400,
      }}>{title}</h3>
      {subtitle && (
        <p style={{
          color: "var(--creme-mute)",
          fontSize: 11.5,
          fontFamily: "var(--font-jetbrains, monospace)",
          letterSpacing: "0.04em",
          margin: "0 0 14px",
        }}>{subtitle}</p>
      )}
      {children}
    </div>
  );
}

function MiniBar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ color: "var(--creme-mute)", fontSize: 10, fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: "var(--brass)", fontSize: 10, fontFamily: "var(--font-jetbrains, monospace)", fontWeight: 700 }}>{display}</span>
      </div>
      <div className="card-progress" style={{ height: 3 }}>
        <div className="card-progress-bar" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
