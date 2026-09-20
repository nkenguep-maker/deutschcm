import { notFound } from "next/navigation";
import { A1V2Overview } from "@/features/course-experience/a1-v2/A1V2Overview";

export const dynamic = "force-dynamic";

export default async function A1V2PreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { locale } = await params;
  return <A1V2Overview locale={locale} />;
}
