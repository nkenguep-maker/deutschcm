import { lingalaE1, medumbaE1 } from "@/content/racines-e1-solo";
import { RacinesPilotLanding } from "@/features/racines-course-experience/RacinesPreviewViews";

export const dynamic = "force-dynamic";

export default async function RacinesPilotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <RacinesPilotLanding locale={locale} courses={[medumbaE1, lingalaE1]} />;
}
