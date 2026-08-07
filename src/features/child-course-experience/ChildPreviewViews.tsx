import Link from "next/link";
import type { ChildUnit, YemaChildCourseContent } from "@/content/child-courses/types";
import styles from "./ChildPreview.module.css";

function frameworkLabel(course: YemaChildCourseContent): string {
  const framework = course.course.framework;
  const level = typeof framework.level === "string" ? framework.level : null;
  const stage = typeof framework.stage === "string" ? framework.stage : null;
  return level ?? stage ?? "Débutant";
}

function statusLabel(status: string): string {
  if (status.includes("native-review-required")) return "Test production · relecture native requise";
  if (status.includes("lingalaphone-review-required")) return "Test production · relecture lingalaphone requise";
  if (status.includes("audio-review-required")) return "Test production · voix native à valider";
  return "Test production";
}

export function ChildPilotLanding({ locale, courses }: { locale: string; courses: YemaChildCourseContent[] }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}`}>Accueil</Link>
        </header>
        <div className={styles.notice}>
          <strong>Parcours Enfant · test directement en production</strong>
          Les scripts et activités sont complets. Les voix natives et illustrations finales ne sont pas encore livrées ; l’enregistrement de l’enfant reste local au navigateur.
        </div>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>YEMA ENFANT · 5–8 ANS</p>
          <h1>Choisis une aventure</h1>
          <p>Les parcours Monde et Racines gardent chacun leur propre logique pédagogique. Une action principale à la fois, des sessions courtes et une place centrale donnée à la voix.</p>
        </section>
        <section className={styles.grid}>
          {courses.map((course) => (
            <Link className={styles.card} key={course.course.id} href={`/${locale}/qa/child-course-preview/${course.course.id}`}>
              <p className={styles.eyebrow}>{course.course.track === "racines" ? "RACINES" : "MONDE"} · {frameworkLabel(course)}</p>
              <h2>{course.course.title}</h2>
              <p>{course.course.subtitle}</p>
              <div className={styles.meta}>
                <span className={styles.chip}>{course.course.unitCount} missions</span>
                <span className={styles.chip}>{course.course.lessonCount} leçons</span>
                <span className={styles.chip}>{course.course.exerciseCount} activités</span>
              </div>
              <div className={styles.sequence}>{course.course.signatureSequence.map((stage) => <span key={stage}>{stage}</span>)}</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

export function ChildCoursePreview({ locale, course }: { locale: string; course: YemaChildCourseContent }) {
  const base = `/${locale}/qa/child-course-preview`;
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={base}>← Parcours Enfant</Link>
        </header>
        <div className={styles.notice}>
          <strong>{statusLabel(course.status)}</strong>
          Tu peux tester le parcours complet. L’audio natif et les illustrations finales sont encore à produire/valider ; aucun score de prononciation automatique n’est simulé.
        </div>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{course.course.track === "racines" ? "RACINES" : "MONDE"} · {frameworkLabel(course)} · {course.course.ageRange} ANS</p>
          <h1>{course.course.title}</h1>
          <p>{course.course.description}</p>
          <div className={styles.meta}>
            <span className={styles.chip}>{course.course.estimatedTotalMinutes} min</span>
            <span className={styles.chip}>{course.course.unitCount} missions</span>
            <span className={styles.chip}>4–7 min / session</span>
          </div>
          <div className={styles.sequence}>{course.course.signatureSequence.map((stage) => <span key={stage}>{stage}</span>)}</div>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Les 8 missions</h2>
          <div className={styles.unitGrid}>
            {course.units.map((unit) => (
              <Link className={styles.unit} href={`${base}/${course.course.id}/${unit.id}`} key={unit.id}>
                <small>MISSION {unit.order}</small>
                <h3>{unit.title}</h3>
                <p>{unit.mission}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function ChildUnitPreview({ locale, course, unit }: { locale: string; course: YemaChildCourseContent; unit: ChildUnit }) {
  const base = `/${locale}/qa/child-course-preview/${course.course.id}`;
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={base}>← Les 8 missions</Link>
        </header>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>MISSION {unit.order} · {frameworkLabel(course)}</p>
          <h1>{unit.title}</h1>
          <p>{unit.mission}</p>
          <div className={styles.meta}>
            <span className={styles.chip}>{unit.estimatedMinutes} min</span>
            <span className={styles.chip}>4 étapes</span>
            <span className={styles.chip}>12 activités</span>
          </div>
        </section>
        <section className={styles.audioCard}>
          <p className={styles.eyebrow}>SCRIPT AUDIO · VOIX NATIVE À PRODUIRE</p>
          <h2>{unit.audioScene.title}</h2>
          <p>{unit.audioScene.context}</p>
          <div className={styles.dialogue}>
            {unit.audioScene.lines.map((line, index) => (
              <div className={styles.line} key={`${line.speaker}-${index}`}>
                <strong>{line.speaker} · {line.target}</strong>
                <span>{line.fr}</span>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Les 4 étapes</h2>
          <div className={styles.lessonList}>
            {unit.lessons.map((lesson) => (
              <Link className={styles.lesson} href={`${base}/${unit.id}/${lesson.id}`} key={lesson.id}>
                <div>
                  <strong>{lesson.title}</strong>
                  <span>{lesson.durationMinutes} min · {lesson.xp} XP · 3 activités</span>
                </div>
                <span className={styles.stageBubble}>{lesson.stage}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
