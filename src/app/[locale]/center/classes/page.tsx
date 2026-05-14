"use client";

import { useState } from "react";
import CenterLayout from "@/components/CenterLayout";

const CLASSES = [
  {
    id: "cls1", name: "Groupe A1 Matin",  level: "A1", teacher: "Prof. Marie Tchamba",
    code: "LINGUA-A1-MT2026", students: 18, maxStudents: 25,
    avgProgress: 45, avgScore: 7.5, isActive: true,
    schedule: "Lun · Mer · Ven  08h–10h", enrolled: "10 jan 2026",
  },
  {
    id: "cls2", name: "Groupe A1 Soir",   level: "A1", teacher: "Prof. Jean Mbarga",
    code: "LINGUA-A1-SR2026", students: 14, maxStudents: 20,
    avgProgress: 38, avgScore: 6.9, isActive: true,
    schedule: "Mar · Jeu  18h–20h", enrolled: "15 jan 2026",
  },
  {
    id: "cls3", name: "Groupe A2 Matin",  level: "A2", teacher: "Prof. Marie Tchamba",
    code: "LINGUA-A2-MT2026", students: 12, maxStudents: 20,
    avgProgress: 62, avgScore: 7.8, isActive: true,
    schedule: "Lun · Mer  09h–11h", enrolled: "20 jan 2026",
  },
  {
    id: "cls4", name: "Groupe A2 Soir",   level: "A2", teacher: "Prof. Esther Fouda",
    code: "LINGUA-A2-SR2026", students: 15, maxStudents: 20,
    avgProgress: 32, avgScore: 7.3, isActive: true,
    schedule: "Mar · Jeu  18h–20h", enrolled: "22 jan 2026",
  },
  {
    id: "cls5", name: "Prépa Goethe B1",  level: "B1", teacher: "Prof. Marie Tchamba",
    code: "LINGUA-B1-GP2026", students: 14, maxStudents: 20,
    avgProgress: 71, avgScore: 8.1, isActive: true,
    schedule: "Sam  09h–13h", enrolled: "5 fév 2026",
  },
  {
    id: "cls6", name: "Intensif B2",      level: "B2", teacher: "Prof. Alain Nkolo",
    code: "LINGUA-B2-IN2026", students: 9,  maxStudents: 15,
    avgProgress: 54, avgScore: 8.4, isActive: true,
    schedule: "Ven  14h–18h · Sam  14h–18h", enrolled: "1 mar 2026",
  },
  {
    id: "cls7", name: "Conversation C1",  level: "C1", teacher: "Prof. Sophie Beti",
    code: "LINGUA-C1-CV2026", students: 6,  maxStudents: 12,
    avgProgress: 80, avgScore: 8.9, isActive: false,
    schedule: "Mer  16h–18h", enrolled: "12 mar 2026",
  },
];

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#14b8a6", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f97316",
};

type Filter = "all" | "active" | "inactive";

export default function CenterClassesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = CLASSES.filter(c => {
    const matchFilter = filter === "active" ? c.isActive : filter === "inactive" ? !c.isActive : true;
    const q = search.toLowerCase();
    return matchFilter && (c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q) || c.level.toLowerCase().includes(q));
  });

  const totalStudents = filtered.reduce((s, c) => s + c.students, 0);

  return (
    <CenterLayout title="Classes">
      <div style={{ maxWidth: 960 }}>

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Classes totales",  value: CLASSES.length,                        color: "#eab308" },
            { label: "Classes actives",  value: CLASSES.filter(c => c.isActive).length, color: "#10b981" },
            { label: "Élèves inscrits",  value: CLASSES.reduce((s, c) => s + c.students, 0), color: "#6366f1" },
            { label: "Places libres",    value: CLASSES.reduce((s, c) => s + (c.maxStudents - c.students), 0), color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderTop: `2px solid ${s.color}` }}>
              <div style={{ color: s.color, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une classe, un prof, un niveau…"
            style={{
              flex: 1, minWidth: 220, padding: "9px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "white", fontSize: "0.8rem", outline: "none",
            }}
          />
          {(["all", "active", "inactive"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontFamily: "'Syne', sans-serif", fontWeight: 600,
              background: filter === f ? "#eab308" : "rgba(255,255,255,0.05)",
              color: filter === f ? "#0a0a0a" : "rgba(255,255,255,0.4)",
            }}>
              {f === "all" ? "Toutes" : f === "active" ? "Actives" : "Inactives"}
            </button>
          ))}
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>{filtered.length} classe{filtered.length > 1 ? "s" : ""} · {totalStudents} élèves</span>
          <button onClick={() => setShowModal(true)} style={{
            padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #eab308, #ca8a04)", color: "#0a0a0a",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem",
            boxShadow: "0 4px 16px rgba(234,179,8,0.25)",
          }}>+ Nouvelle classe</button>
        </div>

        {/* Class cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(cls => {
            const c = LEVEL_COLORS[cls.level] ?? "#eab308";
            const pct = Math.round((cls.students / cls.maxStudents) * 100);
            const scoreColor = (v: number) => v >= 8 ? "#10b981" : v >= 6 ? "#f59e0b" : "#ef4444";
            return (
              <div key={cls.id} style={{
                padding: "20px 24px", borderRadius: 16,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                      <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{cls.name}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: `${c}18`, color: c, border: `1px solid ${c}33`, fontSize: "0.65rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{cls.level}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: cls.isActive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)", color: cls.isActive ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: "0.62rem" }}>
                        {cls.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>
                      👨‍🏫 {cls.teacher} · 🕐 {cls.schedule}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <code style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", color: c, fontSize: "0.65rem" }}>{cls.code}</code>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
                  {[
                    { v: `${cls.students}/${cls.maxStudents}`, l: "élèves" },
                    { v: `${cls.avgProgress}%`, l: "progression" },
                    { v: `${cls.avgScore}/10`, l: "score moyen" },
                    { v: cls.enrolled, l: "ouvert le" },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: "center", padding: "8px 0", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>{s.v}</div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.58rem", marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: `linear-gradient(90deg, ${c}88, ${c})` }} />
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.62rem", flexShrink: 0 }}>{pct}% rempli</span>
                  <button style={{ padding: "5px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", cursor: "pointer" }}>
                    Gérer
                  </button>
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
              <h2 style={{ margin: "0 0 24px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>Nouvelle classe</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Nom de la classe", ph: "Ex: Groupe B1 Weekend" },
                  { label: "Enseignant",        ph: "Prof. Marie Tchamba" },
                  { label: "Niveau",            ph: "A1 / A2 / B1 / B2 / C1" },
                  { label: "Capacité max",      ph: "20" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input placeholder={f.ph} style={{ width: "100%", padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Annuler</button>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: "#eab308", color: "#0a0a0a", fontWeight: 700, cursor: "pointer" }}>Créer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CenterLayout>
  );
}
