import { notFound } from "next/navigation";
import { getCourseContent, getCourseUnit } from "@/data/courses/registry";
import { loadCourseViewer } from "@/lib/course-content/server";
import { UnitOverview } from "@/features/course-experience/UnitOverview";

export const dynamic = "force-dynamic";

export default async function UnitPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string }> }) {
  const { locale, courseId, unitId } = await params;
  const course = getCourseContent(courseId);
  const unit = getCourseUnit(courseId, unitId);
  if (!course || !unit) notFound();
  const viewer = await loadCourseViewer(courseId, locale);
  return <UnitOverview course={course} unit={unit} progress={viewer.progress} accessStatus={viewer.accessStatus} locale={locale} />;
}
