import Link from "next/link";
import type { CourseContent, CourseProgressRecord } from "@/data/courses/types";
import styles from "./CourseExperience.module.css";

export function CourseCompletion({
  course,
  progress,
  locale,
}: {
  course: CourseContent;
  progress: CourseProgressRecord[];
  locale: string;
}) {
  const completed = new Set(
    progress.filter((item) => item.status === "COMPLETED").map((item) => item.moduleId),
  );
  const allLessons = course.units.flatMap((unit) => unit.lessons);
  const completedCount = allLessons.filter((lesson) => completed.has(lesson.id)).length;
  const pct = allLessons.length === 0 ? 0 : Math.round((completedCount / allLessons.length) * 100);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/learn/${course.course.id}`}>← Retour au parcours</Link>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>NIVEAU {course.course.framework.level} TERMINÉ</div>
            <h1>{course.course.dashboardStrings.levelCompleted}</h1>
            <p className={styles.lead}>
              Tu as terminé les {course.course.lessonCount} leçons de {course.course.shortTitle}.
              Voici ton bilan avant la suite.
            </p>
            <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{course.course.courseHero.progressLabel}</strong><span>{pct} %</span>
              </div>
              <div className={styles.progress} aria-label={`${pct} %`}><span style={{ width: `${pct}%` }} /></div>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{course.course.unitCount}/{course.course.unitCount}</strong><span>unités terminées</span></div>
            <div className={styles.stat}><strong>{completedCount}/{allLessons.length}</strong><span>leçons terminées</span></div>
            <div className={styles.stat}><strong>{Math.round(course.course.estimatedTotalMinutes / 60)} h</strong><span>parcours estimé</span></div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.eyebrow}>CE QUE TU SAIS FAIRE</div>
            <h2 className={styles.sectionTitle}>Tes acquis A1</h2>
            <ol className={styles.list}>
              {course.course.levelOutcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
            </ol>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.eyebrow}>RÉVISION GÉNÉRALE</div>
              <h2 className={styles.sectionTitle}>{course.levelReview.title}</h2>
            </div>
            <p className={styles.muted}>{course.levelReview.description}</p>
          </div>
          <div className={styles.unitGrid}>
            {course.levelReview.sections.map((section) => (
              <article className={styles.unitCard} key={section.title}>
                <div><h2>{section.title}</h2></div>
                <ul className={styles.list}>
                  {section.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.eyebrow}>AUTO-ÉVALUATION</div>
            <h2 className={styles.sectionTitle}>Avant A2</h2>
            <ul className={styles.list}>
              {course.levelReview.finalChecklist.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className={styles.primary} href={`/${locale}/dashboard/view/mon-cours`}>Retour à mon espace</Link>
              <Link className={styles.secondary} href={`/${locale}/learn/${course.course.id}`}>Revoir A1</Link>
            </div>
          </div>
        </section>

        <section className={styles.state}>
          <div className={styles.eyebrow}>{course.course.dashboardStrings.nextLevel}</div>
          <h2 className={styles.sectionTitle}>A2 viendra ensuite.</h2>
          <p className={styles.muted}>A1 reste ton niveau complet disponible aujourd’hui. Tes acquis et ta progression sont conservés.</p>
        </section>
      </div>
    </main>
  );
}
