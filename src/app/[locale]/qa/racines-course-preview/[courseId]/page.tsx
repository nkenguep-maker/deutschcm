import { notFound } from "next/navigation";
import { getRacinesSoloCourse } from "@/content/racines-e1-solo";
import { RacinesCoursePreview } from "@/features/racines-course-experience/RacinesPreviewViews";

export const dynamic = "force-dynamic";

export default async function RacinesPilotCoursePage({ params }: { params: Promise<{ locale: string; courseId: string }> }) {
  const { locale, courseId } = await params;
  const course = getRacinesSoloCourse(courseId);
  if (!course) notFound();
  return <RacinesCoursePreview locale={locale} course={course} />;
}
