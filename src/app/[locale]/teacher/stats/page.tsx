"use client";

import TeacherLayout from "@/components/TeacherLayout";
import { useT } from "@/hooks/useT";
import { Link } from "@/navigation";

// Demo chart data — clearly labeled
const WEEKLY_DEMO = [
  { name: "Sem 1", A1: 6.2, A2: 5.8 },
  { name: "Sem 2", A1: 6.8, A2: 6.3 },
  { name: "Sem 3", A1: 7.1, A2: 6.9 },
  { name: "Sem 4", A1: 7.4, A2: 7.2 },
];

export default function TrackingPage() {
  const { teacher: tT, nav: tNav } = useT();

  const hasDemoData = true; // switch to false when real API data available

  return (
    <TeacherLayout title={tNav.tracking}>
      <div style={{ maxWidth: 900 }}>

        {/* Subtitle */}
        <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
          {tT.trackingSubtitle}
        </p>

        {/* Demo data banner */}
        {hasDemoData && (
          <div style={{ marginBottom: 28, padding: "12px 16px", borderRadius: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ padding: "1px 8px", borderRadius: 5, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "0.6rem", fontFamily: "'Syne', sans-serif", fontWeight: 700, flexShrink: 0 }}>Démo</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>{tT.demoDataBanner}</span>
          </div>
        )}

        {/* 1 — Points d'attention */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 14px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
            {tT.trackingAttnTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12 }}>
            {[
              { icon: "⚠️", label: "Apprenants en difficulté",    value: "2",    color: "#ef4444", hint: "Score < 5/10" },
              { icon: "💤", label: "Inactifs cette semaine",      value: "1",    color: "#6b7280", hint: "Pas de connexion depuis 7j" },
              { icon: "📈", label: "En forte progression",        value: "3",    color: "#10b981", hint: "Score en hausse" },
              { icon: "🏆", label: "Objectif atteint",            value: "5",    color: "#f59e0b", hint: "Module complété" },
            ].map(s => (
              <div key={s.label} style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}20`, opacity: hasDemoData ? 0.7 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>
                  <span style={{ color: s.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.5rem" }}>{s.value}</span>
                </div>
                <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.7)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem" }}>{s.label}</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.62rem" }}>{s.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2 — Progression par classe */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 14px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
            {tT.trackingClassTitle}
          </h2>
          <div style={{ padding: "20px 22px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", opacity: hasDemoData ? 0.75 : 1 }}>
            <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{tT.chartWeeksLabel}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {WEEKLY_DEMO.map(week => (
                <div key={week.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", width: 44, flexShrink: 0 }}>{week.name}</span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", flex: 1, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, width: `${(week.A1 / 10) * 100}%`, background: "#10b981" }} />
                      </div>
                      <span style={{ color: "#10b981", fontSize: "0.65rem", width: 40, textAlign: "right" }}>A1: {week.A1}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", flex: 1, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, width: `${(week.A2 / 10) * 100}%`, background: "#6366f1" }} />
                      </div>
                      <span style={{ color: "#6366f1", fontSize: "0.65rem", width: 40, textAlign: "right" }}>A2: {week.A2}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 — Compétences à renforcer */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 14px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
            {tT.trackingSkillsTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))", gap: 10 }}>
            {[
              { skill: "Grammaire",     pct: 58, color: "#ef4444" },
              { skill: "Vocabulaire",   pct: 72, color: "#f59e0b" },
              { skill: "Compréhension", pct: 81, color: "#10b981" },
              { skill: "Expression",    pct: 44, color: "#ef4444" },
            ].map(s => (
              <div key={s.skill} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", opacity: hasDemoData ? 0.75 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>{s.skill}</span>
                  <span style={{ color: s.color, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.75rem" }}>{s.pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — Activité récente */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 14px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
            {tT.trackingActivityTitle}
          </h2>
          <div style={{ padding: "24px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", margin: 0 }}>{tT.trackingNoData}</p>
          </div>
        </section>

        {/* 5 — Prochaine action recommandée */}
        <section>
          <h2 style={{ margin: "0 0 14px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
            {tT.trackingNextTitle}
          </h2>
          <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: "0 0 4px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>
                Encourager les apprenants inactifs
              </p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                1 apprenant n'a pas pratiqué depuis plus de 7 jours. Un message peut faire la différence.
              </p>
            </div>
            <Link href="/teacher/students" style={{
              padding: "8px 18px", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)",
              color: "#10b981", fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
            }}>
              {tT.todayAttnCTA2} →
            </Link>
          </div>
        </section>
      </div>
    </TeacherLayout>
  );
}
