// P1 · /decouverte · router qui envoie sur la bonne leçon ou le bilan.
// Ne rend rien lui-même — c'est un aiguilleur serveur.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { deriveFunnelStep, nextFunnelHref } from "@/lib/funnel-state";
import { isLanguageActive, prismaLangToId } from "@/lib/discovery";

interface Props { params: Promise<{ locale: string }> }

export default async function DecouverteRouter({ params }: Props) {
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
  });
  if (!lp) { redirect({ href: "/onboarding", locale }); return null; }

  const grantCount = await prisma.accessGrant.count({
    where: {
      status: "ACTIVE",
      OR: [
        { beneficiaryType: "USER", beneficiaryId: dbUser.id },
        { beneficiaryType: "LEARNING_PATH", beneficiaryId: lp.id },
      ],
    },
  });

  const langId = prismaLangToId(lp.language);
  if (!langId || !isLanguageActive(langId)) {
    redirect({ href: "/decouverte/attente", locale });
    return null;
  }

  const step = deriveFunnelStep({
    hasSupabaseUser: true,
    learningPath: lp,
    hasActiveAccessGrant: grantCount > 0,
  });
  redirect({ href: nextFunnelHref(step, { hasSupabaseUser: true, learningPath: lp, hasActiveAccessGrant: grantCount > 0 }), locale });
  return null;
}
