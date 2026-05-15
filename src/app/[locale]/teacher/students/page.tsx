"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import TeacherLayout from "@/components/TeacherLayout";

const ALL_STUDENTS = [
  { id: "s1",  name: "Fatima Oumarou",    email: "fatima.oumarou@gmail.com",  level: "A1", class: "Groupe A1 Matin", xp: 2140, avgScore: 9.0, progress: 78, lastActive: "il y a 2h",  streak: 14 },
  { id: "s2",  name: "Alice Fotso",        email: "alice.fotso@gmail.com",     level: "A1", class: "Groupe A1 Matin", xp: 1680, avgScore: 7.6, progress: 62, lastActive: "il y a 5h",  streak: 9  },
  { id: "s3",  name: "Rodrigue Essama",    email: "r.essama@yahoo.fr",         level: "A1", class: "Groupe A1 Matin", xp: 1320, avgScore: 7.1, progress: 55, lastActive: "il y a 1j",  streak: 5  },
  { id: "s4",  name: "Nathalie Bello",     email: "nathalie.bello@gmail.com",  level: "A1", class: "Groupe A1 Matin", xp:  980, avgScore: 6.3, progress: 47, lastActive: "il y a 2j",  streak: 3  },
  { id: "s5",  name: "Christian Ondoa",    email: "c.ondoa@gmail.com",         level: "A1", class: "Groupe A1 Matin", xp:  760, avgScore: 5.9, progress: 39, lastActive: "il y a 3j",  streak: 2  },
  { id: "s6",  name: "Jean-Paul Mvondo",   email: "jpmvondo@gmail.com",        level: "A1", class: "Groupe A1 Matin", xp:  340, avgScore: 3.2, progress: 32, lastActive: "il y a 5j",  streak: 0  },
  { id: "s7",  name: "Boris Kamga",        email: "boris.kamga@gmail.com",     level: "A1", class: "Groupe A1 Matin", xp:  210, avgScore: 2.8, progress: 28, lastActive: "il y a 8j",  streak: 0  },
  { id: "s8",  name: "Paul Biya",          email: "paul.biya@gmail.com",       level: "A2", class: "Groupe A2 Soir",  xp: 1540, avgScore: 8.1, progress: 60, lastActive: "il y a 4h",  streak: 11 },
  { id: "s9",  name: "Sylvie Ntang",       email: "sylvie.ntang@gmail.com",    level: "A2", class: "Groupe A2 Soir",  xp: 1200, avgScore: 7.4, progress: 52, lastActive: "il y a 1j",  streak: 7  },
  { id: "s10", name: "Aminata Diallo",     email: "aminata.d@yahoo.fr",        level: "A2", class: "Groupe A2 Soir",  xp:  520, avgScore: 4.1, progress: 41, lastActive: "il y a 3j",  streak: 1  },
  { id: "s11", name: "David Abomo",        email: "d.abomo@gmail.com",         level: "B1", class: "Prépa CEFR B1", xp: 3100, avgScore: 9.2, progress: 82, lastActive: "il y a 1h",  streak: 22 },
  { id: "s12", name: "Claire Mballa",      email: "claire.mballa@gmail.com",   level: "B1", class: "Prépa CEFR B1", xp: 2780, avgScore: 8.6, progress: 76, lastActive: "il y a 3h",  streak: 18 },
  { id: "s13", name: "Eric Mfou",          email: "eric.mfou@yahoo.fr",        level: "B1", class: "Prépa CEFR B1", xp: 2100, avgScore: 7.8, progress: 68, lastActive: "il y a 6h",  streak: 12 },
];

type Filter = "all" | "danger" | "good";

export default function StudentsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = ALL_STUDENTS.filter(s => {
    const matchFilter = filter === "danger" ? s.avgScore < 5 : filter === "good" ? s.avgScore >= 8 : true;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.class.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const scoreColor = (v: number) => v >= 7 ? "#10b981" : v >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <TeacherLayout title="Élèves">
      <div>
        {/* Controls */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un élève ou une classe…"
            style={{
              flex: 1, minWidth: 220, padding: "9px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "white", fontSize: "0.8rem", outline: "none",
            }}
          />
          {(["all", "danger", "good"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'Syne', sans-serif", fontWeight: 600,
              background: filter === f ? "#10b981" : "rgba(255,255,255,0.05)",
              color: filter === f ? "white" : "rgba(255,255,255,0.4)",
            }}>
              {f === "all" ? "Tous" : f === "danger" ? "⚠️ En difficulté" : "⭐ En avance"}
            </button>
          ))}
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>{filtered.length} élève{filtered.length > 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Élève", "Classe", "Niv.", "Score moy.", "Progression", "XP", "Dernière activité", "Streak", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.72rem", flexShrink: 0 }}>
                        {s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.8rem" }}>{s.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem" }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>{s.class}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", fontSize: "0.65rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{s.level}</span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ color: scoreColor(s.avgScore), fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>{s.avgScore}/10</span>
                  </td>
                  <td style={{ padding: "13px 16px", minWidth: 120 }}>
                    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 5, overflow: "hidden", marginBottom: 3 }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${s.progress}%`, background: scoreColor(s.avgScore) }} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>{s.progress}%</span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>{s.xp.toLocaleString()} XP</td>
                  <td style={{ padding: "13px 16px", color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>{s.lastActive}</td>
                  <td style={{ padding: "13px 16px", color: s.streak > 0 ? "#f59e0b" : "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
                    {s.streak > 0 ? `🔥 ${s.streak}j` : "—"}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <Link href={`/teacher/students/${s.id}`} style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", textDecoration: "none", fontFamily: "'Syne', sans-serif" }}>
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TeacherLayout>
  );
}
