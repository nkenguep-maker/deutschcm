// /[locale]/onboarding · router server component.
//
// Rôle : aiguiller un utilisateur authentifié non-onboardé vers le bon
// tunnel (/monde ou /racines) en s'appuyant sur les signaux disponibles,
// dans cet ordre :
//   1. user_metadata.universe (écrit par /register?universe=...)
//   2. le learning_path le plus récent de l'user (source de vérité v1)
//   3. rien de connu → écran de choix minimal (2 portes)
//
// Le middleware envoie ici tout STUDENT non-onboardé qui essaie /dashboard
// ou une route STUDENT protégée. On ne renvoie JAMAIS sur /pricing depuis
// ici : /pricing est une décision commerciale, /onboarding est un tunnel
// technique de finalisation.

import { redirect } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BrandY } from "@/components/brand/BrandY";
import { getTranslations } from "next-intl/server";
import { deriveFunnelStep, nextFunnelHref, readAnswers } from "@/lib/funnel-state";
import { isLanguageActive, prismaLangToId } from "@/lib/discovery";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingRouterPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Le middleware garantit qu'on est auth'd, mais ceinture + bretelles :
  // si on arrive ici anon, on renvoie sur /login (chemin nu via next-intl).
  if (!user) {
    redirect({ href: "/login", locale });
    return null; // narrow type — redirect() ne retourne pas mais TS ne le sait pas
  }

  // 1) Signal learning_paths (source de vérité) + état complet du funnel P1.
  //    Doit être évalué AVANT le fallback metadata pour ne pas court-circuiter
  //    la reprise · un user avec un LP a passé le stade « choix univers ».
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true },
  });
  if (dbUser) {
    const path = await prisma.learningPath.findFirst({
      where: { userId: dbUser.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    // Grant actif = activation payée (bénéficiaire = user ou learning path).
    // Aucun grant accordé par le funnel P1 lui-même.
    const grantCount = await prisma.accessGrant.count({
      where: {
        status: "ACTIVE",
        OR: [
          { beneficiaryType: "USER", beneficiaryId: dbUser.id },
          ...(path ? [{ beneficiaryType: "LEARNING_PATH" as const, beneficiaryId: path.id }] : []),
        ],
      },
    });
    const step = deriveFunnelStep({
      hasSupabaseUser: true,
      learningPath: path,
      hasActiveAccessGrant: grantCount > 0,
    });
    // Cas particulier · si la langue choisie n'est pas encore active (pas de
    // contenu de découverte), on l'envoie sur l'écran d'attente honnête plutôt
    // que sur une leçon vide.
    if (path && (step === "SELF_ASSESSED" || step === "DISCOVERY_STARTED")) {
      const langId = prismaLangToId(path.language);
      if (!langId || !isLanguageActive(langId)) {
        redirect({ href: "/decouverte/attente", locale });
        return null;
      }
    }
    // Onboarding form pas fini · on repointe sur le formulaire d'univers.
    if (step === "ACCOUNT_READY" || step === "UNIVERSE_SELECTED" || step === "LANGUAGE_SELECTED") {
      if (path?.universe === "MONDE") redirect({ href: "/onboarding/monde", locale });
      if (path?.universe === "RACINES") redirect({ href: "/onboarding/racines", locale });
    } else {
      // SELF_ASSESSED / DISCOVERY_STARTED / DISCOVERY_COMPLETED / ACTIVATION_SELECTED / ACTIVATED
      const dest = nextFunnelHref(step, {
        hasSupabaseUser: true,
        learningPath: path,
        hasActiveAccessGrant: grantCount > 0,
      });
      redirect({ href: dest, locale });
      return null;
    }
  }
  // 2) Aucun LP · fallback sur user_metadata.universe (écrit par
  //    /register?universe=...) puis, à défaut, sur l'écran de choix.
  const metaUniverse = (user.user_metadata?.universe as string | undefined)?.toLowerCase();
  if (metaUniverse === "monde") { redirect({ href: "/onboarding/monde", locale }); return null; }
  if (metaUniverse === "racines") { redirect({ href: "/onboarding/racines", locale }); return null; }

  // Empêche l'accès aux variables non utilisées côté TS
  void readAnswers;

  // 3) Rien de connu → écran de choix minimal (deux portes du seuil).
  //    Volontairement sobre : pas de tarifs, pas de baratin — c'est un
  //    tunnel de finalisation, pas une page marketing.
  const t = await getTranslations("onboarding.router");
  return (
    <main className="onboarding-router">
      <header className="onboarding-router-head">
        <BrandY variant="world" state="static" size={80} ariaLabel={t("brand_aria")} />
        <h1 className="onboarding-router-titre">{t("titre")}</h1>
        <p className="onboarding-router-sous">{t("sous_titre")}</p>
      </header>
      <div className="onboarding-router-portes">
        <Link href="/onboarding/monde" className="onboarding-router-porte onboarding-router-porte-monde">
          <span className="onboarding-router-porte-eyebrow">{t("porte_monde_eyebrow")}</span>
          <span className="onboarding-router-porte-titre">{t("porte_monde_titre")}</span>
          <span className="onboarding-router-porte-body">{t("porte_monde_body")}</span>
        </Link>
        <Link href="/onboarding/racines" className="onboarding-router-porte onboarding-router-porte-sources">
          <span className="onboarding-router-porte-eyebrow">{t("porte_racines_eyebrow")}</span>
          <span className="onboarding-router-porte-titre">{t("porte_racines_titre")}</span>
          <span className="onboarding-router-porte-body">{t("porte_racines_body")}</span>
        </Link>
      </div>
    </main>
  );
}
