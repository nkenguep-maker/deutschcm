// P1 · /decouverte/bilan · récapitulatif honnête post-découverte.
// Doctrine §18 : uniquement données réelles issues de la DB.

import { redirect, Link } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LANGUAGES, prismaLangToId, DISCOVERY_TOTAL } from "@/lib/discovery";
import { readAnswers, deriveFunnelStep, nextFunnelHref } from "@/lib/funnel-state";

interface Props { params: Promise<{ locale: string }> }

export default async function DiscoveryBilan({ params }: Props) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id }, select: { id: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding", locale }); return null; }

  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!lp) { redirect({ href: "/onboarding", locale }); return null; }

  const answers = readAnswers(lp);
  const progress = answers.discoveryProgress ?? [];
  if (progress.length < DISCOVERY_TOTAL) {
    // Redirige vers la première leçon non-terminée
    const step = deriveFunnelStep({ hasSupabaseUser: true, learningPath: lp, hasActiveAccessGrant: false });
    redirect({ href: nextFunnelHref(step, { hasSupabaseUser: true, learningPath: lp, hasActiveAccessGrant: false }), locale });
    return null;
  }

  const langId = prismaLangToId(lp.language);
  const langMeta = langId ? LANGUAGES.find((l) => l.id === langId) : null;
  const langName = langMeta ? (loc === "en" ? langMeta.nameEn : langMeta.nameFr) : "";
  const level = lp.currentLevel ?? answers.cefrSelfAssessed ?? answers.racinesStep ?? null;
  const isMonde = lp.universe === "MONDE";

  const copy = {
    fr: {
      eye: "Le seuil est franchi.",
      title: langName ? `Tu as terminé les quatre cours de découverte en ${langName.toLowerCase()}.` : "Tu as terminé les quatre cours de découverte.",
      sub: "Voici où tu en es. Tu peux maintenant choisir comment continuer.",
      universeLabel: "Univers",
      universeMonde: "Monde · le voyage",
      universeRacines: "Racines · la maison",
      langLabel: "Langue",
      levelLabel: isMonde ? "Niveau de départ recommandé" : "Étape Racines",
      lessonsLabel: "Cours terminés",
      lessonsValue: `${DISCOVERY_TOTAL} sur ${DISCOVERY_TOTAL}`,
      cta: "Découvrir les offres",
      changeLevel: "Corriger mon niveau",
    },
    en: {
      eye: "The threshold is crossed.",
      title: langName ? `You've finished the four discovery lessons in ${langName}.` : "You've finished the four discovery lessons.",
      sub: "Here's where you are. You can now choose how to continue.",
      universeLabel: "Universe",
      universeMonde: "World · the journey",
      universeRacines: "Roots · the home",
      langLabel: "Language",
      levelLabel: isMonde ? "Recommended starting level" : "Racines step",
      lessonsLabel: "Lessons completed",
      lessonsValue: `${DISCOVERY_TOTAL} of ${DISCOVERY_TOTAL}`,
      cta: "See the offers",
      changeLevel: "Change my level",
    },
  } as const;
  const c = copy[loc];

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 16px 96px" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{
          margin: "0 0 8px", color: "var(--brass)",
          fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>{c.eye}</p>
        <h1 style={{
          fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic",
          fontSize: 26, color: "var(--creme)", margin: "0 0 8px", lineHeight: 1.25,
        }}>{c.title}</h1>
        <p style={{ color: "var(--creme-mute)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>{c.sub}</p>
      </header>

      <dl style={{
        display: "grid", gridTemplateColumns: "minmax(0,auto) minmax(0,1fr)",
        gap: "10px 16px", padding: "16px 20px", background: "var(--espresso-2)",
        border: "1px solid var(--creme-hair)", borderRadius: 14, margin: "0 0 24px",
        fontSize: 13,
      }}>
        <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.universeLabel}</dt>
        <dd style={{ color: "var(--creme-soft)", margin: 0 }}>{isMonde ? c.universeMonde : c.universeRacines}</dd>
        <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.langLabel}</dt>
        <dd style={{ color: "var(--creme-soft)", margin: 0 }}>{langName || "—"}</dd>
        <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.levelLabel}</dt>
        <dd style={{ color: "var(--creme)", margin: 0, fontWeight: 600 }}>{level ?? "—"}</dd>
        <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.lessonsLabel}</dt>
        <dd style={{ color: "var(--brass)", margin: 0, fontWeight: 600 }}>{c.lessonsValue}</dd>
      </dl>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/activation-intent" className="entry-cta entry-cta-primary" style={{ minHeight: 48 }}>
          {c.cta}
        </Link>
        <Link href="/onboarding" style={{ color: "var(--creme-mute)", fontSize: 13, textDecoration: "underline", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          {c.changeLevel}
        </Link>
      </div>
    </main>
  );
}
