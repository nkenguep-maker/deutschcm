import Link from "next/link";
import type { A1MockExam } from "@/content/monde-a1-v2/mock-exams";
import styles from "./A1V2Preview.module.css";

export function A1V2MockExamPreview({ exam, locale }: { exam: A1MockExam; locale: string }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}/qa/course-preview/de-a1-v2`}>YEMA · A1</Link>
          <Link className={styles.back} href={`/${locale}/qa/course-preview/de-a1-v2`}>Retour</Link>
        </header>
        <section className={styles.hero}>
          <div className={styles.kicker}>EXAMEN BLANC QA · NON OFFICIEL</div>
          <h1 className={styles.title}>{exam.title}</h1>
          <p className={styles.lead}>{exam.disclaimer}</p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>{exam.sections.length}</strong><span>sections</span></div>
            <div className={styles.stat}><strong>{exam.durationMinutes} min</strong><span>durée cible</span></div>
            <div className={styles.stat}><strong>{exam.maxPoints}</strong><span>points internes</span></div>
            <div className={styles.stat}><strong>{exam.status}</strong><span>statut QA</span></div>
          </div>
        </section>
        <div className={styles.stack}>
          {exam.sections.map((section) => (
            <section className={styles.card} key={section.id}>
              <div className={styles.kicker}>{section.title} · {section.durationMinutes} MIN · {section.maxPoints} PTS</div>
              <div className={styles.stack}>
                {section.items.map((item) => (
                  <article className={styles.exercise} key={item.id}>
                    <div className={styles.exerciseHead}>
                      <strong>{item.id}</strong>
                      <span className={styles.status}>{item.kind} · {item.maxPoints} pts</span>
                    </div>
                    <div className={styles.prompt}>{item.prompt}</div>
                    {item.audioScript ? <div className={styles.note}>SCRIPT AUDIO QA · {item.audioScript}</div> : null}
                    {item.stimulus ? <div className={styles.objective}>{item.stimulus}</div> : null}
                    {item.choices ? <div className={styles.choices}>{item.choices.map((choice) => (
                      <div className={styles.choice} key={choice.id}>{choice.id === item.correctChoiceId ? "✓ " : ""}{choice.text}</div>
                    ))}</div> : null}
                    {item.minWords ? <div className={styles.note}>{item.minWords}–{item.maxWords} Wörter</div> : null}
                    {item.preparationSeconds ? <div className={styles.note}>Vorbereitung {item.preparationSeconds}s · Ziel {item.targetSeconds}s</div> : null}
                    {item.checklist ? <div className={styles.chips}>{item.checklist.map((entry) => <span className={styles.chip} key={entry}>{entry}</span>)}</div> : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
