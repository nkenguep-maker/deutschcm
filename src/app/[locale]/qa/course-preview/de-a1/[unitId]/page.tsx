import { notFound } from "next/navigation";
import { DE_A1_COURSE, getCourseUnit } from "@/data/courses/registry";
import { UnitOverview } from "@/features/course-experience/UnitOverview";

export const dynamic = "force-dynamic";

export default async function GermanA1UnitPreview({ params }: { params: Promise<{ locale: string; unitId: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale, unitId } = await params;
  const unit = getCourseUnit(DE_A1_COURSE.course.id, unitId);
  if (!unit) notFound();
  const baseHref = `/${locale}/qa/course-preview/de-a1`;
  return <UnitOverview course={DE_A1_COURSE} unit={unit} progress={[]} accessStatus="ACTIVE" locale={locale} baseHref={baseHref} unlockAll />;
}
