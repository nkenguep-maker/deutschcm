import Link from "next/link";
import { A1_V2_SYLLABUS, A1_V2_UNITS, MONDE_A1_V2_MANIFEST } from "@/content/monde-a1-v2";
import styles from "./A1V2Preview.module.css";

export function A1V2Overview({ locale }: { locale: string }) {
  const integratedLessonCount = A1_V2_UNITS.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const integratedExerciseCount = A1_V2_UNITS.reduce(
    (sum, unit) => sum + unit.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.exercises.length, 0),
    0,
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/qa`}>QA</Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.kicker}>MONDE · ALLEMAND A1 · REFONTE V2</div>
          <h1 className={styles.title}>Un niveau construit comme un système d’apprentissage.</h1>
          <p className={styles.lead}>
            L’ancien parcours 6 unités / 36 leçons reste archivé. Le contrat vise 12 unités,
            60 leçons, 180+ exercices, 35–40 h guidées et 450–600 éléments lexicaux.
            Le syllabus complet est un plan ; seules les unités explicitement marquées intégrées existent dans le runtime.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{A1_V2_UNITS.length}/{MONDE_A1_V2_MANIFEST.target.units}</strong><span>unités intégrées</span></div>
            <div className={styles.stat}><strong>{integratedLessonCount}/{MONDE_A1_V2_MANIFEST.target.lessons}</strong><span>leçons intégrées</span></div>
            <div className={styles.stat}><strong>{integratedExerciseCount}</strong><span>exercices intégrés</span></div>
            <div className={styles.stat}><strong>{MONDE_A1_V2_MANIFEST.target.guidedHoursMin}–{MONDE_A1_V2_MANIFEST.target.guidedHoursMax} h</strong><span>volume final cible</span></div>
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.stack}>
            {A1_V2_UNITS.map((unit) => {
              const exerciseCount = unit.lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);
              const guidedMinutes = unit.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
              return (
                <section className={styles.card} key={unit.id}>
                  <div className={styles.kicker}>UNITÉ {unit.order} · INTÉGRÉE · {unit.status.toUpperCase()}</div>
                  <h2>{unit.title}</h2>
                  <p className={styles.muted}>
                    {unit.lessons.length} leçons · {exerciseCount} exercices · {unit.cards.length} cartes · {guidedMinutes} min guidées.
                  </p>
                  <div className={styles.stack}>
                    {unit.lessons.map((lesson) => (
                      <Link className={styles.lessonLink} key={lesson.id} href={`/${locale}/qa/course-preview/de-a1-v2/${lesson.id}`}>
                        <article className={styles.objective}>
                          <strong>Leçon {lesson.order} · {lesson.phase} · {lesson.title}</strong><br />
                          <span className={styles.muted}>{lesson.durationMinutes} min · {lesson.exercises.length} exercices</span>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}

            <section className={styles.card}>
              <div className={styles.kicker}>SYLLABUS 12 UNITÉS · PLAN, PAS CONTENU INTÉGRÉ</div>
              <div className={styles.stack}>
                {A1_V2_SYLLABUS.map((unit) => {
                  const integrated = MONDE_A1_V2_MANIFEST.integratedUnits.includes(unit.id);
                  return (
                    <div key={unit.id} className={styles.objective}>
                      <strong>U{unit.order} · {unit.title}</strong><br />
                      <span className={styles.muted}>{integrated ? "intégrée en refonte" : "planifiée"} · {unit.lessons.length} leçons · {unit.guidedMinutesTarget} min cible</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className={styles.stack}>
            <section className={styles.card}>
              <div className={styles.kicker}>READY GATES</div>
              <h3>Tout reste fermé par défaut</h3>
              <p className={styles.muted}>
                Niveau complet intégré : {MONDE_A1_V2_MANIFEST.readiness.fullLevelIntegrated ? "oui" : "non"}<br />
                Audio natif critique : {MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady ? "oui" : "non"}<br />
                Examens blancs : {MONDE_A1_V2_MANIFEST.readiness.mockExamsReady ? "oui" : "non"}
              </p>
            </section>
            <section className={styles.card}>
              <div className={styles.kicker}>DOCTRINE</div>
              <div className={styles.chips}>
                <span className={styles.chip}>Rappel avant reconnaissance</span>
                <span className={styles.chip}>QCM ≤ 25 %</span>
                <span className={styles.chip}>Réveil inter-unités</span>
                <span className={styles.chip}>Feedback spécifique</span>
                <span className={styles.chip}>Tolérance clavier</span>
                <span className={styles.chip}>Remédiation</span>
                <span className={styles.chip}>Oral progressif</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
