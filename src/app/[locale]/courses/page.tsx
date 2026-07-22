// /courses · catalogue Monde P2 · server component réel, honnête.
//
// Liste les 5 cours A1 (a1-beta-1..5) avec leur état basé sur ModuleProgress.
// A2-C1 restent "Bientôt disponible" (MONDE_LEVEL_AVAILABILITY).
// Racines · redirigé vers /dashboard (Foyer) — P3 y ajoutera un catalogue.

import { redirect, Link } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import {
  buildA1CourseList,
  computeMondeAccess,
  overallProgress,
  canAccessModule,
} from "@/lib/monde";
import { MONDE_LEVEL_AVAILABILITY } from "@/lib/discovery";

interface Props { params: Promise<{ locale: string }> }

const T = {
  fr: {
    title: "Mon parcours",
    subtitle: "Allemand A1 · cinq leçons pour poser les bases.",
    a1Kicker: "A1 · disponible",
    othersKicker: "Niveaux suivants",
    othersBody: "A2, B1, B2 et C1 ouvriront progressivement, à mesure que le contenu passe la relecture éditoriale.",
    othersSoon: "Bientôt disponible",
    lockedBanner: "Ton parcours de découverte est terminé. Active un Passage pour ouvrir les cinq leçons A1 complètes.",
    lockedCta: "Voir les offres",
    modulesOf: (a: number, b: number) => `${a} sur ${b} modules`,
    open: "Ouvrir",
    resume: "Reprendre",
    locked: "Verrouillé",
    completed: "Terminé",
    progressLbl: "Progression",
    empty: "Ton parcours Monde arrive après la découverte.",
    emptyCta: "Démarrer la découverte",
  },
  en: {
    title: "My journey",
    subtitle: "German A1 · five lessons to build the foundations.",
    a1Kicker: "A1 · available",
    othersKicker: "Next levels",
    othersBody: "A2, B1, B2 and C1 open progressively, once the content clears editorial review.",
    othersSoon: "Coming soon",
    lockedBanner: "Your discovery journey is complete. Activate a Passage to unlock the full five A1 lessons.",
    lockedCta: "See offers",
    modulesOf: (a: number, b: number) => `${a} of ${b} modules`,
    open: "Open",
    resume: "Resume",
    locked: "Locked",
    completed: "Completed",
    progressLbl: "Progress",
    empty: "Your Monde journey opens after discovery.",
    emptyCta: "Start discovery",
  },
} as const;

export default async function CoursesPage({ params }: Props) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = T[loc];

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

  if (!lp) {
    return (
      <Layout title={c.title}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 16px" }}>
          <StateBlock kind="empty" centered soul={c.empty} action={{ label: c.emptyCta, href: "/onboarding" }} />
        </main>
      </Layout>
    );
  }
  if (lp.universe !== "MONDE") { redirect({ href: "/dashboard", locale }); return null; }

  const grants = await prisma.accessGrant.findMany({
    where: {
      OR: [
        { beneficiaryType: "USER", beneficiaryId: dbUser.id },
        { beneficiaryType: "LEARNING_PATH", beneficiaryId: lp.id },
      ],
    },
    select: { startsAt: true, endsAt: true, status: true, metadata: true },
  });
  const access = computeMondeAccess(grants);
  const canAccess = canAccessModule(access);

  const progress = await prisma.moduleProgress.findMany({
    where: { userId: dbUser.id, moduleId: { startsWith: "a1-beta-" } },
    select: { moduleId: true, status: true },
  });
  const courses = buildA1CourseList(progress);
  const pct = overallProgress(courses);

  const OTHER_LEVELS: Array<keyof typeof MONDE_LEVEL_AVAILABILITY> = ["A2", "B1", "B2", "C1"];

  return (
    <Layout title={c.title}>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px 96px" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28,
            color: "var(--creme)", margin: "0 0 6px",
          }}>{c.title}</h1>
          <p style={{ color: "var(--creme-mute)", fontSize: 14, margin: 0 }}>{c.subtitle}</p>
        </header>

        {!canAccess && (
          <section style={{ marginBottom: 20, padding: "14px 16px", background: "rgba(184, 135, 62, 0.08)", border: "1px solid var(--brass-edge)", borderRadius: 12 }}>
            <p style={{ margin: "0 0 8px", color: "var(--creme-soft)", fontSize: 13, lineHeight: 1.5 }}>{c.lockedBanner}</p>
            <Link href="/activation-intent" className="row-btn" style={{ minHeight: 40 }}>{c.lockedCta}</Link>
          </section>
        )}

        <section style={{ marginBottom: 24 }}>
          <p style={{
            margin: "0 0 12px", color: "var(--brass)",
            fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>{c.a1Kicker}</p>
          <p style={{ margin: "0 0 12px", color: "var(--creme-mute)", fontSize: 12 }}>
            {c.progressLbl} · {pct}%
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {courses.map((cs) => {
              const locked = cs.status === "LOCKED" || !canAccess;
              const statusLbl =
                cs.status === "COMPLETED" ? c.completed :
                cs.status === "IN_PROGRESS" ? c.resume :
                cs.status === "OPEN" ? c.open : c.locked;
              const pcs = cs.totalModules === 0 ? 0 : Math.round((cs.completedModules / cs.totalModules) * 100);
              return (
                <li key={cs.id} className="data-card" style={{ opacity: locked ? 0.55 : 1 }}>
                  <div className="data-card-head">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="data-card-title">
                        <span style={{ color: "var(--creme-mute)", marginRight: 8, fontFamily: "var(--font-jetbrains, monospace)", fontSize: 12 }}>
                          {String(cs.index).padStart(2, "0")}
                        </span>
                        {cs.label}
                      </p>
                      <p className="data-card-sub">{c.modulesOf(cs.completedModules, cs.totalModules)} · {statusLbl}</p>
                    </div>
                    {!locked && (
                      <Link
                        href={`/courses/${cs.id}/modules/${cs.moduleIds[0]}`}
                        className="row-btn"
                        style={{ flexShrink: 0, minHeight: 40 }}
                      >
                        {cs.status === "IN_PROGRESS" ? c.resume : c.open}
                      </Link>
                    )}
                  </div>
                  {cs.completedModules > 0 && (
                    <div style={{ height: 4, background: "rgba(244, 235, 220, 0.08)", borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${pcs}%`, background: "var(--brass)", borderRadius: 2 }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section style={{ padding: "14px 16px", background: "rgba(244, 235, 220, 0.02)", border: "1px dashed var(--creme-hair)", borderRadius: 12 }}>
          <p style={{
            margin: "0 0 8px", color: "var(--creme-mute)",
            fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>{c.othersKicker}</p>
          <p style={{ margin: "0 0 12px", color: "var(--creme-mute)", fontSize: 13, lineHeight: 1.5 }}>
            {c.othersBody}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {OTHER_LEVELS.map((lv) => (
              <span key={lv} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 99,
                background: "var(--espresso-2)", border: "1px solid var(--creme-hair)",
                color: "var(--creme-mute)", fontSize: 12, fontFamily: "var(--font-jetbrains, monospace)",
              }}>
                {lv} · {c.othersSoon}
              </span>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
