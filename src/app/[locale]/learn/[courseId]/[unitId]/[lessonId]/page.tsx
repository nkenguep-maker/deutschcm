import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseContent, getCourseLesson, getCourseLessonById, getCourseUnit, getNextCourseLesson } from "@/data/courses/registry";
import { loadCourseViewer } from "@/lib/course-content/server";
import { resolveCourseLessonForPathway, resolveCourseUnitForPathway } from "@/lib/course-content/pathway";
import { AudioLessonExperience } from "@/features/course-experience/AudioLessonExperience";
import styles from "@/features/course-experience/CourseExperience.module.css";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string; lessonId: string }> }) {
  const { locale, courseId, unitId, lessonId } = await params;
  const course = getCourseContent(courseId);
  const unit = getCourseUnit(courseId, unitId);
  const lesson = getCourseLesson(courseId, unitId, lessonId);
  if (!course || !unit || !lesson) notFound();

  const viewer = await loadCourseViewer(
    courseId,
    locale,
    `/${locale}/learn/${courseId}/${unitId}/${lessonId}`,
  );
  const completed = new Set(viewer.progress.filter((item) => item.status === "COMPLETED").map((item) => item.moduleId));
  const currentProgress = viewer.progress.find((item) => item.moduleId === lessonId) ?? null;
  const flat = course.units.flatMap((courseUnit) => courseUnit.lessons.map((courseLesson) => ({ unit: courseUnit, lesson: courseLesson })));
  const requestedIndex = flat.findIndex((item) => item.lesson.id === lessonId);
  const firstIncompleteIndex = flat.findIndex((item) => !completed.has(item.lesson.id));
  const locked = viewer.accessStatus !== "ACTIVE" || (!completed.has(lessonId) && firstIncompleteIndex >= 0 && requestedIndex > firstIncompleteIndex);

  if (locked) {
    const current = firstIncompleteIndex >= 0 ? flat[firstIncompleteIndex] : null;
    const accessActive = viewer.accessStatus === "ACTIVE";
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.topbar}>
            <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
            <Link className={styles.back} href={`/${locale}/learn/${courseId}/${unitId}`}>← Retour à l’unité</Link>
          </header>
          <section className={styles.state}>
            <div className={styles.eyebrow}>{accessActive ? "Module verrouillé" : "Cours pas encore ouvert"}</div>
            <h1 className={styles.sectionTitle}>
              {accessActive
                ? course.globalUiTexts.lockedMessage
                : "Ce parcours n’est pas encore ouvert pour ce profil dans la bêta technique."}
            </h1>
            {accessActive && current ? (
              <Link className={styles.primary} href={`/${locale}/learn/${courseId}/${current.unit.id}/${current.lesson.id}`}>
                Continuer la leçon actuelle
              </Link>
            ) : (
              <Link className={styles.primary} href={`/${locale}/dashboard/view/mon-cours`}>
                Retour à mon cours
              </Link>
            )}
          </section>
        </div>
      </main>
    );
  }

  const next = getNextCourseLesson(courseId, lessonId);
  const resolved = getCourseLessonById(courseId, lessonId);
  if (!resolved) notFound();
  const resolvedUnit = resolveCourseUnitForPathway(unit, viewer.pathwayVariant);
  const resolvedLesson = resolveCourseLessonForPathway(lesson, viewer.pathwayVariant);
  return (
    <AudioLessonExperience
      course={course}
      unit={resolvedUnit}
      lesson={resolvedLesson}
      locale={locale}
      alreadyCompleted={completed.has(lessonId)}
      initialScore={currentProgress?.score ?? null}
      accessActive={viewer.accessStatus === "ACTIVE"}
      nextLesson={next ? { unitId: next.unit.id, lessonId: next.lesson.id, title: next.lesson.title } : null}
    />
  );
}
