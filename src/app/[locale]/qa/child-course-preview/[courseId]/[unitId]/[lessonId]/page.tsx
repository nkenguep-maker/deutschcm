import { notFound } from "next/navigation";
import { ChildLessonPreview } from "@/features/child-course-experience/ChildLessonPreview";

export const dynamic = "force-dynamic";

export default async function ChildLessonPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string; lessonId: string }> }) {
  const { locale, courseId, unitId, lessonId } = await params;

  // Keep the large compressed child-course payloads out of module evaluation.
  // Next.js imports page modules while collecting route configuration during
  // `next build`; eagerly importing @/content/child-courses would inflate all
  // three payloads before any request is rendered and can make route
  // collection fail. Decode only when this force-dynamic QA page is requested.
  const {
    getChildCourse,
    getChildLesson,
    getChildUnit,
    getNextChildLesson,
  } = await import("@/content/child-courses");

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
