"use client";

import { useState } from "react";
import TeacherLayout from "@/components/TeacherLayout";
import { useT } from "@/hooks/useT";

const SAMPLE_ACTIVITIES = [
  { id: "a1", title: "Quiz Lektion 4 — Wortschatz",      class: "Groupe A1 Matin", due: "12 mai 2026", submitted: 12, total: 18, maxScore: 20, tab: "review",   icon: "✏️", hasAI: true  },
  { id: "a2", title: "Lesen Arbeit — Textverstehen",      class: "Groupe A1 Matin", due: "15 mai 2026", submitted:  7, total: 18, maxScore: 20, tab: "review",   icon: "📄", hasAI: false },
  { id: "a3", title: "Simulation Ambassade",              class: "Prépa CEFR B1",   due: "—",           submitted: 14, total: 14, maxScore: 30, tab: "approved", icon: "🎙️", hasAI: true  },
  { id: "a4", title: "Grammaire : Akkusativ & Dativ",     class: "Groupe A2 Soir",  due: "18 mai 2026", submitted:  3, total: 15, maxScore: 20, tab: "review",   icon: "📝", hasAI: false },
  { id: "a5", title: "Hörverstehen — Dialog au Café",     class: "Groupe A2 Soir",  due: "22 mai 2026", submitted:  0, total: 15, maxScore: 15, tab: "ai",       icon: "🎧", hasAI: true  },
  { id: "a6", title: "Schreiben — Brief an einen Freund", class: "Prépa CEFR B1",   due: "20 mai 2026", submitted:  9, total: 14, maxScore: 25, tab: "review",   icon: "✉️", hasAI: true  },
];

type Tab = "review" | "ai" | "approved" | "all";

export default function CorrectionsPage() {
  const { teacher: tT, common: tC, nav: tNav } = useT();
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [showModal, setShowModal] = useState(false);

  const filtered = SAMPLE_ACTIVITIES.filter(a => activeTab === "all" || a.tab === activeTab);
  const scoreColor = (pct: number) => pct >= 80 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "review",   label: tT.tabToReview,      count: SAMPLE_ACTIVITIES.filter(a => a.tab === "review").length },
    { key: "ai",       label: tT.tabAISuggestions,  count: SAMPLE_ACTIVITIES.filter(a => a.tab === "ai").length },
    { key: "approved", label: tT.tabApproved,       count: SAMPLE_ACTIVITIES.filter(a => a.tab === "approved").length },
    { key: "all",      label: tT.tabAll,             count: SAMPLE_ACTIVITIES.length },
  ];

  return (
    <TeacherLayout title={tNav.corrections}>
      <div style={{ maxWidth: 860 }}>

        {/* Subtitle + positioning */}
        <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.65)", fontSize: "0.86rem" }}>
          {tT.correctionsSubtitle2}
        </p>
        <p style={{ margin: "0 0 16px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>
          {tT.expertiseCenter}
        </p>

        {/* Trust note */}
        <div style={{ marginBottom: 18, padding: "14px 16px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
          <p style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", lineHeight: 1.55 }}>{tT.correctionsTrustCopy}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { step: "1", label: tT.correctionStepLearner, color: "#6366f1" },
              { step: "2", label: tT.correctionStepAI,      color: "#f59e0b" },
              { step: "3", label: tT.correctionStepFinal,   color: "#10b981" },
              { step: "4", label: tT.correctionStepSend,    color: "#10b981" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {i > 0 && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>→</span>}
                <span style={{ padding: "2px 8px", borderRadius: 6, background: `${s.color}12`, border: `1px solid ${s.color}28`, color: s.color, fontSize: "0.75rem", fontFamily: "'DM Mono', monospace" }}>
                  {s.step}. {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo banner */}
        <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "1px 8px", borderRadius: 5, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 700, flexShrink: 0 }}>{tT.sampleLabel}</span>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>{tT.aiTrustNote}</span>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "7px 14px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600,
              background: activeTab === tab.key ? "#10b981" : "rgba(255,255,255,0.05)",
              color: activeTab === tab.key ? "white" : "rgba(255,255,255,0.72)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {tab.label}
              <span style={{ padding: "1px 6px", borderRadius: 99, background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", fontSize: "0.75rem" }}>{tab.count}</span>
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={() => setShowModal(true)} style={{
            padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem",
            boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
          }}>{tT.prepareActivity}</button>
        </div>

        {/* Activity cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", margin: 0 }}>{tT.activityEmpty ?? "Aucune activité dans cette catégorie."}</p>
            </div>
          ) : filtered.map(a => {
            const pct = Math.round((a.submitted / a.total) * 100);
            return (
              <div key={a.id} style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: 2 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem" }}>{a.title}</span>
                      <span style={{ padding: "1px 8px", borderRadius: 5, background: "rgba(99,102,241,0.12)", color: "#818cf8", fontSize: "0.75rem" }}>{a.class}</span>
                      {a.hasAI && (
                        <span style={{ padding: "1px 8px", borderRadius: 5, background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "0.75rem", border: "1px solid rgba(16,185,129,0.2)" }}>
                          ✨ {tT.aiSuggestionAvailable}
                        </span>
                      )}
                      <span style={{ padding: "1px 8px", borderRadius: 5, background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: "0.75rem", border: "1px solid rgba(245,158,11,0.2)" }}>
                        {tT.sampleLabel}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.72)", fontSize: "0.875rem" }}>
                      {tT.deadline} : {a.due} · {tT.maxScoreLabel} : {a.maxScore} pts
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ flex: 1, maxWidth: 220 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.82rem" }}>{tT.submittedLabel}</span>
                          <span style={{ color: scoreColor(pct), fontSize: "0.78rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{a.submitted}/{a.total}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: scoreColor(pct) }} />
                        </div>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.82rem" }}>{pct}% {tT.submittedPctLabel}</span>
                    </div>
                  </div>
                  <button style={{
                    padding: "7px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.72)",
                    fontSize: "0.82rem", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                  }}>{tT.reviewBtn}</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prepare activity modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 28, width: "100%", maxWidth: 480 }}>
              <h2 style={{ margin: "0 0 20px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{tT.newActivityTitle}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: tT.fieldTitle, ph: tT.fieldTitlePh },
                  { label: tT.fieldClass, ph: tT.fieldClassPh },
                  { label: tT.fieldDue,   ph: "" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.875rem", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input placeholder={f.ph} style={{ width: "100%", padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "1rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
                {/* Teacher review always ON */}
                <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#10b981", fontSize: "0.85rem" }}>✓</span>
                    <span style={{ color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.75rem" }}>{tT.activityValidationRequired}</span>
                  </div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", paddingLeft: 24 }}>{tT.microcopy1}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 18px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.65)", cursor: "pointer", fontSize: "0.875rem" }}>{tC.cancel}</button>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: "#10b981", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}>{tT.createActivityDraft}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
