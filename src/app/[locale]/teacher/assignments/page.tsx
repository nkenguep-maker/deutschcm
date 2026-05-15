"use client";

import { useState } from "react";
import TeacherLayout from "@/components/TeacherLayout";

const ASSIGNMENTS = [
  { id: "a1", title: "Quiz Lektion 4 — Wortschatz",       class: "Groupe A1 Matin",  due: "12 mai 2026", submitted: 12, total: 18, maxScore: 20, status: "open",   icon: "✏️" },
  { id: "a2", title: "Lesen Arbeit — Textverstehen",       class: "Groupe A1 Matin",  due: "15 mai 2026", submitted:  7, total: 18, maxScore: 20, status: "open",   icon: "📄" },
  { id: "a3", title: "Simulation Ambassade",               class: "Prépa CEFR B1",  due: "—",           submitted: 14, total: 14, maxScore: 30, status: "closed", icon: "🎙️" },
  { id: "a4", title: "Grammaire : Akkusativ & Dativ",      class: "Groupe A2 Soir",   due: "18 mai 2026", submitted:  3, total: 15, maxScore: 20, status: "open",   icon: "📝" },
  { id: "a5", title: "Hörverstehen — Dialog au Café",      class: "Groupe A2 Soir",   due: "22 mai 2026", submitted:  0, total: 15, maxScore: 15, status: "open",   icon: "🎧" },
  { id: "a6", title: "Schreiben — Brief an einen Freund",  class: "Prépa CEFR B1",  due: "20 mai 2026", submitted:  9, total: 14, maxScore: 25, status: "open",   icon: "✉️" },
];

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = ASSIGNMENTS.filter(a => filter === "all" || a.status === filter);
  const scoreColor = (pct: number) => pct >= 80 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <TeacherLayout title="Devoirs">
      <div style={{ maxWidth: 860 }}>
        {/* Controls */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
          {(["all", "open", "closed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontFamily: "'Syne', sans-serif", fontWeight: 600,
              background: filter === f ? "#10b981" : "rgba(255,255,255,0.05)",
              color: filter === f ? "white" : "rgba(255,255,255,0.4)",
            }}>
              {f === "all" ? "Tous" : f === "open" ? "En cours" : "Terminés"}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={() => setShowModal(true)} style={{
            padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem",
            boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
          }}>+ Créer un devoir</button>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(a => {
            const pct = Math.round((a.submitted / a.total) * 100);
            return (
              <div key={a.id} style={{ padding: "20px 22px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: 2 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>{a.title}</span>
                      <span style={{ padding: "1px 8px", borderRadius: 5, background: "rgba(99,102,241,0.12)", color: "#818cf8", fontSize: "0.62rem" }}>{a.class}</span>
                      <span style={{ padding: "1px 8px", borderRadius: 5, background: a.status === "open" ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)", color: a.status === "open" ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: "0.62rem" }}>
                        {a.status === "open" ? "Ouvert" : "Fermé"}
                      </span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", marginBottom: 12 }}>
                      Échéance : {a.due} · Note max : {a.maxScore} pts
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ flex: 1, maxWidth: 240 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem" }}>Rendus</span>
                          <span style={{ color: scoreColor(pct), fontSize: "0.68rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{a.submitted}/{a.total}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: scoreColor(pct) }} />
                        </div>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.68rem" }}>{pct}% remis</span>
                    </div>
                  </div>
                  <button style={{
                    padding: "7px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
                    fontSize: "0.72rem", cursor: "pointer", flexShrink: 0,
                  }}>Corriger</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 32, width: 480, maxWidth: "90vw" }}>
              <h2 style={{ margin: "0 0 24px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>Nouveau devoir</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Titre", ph: "Ex: Vocabulaire Lektion 5" },
                  { label: "Classe", ph: "Groupe A1 Matin" },
                  { label: "Date limite", ph: "" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input placeholder={f.ph} style={{ width: "100%", padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Annuler</button>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: "#10b981", color: "white", fontWeight: 700, cursor: "pointer" }}>Créer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
