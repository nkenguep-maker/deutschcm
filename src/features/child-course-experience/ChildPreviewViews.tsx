import Link from "next/link";
import type { ChildUnit, YemaChildCourseContent } from "@/content/child-courses/types";
import { ChildMissionPath } from "./ChildMissionPath";
import styles from "./ChildPreview.module.css";

function frameworkLabel(course: YemaChildCourseContent): string {
  const framework = course.course.framework;
  const level = typeof framework.level === "string" ? framework.level : null;
  const stage = typeof framework.stage === "string" ? framework.stage : null;
  return level ?? stage ?? "Débutant";
}

function statusLabel(status: string): string {
  if (status.includes("native-review-required")) return "Voix native à relire";
  if (status.includes("lingalaphone-review-required")) return "Voix lingalaphone à relire";
  if (status.includes("audio-review-required")) return "Audio natif à valider";
  return "Mode test";
}

function courseEmoji(course: YemaChildCourseContent) {
  if (course.course.track === "monde") return "🚀";
  return course.course.learningLanguage.code === "ln" ? "🌿" : "🔥";
}

export function ChildPilotLanding({ locale, courses }: { locale: string; courses: YemaChildCourseContent[] }) {
  return (
    <main className={styles.page} data-universe="kids">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}><span className={styles.brandMark}>Y</span> YEMA KIDS</Link>
          <Link className={styles.back} href={`/${locale}`}>Sortir</Link>
        </header>
        <section className={styles.gameHero}>
          <div>
            <p className={styles.kicker}>🎮 CHOISIS TON AVENTURE</p>
            <h1>À toi de jouer !</h1>
            <p>Une mission courte à la fois. Tu écoutes, tu touches, tu répètes et tu avances sur ton chemin.</p>
          </div>
          <div className={styles.guide} aria-hidden="true"><span>★</span></div>
        </section>
        <section className={styles.adventureGrid}>
          {courses.map((course) => (
            <Link className={styles.adventureCard} data-track={course.course.track} key={course.course.id} href={`/${locale}/qa/child-course-preview/${course.course.id}`}>
              <span className={styles.adventureEmoji}>{courseEmoji(course)}</span>
              <div>
                <p className={styles.eyebrow}>{course.course.track === "racines" ? "RACINES" : "MONDE"} · {frameworkLabel(course)}</p>
                <h2>{course.course.shortTitle || course.course.title}</h2>
                <p>{course.course.subtitle}</p>
              </div>
              <div className={styles.adventureFooter}><span>{course.course.unitCount} missions</span><strong>JOUER →</strong></div>
            </Link>
          ))}
        </section>
        <p className={styles.testNote}>Mode test : les parcours sont jouables ; certaines voix natives et illustrations finales restent à produire.</p>
      </div>
    </main>
  );
}

export function ChildCoursePreview({ locale, course }: { locale: string; course: YemaChildCourseContent }) {
  const base = `/${locale}/qa/child-course-preview`;
  const isRacines = course.course.track === "racines";
  return (
    <main className={styles.page} data-universe={isRacines ? "racines" : "monde"}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}><span className={styles.brandMark}>Y</span> YEMA KIDS</Link>
          <Link className={styles.back} href={base}>← Aventures</Link>
        </header>
        <div className={styles.statusMini}>🧪 {statusLabel(course.status)}</div>
        <section className={styles.gameHero}>
          <div>
            <p className={styles.kicker}>{isRacines ? "🌿 RACINES" : "🚀 MONDE"} · {frameworkLabel(course)} · {course.course.ageRange} ANS</p>
            <h1>{course.course.shortTitle || course.course.title}</h1>
            <p>{course.course.description}</p>
            <div className={styles.gameStats}>
              <span>🗺️ {course.course.unitCount} missions</span>
              <span>⚡ {course.course.estimatedTotalMinutes} min</span>
              <span>🎯 4–7 min</span>
            </div>
          </div>
          <div className={styles.guide} aria-hidden="true"><span>{isRacines ? "🌟" : "★"}</span></div>
        </section>
        <div className={styles.sequenceRibbon}>{course.course.signatureSequence.map((stage, index) => <span key={stage}><b>{index + 1}</b>{stage}</span>)}</div>
        <ChildMissionPath locale={locale} courseId={course.course.id} units={course.units} />
      </div>
    </main>
  );
}

export function ChildUnitPreview({ locale, course, unit }: { locale: string; course: YemaChildCourseContent; unit: ChildUnit }) {
  const base = `/${locale}/qa/child-course-preview/${course.course.id}`;
  const isRacines = course.course.track === "racines";
  return (
    <main className={styles.page} data-universe={isRacines ? "racines" : "monde"}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}><span className={styles.brandMark}>Y</span> YEMA KIDS</Link>
          <Link className={styles.back} href={base}>← Chemin</Link>
        </header>
        <section className={styles.unitHero}>
          <div className={styles.unitNumber}>{unit.order}</div>
          <div>
            <p className={styles.kicker}>MISSION {unit.order} · {frameworkLabel(course)}</p>
            <h1>{unit.title}</h1>
            <p>{unit.mission}</p>
          </div>
        </section>
        <section className={styles.storyCard}>
          <div className={styles.storyIcon}>🔊</div>
          <div>
            <p className={styles.kicker}>LA SCÈNE DE LA MISSION</p>
            <h2>{unit.audioScene.title}</h2>
            <p>{unit.audioScene.context}</p>
          </div>
          <div className={styles.dialogue}>
            {unit.audioScene.lines.map((line, index) => (
              <div className={styles.line} key={`${line.speaker}-${index}`}>
                <strong>{line.target}</strong>
                <span>{line.fr}</span>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.stagePath}>
          <div className={styles.pathHeader}><div><p className={styles.kicker}>4 PETITES ÉTAPES</p><h2>Traverse la mission</h2></div><span className={styles.pathScore}>+ ⭐</span></div>
          {unit.lessons.map((lesson, index) => (
            <Link className={styles.stageCard} href={`${base}/${unit.id}/${lesson.id}`} key={lesson.id}>
              <span className={styles.stageNumber}>{index + 1}</span>
              <div><strong>{lesson.stage}</strong><small>{lesson.title} · {lesson.durationMinutes} min</small></div>
              <span className={styles.stagePlay}>▶</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

// Production release marker: forces the Git-integrated Vercel build for the game-first child experience.
export const CHILD_GAME_PRODUCTION_RELEASE = "2026-08-07T13:39+02:00";
