"use client";

import Link from "next/link";
import TeacherLayout from "@/components/TeacherLayout";

const CLASSES = [
  { id: "cls1", name: "Groupe A1 Matin",  level: "A1", code: "LINGUA-A1-MT2026", students: 18, maxStudents: 25, avgProgress: 45, avgScore: 7.5, isActive: true,  schedule: "Lun · Mer · Ven  08h–10h" },
  { id: "cls2", name: "Groupe A2 Soir",   level: "A2", code: "LINGUA-A2-SR2026", students: 15, maxStudents: 20, avgProgress: 32, avgScore: 7.8, isActive: true,  schedule: "Mar · Jeu  18h–20h" },
  { id: "cls3", name: "Prépa Goethe B1",  level: "B1", code: "LINGUA-B1-GP2026", students: 14, maxStudents: 20, avgProgress: 71, avgScore: 8.1, isActive: true,  schedule: "Sam  09h–13h" },
];

const LEVEL_COLORS: Record<string, string> = { A1: "#10b981", A2: "#14b8a6", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f97316" };

export default function ClassroomsPage() {
  return (
    <TeacherLayout title="Mes Classes">
      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
              {CLASSES.length} classes · {CLASSES.reduce((s, c) => s + c.students, 0)} élèves au total
            </p>
          </div>
          <Link href="/teacher/classroom/new" style={{
            padding: "9px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem",
            textDecoration: "none", boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
          }}>+ Nouvelle classe</Link>
        </div>

        {/* Class cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CLASSES.map((cls) => {
            const c = LEVEL_COLORS[cls.level] ?? "#10b981";
            return (
              <Link key={cls.id} href={`/teacher/classroom/${cls.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "22px 24px", borderRadius: 18,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${c}40`; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                        <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>{cls.name}</span>
                        <span style={{ padding: "2px 10px", borderRadius: 6, background: `${c}18`, color: c, border: `1px solid ${c}33`, fontSize: "0.68rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{cls.level}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "0.62rem" }}>Active</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>🕐 {cls.schedule}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <code style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", color: c, fontSize: "0.68rem" }}>{cls.code}</code>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 18 }}>›</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 14 }}>
                    {[
                      { v: `${cls.students}/${cls.maxStudents}`, l: "élèves" },
                      { v: `${cls.avgProgress}%`, l: "progression" },
                      { v: `${cls.avgScore}/10`, l: "score moyen" },
                      { v: `${cls.maxStudents - cls.students}`, l: "places libres" },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.03)" }}>
                        <div style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.05rem" }}>{s.v}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", marginTop: 2 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${cls.avgProgress}%`, background: `linear-gradient(90deg, ${c}88, ${c})` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </TeacherLayout>
  );
}
