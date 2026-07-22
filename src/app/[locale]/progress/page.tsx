// /progress · vue progression P2 · server component · uniquement données réelles.
// Doctrine §15 · pas de ranking, pas de compare fictif, pas de faux temps.

import { redirect, Link } from "@/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import {
  buildA1CourseList,
  computeMondeAccess,
  overallProgress,
} from "@/lib/monde";

interface Props { params: Promise<{ locale: string }> }

const T = {
  fr: {
    title: "Ma progression",
    subtitle: "Données réelles issues de ton parcours. Rien d'estimé, rien d'inventé.",
    levelLbl: "Niveau",
    xpLbl: "XP",
    modulesDone: "Modules terminés",
    modulesTotal: "sur",
    accessLbl: "Accès",
    accessActive: "actif",
    accessExpired: "expiré",
    accessNone: "aucun",
    lastLbl: "Dernière activité",
    never: "Jamais",
    empty: "Rien à afficher pour l'instant.",
    emptyBody: "Commence par une leçon depuis /courses ou depuis ton dashboard.",
    emptyCta: "Voir mon parcours",
    coursesTitle: "Détail par leçon",
    modulesLbl: "modules",
  },
  en: {
    title: "My progress",
    subtitle: "Real data from your journey. Nothing estimated, nothing invented.",
    levelLbl: "Level",
    xpLbl: "XP",
    modulesDone: "Modules completed",
    modulesTotal: "of",
    accessLbl: "Access",
    accessActive: "active",
    accessExpired: "expired",
    accessNone: "none",
    lastLbl: "Last activity",
    never: "Never",
    empty: "Nothing to show yet.",
    emptyBody: "Start with a lesson from /courses or your dashboard.",
    emptyCta: "See my journey",
    coursesTitle: "Per-lesson detail",
    modulesLbl: "modules",
  },
} as const;

export default async function ProgressPage({ params }: Props) {
  const { locale } = await params;
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const c = T[loc];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return null; }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, xpTotal: true, lastActiveAt: true },
  });
  if (!dbUser) { redirect({ href: "/onboarding", locale }); return null; }

  const lp = await prisma.learningPath.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE", universe: "MONDE" },
    orderBy: { createdAt: "desc" },
  });

  if (!lp) {
    return (
      <Layout title={c.title}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 16px" }}>
          <StateBlock kind="empty" centered soul={c.empty} body={c.emptyBody} action={{ label: c.emptyCta, href: "/dashboard" }} />
        </main>
      </Layout>
    );
  }

  const [grants, progress] = await Promise.all([
    prisma.accessGrant.findMany({
      where: {
        OR: [
          { beneficiaryType: "USER", beneficiaryId: dbUser.id },
          { beneficiaryType: "LEARNING_PATH", beneficiaryId: lp.id },
        ],
      },
      select: { startsAt: true, endsAt: true, status: true, metadata: true },
    }),
    prisma.moduleProgress.findMany({
      where: { userId: dbUser.id, moduleId: { startsWith: "a1-beta-" } },
      select: { moduleId: true, status: true, completedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const access = computeMondeAccess(grants);
  const courses = buildA1CourseList(progress);
  const pct = overallProgress(courses);
  const totalMods = courses.reduce((acc, s) => acc + s.totalModules, 0);
  const doneMods = courses.reduce((acc, s) => acc + s.completedModules, 0);
  const lastActive = dbUser.lastActiveAt
    ? new Date(dbUser.lastActiveAt).toLocaleDateString(loc === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "long", year: "numeric" })
    : c.never;
  const accessLabel = access.status === "ACTIVE" ? c.accessActive : access.status === "EXPIRED" ? c.accessExpired : c.accessNone;

  return (
    <Layout title={c.title}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 96px" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 26,
            color: "var(--creme)", margin: "0 0 6px",
          }}>{c.title}</h1>
          <p style={{ color: "var(--creme-mute)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{c.subtitle}</p>
        </header>

        {/* Résumé chiffré (uniquement données réelles) */}
        <dl className="data-card" style={{ display: "grid", gridTemplateColumns: "minmax(0,auto) minmax(0,1fr)", gap: "10px 16px", marginBottom: 24 }}>
          <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.levelLbl}</dt>
          <dd style={{ color: "var(--creme)", margin: 0, fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18 }}>{lp.currentLevel ?? "A1"}</dd>
          <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.modulesDone}</dt>
          <dd style={{ color: "var(--brass)", margin: 0, fontWeight: 600 }}>{doneMods} {c.modulesTotal} {totalMods} · {pct}%</dd>
          <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.xpLbl}</dt>
          <dd style={{ color: "var(--creme-soft)", margin: 0 }}>{dbUser.xpTotal ?? 0}</dd>
          <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.accessLbl}</dt>
          <dd style={{ color: access.status === "ACTIVE" ? "var(--brass)" : access.status === "EXPIRED" ? "var(--oxblood)" : "var(--creme-mute)", margin: 0 }}>
            {accessLabel}
            {access.status === "ACTIVE" && access.daysRemaining !== null && ` · ${access.daysRemaining}j`}
          </dd>
          <dt style={{ color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.lastLbl}</dt>
          <dd style={{ color: "var(--creme-soft)", margin: 0, fontFamily: "var(--font-jetbrains, monospace)", fontSize: 12 }}>{lastActive}</dd>
        </dl>

        {/* Détail par leçon */}
        <section>
          <h2 style={{
            fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
            color: "var(--creme-mute)", letterSpacing: "0.1em", textTransform: "uppercase",
            margin: "0 0 12px",
          }}>{c.coursesTitle}</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {courses.map((cs) => {
              const pcs = cs.totalModules === 0 ? 0 : Math.round((cs.completedModules / cs.totalModules) * 100);
              return (
                <li key={cs.id} className="data-card">
                  <div className="data-card-head">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="data-card-title">{cs.label}</p>
                      <p className="data-card-sub">{cs.completedModules} / {cs.totalModules} {c.modulesLbl} · {pcs}%</p>
                    </div>
                    <Link href={`/courses/${cs.id}/modules/${cs.moduleIds[0]}`} className="row-btn" style={{ flexShrink: 0, minHeight: 40 }}>
                      →
                    </Link>
                  </div>
                  <div style={{ height: 4, background: "rgba(244, 235, 220, 0.08)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${pcs}%`, background: "var(--brass)", borderRadius: 2 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </Layout>
  );
}
