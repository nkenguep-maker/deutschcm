import { notFound } from "next/navigation";
import { A1_V2_UNIT_1, getA1V2Lesson } from "@/content/monde-a1-v2";
import { A1V2LessonPreview } from "@/features/course-experience/a1-v2/A1V2LessonPreview";

export const dynamic = "force-dynamic";

export default async function A1V2LessonPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; lessonId: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale, lessonId } = await params;
  const lesson = getA1V2Lesson(lessonId);
  if (!lesson) notFound();
  return <A1V2LessonPreview unit={A1_V2_UNIT_1} lesson={lesson} locale={locale} />;
}
