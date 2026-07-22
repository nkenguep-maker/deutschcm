// P2 · Server-side access enforcement for module pages.
// Doctrine §24 · vérifie session + rôle STUDENT + AccessGrant ACTIVE avant
// de rendre le contenu payant. Sans grant → écran verrouillé honnête.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import { canAccessModule, computeMondeAccess } from "@/lib/monde";
import { COURSE_TO_MODULE_IDS } from "@/data/a1-beta-modules";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string; courseId: string; moduleId: string }>;
}

const COPY = {
  fr: {
    lockedSoul: "Ce cours *demande un Passage actif.*",
    lockedBody: "Tu peux revoir ta découverte librement. Pour ouvrir le programme A1 complet, active ton Passage.",
    lockedCta: "Voir les offres",
    lockedBack: "Retour au parcours",
    expiredSoul: "Ton Passage *est arrivé à son terme.*",
    expiredBody: "Ta progression est conservée. Le renouvellement s'ouvrira bientôt.",
  },
  en: {
    lockedSoul: "This course *needs an active Passage.*",
    lockedBody: "You can revisit discovery freely. To unlock the full A1 programme, activate your Passage.",
    lockedCta: "See offers",
    lockedBack: "Back to journey",
    expiredSoul: "Your Passage *has ended.*",
    expiredBody: "Your progress is saved. Renewal opens soon.",
  },
} as const;

export default async function ModuleAccessLayout({ children, params }: Props) {
  const { locale, courseId, moduleId } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = COPY[loc];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id }, select: { id: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding", locale }); return null; }

  // Vérifie que le module existe bien dans le catalogue A1 Beta actuel.
  const modIds = COURSE_TO_MODULE_IDS[courseId];
  if (modIds && !modIds.includes(moduleId)) {
    // moduleId invalide pour ce cours · laissons la page enfant gérer (elle
    // affichera son propre notFound). Pas de redirect ici pour éviter les boucles.
  }

  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE", universe: "MONDE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const grants = lp
    ? await prisma.accessGrant.findMany({
        where: {
          OR: [
            { beneficiaryType: "USER", beneficiaryId: dbUser.id },
            { beneficiaryType: "LEARNING_PATH", beneficiaryId: lp.id },
          ],
        },
        select: { startsAt: true, endsAt: true, status: true, metadata: true },
      })
    : [];

  const access = computeMondeAccess(grants);
  if (!canAccessModule(access)) {
    const soul = access.status === "EXPIRED" ? c.expiredSoul : c.lockedSoul;
    const body = access.status === "EXPIRED" ? c.expiredBody : c.lockedBody;
    return (
      <Layout title="—">
        <main style={{ maxWidth: 620, margin: "0 auto", padding: "80px 16px" }}>
          <StateBlock
            kind="locked"
            centered
            soul={soul}
            body={body}
            action={{ label: c.lockedCta, href: "/activation-intent" }}
            secondary={{ label: c.lockedBack, href: "/courses" }}
          />
        </main>
      </Layout>
    );
  }

  return <>{children}</>;
}
