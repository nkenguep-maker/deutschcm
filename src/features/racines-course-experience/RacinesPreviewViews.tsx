import Link from "next/link";
import type { RacinesUnit, YemaRacinesCourseContent } from "@/content/racines-e1-solo";
import styles from "./RacinesPreview.module.css";

export function PilotBanner({ course }: { course?: YemaRacinesCourseContent }) {
  return (
    <div className={styles.pilot} role="note">
      <strong>Prototype éditorial · test interne</strong>
      {course?.course.learningLanguage.code === "byv"
        ? "Bangangté / Medumba : relecture native, graphie et tons à valider avant publication."
        : course?.course.learningLanguage.code === "ln"
          ? "Lingala : relecture lingalaphone et variété des voix à valider avant publication."
          : "Ces parcours restent fermés au public tant que la relecture native et les voix ne sont pas validées."}
    </div>
  );
}

export function RacinesPilotLanding({ locale, courses }: { locale: string; courses: YemaRacinesCourseContent[] }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/dashboard`}>← Dashboard</Link>
        </header>
        <PilotBanner />
        <section className={styles.hero}>
          <p className={styles.eyebrow}>RACINES · É1 · ÉVEIL</p>
          <h1 className={styles.title}>Deux langues à réveiller par la voix.</h1>
          <p className={styles.lede}>Parcours adulte solo. Ici, pas de CECRL : on écoute, on imite, on répond, on raconte puis on transmet. La navigation est libre en Preview QA pour faciliter les tests.</p>
          <div className={styles.sequence} aria-label="Séquence pédagogique">
            {courses[0]?.course.signatureSequence.map((stage) => <div className={styles.stage} key={stage}>{stage}</div>)}
          </div>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Parcours disponibles en test</h2>
          <div className={styles.grid}>
            {courses.map((course) => (
              <Link key={course.course.id} className={styles.card} href={`/${locale}/qa/racines-course-preview/${course.course.id}`}>
                <p className={styles.eyebrow}>{course.course.framework.stage} · {course.course.framework.stageName}</p>
                <h2>{course.course.title}</h2>
                <p>{course.course.subtitle}</p>
                <div className={styles.cardMeta}>
                  <span>{course.course.unitCount} missions · {course.course.lessonCount} étapes</span>
                  <span>{course.course.estimatedWeeks} semaines</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function RacinesCoursePreview({ locale, course }: { locale: string; course: YemaRacinesCourseContent }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/qa/racines-course-preview`}>← Parcours Racines</Link>
        </header>
        <PilotBanner course={course} />
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{course.course.framework.stage} · {course.course.framework.stageName}</p>
          <h1 className={styles.title}>{course.course.title}</h1>
          <p className={styles.lede}>{course.course.description}</p>
          <div className={styles.metaRow}>
            <span className={styles.chip}>Adulte · solo</span>
            <span className={styles.chip}>{course.course.unitCount} missions</span>
            <span className={styles.chip}>{course.course.lessonCount} étapes</span>
            <span className={styles.chip}>{course.course.exerciseCount} exercices</span>
            <span className={styles.chip}>Validation orale 6/8</span>
          </div>
          <div className={styles.sequence} aria-label="Séquence pédagogique">
            {course.course.signatureSequence.map((stage) => <div className={styles.stage} key={stage}>{stage}</div>)}
          </div>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Les 8 missions</h2>
          <div className={styles.missionList}>
            {course.units.map((unit) => (
              <Link className={styles.mission} key={unit.id} href={`/${locale}/qa/racines-course-preview/${course.course.id}/${unit.id}`}>
                <span className={styles.number}>{unit.order}</span>
                <span><h2>{unit.title}</h2><p>{unit.canDo}</p></span>
                <span className={styles.arrow}>→</span>
              </Link>
            ))}
          </div>
        </section>
        <p className={styles.footerNote}>Les informations de sources, statuts d’attestation et notes éditoriales restent volontairement hors de l’expérience apprenant.</p>
      </div>
    </main>
  );
}

export function RacinesUnitPreview({ locale, course, unit }: { locale: string; course: YemaRacinesCourseContent; unit: RacinesUnit }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/qa/racines-course-preview/${course.course.id}`}>← Les 8 missions</Link>
        </header>
        <PilotBanner course={course} />
        <section className={styles.hero}>
          <p className={styles.eyebrow}>MISSION {unit.order} · {course.course.framework.stage}</p>
          <h1 className={styles.title}>{unit.title}</h1>
          <p className={styles.lede}>{unit.oralObjective}</p>
          <div className={styles.metaRow}>
            <span className={styles.chip}>{unit.estimatedMinutes} min</span>
            <span className={styles.chip}>5 étapes</span>
            <span className={styles.chip}>15 activités</span>
          </div>
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Écoute → Imite → Réponds → Raconte → Transmets</h2>
          <div className={styles.missionList}>
            {unit.lessons.map((lesson) => (
              <Link className={styles.mission} key={lesson.id} href={`/${locale}/qa/racines-course-preview/${course.course.id}/${unit.id}/${lesson.id}`}>
                <span className={styles.number}>{lesson.order}</span>
                <span><h2>{lesson.title}</h2><p>{lesson.objective} · {lesson.xp} XP</p></span>
                <span className={styles.arrow}>→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
