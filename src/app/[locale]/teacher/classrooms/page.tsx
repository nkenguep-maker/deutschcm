"use client";

import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";

interface Klass {
  id: string;
  name: string;
  level: string;
  code: string;
  students: number;
  maxStudents: number;
  avgProgress: number;
  avgScore: number;
  isActive: boolean;
  schedule: string;
}

const CLASSES: Klass[] = [
  { id: "cls1", name: "Groupe A1 Matin", level: "A1", code: "YEMA-A1-MT", students: 18, maxStudents: 25, avgProgress: 45, avgScore: 7.5, isActive: true, schedule: "Lun · Mer · Ven — 08h → 10h" },
  { id: "cls2", name: "Groupe A2 Soir",  level: "A2", code: "YEMA-A2-SR", students: 15, maxStudents: 20, avgProgress: 32, avgScore: 7.8, isActive: true, schedule: "Mar · Jeu — 18h → 20h" },
  { id: "cls3", name: "Préparation B1",  level: "B1", code: "YEMA-B1-GP", students: 14, maxStudents: 20, avgProgress: 71, avgScore: 8.1, isActive: true, schedule: "Sam — 09h → 13h" },
];

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: (n: number, learners: number) => string;
  newBtn: string;
  labels: [string, string, string, string];
  active: string;
  fill: (pct: number) => string;
}

const FR: Copy = {
  title: "Mes classes",
  eye: "Classes que j'accompagne",
  h: "Trois classes, un rythme, une méthode.",
  sub: (n, learners) => `${n} classe${n > 1 ? "s" : ""} · ${learners} apprenant·e·s au total.`,
  newBtn: "Nouvelle classe",
  labels: ["Apprenant·e·s", "Progression", "Score", "Places libres"],
  active: "Active",
  fill: (pct) => `${pct}% du parcours parcouru`,
};

const EN: Copy = {
  title: "My classes",
  eye: "Classes I run",
  h: "Three classes, one rhythm, one method.",
  sub: (n, learners) => `${n} class${n > 1 ? "es" : ""} · ${learners} learners total.`,
  newBtn: "New class",
  labels: ["Learners", "Progress", "Score", "Free seats"],
  active: "Active",
  fill: (pct) => `${pct}% completed`,
};

export default function TeacherClassroomsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const totalLearners = CLASSES.reduce((s, c) => s + c.students, 0);

  return (
    <TeacherLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub(CLASSES.length, totalLearners)}</p>
          </div>
          <Link href="/teacher/classroom/new" className="subpage-cta">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3v8M3 7h8" />
            </svg>
            {t.newBtn}
          </Link>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CLASSES.map((cls) => {
            const scoreClass = cls.avgScore >= 8 ? "high" : cls.avgScore >= 6 ? "mid" : "low";
            return (
              <Link
                key={cls.id}
                href={`/teacher/classroom/${cls.id}`}
                style={{
                  textDecoration: "none",
                  background: "var(--espresso-2)",
                  border: "1px solid var(--creme-hair)",
                  borderRadius: 14,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transition: "border-color var(--dur-fast) var(--ease-out-expo)",
                }}
                className="teacher-classroom-card"
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h3 style={{
                        fontFamily: "var(--font-fraunces), Georgia, serif",
                        fontSize: 20,
                        color: "var(--creme)",
                        margin: 0,
                        fontWeight: 400,
                      }}>{cls.name}</h3>
                      <span className="status-pill active">{cls.level}</span>
                      <span className="status-pill active">{t.active}</span>
                    </div>
                    <p style={{
                      color: "var(--creme-mute)",
                      fontSize: 12.5,
                      fontFamily: "var(--font-jetbrains, monospace)",
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}>{cls.schedule}</p>
                  </div>
                  <code style={{
                    fontFamily: "var(--font-jetbrains, monospace)",
                    background: "var(--brass-glow)",
                    border: "1px solid var(--brass-edge)",
                    color: "var(--brass)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    alignSelf: "flex-start",
                  }}>{cls.code}</code>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: 10,
                }}>
                  {[
                    { v: `${cls.students}/${cls.maxStudents}`, l: t.labels[0] },
                    { v: `${cls.avgProgress}%`, l: t.labels[1] },
                    { v: `${cls.avgScore}/10`, l: t.labels[2], cls: scoreClass },
                    { v: `${cls.maxStudents - cls.students}`, l: t.labels[3] },
                  ].map((s) => (
                    <div key={s.l} style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(244, 235, 220, 0.02)",
                      border: "1px solid var(--creme-hair)",
                    }}>
                      <p style={{
                        fontFamily: "var(--font-fraunces), Georgia, serif",
                        fontSize: 16,
                        color: s.cls === "high" ? "var(--brass)" : s.cls === "low" ? "var(--oxblood)" : "var(--creme)",
                        margin: 0,
                        lineHeight: 1.2,
                      }}>{s.v}</p>
                      <p style={{
                        fontFamily: "var(--font-jetbrains, monospace)",
                        fontSize: 10,
                        color: "var(--creme-mute)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        margin: "4px 0 0",
                      }}>{s.l}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div className="card-progress" style={{ flex: 1, minWidth: 160 }}>
                    <div className="card-progress-bar" style={{ width: `${cls.avgProgress}%` }} />
                  </div>
                  <span style={{
                    fontFamily: "var(--font-jetbrains, monospace)",
                    color: "var(--creme-mute)",
                    fontSize: 11,
                    letterSpacing: "0.04em",
                  }}>{t.fill(cls.avgProgress)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <style>{`
        .teacher-classroom-card:hover { border-color: var(--brass-edge) !important; }
      `}</style>
    </TeacherLayout>
  );
}
