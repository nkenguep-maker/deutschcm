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
import Layout from "@/components/Layout";
import { DashboardMonde } from "@/components/monde/DashboardMonde";
import { DashboardRacines } from "@/components/racines/DashboardRacines";

interface Props { params: Promise<{ locale: string }> }

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
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

  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  if (lp.universe === "MONDE") {
    return (
      <Layout title="Monde">
        <DashboardMonde locale={loc} />
      </Layout>
    );
  }

  // Racines (P3)
  return (
    <Layout title={loc === "en" ? "Roots" : "Racines"}>
      <DashboardRacines locale={loc} />
    </Layout>
  );
}
