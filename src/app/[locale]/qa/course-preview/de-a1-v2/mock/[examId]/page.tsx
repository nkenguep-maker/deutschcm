import { notFound } from "next/navigation";
import { getA1V2MockExam } from "@/content/monde-a1-v2/mock-exams";
import { A1V2MockExamPreview } from "@/features/course-experience/a1-v2/A1V2MockExamPreview";

export const dynamic = "force-dynamic";

export default async function A1V2MockExamPage({ params }: { params: Promise<{ locale: string; examId: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale, examId } = await params;
  const exam = getA1V2MockExam(examId);
  if (!exam) notFound();
  return <A1V2MockExamPreview exam={exam} locale={locale} />;
}
