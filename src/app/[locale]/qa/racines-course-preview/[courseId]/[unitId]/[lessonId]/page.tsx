import { notFound } from "next/navigation";
import { getNextRacinesLesson, getRacinesLesson, getRacinesSoloCourse, getRacinesUnit } from "@/content/racines-e1-solo";
import { RacinesLessonPreview } from "@/features/racines-course-experience/RacinesLessonPreview";

export const dynamic = "force-dynamic";

export default async function RacinesPilotLessonPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string; lessonId: string }> }) {
  const { locale, courseId, unitId, lessonId } = await params;
  const course = getRacinesSoloCourse(courseId);
  const unit = getRacinesUnit(courseId, unitId);
  const lesson = getRacinesLesson(courseId, unitId, lessonId);
  if (!course || !unit || !lesson) notFound();
  const next = getNextRacinesLesson(courseId, lessonId);
  return (
    <RacinesLessonPreview
      courseId={course.course.id}
      courseTitle={course.course.title}
      languageCode={course.course.learningLanguage.code}
      languageLabel={course.course.learningLanguage.labelFr}
      unit={unit}
      lesson={lesson}
      locale={locale}
      nextLesson={next ? { unitId: next.unit.id, lessonId: next.lesson.id, title: next.lesson.title } : null}
    />
  );
}
