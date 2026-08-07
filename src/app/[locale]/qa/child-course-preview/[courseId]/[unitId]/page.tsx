import { notFound } from "next/navigation";
import { getChildCourse, getChildUnit } from "@/content/child-courses";
import { ChildUnitPreview } from "@/features/child-course-experience/ChildPreviewViews";

export const dynamic = "force-dynamic";

export default async function ChildUnitPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string }> }) {
  const { locale, courseId, unitId } = await params;
  const course = getChildCourse(courseId);
  const unit = getChildUnit(courseId, unitId);
  if (!course || !unit) notFound();
  return <ChildUnitPreview locale={locale} course={course} unit={unit} />;
}
