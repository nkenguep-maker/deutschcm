import { notFound } from "next/navigation";
import { getChildCourse, getChildLesson, getChildUnit, getNextChildLesson } from "@/content/child-courses";
import { ChildLessonPreview } from "@/features/child-course-experience/ChildLessonPreview";

export const dynamic = "force-dynamic";

export default async function ChildLessonPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string; lessonId: string }> }) {
  const { locale, courseId, unitId, lessonId } = await params;
  const course = getChildCourse(courseId);
  const unit = getChildUnit(courseId, unitId);
  const lesson = getChildLesson(courseId, unitId, lessonId);
  if (!course || !unit || !lesson) notFound();
  const next = getNextChildLesson(courseId, lessonId);
  return (
    <ChildLessonPreview
      locale={locale}
      course={course}
      unit={unit}
      lesson={lesson}
      nextLesson={next ? { unitId: next.unit.id, lessonId: next.lesson.id, title: next.lesson.title } : null}
    />
  );
}
