import { notFound, redirect } from "next/navigation";
import { getCourseContent, getCourseLessonIds } from "@/data/courses/registry";
import { loadCourseViewer } from "@/lib/course-content/server";
import { CourseCompletion } from "@/features/course-experience/CourseCompletion";

export const dynamic = "force-dynamic";

export default async function CourseCompletionPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;
  const course = getCourseContent(courseId);
  if (!course) notFound();

  const viewer = await loadCourseViewer(
    courseId,
    locale,
    `/${locale}/learn/${courseId}/complete`,
  );
  const expected = new Set(getCourseLessonIds(courseId));
  const completed = new Set(
    viewer.progress
      .filter((item) => item.status === "COMPLETED")
      .map((item) => item.moduleId),
  );
  const finished = expected.size > 0 && [...expected].every((id) => completed.has(id));
  if (!finished) redirect(`/${locale}/learn/${courseId}`);

  return <CourseCompletion course={course} progress={viewer.progress} locale={locale} />;
}
