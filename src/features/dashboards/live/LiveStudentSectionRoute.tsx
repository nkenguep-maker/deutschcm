import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isYemaDashboardRedesignActive } from "@/lib/flags";
import { resolveActiveChildSession } from "@/lib/family/childResolvers";
import { hasInternalTestMarker } from "@/lib/internalTestProvisioning";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { StudentMondeDashboard } from "@/features/dashboards/student-monde";
import { StudentRacinesDashboard } from "@/features/dashboards/student-racines";
import { ChildMondeDashboard } from "@/features/dashboards/child-monde";
import { ChildRacinesDashboard } from "@/features/dashboards/child-racines";

export async function LiveStudentSectionRoute({ locale, sectionId }: { locale: string; sectionId: string }) {
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const internalPersona = await resolveActiveInternalPersona(["student_monde", "student_racines", "child_monde", "child_racines"]);
  if (internalPersona) return <InternalPersonaDashboard persona={internalPersona} locale={loc} activeSectionId={sectionId} />;

  const childSession = await resolveActiveChildSession();
  if (childSession) {
    const child = {
      childProfileId: childSession.childProfileId,
      prenom: childSession.prenom,
      avatarAnimal: childSession.avatarAnimal,
      age: childSession.age,
      activeLangue: childSession.activeLangue,
      langues: (childSession.langues as unknown[])
        .filter((item): item is { langue: string; type: "native" | "foreign"; echelle: number; etoiles: number } => typeof item === "object" && item !== null)
        .map((item) => ({
          langue: String((item as { langue?: unknown }).langue ?? ""),
          type: ((item as { type?: unknown }).type === "native" ? "native" : "foreign") as "native" | "foreign",
          echelle: Number((item as { echelle?: unknown }).echelle ?? 0),
          etoiles: Number((item as { etoiles?: unknown }).etoiles ?? 0),
        })),
    };
    return childSession.universe === "RACINES"
      ? <ChildRacinesDashboard locale={loc} child={child} activeSectionId={sectionId} />
      : <ChildMondeDashboard locale={loc} child={child} activeSectionId={sectionId} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } });
  if (!dbUser) redirect(`/${locale}/onboarding`);
  const paths = await prisma.learningPath.findMany({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { universe: true, onboardingAnswers: true },
  });
  const path = paths.find((item) => !hasInternalTestMarker(item.onboardingAnswers)) ?? paths[0];
  if (!path) redirect(`/${locale}/onboarding`);
  if (!isYemaDashboardRedesignActive()) redirect(`/${locale}/dashboard`);
  return path.universe === "MONDE"
    ? <StudentMondeDashboard locale={loc} activeSectionId={sectionId} />
    : <StudentRacinesDashboard locale={loc} activeSectionId={sectionId} />;
}
