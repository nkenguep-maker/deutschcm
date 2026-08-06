import Link from "next/link";
import type { CourseContent, CourseProgressRecord } from "@/data/courses/types";
import styles from "./CourseExperience.module.css";

type Status = "COMPLETED" | "IN_PROGRESS" | "OPEN" | "LOCKED";

function progressState(course: CourseContent, progress: CourseProgressRecord[]) {
  const completed = new Set(progress.filter((item) => item.status === "COMPLETED").map((item) => item.moduleId));
  const allLessons = course.units.flatMap((unit) => unit.lessons);
  const firstIncomplete = allLessons.find((lesson) => !completed.has(lesson.id))?.id ?? null;
  const unitStatuses = new Map<string, Status>();
  for (const unit of course.units) {
    const done = unit.lessons.filter((lesson) => completed.has(lesson.id)).length;
    const containsCurrent = unit.lessons.some((lesson) => lesson.id === firstIncomplete);
    const status: Status = done === unit.lessons.length ? "COMPLETED" : done > 0 ? "IN_PROGRESS" : containsCurrent ? "OPEN" : "LOCKED";
    unitStatuses.set(unit.id, status);
  }
  return {
    completed,
    firstIncomplete,
    unitStatuses,
    pct: allLessons.length === 0 ? 0 : Math.round((completed.size / allLessons.length) * 100),
  };
}

const statusLabel = (status: Status, strings: Record<string, string>) =>
  status === "COMPLETED" ? strings.mastered : status === "IN_PROGRESS" ? strings.inProgress : status === "OPEN" ? strings.toStart : strings.locked;

export function CourseOverview({
  course,
  progress,
  accessStatus,
  locale,
}: {
  course: CourseContent;
  progress: CourseProgressRecord[];
  accessStatus: "ACTIVE" | "EXPIRED" | "NONE";
  locale: string;
}) {
  const state = progressState(course, progress);
  const next = state.firstIncomplete
    ? course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson }))).find((item) => item.lesson.id === state.firstIncomplete)
    : null;
  const canLearn = accessStatus === "ACTIVE";
  const nextHref = next ? `/${locale}/learn/${course.course.id}/${next.unit.id}/${next.lesson.id}` : `/${locale}/dashboard/view/mon-cours`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/dashboard/view/mon-cours`}>← Retour à mon espace</Link>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>{course.course.courseHero.eyebrow} · {course.course.shortTitle}</div>
            <h1>{course.course.courseHero.title}</h1>
            <p className={styles.lead}>{course.course.courseHero.description}</p>
            <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{course.course.courseHero.progressLabel}</strong><span>{state.pct} %</span>
              </div>
              <div className={styles.progress} aria-label={`${state.pct} %`}><span style={{ width: `${state.pct}%` }} /></div>
            </div>
            <div style={{ marginTop: 24 }}>
              {canLearn ? <Link className={styles.primary} href={nextHref}>{next ? course.course.courseHero.continueLabel : "Voir mon bilan"}</Link> : <Link className={styles.primary} href={`/${locale}/offers`}>Activer l’accès au cours</Link>}
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{course.course.unitCount}</strong><span>unités communicatives</span></div>
            <div className={styles.stat}><strong>{course.course.lessonCount}</strong><span>leçons</span></div>
            <div className={styles.stat}><strong>{Math.round(course.course.estimatedTotalMinutes / 60)} h</strong><span>durée estimée · {course.course.estimatedWeeks} semaines</span></div>
          </div>
        </section>

        <nav className={styles.path} aria-label="Parcours CECRL">
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => <span key={level} className={`${styles.level} ${level === "A1" ? styles.levelActive : ""}`}>{level}</span>)}
        </nav>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><div className={styles.eyebrow}>{course.course.dashboardStrings.courseTitle}</div><h2 className={styles.sectionTitle}>{course.course.title}</h2></div>
            <p className={styles.muted}>{course.course.completionRule}</p>
          </div>
          <div className={styles.unitGrid}>
            {course.units.map((unit) => {
              const status = state.unitStatuses.get(unit.id) ?? "LOCKED";
              const locked = status === "LOCKED" || !canLearn;
              const done = unit.lessons.filter((lesson) => state.completed.has(lesson.id)).length;
              const href = `/${locale}/learn/${course.course.id}/${unit.id}`;
              return (
                <article key={unit.id} className={`${styles.unitCard} ${locked ? styles.unitCardLocked : ""}`}>
                  <div className={styles.unitTop}><span className={styles.mono}>U{unit.order}</span><span className={styles.status}>{statusLabel(status, course.course.dashboardStrings)}</span></div>
                  <div><h2>{unit.title}</h2><p className={styles.muted}>{unit.communicativeObjective}</p></div>
                  <div className={styles.chipRow}>{unit.skills.slice(0, 3).map((skill) => <span className={styles.chip} key={skill}>{skill}</span>)}</div>
                  <div style={{ display: "grid", gap: 9 }}><div className={styles.progress}><span style={{ width: `${Math.round((done / unit.lessons.length) * 100)}%` }} /></div><small>{done}/{unit.lessons.length} leçons · {unit.estimatedMinutes} min</small></div>
                  {locked ? <span className={styles.secondary}>{canLearn ? course.globalUiTexts.lockedMessage : "Accès requis"}</span> : <Link className={styles.secondary} href={href}>{status === "COMPLETED" ? "Revoir l’unité" : "Ouvrir l’unité"}</Link>}
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.eyebrow}>À la fin du niveau</div>
            <h2 className={styles.sectionTitle}>Ce que tu sauras faire</h2>
            <ol className={styles.list}>{course.course.levelOutcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ol>
          </div>
        </section>
      </div>
    </main>
  );
}
