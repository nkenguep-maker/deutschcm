import { notFound } from "next/navigation";
import refonte from "@/data/courses/monde/adulte/de-a1-refonte/u1.json";
import type { GermanA1RefonteUnit } from "@/data/courses/monde/adulte/de-a1-refonte/types";
import { A1RefonteLessonPreview } from "@/features/course-experience/A1RefonteLessonPreview";

const data = refonte as unknown as GermanA1RefonteUnit;

export const dynamic = "force-dynamic";

export default async function A1RefonteLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { lessonId } = await params;
  const lesson = data.lessons.find((item) => item.id === lessonId);
  if (!lesson) notFound();
  return <A1RefonteLessonPreview lesson={lesson} />;
}
