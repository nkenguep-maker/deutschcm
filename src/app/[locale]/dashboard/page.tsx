// /dashboard · aiguillage par univers (P2, étendu P3).
// Server component qui charge le LearningPath actif de l'utilisateur et
// route :
//   Monde   → <DashboardMonde />   (P2)
//   Racines → <DashboardRacines /> (P3 · nouvel espace, remplace le Foyer
//                                    universel qui restait un fallback)
//   sinon   → /onboarding (fallback funnel)
//
// Le middleware garantit que seul un rôle STUDENT arrive ici.

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

interface Props { params: Promise<{ locale: string }> }

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  // P4.6 Lot 5 · session enfant prioritaire · si le cookie enfant est
  // valide, on rend le dashboard enfant correspondant à l'univers du
  // ChildProfile. La session Supabase du responsable n'est PAS lue ici :
  // aucun parentUserId n'est exposé au client, aucune route adulte n'est
  // accessible pendant que le cookie enfant est actif.
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

  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { universe: true },
  });

  if (!lp) { redirect({ href: "/onboarding", locale }); return null; }

  // P4.6 · gate visuel refonte des dashboards. Flag off = comportement
  // byte-identique aux anciens dashboards. Aucune nouvelle route, aucune
  // modification de la redirection onboarding ni du resolver LearningPath.
  const useRedesign = isYemaDashboardRedesignActive();

  if (lp.universe === "MONDE") {
    if (useRedesign) {
      return <StudentMondeDashboard locale={loc} />;
    }
    return (
      <Layout title="Monde">
        <DashboardMonde locale={loc} />
      </Layout>
    );
  }

  // Racines (P3)
  if (useRedesign) {
    return <StudentRacinesDashboard locale={loc} />;
  }
  return (
    <Layout title={loc === "en" ? "Roots" : "Racines"}>
      <DashboardRacines locale={loc} />
    </Layout>
  );
}
