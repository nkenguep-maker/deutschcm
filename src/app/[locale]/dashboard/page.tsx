// /dashboard · student dashboard dispatcher.
// Child sessions and P-1 internal personas are resolved first. Adult accounts
// are then checked against the canonical persona runtime so Family, Coach,
// Teacher, Center and Admin never fall through to an unrelated learner space.

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
import { InternalPersonaDashboard } from "@/features/dashboards/internal-test/InternalPersonaDashboard";
import { resolveActiveInternalPersona } from "@/lib/internalPersonaPage";
import {
  INTERNAL_TEST_COOKIE_NAME,
  isInternalPersonaId,
  isInternalTesterEmail,
} from "@/lib/internalTest";
import { hasInternalTestMarker } from "@/lib/internalTestProvisioning";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

interface Props { params: Promise<{ locale: string }> }

function PersonaBoundary({ persona, children }: { persona: string; children: React.ReactNode }) {
  return <div data-yema-persona={persona}>{children}</div>;
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  const internalPersona = await resolveActiveInternalPersona([
    "student_monde",
    "student_racines",
    "child_monde",
    "child_racines",
  ]);
  if (internalPersona) {
    return (
      <PersonaBoundary persona={internalPersona}>
        <InternalPersonaDashboard persona={internalPersona} locale={loc} />
      </PersonaBoundary>
    );
  }

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
      return (
        <PersonaBoundary persona="child_racines">
          <ChildRacinesDashboard locale={loc} child={childData} />
        </PersonaBoundary>
      );
    }
    return (
      <PersonaBoundary persona="child_monde">
        <ChildMondeDashboard locale={loc} child={childData} />
      </PersonaBoundary>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });
  if (runtime.persona && runtime.persona !== "student_monde" && runtime.persona !== "student_racines") {
    redirect({ href: runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute, locale });
    return null;
  }
  if (runtime.persona && !runtime.onboarded) {
    redirect({ href: runtime.onboardingRoute, locale });
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding/persona", locale }); return null; }

  const paths = await prisma.learningPath.findMany({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { universe: true, onboardingAnswers: true },
  });

  const jar = await cookies();
  const rawPersona = jar.get(INTERNAL_TEST_COOKIE_NAME)?.value;
  const persona = isInternalPersonaId(rawPersona) ? rawPersona : null;
  const internalOwner = isInternalTesterEmail(user.email);
  const internalRequestedUniverse =
    internalOwner && persona === "student_monde" ? "MONDE" :
    internalOwner && persona === "student_racines" ? "RACINES" :
    null;
  const runtimeUniverse =
    runtime.persona === "student_monde" || runtime.persona === "student_racines"
      ? runtime.universe
      : null;
  const requestedUniverse = internalRequestedUniverse ?? runtimeUniverse;
  const internalSelection = internalRequestedUniverse !== null;

  const lp = requestedUniverse
    ? internalSelection
      ? paths.find((path) => path.universe === requestedUniverse && hasInternalTestMarker(path.onboardingAnswers))
        ?? paths.find((path) => path.universe === requestedUniverse)
      : paths.find((path) => path.universe === requestedUniverse && !hasInternalTestMarker(path.onboardingAnswers))
        ?? paths.find((path) => path.universe === requestedUniverse)
    : paths.find((path) => !hasInternalTestMarker(path.onboardingAnswers)) ?? paths[0];

  if (!lp) { redirect({ href: "/onboarding/persona", locale }); return null; }

  const useRedesign = isYemaDashboardRedesignActive();
  if (lp.universe === "MONDE") {
    if (useRedesign) {
      return (
        <PersonaBoundary persona="student_monde">
          <StudentMondeDashboard locale={loc} />
        </PersonaBoundary>
      );
    }
    return (
      <PersonaBoundary persona="student_monde">
        <Layout title="Monde">
          <DashboardMonde locale={loc} />
        </Layout>
      </PersonaBoundary>
    );
  }

  if (useRedesign) {
    return (
      <PersonaBoundary persona="student_racines">
        <StudentRacinesDashboard locale={loc} />
      </PersonaBoundary>
    );
  }
  return (
    <PersonaBoundary persona="student_racines">
      <Layout title={loc === "en" ? "Roots" : "Racines"}>
        <DashboardRacines locale={loc} />
      </Layout>
    </PersonaBoundary>
  );
}
