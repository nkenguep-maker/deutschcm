"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import TeacherLayout from "@/components/TeacherLayout";
import { useT } from "@/hooks/useT";

// Demo data — clearly labeled in UI
const DEMO_LEARNERS = [
  { id: "s1",  name: "Fatima Oumarou",  level: "A1", class: "Groupe A1 Matin", avgScore: 9.0, progress: 78, lastActive: "2h",  streak: 14, status: "good"       },
  { id: "s2",  name: "Alice Fotso",     level: "A1", class: "Groupe A1 Matin", avgScore: 7.6, progress: 62, lastActive: "5h",  streak: 9,  status: "good"       },
  { id: "s3",  name: "Rodrigue Essama", level: "A1", class: "Groupe A1 Matin", avgScore: 7.1, progress: 55, lastActive: "1j",  streak: 5,  status: "progressing" },
  { id: "s4",  name: "Nathalie Bello",  level: "A1", class: "Groupe A1 Matin", avgScore: 6.3, progress: 47, lastActive: "2j",  streak: 3,  status: "progressing" },
  { id: "s5",  name: "Christian Ondoa", level: "A1", class: "Groupe A1 Matin", avgScore: 5.9, progress: 39, lastActive: "3j",  streak: 2,  status: "encourage"   },
  { id: "s6",  name: "Jean-Paul Mvondo",level: "A1", class: "Groupe A1 Matin", avgScore: 3.2, progress: 32, lastActive: "5j",  streak: 0,  status: "support"     },
  { id: "s7",  name: "Boris Kamga",     level: "A1", class: "Groupe A1 Matin", avgScore: 2.8, progress: 28, lastActive: "8j",  streak: 0,  status: "inactive"    },
  { id: "s8",  name: "Paul Biya",       level: "A2", class: "Groupe A2 Soir",  avgScore: 8.1, progress: 60, lastActive: "4h",  streak: 11, status: "good"        },
  { id: "s9",  name: "Sylvie Ntang",    level: "A2", class: "Groupe A2 Soir",  avgScore: 7.4, progress: 52, lastActive: "1j",  streak: 7,  status: "progressing" },
  { id: "s10", name: "Aminata Diallo",  level: "A2", class: "Groupe A2 Soir",  avgScore: 4.1, progress: 41, lastActive: "3j",  streak: 1,  status: "encourage"   },
  { id: "s11", name: "David Abomo",     level: "B1", class: "Prépa CEFR B1",   avgScore: 9.2, progress: 82, lastActive: "1h",  streak: 22, status: "good"        },
  { id: "s12", name: "Claire Mballa",   level: "B1", class: "Prépa CEFR B1",   avgScore: 8.6, progress: 76, lastActive: "3h",  streak: 18, status: "good"        },
  { id: "s13", name: "Eric Mfou",       level: "B1", class: "Prépa CEFR B1",   avgScore: 7.8, progress: 68, lastActive: "6h",  streak: 12, status: "progressing" },
];

type StatusFilter = "all" | "encourage" | "progressing" | "support" | "inactive";

const statusConfig: Record<string, { color: string; bg: string; border: string; label: (tT: ReturnType<typeof useT>["teacher"]) => string }> = {
  good:        { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  label: tT => tT.learnerGoodProgress },
  progressing: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)",  label: tT => tT.learnerGoodProgress },
  encourage:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  label: tT => tT.filterNeedsEncouragement },
  support:     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   label: tT => tT.learnerNeedsSupport },
  inactive:    { color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", label: tT => tT.learnerInactive },
};

const scoreColor = (v: number) => v >= 7 ? "#10b981" : v >= 5 ? "#f59e0b" : "#ef4444";

export default function LearnersPage() {
  const { teacher: tT, nav: tNav, common: tC } = useT();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = DEMO_LEARNERS.filter(s => {
    const matchFilter = filter === "all" || s.status === filter;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.class.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all",        label: tT.filterAll,               count: DEMO_LEARNERS.length },
    { key: "encourage",  label: tT.filterNeedsEncouragement, count: DEMO_LEARNERS.filter(s => s.status === "encourage").length },
    { key: "progressing",label: tT.filterProgressing,        count: DEMO_LEARNERS.filter(s => s.status === "progressing" || s.status === "good").length },
    { key: "support",    label: tT.filterNeedsSupport,       count: DEMO_LEARNERS.filter(s => s.status === "support").length },
    { key: "inactive",   label: tT.filterInactive,           count: DEMO_LEARNERS.filter(s => s.status === "inactive").length },
  ];

  return (
    <TeacherLayout title={tNav.learners}>
      <div>
        {/* Subtitle */}
        <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.65)", fontSize: "0.86rem" }}>
          {tT.learnersSubtitle}
        </p>

        {/* Demo banner */}
        <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "1px 8px", borderRadius: 5, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 700, flexShrink: 0 }}>{tT.demoLabel}</span>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>{tT.demoLearnersBanner}</span>
        </div>

        {/* Filters + search */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: "7px 14px", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600,
                background: filter === tab.key ? "#10b981" : "rgba(255,255,255,0.05)",
                color: filter === tab.key ? "white" : "rgba(255,255,255,0.72)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {tab.label}
                <span style={{ padding: "1px 6px", borderRadius: 99, background: filter === tab.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", fontSize: "0.75rem" }}>{tab.count}</span>
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${tC.search}…`}
            style={{ width: "100%", maxWidth: 360, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "1rem", outline: "none" }}
          />
        </div>

        {/* Learner cards grid */}
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.86rem", margin: 0 }}>{tT.learnersEmpty}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 14 }}>
            {filtered.map(s => {
              const cfg = statusConfig[s.status] ?? statusConfig.progressing;
              return (
                <div key={s.id} style={{ padding: "18px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 }}>
                      {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                      <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.68)", fontSize: "0.82rem" }}>{s.class}</p>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600, flexShrink: 0 }}>
                      {cfg.label(tT)}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                      <p style={{ margin: 0, color: scoreColor(s.avgScore), fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{s.avgScore}/10</p>
                      <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }}>score</p>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                      <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{s.progress}%</p>
                      <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }}>{tT.classProgress}</p>
                    </div>
                    <div style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                      <p style={{ margin: 0, color: s.streak > 0 ? "#f59e0b" : "rgba(255,255,255,0.25)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{s.streak > 0 ? `🔥 ${s.streak}j` : "—"}</p>
                      <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }}>streak</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${s.progress}%`, background: scoreColor(s.avgScore) }} />
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.68)", fontSize: "0.82rem" }}>{tT.learnerLastActive ?? "Dernière activité"} : il y a {s.lastActive}</span>
                    <Link href={`/teacher/students/${s.id}`} style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.78)", fontSize: "0.82rem", textDecoration: "none", fontFamily: "'Syne', sans-serif" }}>
                      {tT.viewStudent}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
