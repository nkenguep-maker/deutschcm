import { notFound } from "next/navigation";
import { getRacinesSoloCourse, getRacinesUnit } from "@/content/racines-e1-solo";
import { RacinesUnitPreview } from "@/features/racines-course-experience/RacinesPreviewViews";

export const dynamic = "force-dynamic";

export default async function RacinesPilotUnitPage({ params }: { params: Promise<{ locale: string; courseId: string; unitId: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale, courseId, unitId } = await params;
  const course = getRacinesSoloCourse(courseId);
  const unit = getRacinesUnit(courseId, unitId);
  if (!course || !unit) notFound();
  return <RacinesUnitPreview locale={locale} course={course} unit={unit} />;
}
