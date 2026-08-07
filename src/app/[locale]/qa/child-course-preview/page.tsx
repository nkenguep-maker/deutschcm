import { childCourses } from "@/content/child-courses";
import { ChildPilotLanding } from "@/features/child-course-experience/ChildPreviewViews";

export const dynamic = "force-dynamic";

export default async function ChildPilotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ChildPilotLanding locale={locale} courses={childCourses} />;
}
