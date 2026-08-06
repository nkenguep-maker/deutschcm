import { notFound } from "next/navigation";
import { getCourseContent } from "@/data/courses/registry";
import { loadCourseViewer } from "@/lib/course-content/server";
import { CourseOverview } from "@/features/course-experience/CourseOverview";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId } = await params;
  const course = getCourseContent(courseId);
  if (!course) notFound();
  const viewer = await loadCourseViewer(courseId, locale);
  return <CourseOverview course={course} progress={viewer.progress} accessStatus={viewer.accessStatus} locale={locale} />;
}
