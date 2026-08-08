// /[locale]/onboarding · canonical authenticated onboarding router.
// Fresh accounts choose a persona first. Existing/in-progress learners resume
// their Monde/Racines funnel from the database without losing progress.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { deriveFunnelStep, nextFunnelHref } from "@/lib/funnel-state";
import { isLanguageActive, prismaLangToId } from "@/lib/discovery";
import { resolvePersonaRuntime } from "@/lib/personas/runtime";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingRouterPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });

  if (dbUser) {
    const path = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (path) {
      const grantCount = await prisma.accessGrant.count({
        where: {
          status: "ACTIVE",
          OR: [
            { beneficiaryType: "USER", beneficiaryId: dbUser.id },
            { beneficiaryType: "LEARNING_PATH", beneficiaryId: path.id },
          ],
        },
      });
      const step = deriveFunnelStep({
        hasSupabaseUser: true,
        learningPath: path,
        hasActiveAccessGrant: grantCount > 0,
      });

      if (step === "ACCOUNT_READY" || step === "UNIVERSE_SELECTED") {
        redirect({
          href: path.universe === "RACINES" ? "/onboarding/racines" : "/onboarding/monde",
          locale,
        });
        return null;
      }

      if (step === "SELF_ASSESSED" || step === "DISCOVERY_STARTED") {
        const langId = prismaLangToId(path.language);
        if (!langId || !isLanguageActive(langId)) {
          redirect({ href: "/decouverte/attente", locale });
          return null;
        }
      }

      redirect({
        href: nextFunnelHref(step, {
          hasSupabaseUser: true,
          learningPath: path,
          hasActiveAccessGrant: grantCount > 0,
        }),
        locale,
      });
      return null;
    }
  }

  // Existing profiles (family/professional) and pending requests are resolved
  // from trusted DB roles/app roles plus the non-authorizing persona preference.
  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });
  if (runtime.persona) {
    redirect({ href: runtime.onboardingRoute, locale });
    return null;
  }

  // Legacy register links may still carry an initial universe preference. Use
  // it only to pre-route a learner; authorization never trusts this metadata.
  const metaUniverse = (user.user_metadata?.universe as string | undefined)?.toLowerCase();
  if (metaUniverse === "monde") {
    redirect({ href: "/onboarding/monde", locale });
    return null;
  }
  if (metaUniverse === "racines") {
    redirect({ href: "/onboarding/racines", locale });
    return null;
  }

  redirect({ href: "/onboarding/persona", locale });
  return null;
}
