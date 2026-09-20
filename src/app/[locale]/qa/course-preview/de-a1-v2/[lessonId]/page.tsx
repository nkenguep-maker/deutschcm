import { notFound } from "next/navigation";
import { getA1V2LessonContext } from "@/content/monde-a1-v2";
import { A1V2LessonPreview } from "@/features/course-experience/a1-v2/A1V2LessonPreview";

export const dynamic = "force-dynamic";

export default async function A1V2LessonPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; lessonId: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale, lessonId } = await params;
  const context = getA1V2LessonContext(lessonId);
  if (!context) notFound();
  return <A1V2LessonPreview unit={context.unit} lesson={context.lesson} locale={locale} />;
}
