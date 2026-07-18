"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import {
  IconGroup,
  IconChart,
  IconCalendar,
  IconSpark,
  IconCheck,
  IconClasse,
} from "@/components/landing/icons";

// Dashboard enseignant · Kaffeehaus.
// Priorité du jour · métriques classes · schedule aujourd'hui.

interface Classroom {
  id: string;
  name: string;
  level: string;
  code: string;
  students: number;
  avgProgress: number;
  avgScore: number;
  isActive: boolean;
}
interface Student {
  id: string;
  name: string;
  level: string | null;
  progress: number;
  className: string;
}

interface Copy {
  eye: string;
  greet: (name: string) => string;
  priorityEyePending: string;
  priorityEyeCalm: string;
  h1Pending: string;
  h1Calm: string;
  subPending: (n: number) => string;
  subCalm: string;
  ctaPending: string;
  ctaCalm: string;
  hint: string;
  statClasses: string;
  statClassesSub: string;
  statLearners: string;
  statLearnersSub: string;
  statProgress: string;
  statProgressSub: string;
  statScore: string;
  statScoreSub: string;
  classesEye: string;
  classesH: string;
  classesEmpty: string;
  classesCta: string;
  classCodeLbl: string;
  classStudents: (n: number) => string;
  classAvg: string;
  attnEye: string;
  attnH: string;
  attnEmpty: string;
  attnHint: string;
}

const FR: Copy = {
  eye: "Aujourd'hui",
  greet: (name) => `Bonjour, ${name}.`,
  priorityEyePending: "Ta priorité",
  priorityEyeCalm: "Journée calme",
  h1Pending: "Des copies attendent ton regard.",
  h1Calm: "Rien d'urgent ce matin.",
  subPending: (n) =>
    `${n} rendu${n > 1 ? "s" : ""} à corriger. L'IA peut proposer une piste — c'est ta validation qui donne du sens.`,
  subCalm: "Profites-en pour préparer une activité ou revoir la progression d'un·e apprenant·e.",
  ctaPending: "Voir les corrections",
  ctaCalm: "Préparer une activité",
  hint: "Enseigner, c'est d'abord voir. Yema te montre où ton regard compte le plus.",
  statClasses: "Classes actives",
  statClassesSub: "En cours cette semaine",
  statLearners: "Apprenant·e·s",
  statLearnersSub: "Suivis actifs",
  statProgress: "Progression moy.",
  statProgressSub: "Toutes classes",
  statScore: "Score moyen",
  statScoreSub: "Sur 100",
  classesEye: "Mes classes",
  classesH: "Où en sont-elles.",
  classesEmpty: "Aucune classe créée pour l'instant. Commence par en créer une.",
  classesCta: "Créer une classe",
  classCodeLbl: "Code",
  classStudents: (n) => `${n} apprenant${n > 1 ? "·e·s" : "·e"}`,
  classAvg: "Progression moy.",
  attnEye: "À encourager",
  attnH: "Quelques apprenant·e·s dont la présence compte.",
  attnEmpty: "Tes apprenant·e·s avancent bien. Continue.",
  attnHint:
    "Ces suggestions sont indicatives. Un message court peut relancer une progression.",
};

const EN: Copy = {
  eye: "Today",
  greet: (name) => `Hello, ${name}.`,
  priorityEyePending: "Your priority",
  priorityEyeCalm: "Quiet day",
  h1Pending: "Submissions are waiting for you.",
  h1Calm: "Nothing urgent this morning.",
  subPending: (n) =>
    `${n} submission${n > 1 ? "s" : ""} to grade. AI can suggest a starting point — your validation gives it meaning.`,
  subCalm: "Use this time to plan an activity or review a learner's progress.",
  ctaPending: "See submissions",
  ctaCalm: "Plan an activity",
  hint: "Teaching starts with seeing. Yema shows you where your attention matters most.",
  statClasses: "Active classes",
  statClassesSub: "This week",
  statLearners: "Learners",
  statLearnersSub: "Active",
  statProgress: "Avg. progress",
  statProgressSub: "All classes",
  statScore: "Avg. score",
  statScoreSub: "Out of 100",
  classesEye: "My classes",
  classesH: "Where they stand.",
  classesEmpty: "No class yet. Start by creating one.",
  classesCta: "Create a class",
  classCodeLbl: "Code",
  classStudents: (n) => `${n} learner${n > 1 ? "s" : ""}`,
  classAvg: "Avg. progress",
  attnEye: "To encourage",
  attnH: "A few learners whose momentum matters.",
  attnEmpty: "Your learners are moving forward well. Keep going.",
  attnHint:
    "These are suggestions. A short message can restart a learner's momentum.",
};

