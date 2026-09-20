import Link from "next/link";
import { A1_V2_UNIT_1, MONDE_A1_V2_MANIFEST } from "@/content/monde-a1-v2";
import styles from "./A1V2Preview.module.css";

export function A1V2Overview({ locale }: { locale: string }) {
  const exerciseCount = A1_V2_UNIT_1.lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/qa`}>QA</Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.kicker}>MONDE · ALLEMAND A1 · REFONTE V2</div>
          <h1 className={styles.title}>On recommence sur une vraie mécanique d’apprentissage.</h1>
          <p className={styles.lead}>
            L’ancien parcours 6 unités / 36 leçons reste archivé. Le contrat de travail vise maintenant
            12 unités, 60 leçons, 180 exercices, 35–40 h guidées et 450–600 éléments lexicaux.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{MONDE_A1_V2_MANIFEST.target.units}</strong><span>unités cible</span></div>
            <div className={styles.stat}><strong>{MONDE_A1_V2_MANIFEST.target.lessons}</strong><span>leçons cible</span></div>
            <div className={styles.stat}><strong>{MONDE_A1_V2_MANIFEST.target.exercises}</strong><span>exercices cible</span></div>
            <div className={styles.stat}><strong>{MONDE_A1_V2_MANIFEST.target.guidedHoursMin}–{MONDE_A1_V2_MANIFEST.target.guidedHoursMax} h</strong><span>volume guidé cible</span></div>
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.stack}>
            <section className={styles.card}>
              <div className={styles.kicker}>UNITÉ 1 · GABARIT REÇU</div>
              <h2>Première rencontre</h2>
              <p className={styles.muted}>
                Le fichier de référence reçu contient {A1_V2_UNIT_1.lessons.length} leçons,
                {exerciseCount} exercices, {A1_V2_UNIT_1.cards.length} cartes mémoire et
                {A1_V2_UNIT_1.remediations.length} remédiations. Il reste volontairement en
                statut « {A1_V2_UNIT_1.status} ».
              </p>
            </section>

            {A1_V2_UNIT_1.lessons.map((lesson) => (
              <Link className={styles.lessonLink} key={lesson.id} href={`/${locale}/qa/course-preview/de-a1-v2/${lesson.id}`}>
                <article className={styles.card}>
                  <div className={styles.kicker}>LEÇON {lesson.order} · {lesson.phase}</div>
                  <h2>{lesson.title}</h2>
                  <p className={styles.muted}>{lesson.durationMinutes} min · {lesson.exercises.length} exercices · {lesson.objectiveIds.length} objectif(s)</p>
                  <span className={styles.status}>Ouvrir le gabarit →</span>
                </article>
              </Link>
            ))}
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
                <span className={styles.chip}>Réveil SRS</span>
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
