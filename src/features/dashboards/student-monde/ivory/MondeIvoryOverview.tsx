"use client";

import "./tokens.css";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MondeIvoryHero } from "./MondeIvoryHero";
import { PathwayModule } from "./PathwayModule";
import { MondeIvoryEmptyState } from "./MondeIvoryEmptyState";
import { derivePathStatus, resolveMondePath } from "./mondePath";
import type { MondePath } from "./mondePath";

// Lot 7A / 7A.1 · Overview Monde Ivory · orchestre l'ordre desktop/mobile
// brief §4/§16.
//
// AUCUN tab de sélection de parcours en production · le parcours vient
// UNIQUEMENT des données onboarding via resolveMondePath.
//
// Lot 7A.1 · l'override query ?monde_path= est RETIRÉ. Toute exploration
// des 5 variantes en QA se fait via un script server-only qui bascule
// temporairement la valeur `learningGoal` du Student Monde QA puis
// restaure la valeur d'origine · aucun bypass côté client, aucun
// NEXT_PUBLIC.

type Props = {
  input: {
    learningGoal?: string | null;
    mondePath?: MondePath | null;
    targetDate?: string | null;
    targetCity?: string | null;
    progressPct?: number;
    completed?: boolean;
    level?: string | null;
  };
};

export function MondeIvoryOverview({ input }: Props) {
  const router = useRouter();
  const locale = useLocale();

  const effectivePath = resolveMondePath({
    learningGoal: input.learningGoal,
    mondePath: input.mondePath,
  });
  const status = derivePathStatus({
    path: effectivePath,
    targetDate: input.targetDate,
    targetCity: input.targetCity,
    progressPct: input.progressPct,
    completed: input.completed,
  });

  const goToOnboarding = () => router.push(`/${locale}/onboarding`);
  const resumeCourse = () => router.push(`/${locale}/apprentissage`);

  return (
    <div
      data-monde-ivory
      style={{ minHeight: "100vh", padding: "24px", maxWidth: 960, margin: "0 auto" }}
    >
      {/* Carte "Parcours actif" discrète · brief §4. */}
      {effectivePath && status.state !== "no_pathway" ? (
        <section
          aria-label="Parcours actif"
          style={{
            background: "var(--monde-surface)",
            border: "1px solid var(--monde-border)",
            borderRadius: "var(--monde-r-card)",
            padding: "12px 16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span className="monde-mono" style={{ color: "var(--monde-text-muted)" }}>
            PARCOURS · {effectivePath}
          </span>
          {status.targetCity ? (
            <span style={{ fontSize: 13, color: "var(--monde-ink)" }}>{status.targetCity}</span>
          ) : null}
          <button type="button" className="monde-cta-secondary" style={{ marginLeft: "auto" }} onClick={goToOnboarding}>
            Modifier
          </button>
        </section>
      ) : null}

      <MondeIvoryHero
        status={status}
        level={input.level ?? null}
        onPrimaryAction={effectivePath ? resumeCourse : goToOnboarding}
        onEditGoal={goToOnboarding}
      />

      {/* État métier · brief §12. */}
      {status.state === "no_pathway" ? (
        <MondeIvoryEmptyState
          labelKey="empty.no_pathway.label"
          titleKey="empty.no_pathway.title"
          descriptionKey="empty.no_pathway.description"
          actionKey="cta.define_goal"
          onAction={goToOnboarding}
        />
      ) : status.state === "incomplete_goal" ? (
        <>
          <MondeIvoryEmptyState
            labelKey="empty.incomplete_goal.label"
            titleKey="empty.incomplete_goal.title"
            descriptionKey="empty.incomplete_goal.description"
            actionKey="cta.complete_goal"
            onAction={goToOnboarding}
          />
          {effectivePath ? <PathwayModule path={effectivePath} /> : null}
        </>
      ) : status.state === "completed" ? (
        <section
          style={{
            marginTop: 24,
            padding: 20,
            background: "var(--monde-ink)",
            color: "var(--monde-on-ink)",
            borderRadius: "var(--monde-r-card)",
          }}
        >
          <span className="monde-mono" style={{ color: "var(--monde-gold-on-ink)" }}>PARCOURS TERMINÉ</span>
          <h2 style={{ color: "var(--monde-on-ink)", marginTop: 8 }}>{effectivePath}</h2>
          <p style={{ fontSize: 14, color: "var(--monde-on-ink)", opacity: 0.85 }}>
            Progression 100 %. Prêt pour un nouvel objectif ?
          </p>
        </section>
      ) : (
        effectivePath ? <PathwayModule path={effectivePath} /> : null
      )}
    </div>
  );
}
