import Link from "next/link";
import { notFound } from "next/navigation";
import refonte from "@/data/courses/monde/adulte/de-a1-refonte/u1.json";
import type { GermanA1RefonteUnit } from "@/data/courses/monde/adulte/de-a1-refonte/types";
import styles from "@/features/course-experience/CourseExperience.module.css";

const data = refonte as unknown as GermanA1RefonteUnit;

export const dynamic = "force-dynamic";

export default async function A1RefontePreview({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale } = await params;
  const base = `/${locale}/qa/course-preview/de-a1-refonte`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/qa/course-preview/de-a1`}>Ancien A1</Link>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>A1 · REFONTE PÉDAGOGIQUE · U1</div>
            <h1>Apprendre, retenir, corriger l’erreur</h1>
            <p className={styles.lead}>Gabarit de référence avant extension aux autres unités : rappel productif, Réveil espacé, feedback par erreur, normalisation clavier et remédiation.</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{data.lessons.length}</strong><span>leçons de référence</span></div>
            <div className={styles.stat}><strong>{data.cards.length}</strong><span>cartes mémoire</span></div>
            <div className={styles.stat}><strong>{data.remediations.length}</strong><span>remédiations</span></div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><div className={styles.eyebrow}>UNITÉ 1 · GABARIT</div><h2 className={styles.sectionTitle}>Saluer et se présenter</h2></div>
            <p className={styles.muted}>Version {data.contentVersion} · {data.status}</p>
          </div>
          <div className={styles.lessonList}>
            {data.lessons.map((lesson) => (
              <article className={styles.lessonCard} key={lesson.id}>
                <div className={styles.lessonIndex}>{lesson.order}</div>
                <div>
                  <span className={styles.status}>{lesson.phase}</span>
                  <h3>{lesson.title}</h3>
                  <div className={styles.lessonMeta}>{lesson.durationMinutes} min · {lesson.exercises.length} activités · {lesson.objectiveIds.length} objectif(s)</div>
                </div>
                <Link className={styles.secondary} href={`${base}/${lesson.id}`}>Ouvrir la leçon</Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.eyebrow}>QUALITY GATES</div>
            <ul className={styles.list}>
              <li>Reconnaissance : ≤ {Math.round(data.qualityGates.exerciseMix.recognitionMax * 100)} %</li>
              <li>Productif écrit : ≥ {Math.round(data.qualityGates.exerciseMix.productiveWrittenMin * 100)} %</li>
              <li>Structure : ≥ {Math.round(data.qualityGates.exerciseMix.structureMin * 100)} %</li>
              <li>Oral : ≥ {Math.round(data.qualityGates.exerciseMix.oralMin * 100)} %</li>
              <li>Réveil : au moins {data.qualityGates.spacedRecall.minCardsRevisitedPerLesson} cartes dues par leçon</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
