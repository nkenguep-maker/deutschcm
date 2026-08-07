import { notFound } from "next/navigation";
import { getChildCourse } from "@/content/child-courses";
import { ChildCoursePreview } from "@/features/child-course-experience/ChildPreviewViews";

export const dynamic = "force-dynamic";

export default async function ChildCoursePage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId } = await params;
  const course = getChildCourse(courseId);
  if (!course) notFound();
  return <ChildCoursePreview locale={locale} course={course} />;
}
