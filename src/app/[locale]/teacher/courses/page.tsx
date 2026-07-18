"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import { IconBook, IconCheck, IconClasse, IconSpark } from "@/components/landing/icons";

type Level = "A1" | "A2" | "B1" | "B2" | "C1";
type Filter = "all" | Level;

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

const CLASSES = [
  { id: "cls1", name: "Groupe A1 Matin", level: "A1" },
  { id: "cls2", name: "Groupe A2 Soir",  level: "A2" },
  { id: "cls3", name: "Préparation B1",  level: "B1" },
];

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  kpiTotal: string;
  kpiPublished: string;
  kpiDrafts: string;
  kpiClasses: string;
  searchPh: string;
  filters: Record<Filter, string>;
  loading: string;
  emptyH: string;
  emptySub: string;
  published: string;
  draft: string;
  publish: string;
  unpublish: string;
  assign: string;
  assignedTo: string;
  moduleCount: (n: number) => string;
  modalH: string;
  modalSub: (course: string) => string;
  alreadyAssigned: string;
  assignSuccess: (klass: string) => string;
  close: string;
}

const FR: Copy = {
  title: "Catalogue de cours",
  eye: "Bibliothèque pédagogique",
  h: "Choisis, assigne, publie.",
  sub: "Vue d'ensemble des leçons alignées CECRL. Publie ce qui est prêt, assigne à tes classes, garde le contrôle du rythme.",
  kpiTotal: "Cours disponibles",
  kpiPublished: "Publiés",
  kpiDrafts: "Brouillons",
  kpiClasses: "Mes classes",
  searchPh: "Chercher un titre, un niveau, un tag…",
  filters: { all: "Tous", A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1" },
  loading: "Chargement des cours…",
  emptyH: "Aucun cours ne correspond.",
  emptySub: "Essaie un autre filtre — ou demande à un·e admin de générer une leçon.",
  published: "Publié",
  draft: "Brouillon",
  publish: "Publier",
  unpublish: "Dépublier",
  assign: "Assigner",
  assignedTo: "Assigné à",
  moduleCount: (n) => `${n} module${n > 1 ? "s" : ""}`,
  modalH: "Assigner à une classe",
  modalSub: (course) => `Course : ${course}`,
  alreadyAssigned: "Déjà assigné",
  assignSuccess: (klass) => `Cours assigné à ${klass}.`,
  close: "Fermer",
};

const EN: Copy = {
  title: "Course catalog",
  eye: "Teaching library",
  h: "Pick, assign, publish.",
  sub: "Overview of CEFR-aligned lessons. Publish what's ready, assign to your classes, keep the pace.",
  kpiTotal: "Available courses",
  kpiPublished: "Published",
  kpiDrafts: "Drafts",
  kpiClasses: "My classes",
  searchPh: "Search a title, level, tag…",
  filters: { all: "All", A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1" },
  loading: "Loading courses…",
  emptyH: "No course matches.",
  emptySub: "Try another filter — or ask an admin to generate one.",
  published: "Published",
  draft: "Draft",
  publish: "Publish",
  unpublish: "Unpublish",
  assign: "Assign",
  assignedTo: "Assigned to",
  moduleCount: (n) => `${n} module${n > 1 ? "s" : ""}`,
  modalH: "Assign to a class",
  modalSub: (course) => `Course: ${course}`,
  alreadyAssigned: "Already assigned",
  assignSuccess: (klass) => `Course assigned to ${klass}.`,
  close: "Close",
};

export default function TeacherCoursesPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [courses, setCourses] = useState<DBCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [assignModal, setAssignModal] = useState<DBCourse | null>(null);
  const [assigned, setAssigned] = useState<Record<string, string[]>>({});
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    fetch("/api/courses?includeUnpublished=true")
      .then((r) => r.json())
      .then((d) => {
        if (!d.fallback && Array.isArray(d.courses)) setCourses(d.courses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    if (filter !== "all" && c.level !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.titleDE.toLowerCase().includes(q) && !c.level.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.length - publishedCount;

  const handlePublish = async (courseId: string, isPublished: boolean) => {
    await fetch("/api/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, isPublished }),
    });
    setCourses((prev) => prev.map((c) => (c.courseId === courseId ? { ...c, isPublished } : c)));
  };

  const handleAssign = (classId: string) => {
    if (!assignModal) return;
    setAssigned((prev) => {
      const existing = prev[classId] ?? [];
      if (existing.includes(assignModal.courseId)) return prev;
      return { ...prev, [classId]: [...existing, assignModal.courseId] };
    });
    const klass = CLASSES.find((c) => c.id === classId)?.name ?? "";
    setAssignSuccess(t.assignSuccess(klass));
    setTimeout(() => {
      setAssignModal(null);
      setAssignSuccess("");
    }, 1800);
  };

  return (
    <TeacherLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
        </header>

        <section className="dash-stats">
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconBook size={13} /></span>
              {t.kpiTotal}
            </p>
            <p className="dash-stat-val">{loading ? "—" : courses.length}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconCheck size={13} /></span>
              {t.kpiPublished}
            </p>
            <p className="dash-stat-val">{loading ? "—" : publishedCount}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconSpark size={13} /></span>
              {t.kpiDrafts}
            </p>
            <p className="dash-stat-val">{loading ? "—" : draftCount}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconClasse size={13} /></span>
              {t.kpiClasses}
            </p>
            <p className="dash-stat-val">{CLASSES.length}</p>
          </div>
        </section>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="search"
            aria-label={t.searchPh}
            className="modal-input"
            style={{ flex: 1, minWidth: 240 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPh}
          />
          <div className="subpage-filters" role="tablist" aria-label={t.filters.all}>
            {(Object.keys(t.filters) as Filter[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={filter === k}
                className={`subpage-filter ${filter === k ? "on" : ""}`}
                onClick={() => setFilter(k)}
              >
                {t.filters[k]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p className="empty-state-sub">{t.loading}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-h">{t.emptyH}</p>
            <p className="empty-state-sub">{t.emptySub}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((course) => {
              const assignedClasses = Object.entries(assigned)
                .filter(([, ids]) => ids.includes(course.courseId))
                .map(([clsId]) => CLASSES.find((cl) => cl.id === clsId)?.name)
                .filter(Boolean) as string[];

              return (
                <article key={course.id} style={{
                  background: "var(--espresso-2)",
                  border: "1px solid var(--creme-hair)",
                  borderRadius: 14,
                  padding: 18,
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto",
                  gap: 16,
                  alignItems: "center",
                }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: "var(--brass-glow)",
                    border: "1px solid var(--brass-edge)",
                    color: "var(--brass)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }} aria-hidden="true">
                    <IconBook size={22} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <h3 style={{
                        fontFamily: "var(--font-fraunces), Georgia, serif",
                        fontSize: 16,
                        color: "var(--creme)",
                        margin: 0,
                        fontWeight: 400,
                      }}>{course.titleDE}</h3>
                      <span className="status-pill active">{course.level}</span>
                      <span className={`status-pill ${course.isPublished ? "active" : "pending"}`}>
                        {course.isPublished ? t.published : t.draft}
                      </span>
                    </div>
                    <p style={{
                      color: "var(--creme-mute)",
                      fontSize: 12,
                      fontFamily: "var(--font-jetbrains, monospace)",
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}>
                      {course.lektionen} · {t.moduleCount(course.modules)}
                      {assignedClasses.length > 0 && (
                        <>
                          {" · "}
                          <span style={{ color: "var(--brass)" }}>{t.assignedTo}: {assignedClasses.join(", ")}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className={course.isPublished ? "row-btn danger" : "row-btn"}
                      onClick={() => handlePublish(course.courseId, !course.isPublished)}
                    >
                      {course.isPublished ? t.unpublish : t.publish}
                    </button>
                    <button
                      type="button"
                      className="row-btn"
                      onClick={() => setAssignModal(course)}
                    >
                      {t.assign}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {assignModal && (
        <div
          className="modal-scrim"
          onClick={(e) => { if (e.target === e.currentTarget) setAssignModal(null); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-course-h"
        >
          <div className="modal-card">
            <p className="modal-eye">{assignModal.level}</p>
            <h3 id="assign-course-h" className="modal-h">{t.modalH}</h3>
            <p className="modal-sub">{t.modalSub(assignModal.titleDE)}</p>

            {assignSuccess ? (
              <div style={{
                padding: "14px 18px",
                borderRadius: 10,
                background: "var(--brass-glow)",
                border: "1px solid var(--brass-edge)",
                color: "var(--creme)",
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 15,
                textAlign: "center",
              }}>
                {assignSuccess}
              </div>
            ) : (
              <div className="modal-form">
                {CLASSES.map((cls) => {
                  const alreadyAssigned = (assigned[cls.id] ?? []).includes(assignModal.courseId);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => !alreadyAssigned && handleAssign(cls.id)}
                      disabled={alreadyAssigned}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: alreadyAssigned ? "var(--brass-glow)" : "rgba(244, 235, 220, 0.02)",
                        border: `1px solid ${alreadyAssigned ? "var(--brass-edge)" : "var(--creme-hair)"}`,
                        color: alreadyAssigned ? "var(--brass)" : "var(--creme)",
                        cursor: alreadyAssigned ? "default" : "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        transition: "border-color var(--dur-fast)",
                      }}
                    >
                      <span style={{
                        fontFamily: "var(--font-fraunces), Georgia, serif",
                        fontSize: 15,
                      }}>{cls.name}</span>
                      <span style={{
                        fontSize: 11,
                        fontFamily: "var(--font-jetbrains, monospace)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: alreadyAssigned ? "var(--brass)" : "var(--creme-mute)",
                      }}>
                        {alreadyAssigned ? t.alreadyAssigned : cls.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!assignSuccess && (
              <div className="modal-actions">
                <button type="button" className="subpage-cta ghost" onClick={() => setAssignModal(null)}>
                  {t.close}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
