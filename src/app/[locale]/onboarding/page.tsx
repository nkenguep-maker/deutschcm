// /[locale]/onboarding · canonical authenticated onboarding router.
// Fresh accounts choose a persona first. Existing/in-progress learners resume
// their Monde/Racines funnel, while completed personas go straight home.

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

  // Resolve the trusted persona before looking at learner paths. Family,
  // Teacher, Coach, Center and Admin accounts may legitimately retain an old
  // Student/LearningPath history; that must never pull them back into Solo.
  const runtime = await resolvePersonaRuntime({
    supabaseId: user.id,
    requestedPersona: user.user_metadata?.requested_persona,
  });
  if (
    runtime.persona &&
    runtime.persona !== "student_monde" &&
    runtime.persona !== "student_racines"
  ) {
    redirect({ href: runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute, locale });
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: {
      id: true,
      userRoles: {
        where: { role: "STUDENT", status: "ACTIVE" },
        select: { onboarded: true },
        take: 1,
      },
    },
  });

  if (dbUser) {
    const selectedUniverse =
      runtime.persona === "student_monde" || runtime.persona === "student_racines"
        ? runtime.universe
        : null;
    const path = await prisma.learningPath.findFirst({
      where: {
        userId: dbUser.id,
        status: "ACTIVE",
        ...(selectedUniverse ? { universe: selectedUniverse } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (path) {
      // Once the Student persona has completed onboarding, this route is no
      // longer a discovery funnel entry. It is a stable return point that must
      // reopen the learner dashboard. Explicit level-test routes bypass this
      // router and remain available when the learner selected them.
      if (dbUser.userRoles[0]?.onboarded === true) {
        redirect({ href: "/dashboard", locale });
        return null;
      }

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

  if (runtime.persona) {
    redirect({ href: runtime.onboarded ? runtime.homeRoute : runtime.onboardingRoute, locale });
    return null;
  }

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
