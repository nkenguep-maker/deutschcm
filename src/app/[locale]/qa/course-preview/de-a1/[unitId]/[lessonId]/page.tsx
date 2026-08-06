import { notFound } from "next/navigation";
import { DE_A1_COURSE, getCourseLesson, getCourseUnit, getNextCourseLesson } from "@/data/courses/registry";
import { LessonExperience } from "@/features/course-experience/LessonExperience";

export const dynamic = "force-dynamic";

export default async function GermanA1LessonPreview({ params }: { params: Promise<{ locale: string; unitId: string; lessonId: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale, unitId, lessonId } = await params;
  const unit = getCourseUnit(DE_A1_COURSE.course.id, unitId);
  const lesson = getCourseLesson(DE_A1_COURSE.course.id, unitId, lessonId);
  if (!unit || !lesson) notFound();
  const next = getNextCourseLesson(DE_A1_COURSE.course.id, lessonId);
  return (
    <LessonExperience
      course={DE_A1_COURSE}
      unit={unit}
      lesson={lesson}
      locale={locale}
      alreadyCompleted
      initialScore={100}
      accessActive
      nextLesson={next ? { unitId: next.unit.id, lessonId: next.lesson.id, title: next.lesson.title } : null}
    />
  );
}
