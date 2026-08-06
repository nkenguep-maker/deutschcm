import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContent, getCourseLesson, getCourseLessonById, getCourseUnit, getNextCourseLesson } from "@/data/courses/registry";
import { loadCourseViewer } from "@/lib/course-content/server";
import { AudioLessonExperience } from "@/features/course-experience/AudioLessonExperience";
import styles from "@/features/course-experience/CourseExperience.module.css";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string; lessonId: string }> }) {
  const { locale, courseId, unitId, lessonId } = await params;
  const course = getCourseContent(courseId);
  const unit = getCourseUnit(courseId, unitId);
  const lesson = getCourseLesson(courseId, unitId, lessonId);
  if (!course || !unit || !lesson) notFound();

  const viewer = await loadCourseViewer(courseId, locale);
  const completed = new Set(viewer.progress.filter((item) => item.status === "COMPLETED").map((item) => item.moduleId));
  const currentProgress = viewer.progress.find((item) => item.moduleId === lessonId) ?? null;
  const flat = course.units.flatMap((courseUnit) => courseUnit.lessons.map((courseLesson) => ({ unit: courseUnit, lesson: courseLesson })));
  const requestedIndex = flat.findIndex((item) => item.lesson.id === lessonId);
  const firstIncompleteIndex = flat.findIndex((item) => !completed.has(item.lesson.id));
  const locked = viewer.accessStatus !== "ACTIVE" || (!completed.has(lessonId) && firstIncompleteIndex >= 0 && requestedIndex > firstIncompleteIndex);

  if (locked) {
    const current = firstIncompleteIndex >= 0 ? flat[firstIncompleteIndex] : null;
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.topbar}>
            <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
            <Link className={styles.back} href={`/${locale}/learn/${courseId}/${unitId}`}>← Retour à l’unité</Link>
          </header>
          <section className={styles.state}>
            <div className={styles.eyebrow}>{viewer.accessStatus === "ACTIVE" ? "Module verrouillé" : "Accès au cours requis"}</div>
            <h1 className={styles.sectionTitle}>{viewer.accessStatus === "ACTIVE" ? course.globalUiTexts.lockedMessage : "Active ton accès pour commencer ce parcours."}</h1>
            {viewer.accessStatus === "ACTIVE" && current ? <Link className={styles.primary} href={`/${locale}/learn/${courseId}/${current.unit.id}/${current.lesson.id}`}>Continuer la leçon actuelle</Link> : <Link className={styles.primary} href={`/${locale}/offers`}>Voir les offres</Link>}
          </section>
        </div>
      </main>
    );
  }

  const next = getNextCourseLesson(courseId, lessonId);
  const resolved = getCourseLessonById(courseId, lessonId);
  if (!resolved) notFound();
  return (
    <AudioLessonExperience
      course={course}
      unit={unit}
      lesson={lesson}
      locale={locale}
      alreadyCompleted={completed.has(lessonId)}
      initialScore={currentProgress?.score ?? null}
      accessActive={viewer.accessStatus === "ACTIVE"}
      nextLesson={next ? { unitId: next.unit.id, lessonId: next.lesson.id, title: next.lesson.title } : null}
    />
  );
}
