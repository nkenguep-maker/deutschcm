import Link from "next/link";
import type { CourseContent, CourseProgressRecord, CourseUnit } from "@/data/courses/types";
import styles from "./CourseExperience.module.css";

export function UnitOverview({
  course,
  unit,
  progress,
  accessStatus,
  locale,
  baseHref,
  unlockAll = false,
}: {
  course: CourseContent;
  unit: CourseUnit;
  progress: CourseProgressRecord[];
  accessStatus: "ACTIVE" | "EXPIRED" | "NONE";
  locale: string;
  baseHref?: string;
  unlockAll?: boolean;
}) {
  const completed = new Set(progress.filter((item) => item.status === "COMPLETED").map((item) => item.moduleId));
  const all = course.units.flatMap((item) => item.lessons);
  const currentId = all.find((lesson) => !completed.has(lesson.id))?.id ?? null;
  const canLearn = accessStatus === "ACTIVE";
  const courseBaseHref = baseHref ?? `/${locale}/learn/${course.course.id}`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={courseBaseHref}>← Retour au cours</Link>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>{unit.hero.eyebrow}</div>
            <h1>{unit.hero.title}</h1>
            <p className={styles.lead}>{unit.hero.description}</p>
            <p className={styles.muted}><strong>Mission finale :</strong> {unit.finalMission}</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{unit.lessons.length}</strong><span>leçons</span></div>
            <div className={styles.stat}><strong>{unit.estimatedMinutes} min</strong><span>durée estimée</span></div>
            <div className={styles.stat}><strong>{unit.skills.length}</strong><span>compétences</span></div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><div className={styles.eyebrow}>MODULE — ÉLÈVE MONDE</div><h2 className={styles.sectionTitle}>{unit.title}</h2></div>
            <p className={styles.muted}>{unit.canDo}</p>
          </div>
          <div className={styles.lessonList}>
            {unit.lessons.map((lesson) => {
              const globalIndex = all.findIndex((item) => item.id === lesson.id);
              const currentIndex = currentId ? all.findIndex((item) => item.id === currentId) : all.length;
              const isDone = completed.has(lesson.id);
              const locked = !canLearn || (!unlockAll && !isDone && globalIndex > currentIndex);
              const status = isDone ? "Maîtrisé" : lesson.id === currentId ? "En cours" : locked ? "Verrouillé" : "À commencer";
              return (
                <article key={lesson.id} className={`${styles.lessonCard} ${locked ? styles.lessonLocked : ""}`}>
                  <div className={styles.lessonIndex}>{lesson.order}</div>
                  <div>
                    <span className={styles.status}>{lesson.phase} · {status}</span>
                    <h3>{lesson.title}</h3>
                    <div className={styles.lessonMeta}>{lesson.objective} · {lesson.durationMinutes} min · +{lesson.xp} XP</div>
                  </div>
                  {locked ? <span className={styles.secondary}>{canLearn ? "Termine la leçon précédente" : "Accès requis"}</span> : <Link className={styles.secondary} href={`${courseBaseHref}/${unit.id}/${lesson.id}`}>{isDone ? "Revoir" : lesson.primaryCta}</Link>}
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.eyebrow}>Contexte de la mission</div>
            <h2 className={styles.sectionTitle}>{unit.situation}</h2>
            <div className={styles.chipRow}>{unit.skills.map((skill) => <span className={styles.chip} key={skill}>{skill}</span>)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
