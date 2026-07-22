"use client";

// P2 · Dashboard Monde étudiant · réel, honnête, mobile-first.
// Consomme /api/me/monde-dashboard uniquement — aucune donnée mock.

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { StateBlock } from "@/components/StateBlock";
import type { MondeAccess, MondeCourseSummary } from "@/lib/monde";

interface DashboardData {
  universe: "MONDE";
  hasLearningPath: boolean;
  learningPath?: { id: string; language: string; currentLevel: string | null };
  access: MondeAccess;
  courses: MondeCourseSummary[];
  overallPct: number;
  nextModule: { courseId: string; moduleId: string; label: string } | null;
  greetingName: string | null;
  xpTotal?: number;
}

const COPY = {
  fr: {
    greetingFallback: "Bienvenue",
    universeLbl: "Monde · le voyage",
    languageDeutsch: "Allemand",
    levelLbl: "Niveau",
    accessActive: "Accès actif",
    accessExpired: "Accès expiré",
    accessNone: "Aucun accès",
    daysRemaining: (n: number) => n === 1 ? "1 jour restant" : `${n} jours restants`,
    hero: "Continuer ta prochaine leçon",
    heroSubStart: "Reprends là où tu t'étais arrêté.",
    heroSubDone: "Tu as terminé le programme A1. Bravo.",
    heroSubNoAccess: "Ton parcours de découverte est terminé — active ton Passage pour continuer.",
    heroSubExpired: "Ton Passage est arrivé à son terme. Tu retrouves ta progression, la reprise se prépare.",
    resume: "Reprendre",
    activate: "Choisir un Passage",
    dashboardCoursesTitle: "Ton parcours",
    dashboardCoursesSub: "Cinq leçons A1 pour poser les bases.",
    courseLocked: "Verrouillé",
    courseOpen: "À commencer",
    courseInProgress: "En cours",
    courseCompleted: "Terminé",
    modulesOf: (a: number, b: number) => `${a} sur ${b} modules`,
    seeCourse: "Voir la leçon",
    progressTitle: "Progression globale",
    prepTitle: "Préparation",
    prepBody: "Le test de niveau détaillé et les examens blancs ouvrent progressivement.",
    prepCta: "Faire le test de niveau",
    teacherTitle: "Suivi professeur",
    teacherBody: "Le suivi humain Monde s'ouvre bientôt. Tu recevras un message dès qu'il est prêt.",
    loading: "Ta maison s'ouvre — *un instant.*",
    errorSoul: "La voix s'est perdue en route. *Pas la tienne.*",
    errorBody: "Impossible de charger ton dashboard. Réessaie dans un instant.",
    retry: "Réessayer",
    noAccessSoul: "La porte est encore fermée. *Ton parcours attend.*",
    noAccessBody: "Ton compte a fini la découverte mais aucun Passage n'est actif. Reviens quand tu es prêt.",
    noAccessCta: "Voir les offres",
    xpLbl: "XP",
  },
  en: {
    greetingFallback: "Welcome",
    universeLbl: "World · the journey",
    languageDeutsch: "German",
    levelLbl: "Level",
    accessActive: "Active access",
    accessExpired: "Access expired",
    accessNone: "No access",
    daysRemaining: (n: number) => n === 1 ? "1 day left" : `${n} days left`,
    hero: "Continue your next lesson",
    heroSubStart: "Pick up where you left off.",
    heroSubDone: "You completed the A1 programme. Well done.",
    heroSubNoAccess: "Your discovery journey is complete — activate your Passage to continue.",
    heroSubExpired: "Your Passage ended. Your progress is saved, the resumption is being prepared.",
    resume: "Resume",
    activate: "Choose a Passage",
    dashboardCoursesTitle: "Your journey",
    dashboardCoursesSub: "Five A1 lessons to lay the foundations.",
    courseLocked: "Locked",
    courseOpen: "Start",
    courseInProgress: "In progress",
    courseCompleted: "Completed",
    modulesOf: (a: number, b: number) => `${a} of ${b} modules`,
    seeCourse: "See lesson",
    progressTitle: "Overall progress",
    prepTitle: "Preparation",
    prepBody: "The detailed level test and mock exams open progressively.",
    prepCta: "Take the level test",
    teacherTitle: "Teacher support",
    teacherBody: "Human teacher support opens soon. You'll get a message as soon as it's ready.",
    loading: "Your home is opening — *just a moment.*",
    errorSoul: "The voice got lost on the way. *Not yours.*",
    errorBody: "Can't load your dashboard. Try again in a moment.",
    retry: "Retry",
    noAccessSoul: "The door is still closed. *Your journey is waiting.*",
    noAccessBody: "You finished discovery but no Passage is active. Come back when you're ready.",
    noAccessCta: "See offers",
    xpLbl: "XP",
  },
} as const;

