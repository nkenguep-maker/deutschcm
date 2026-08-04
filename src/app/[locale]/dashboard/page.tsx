// /dashboard · aiguillage par univers (P2, étendu P3).
// Server component qui charge le LearningPath actif de l'utilisateur et
// route Monde / Racines. En mode test interne Production, le cookie persona
// choisit explicitement le parcours fixture du propriétaire sans modifier le
// parcours réel utilisé hors de ce mode.

import { cookies } from "next/headers";
import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isYemaDashboardRedesignActive } from "@/lib/flags";
import Layout from "@/components/Layout";
import { DashboardMonde } from "@/components/monde/DashboardMonde";
import { DashboardRacines } from "@/components/racines/DashboardRacines";
import { StudentMondeDashboard } from "@/features/dashboards/student-monde";
import { StudentRacinesDashboard } from "@/features/dashboards/student-racines";
import { resolveActiveChildSession } from "@/lib/family/childResolvers";
import { ChildMondeDashboard } from "@/features/dashboards/child-monde";
import { ChildRacinesDashboard } from "@/features/dashboards/child-racines";
import {
  INTERNAL_TEST_COOKIE_NAME,
  isInternalPersonaId,
  isInternalTesterEmail,
} from "@/lib/internalTest";
import { hasInternalTestMarker } from "@/lib/internalTestProvisioning";

interface Props { params: Promise<{ locale: string }> }

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  const childSession = await resolveActiveChildSession();
  if (childSession) {
    const childData = {
      childProfileId: childSession.childProfileId,
      prenom: childSession.prenom,
      avatarAnimal: childSession.avatarAnimal,
      age: childSession.age,
      activeLangue: childSession.activeLangue,
      langues: (childSession.langues as unknown[])
        .filter((x): x is { langue: string; type: "native" | "foreign"; echelle: number; etoiles: number } => {
          return typeof x === "object" && x !== null;
        })
        .map((x) => ({
          langue: String((x as { langue?: unknown }).langue ?? ""),
          type: ((x as { type?: unknown }).type === "native" ? "native" : "foreign") as "native" | "foreign",
          echelle: Number((x as { echelle?: unknown }).echelle ?? 0),
          etoiles: Number((x as { etoiles?: unknown }).etoiles ?? 0),
        })),
    };
    if (childSession.universe === "RACINES") {
      return <ChildRacinesDashboard locale={loc} child={childData} />;
    }
    return <ChildMondeDashboard locale={loc} child={childData} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding", locale }); return null; }

  const paths = await prisma.learningPath.findMany({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { universe: true, onboardingAnswers: true },
  });

  const jar = await cookies();
  const rawPersona = jar.get(INTERNAL_TEST_COOKIE_NAME)?.value;
  const persona = isInternalPersonaId(rawPersona) ? rawPersona : null;
  const internalOwner = isInternalTesterEmail(user.email);
  const requestedUniverse =
    internalOwner && persona === "student_monde" ? "MONDE" :
    internalOwner && persona === "student_racines" ? "RACINES" :
    null;

  const lp = requestedUniverse
    ? paths.find((path) => path.universe === requestedUniverse && hasInternalTestMarker(path.onboardingAnswers))
      ?? paths.find((path) => path.universe === requestedUniverse)
    : paths.find((path) => !hasInternalTestMarker(path.onboardingAnswers)) ?? paths[0];

  if (!lp) { redirect({ href: "/onboarding", locale }); return null; }

  const useRedesign = isYemaDashboardRedesignActive();

  if (lp.universe === "MONDE") {
    if (useRedesign) return <StudentMondeDashboard locale={loc} />;
    return (
      <Layout title="Monde">
        <DashboardMonde locale={loc} />
      </Layout>
    );
  }

  if (useRedesign) return <StudentRacinesDashboard locale={loc} />;
  return (
    <Layout title={loc === "en" ? "Roots" : "Racines"}>
      <DashboardRacines locale={loc} />
    </Layout>
  );
}