export default function TeacherDashboard() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [name, setName] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.fullName) setName(d.fullName.split(" ")[0]);
      })
      .catch(() => {});

    fetch("/api/teacher?action=classrooms")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.classrooms)) setClassrooms(d.classrooms);
      })
      .catch(() => {});

    fetch("/api/teacher?action=students")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.students)) setStudents(d.students);
      })
      .catch(() => {});

    fetch("/api/teacher?action=pending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.count === "number") setPendingCount(d.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = name || (locale === "en" ? "you" : "toi");
  const totalStudents =
    classrooms.reduce((s, c) => s + c.students, 0) || students.length;
  const avgProgress =
    classrooms.length > 0
      ? Math.round(classrooms.reduce((s, c) => s + c.avgProgress, 0) / classrooms.length)
      : 0;
  const avgScore =
    classrooms.length > 0
      ? Math.round(classrooms.reduce((s, c) => s + c.avgScore, 0) / classrooms.length)
      : 0;

  const hasPending = pendingCount > 0;
  const priorityHref = hasPending ? "/teacher/assignments" : "/teacher/activities";
  const toEncourage = students.filter((s) => s.progress < 40).slice(0, 3);

  return (
    <TeacherLayout title={t.eye}>
      <section className="dash">
        <header>
          <p className="dash-eye">{t.greet(displayName)}</p>
        </header>

        <article className="dash-hero">
          <div>
            <p className="dash-eye" style={{ margin: "0 0 10px" }}>
              {hasPending ? t.priorityEyePending : t.priorityEyeCalm}
            </p>
            <h1 className="dash-hero-h">
              {hasPending ? t.h1Pending : t.h1Calm}
            </h1>
            <p className="dash-hero-sub">
              {hasPending ? t.subPending(pendingCount) : t.subCalm}
            </p>
            <Link href={priorityHref} className="dash-hero-cta">
              {hasPending ? t.ctaPending : t.ctaCalm}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                   stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                   strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <p style={{
              marginTop: 18,
              color: "var(--creme-mute)",
              fontSize: 12.5,
              fontFamily: "var(--font-jetbrains, monospace)",
              letterSpacing: "0.04em",
              maxWidth: "48ch",
            }}>
              {t.hint}
            </p>
          </div>
          <div className="dash-hero-side">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 140 }}>
              <div style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 60,
                fontWeight: 400,
                color: hasPending ? "var(--brass)" : "var(--creme-soft)",
                lineHeight: 1,
              }} aria-hidden="true">
                {loading ? "—" : pendingCount}
              </div>
              <p style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 10.5,
                color: "var(--creme-mute)",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                margin: 0,
              }}>
                {locale === "en" ? "Awaiting review" : "En attente"}
              </p>
            </div>
          </div>
        </article>

        <section aria-label={t.statClasses} className="dash-stats">
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconClasse size={13} /></span>
              {t.statClasses}
            </p>
            <p className="dash-stat-val">{loading ? "—" : classrooms.length}</p>
            <p className="dash-stat-sub">{t.statClassesSub}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconGroup size={13} /></span>
              {t.statLearners}
            </p>
            <p className="dash-stat-val">{loading ? "—" : totalStudents}</p>
            <p className="dash-stat-sub">{t.statLearnersSub}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconChart size={13} /></span>
              {t.statProgress}
            </p>
            <p className="dash-stat-val">{loading ? "—" : `${avgProgress}%`}</p>
            <p className="dash-stat-sub">{t.statProgressSub}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconCheck size={13} /></span>
              {t.statScore}
            </p>
            <p className="dash-stat-val">{loading ? "—" : avgScore || "—"}</p>
            <p className="dash-stat-sub">{t.statScoreSub}</p>
          </div>
        </section>

        <div className="dash-teacher-two">
          <section aria-labelledby="teacher-classes">
            <p className="dash-eye">{t.classesEye}</p>
            <h2 id="teacher-classes" className="dash-block-h">{t.classesH}</h2>
            {classrooms.length === 0 ? (
              <div className="dash-teacher-today">
                <p className="dash-teacher-empty">{t.classesEmpty}</p>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Link href="/teacher/classroom/new" className="dash-hero-cta">
                    {t.classesCta}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="dash-teacher-schedule">
                {classrooms.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/teacher/classrooms/${c.id}`}
                    className="dash-teacher-slot"
                    style={{ textDecoration: "none" }}
                  >
                    <span className="dash-teacher-slot-time">{c.level}</span>
                    <div>
                      <p className="dash-teacher-slot-title">{c.name}</p>
                      <p className="dash-teacher-slot-meta">
                        {t.classStudents(c.students)} · {t.classAvg} {c.avgProgress}%
                      </p>
                    </div>
                    <span className="dash-teacher-slot-status">{t.classCodeLbl} {c.code}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="teacher-attn">
            <p className="dash-eye">{t.attnEye}</p>
            <h2 id="teacher-attn" className="dash-block-h">{t.attnH}</h2>
            {toEncourage.length === 0 ? (
              <div className="dash-teacher-today">
                <p className="dash-teacher-empty">{t.attnEmpty}</p>
              </div>
            ) : (
              <div className="dash-teacher-schedule">
                {toEncourage.map((s) => (
                  <Link
                    key={s.id}
                    href={`/teacher/students/${s.id}`}
                    className="dash-teacher-slot"
                    style={{ textDecoration: "none" }}
                  >
                    <span className="dash-teacher-slot-time">{s.level ?? "—"}</span>
                    <div>
                      <p className="dash-teacher-slot-title">{s.name}</p>
                      <p className="dash-teacher-slot-meta">
                        {s.className} · {s.progress}%
                      </p>
                    </div>
                    <span className="dash-teacher-slot-status">
                      {locale === "en" ? "Follow up" : "Relancer"}
                    </span>
                  </Link>
                ))}
                <p style={{
                  color: "var(--creme-mute)",
                  fontSize: 12,
                  fontFamily: "var(--font-jetbrains, monospace)",
                  letterSpacing: "0.04em",
                  margin: "8px 4px 0",
                }}>
                  {t.attnHint}
                </p>
              </div>
            )}
          </section>
        </div>

        <section aria-label={locale === "en" ? "Quick actions" : "Actions rapides"}>
          <p className="dash-eye">{locale === "en" ? "Quick actions" : "Actions rapides"}</p>
          <h2 className="dash-block-h">
            {locale === "en" ? "Between two classes." : "Entre deux cours."}
          </h2>
          <div className="dash-actions">
            <Link href="/teacher/classroom/new" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconCalendar size={18} /></span>
              <h3 className="dash-action-title">
                {locale === "en" ? "New class" : "Nouvelle classe"}
              </h3>
              <p className="dash-action-desc">
                {locale === "en"
                  ? "Set up a class, generate an access code, invite your learners."
                  : "Crée une classe, génère un code d'accès, invite tes apprenant·e·s."}
              </p>
              <p className="dash-action-cta">
                {locale === "en" ? "Create" : "Créer"} →
              </p>
            </Link>
            <Link href="/admin/courses/generate" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconSpark size={18} /></span>
              <h3 className="dash-action-title">
                {locale === "en" ? "AI course" : "Cours IA"}
              </h3>
              <p className="dash-action-desc">
                {locale === "en"
                  ? "Compose a full lesson in minutes — you keep editorial control."
                  : "Compose une leçon complète en quelques minutes — tu gardes la main."}
              </p>
              <p className="dash-action-cta">
                {locale === "en" ? "Generate" : "Générer"} →
              </p>
            </Link>
            <Link href="/teacher/stats" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconChart size={18} /></span>
              <h3 className="dash-action-title">
                {locale === "en" ? "Class stats" : "Suivi classes"}
              </h3>
              <p className="dash-action-desc">
                {locale === "en"
                  ? "Detailed progress by class, skill, and learner. Zero jargon."
                  : "Progression détaillée par classe, compétence et apprenant·e. Zéro jargon."}
              </p>
              <p className="dash-action-cta">
                {locale === "en" ? "See" : "Voir"} →
              </p>
            </Link>
          </div>
        </section>
      </section>
    </TeacherLayout>
  );
}