export function DashboardMonde({ locale }: { locale: "fr" | "en" }) {
  const c = COPY[locale];
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setLoading(true);
    fetch("/api/me/monde-dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch"))))
      .then((d) => setData(d as DashboardData))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (loading) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
        <StateBlock kind="loading" soul={c.loading} />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 16px" }}>
        <StateBlock kind="error" soul={c.errorSoul} body={c.errorBody} action={{ label: c.retry, onClick: load }} />
      </main>
    );
  }

  const noLP = !data.hasLearningPath;
  const noAccess = data.access.status === "NONE";
  const expired = data.access.status === "EXPIRED";
  const active = data.access.status === "ACTIVE";

  // Sans LP ni accès · l'utilisateur devrait passer par le funnel P1.
  if (noLP) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 16px" }}>
        <StateBlock
          kind="empty"
          centered
          soul={c.noAccessSoul}
          body={c.noAccessBody}
          action={{ label: c.noAccessCta, href: "/onboarding" }}
        />
      </main>
    );
  }

  const greeting = data.greetingName?.split(" ")[0] ?? c.greetingFallback;
  const heroSub = active
    ? (data.nextModule ? c.heroSubStart : c.heroSubDone)
    : (expired ? c.heroSubExpired : c.heroSubNoAccess);

  return (
    <main className="monde-dash" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px 96px" }}>
      {/* En-tête */}
      <header style={{ marginBottom: 24 }}>
        <p style={{
          margin: "0 0 6px", color: "var(--brass)",
          fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>{c.universeLbl}</p>
        <h1 style={{
          fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28,
          color: "var(--creme)", margin: "0 0 6px", overflowWrap: "anywhere",
        }}>{greeting}</h1>
        <p style={{ color: "var(--creme-mute)", fontSize: 14, margin: 0 }}>
          {c.languageDeutsch} · {c.levelLbl} {data.learningPath?.currentLevel ?? "A1"}
          {" · "}
          <AccessBadge access={data.access} locale={locale} />
        </p>
      </header>

      {/* Hero · progression + next */}
      <section style={{
        marginBottom: 24, padding: "20px 22px",
        background: "var(--brass-glow)", border: "1px solid var(--brass-edge)",
        borderRadius: 16,
      }}>
        <p style={{ margin: "0 0 6px", color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {data.overallPct}% · {c.progressTitle}
        </p>
        <div style={{ height: 6, background: "rgba(244, 235, 220, 0.1)", borderRadius: 3, marginBottom: 14 }}>
          <div style={{ height: 6, width: `${data.overallPct}%`, background: "var(--brass)", borderRadius: 3 }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, color: "var(--creme)", margin: "0 0 4px" }}>
          {c.hero}
        </h2>
        <p style={{ color: "var(--creme-soft)", fontSize: 13, margin: "0 0 14px" }}>{heroSub}</p>
        {active && data.nextModule ? (
          <Link
            href={`/courses/${data.nextModule.courseId}/modules/${data.nextModule.moduleId}`}
            className="entry-cta entry-cta-primary"
            style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}
          >
            {c.resume} · {data.nextModule.label}
          </Link>
        ) : (
          <Link
            href={active ? "/progress" : "/activation-intent"}
            className="entry-cta entry-cta-primary"
            style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}
          >
            {active ? c.progressTitle : c.activate}
          </Link>
        )}
      </section>

      {/* Cours · liste des 5 leçons */}
      <section style={{ marginBottom: 24 }}>
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 22, color: "var(--creme)", margin: "0 0 4px" }}>
            {c.dashboardCoursesTitle}
          </h2>
          <p style={{ color: "var(--creme-mute)", fontSize: 13, margin: 0 }}>{c.dashboardCoursesSub}</p>
        </header>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {data.courses.map((cs) => {
            const locked = cs.status === "LOCKED" || (noAccess && !active);
            const statusLbl =
              cs.status === "COMPLETED" ? c.courseCompleted :
              cs.status === "IN_PROGRESS" ? c.courseInProgress :
              cs.status === "OPEN" ? c.courseOpen : c.courseLocked;
            const pct = cs.totalModules === 0 ? 0 : Math.round((cs.completedModules / cs.totalModules) * 100);
            return (
              <li key={cs.id} className="data-card" style={{ opacity: locked ? 0.55 : 1 }}>
                <div className="data-card-head">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="data-card-title">
                      <span style={{ color: "var(--creme-mute)", marginRight: 8, fontFamily: "var(--font-jetbrains, monospace)", fontSize: 12 }}>
                        {String(cs.index).padStart(2, "0")}
                      </span>
                      {cs.label}
                    </p>
                    <p className="data-card-sub">{c.modulesOf(cs.completedModules, cs.totalModules)} · {statusLbl}</p>
                  </div>
                  {!locked && (
                    <Link
                      href={`/courses/${cs.id}/modules/${cs.moduleIds[0]}`}
                      className="row-btn"
                      style={{ flexShrink: 0, minHeight: 40 }}
                    >
                      {c.seeCourse}
                    </Link>
                  )}
                </div>
                {cs.completedModules > 0 && (
                  <div style={{ height: 4, background: "rgba(244, 235, 220, 0.08)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${pct}%`, background: "var(--brass)", borderRadius: 2 }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Préparation · lien honnête vers le test de niveau existant */}
      <section style={{ marginBottom: 24, padding: "16px 18px", background: "var(--espresso-2)", border: "1px solid var(--creme-hair)", borderRadius: 14 }}>
        <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18, color: "var(--creme)", margin: "0 0 6px" }}>
          {c.prepTitle}
        </h2>
        <p style={{ color: "var(--creme-mute)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{c.prepBody}</p>
        <Link href="/test-niveau" className="row-btn" style={{ minHeight: 40 }}>{c.prepCta}</Link>
      </section>

      {/* Suivi professeur · état honnête */}
      <section style={{ padding: "16px 18px", background: "rgba(244, 235, 220, 0.02)", border: "1px dashed var(--creme-hair)", borderRadius: 14 }}>
        <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18, color: "var(--creme)", margin: "0 0 6px" }}>
          {c.teacherTitle}
        </h2>
        <p style={{ color: "var(--creme-mute)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{c.teacherBody}</p>
      </section>
    </main>
  );
}

function AccessBadge({ access, locale }: { access: MondeAccess; locale: "fr" | "en" }) {
  const c = COPY[locale];
  const label =
    access.status === "ACTIVE" ? c.accessActive :
    access.status === "EXPIRED" ? c.accessExpired : c.accessNone;
  const color =
    access.status === "ACTIVE" ? "var(--brass)" :
    access.status === "EXPIRED" ? "var(--oxblood)" : "var(--creme-mute)";
  return (
    <span style={{ color, fontWeight: 600 }}>
      {label}
      {access.status === "ACTIVE" && access.daysRemaining !== null && (
        <span style={{ color: "var(--creme-mute)", fontWeight: 400 }}>
          {" · "}{c.daysRemaining(access.daysRemaining)}
        </span>
      )}
    </span>
  );
}
