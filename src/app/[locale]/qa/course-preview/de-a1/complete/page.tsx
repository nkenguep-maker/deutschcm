import { notFound } from "next/navigation";
import { DE_A1_COURSE, getCourseLessonIds } from "@/data/courses/registry";
import { CourseCompletion } from "@/features/course-experience/CourseCompletion";

export const dynamic = "force-dynamic";

export default async function GermanA1CompletionPreview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale } = await params;
  const progress = getCourseLessonIds(DE_A1_COURSE.course.id).map((moduleId) => ({
    moduleId,
    status: "COMPLETED" as const,
    score: 100,
    completedAt: new Date(0),
  }));

  return <CourseCompletion course={DE_A1_COURSE} progress={progress} locale={locale} />;
}
