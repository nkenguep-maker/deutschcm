import { notFound } from "next/navigation";
import { DE_A1_COURSE } from "@/data/courses/registry";
import { CourseOverview } from "@/features/course-experience/CourseOverview";

export const dynamic = "force-dynamic";

export default async function GermanA1CoursePreview({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale } = await params;
  const baseHref = `/${locale}/qa/course-preview/de-a1`;
  return <CourseOverview course={DE_A1_COURSE} progress={[]} accessStatus="ACTIVE" locale={locale} baseHref={baseHref} />;
}
