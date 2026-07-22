"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { StateBlock } from "@/components/StateBlock";
import {
  MONDE_OPTIONS,
  RACINES_OPTIONS,
  recommendMondeLevel,
  recommendRacinesStep,
} from "@/lib/self-assessment";
import type { CefrLevel, RacinesStep } from "@/lib/funnel-state";

interface Props {
  universe: "MONDE" | "RACINES";
  locale: "fr" | "en";
  currentAnswer: number | null;
  currentLevel: string | null;
}

const COPY = {
  fr: {
    kicker: (u: "MONDE" | "RACINES") => u === "MONDE" ? "Monde · le voyage" : "Racines · la maison",
    title: (u: "MONDE" | "RACINES") => u === "MONDE" ? "Où en es-tu en allemand ?" : "Où en es-tu dans cette langue ?",
    lede: "Choisis la phrase qui te ressemble le plus.",
    honest: "Cette recommandation est indicative. Tu pourras ajuster ton niveau ou passer un test plus complet.",
    save: "Continuer",
    saving: "Enregistrement…",
    errNoChoice: "Choisis une des cinq options.",
    errSave: "La sauvegarde a échoué. Réessaie.",
    retry: "Réessayer",
    recommendedLbl: "Nous te recommandons :",
  },
  en: {
    kicker: (u: "MONDE" | "RACINES") => u === "MONDE" ? "World · the journey" : "Roots · the home",
    title: (u: "MONDE" | "RACINES") => u === "MONDE" ? "Where are you in German?" : "Where are you in this language?",
    lede: "Pick the sentence closest to you.",
    honest: "This recommendation is indicative. You can adjust your level or take a fuller test later.",
    save: "Continue",
    saving: "Saving…",
    errNoChoice: "Pick one of the five options.",
    errSave: "Save failed. Try again.",
    retry: "Retry",
    recommendedLbl: "We recommend:",
  },
} as const;

export function NiveauForm({ universe, locale, currentAnswer }: Props) {
  const c = COPY[locale];
  const router = useRouter();
  const options = universe === "MONDE" ? MONDE_OPTIONS : RACINES_OPTIONS;

  const [answer, setAnswer] = useState<number | null>(currentAnswer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<null | "no_choice" | "save_failed">(null);

  const selected = options.find((o) => o.id === answer) ?? null;
  const declared = selected?.level ?? null;
  const recommended = declared
    ? (universe === "MONDE"
        ? recommendMondeLevel(declared as CefrLevel)
        : recommendRacinesStep(declared as RacinesStep))
    : null;

  const save = async () => {
    if (!answer || !selected || !declared || !recommended) {
      setError("no_choice");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const resp = await fetch("/api/funnel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: {
          selfAssessmentAnswer: answer,
          declaredLevel: declared,
          recommendedLevel: recommended,
        } }),
      });
      if (!resp.ok) throw new Error("save failed");
      // Le router /onboarding décide la prochaine étape (découverte ou attente).
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("save_failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 16px 96px" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{
          margin: "0 0 8px", color: "var(--brass)",
          fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>{c.kicker(universe)}</p>
        <h1 style={{
          fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 26,
          color: "var(--creme)", margin: "0 0 8px", lineHeight: 1.25,
        }}>{c.title(universe)}</h1>
        <p style={{ color: "var(--creme-mute)", fontSize: 14, margin: 0 }}>{c.lede}</p>
      </header>

      <div role="radiogroup" aria-label={c.title(universe)} style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {options.map((opt) => {
          const picked = answer === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={picked}
              onClick={() => { setAnswer(opt.id); setError(null); }}
              style={{
                textAlign: "left", padding: "14px 16px",
                background: picked ? "var(--brass-glow)" : "var(--espresso-2)",
                color: picked ? "var(--creme)" : "var(--creme-soft)",
                border: `1px solid ${picked ? "var(--brass)" : "var(--creme-hair)"}`,
                borderRadius: 12, cursor: "pointer", minHeight: 56,
                fontSize: 14, lineHeight: 1.5,
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <span aria-hidden="true" style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${picked ? "var(--brass)" : "var(--creme-hair)"}`,
                background: picked ? "var(--brass)" : "transparent",
                color: picked ? "var(--espresso)" : "var(--creme-mute)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11, fontWeight: 700,
              }}>{opt.id}</span>
              <span style={{ overflowWrap: "anywhere" }}>
                {locale === "en" ? opt.labelEn : opt.labelFr}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <p style={{ margin: "0 0 16px", color: "var(--brass)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 12, letterSpacing: "0.05em" }}>
          {c.recommendedLbl} <strong style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18, marginLeft: 4 }}>{recommended}</strong>
        </p>
      )}

      <p style={{ margin: "0 0 20px", color: "var(--creme-mute)", fontSize: 12, lineHeight: 1.6, fontStyle: "italic" }}>
        {c.honest}
      </p>

      {error === "no_choice" && (
        <p role="alert" style={{ margin: "0 0 12px", color: "var(--oxblood)", fontSize: 13 }}>{c.errNoChoice}</p>
      )}
      {error === "save_failed" && (
        <div style={{ marginBottom: 12 }}>
          <StateBlock kind="offline" compact soul={c.errSave} body="" action={{ label: c.retry, onClick: save }} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="entry-cta entry-cta-primary"
          disabled={saving || !answer}
          onClick={save}
          style={{ minHeight: 48 }}
        >
          {saving ? c.saving : c.save}
        </button>
      </div>
    </main>
  );
}
