"use client";

import { useState, useEffect } from "react";
import TeacherLayout from "@/components/TeacherLayout";

type Level = "A1" | "A2" | "B1" | "B2" | "C1";

interface DBCourse {
  id: string;
  courseId: string;
  firstModuleId: string;
  lektionNumber: number;
  titleDE: string;
  titleFR: string;
  level: string;
  modules: number;
  lektionen: string;
  icon: string;
  locked: boolean;
  progress: number;
  isPublished: boolean;
  moduleIds: string[];
  tags: string[];
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "#10b981", A2: "#14b8a6", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f97316",
};

const CLASSES = [
  { id: "cls1", name: "Groupe A1 Matin", level: "A1" },
  { id: "cls2", name: "Groupe A2 Soir",  level: "A2" },
  { id: "cls3", name: "Prépa Goethe B1", level: "B1" },
];

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<DBCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Level>("all");
  const [search, setSearch] = useState("");
  const [assignModal, setAssignModal] = useState<DBCourse | null>(null);
  const [assigned, setAssigned] = useState<Record<string, string[]>>({});
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    fetch("/api/courses?includeUnpublished=true")
      .then(r => r.json())
      .then(d => {
        if (!d.fallback) setCourses(d.courses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const matchLevel = filter === "all" || c.level === filter;
    const q = search.toLowerCase();
    return matchLevel && (!q || c.titleDE.toLowerCase().includes(q) || c.level.toLowerCase().includes(q));
  });

  const handlePublish = async (courseId: string, isPublished: boolean) => {
    await fetch("/api/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, isPublished }),
    });
    setCourses(prev => prev.map(c => c.courseId === courseId ? { ...c, isPublished } : c));
  };

  const handleAssign = (classId: string) => {
    if (!assignModal) return;
    setAssigned(prev => {
      const existing = prev[classId] ?? [];
      if (existing.includes(assignModal.courseId)) return prev;
      return { ...prev, [classId]: [...existing, assignModal.courseId] };
    });
    setAssignSuccess(`Cours assigné à ${CLASSES.find(c => c.id === classId)?.name} !`);
    setTimeout(() => { setAssignModal(null); setAssignSuccess(""); }, 1800);
  };

  const publishedCount = courses.filter(c => c.isPublished).length;
  const draftCount = courses.length - publishedCount;

  return (
    <TeacherLayout title="Cours">
      <div style={{ maxWidth: 900 }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Cours disponibles", value: courses.length,  color: "#6366f1" },
            { label: "Publiés",           value: publishedCount,  color: "#10b981" },
            { label: "Brouillons",        value: draftCount,      color: "#f59e0b" },
            { label: "Mes classes",       value: CLASSES.length,  color: "#e879f9" },
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
            placeholder="Rechercher un cours…"
            style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "0.8rem", outline: "none" }}
          />
          {(["all", "A1", "A2", "B1", "B2", "C1"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 14px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600,
              background: filter === f ? "#6366f1" : "rgba(255,255,255,0.05)",
              color: filter === f ? "white" : "rgba(255,255,255,0.4)",
            }}>
              {f === "all" ? "Tous" : f}
            </button>
          ))}
        </div>

        {/* Course list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
            Chargement des cours…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📭</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Syne', sans-serif", fontSize: "0.9rem" }}>
              {courses.length === 0 ? "Aucun cours en base — demandez à l'admin de générer des cours." : "Aucun cours trouvé pour ce filtre."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(course => {
              const c = LEVEL_COLORS[course.level] ?? "#10b981";
              const assignedClasses = Object.entries(assigned)
                .filter(([, ids]) => ids.includes(course.courseId))
                .map(([clsId]) => CLASSES.find(cl => cl.id === clsId)?.name)
                .filter(Boolean);

              return (
                <div key={course.id} style={{ padding: "18px 22px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{course.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>
                          {course.titleDE}
                        </span>
                        <span style={{ padding: "1px 8px", borderRadius: 5, background: `${c}18`, color: c, border: `1px solid ${c}33`, fontSize: "0.62rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                          {course.level}
                        </span>
                        <span style={{ padding: "1px 8px", borderRadius: 5, background: course.isPublished ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: course.isPublished ? "#10b981" : "#f59e0b", fontSize: "0.62rem" }}>
                          {course.isPublished ? "Publié" : "Brouillon"}
                        </span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>
                        {course.lektionen} · {course.modules} modules
                        {assignedClasses.length > 0 && (
                          <span style={{ marginLeft: 8, color: "#6366f1" }}>
                            → {assignedClasses.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handlePublish(course.courseId, !course.isPublished)}
                        style={{
                          padding: "6px 14px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: "0.7rem",
                          borderColor: course.isPublished ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)",
                          background: "transparent",
                          color: course.isPublished ? "#ef4444" : "#10b981",
                        }}
                      >
                        {course.isPublished ? "Dépublier" : "Publier"}
                      </button>
                      <button
                        onClick={() => setAssignModal(course)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "transparent", color: "#818cf8", fontSize: "0.7rem", cursor: "pointer" }}
                      >
                        Assigner
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assign modal */}
        {assignModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            onClick={e => e.target === e.currentTarget && setAssignModal(null)}>
            <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 32, width: 420, maxWidth: "90vw" }}>
              <h2 style={{ margin: "0 0 6px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem" }}>
                Assigner à une classe
              </h2>
              <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
                {assignModal.icon} {assignModal.titleDE} — {assignModal.level}
              </p>

              {assignSuccess ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                  ✓ {assignSuccess}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CLASSES.map(cls => {
                    const alreadyAssigned = (assigned[cls.id] ?? []).includes(assignModal.courseId);
                    return (
                      <button
                        key={cls.id}
                        onClick={() => handleAssign(cls.id)}
                        disabled={alreadyAssigned}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px", borderRadius: 10,
                          border: alreadyAssigned ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)",
                          background: alreadyAssigned ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.04)",
                          color: alreadyAssigned ? "#10b981" : "white",
                          cursor: alreadyAssigned ? "default" : "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.82rem" }}>{cls.name}</span>
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                          {alreadyAssigned ? "✓ Déjà assigné" : cls.level}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!assignSuccess && (
                <div style={{ marginTop: 20, textAlign: "right" }}>
                  <button onClick={() => setAssignModal(null)} style={{ padding: "8px 20px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
