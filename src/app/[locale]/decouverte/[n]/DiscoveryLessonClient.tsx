"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { StateBlock } from "@/components/StateBlock";
import type { DiscoveryLesson } from "@/lib/discovery";
import { DISCOVERY_TOTAL } from "@/lib/discovery";

interface Props {
  langId: string;
  lesson: DiscoveryLesson;
  alreadyDone: boolean;
  currentLevel: string | null;
  progress: number[];
  locale: "fr" | "en";
}

const COPY = {
  fr: {
    stepLabel: (n: number) => `Cours ${n} sur ${DISCOVERY_TOTAL}`,
    vocab: "Vocabulaire",
    exercises: "À toi de jouer",
    check: "Vérifier",
    next: "Continuer",
    nextLesson: (n: number) => `Cours ${n} sur ${DISCOVERY_TOTAL}`,
    goToBilan: "Voir le bilan",
    backToFunnel: "Reprendre le parcours",
    correct: "Bonne réponse.",
    incorrect: "Essaie encore.",
    alreadyDoneHead: "Ce cours est déjà terminé.",
    alreadyDoneBody: "Tu peux le refaire pour t'entraîner, ou passer au suivant.",
    savingErr: "Impossible d'enregistrer ton avancée pour l'instant.",
    retry: "Réessayer",
    saving: "Enregistrement…",
  },
  en: {
    stepLabel: (n: number) => `Lesson ${n} of ${DISCOVERY_TOTAL}`,
    vocab: "Vocabulary",
    exercises: "Your turn",
    check: "Check",
    next: "Continue",
    nextLesson: (n: number) => `Lesson ${n} of ${DISCOVERY_TOTAL}`,
    goToBilan: "See summary",
    backToFunnel: "Back to journey",
    correct: "Correct.",
    incorrect: "Try again.",
    alreadyDoneHead: "You've already finished this lesson.",
    alreadyDoneBody: "You can redo it for practice, or move to the next.",
    savingErr: "We couldn't save your progress right now.",
    retry: "Retry",
    saving: "Saving…",
  },
} as const;

export function DiscoveryLessonClient({ lesson, alreadyDone, progress, locale }: Props) {
  const router = useRouter();
  const c = COPY[locale];

  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const allChecked = lesson.exercises.every((e) => feedback[e.id] !== undefined && feedback[e.id] !== null);
  const allCorrect = lesson.exercises.every((e) => feedback[e.id] === true);

  const check = (exId: string, correctIndex: number) => {
    const picked = answers[exId];
    if (picked === null || picked === undefined) return;
    setFeedback((prev) => ({ ...prev, [exId]: picked === correctIndex }));
  };

  const finish = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const newProgress = Array.from(new Set([...progress, lesson.n])).sort((a, b) => a - b);
      const resp = await fetch("/api/funnel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: { discoveryProgress: newProgress } }),
      });
      if (!resp.ok) throw new Error("save failed");
      const nextN = [1, 2, 3, 4].find((n) => !newProgress.includes(n));
      if (nextN) {
        router.push(`/decouverte/${nextN}`);
      } else {
        router.push("/decouverte/bilan");
      }
      router.refresh();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const promptFor = (e: DiscoveryLesson["exercises"][number]) => locale === "en" ? e.promptEn : e.prompt;
  const explFor = (e: DiscoveryLesson["exercises"][number]) => locale === "en" ? e.explanationEn : e.explanation;
  const title = locale === "en" ? lesson.titleEn : lesson.title;
  const objective = locale === "en" ? lesson.objectiveEn : lesson.objective;
  const intro = locale === "en" ? lesson.introEn : lesson.intro;

  return (
    <main className="decouverte-shell" style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 96px" }}>
      <nav aria-label="Progression" style={{ marginBottom: 16 }}>
        <p style={{ margin: 0, color: "var(--creme-mute)", fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {c.stepLabel(lesson.n)}
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }} aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: progress.includes(i) || i === lesson.n ? "var(--brass)" : "var(--creme-hair)",
              opacity: progress.includes(i) ? 1 : i === lesson.n ? 0.9 : 0.4,
            }} />
          ))}
        </div>
      </nav>

      <header style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28,
          color: "var(--creme)", margin: "0 0 6px", overflowWrap: "anywhere",
        }}>{title}</h1>
        <p style={{ color: "var(--creme-mute)", fontSize: 14, margin: 0 }}>{objective}</p>
      </header>

      {alreadyDone && (
        <div style={{ marginBottom: 20 }}>
          <StateBlock
            kind="success"
            compact
            soul={c.alreadyDoneHead}
            body={c.alreadyDoneBody}
          />
        </div>
      )}

      <section style={{ marginBottom: 24, padding: "16px 18px", background: "var(--espresso-2)", border: "1px solid var(--creme-hair)", borderRadius: 14 }}>
        <p style={{ margin: 0, color: "var(--creme-soft)", lineHeight: 1.6, fontSize: 14 }}>{intro}</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
          color: "var(--creme-mute)", letterSpacing: "0.1em", textTransform: "uppercase",
          margin: "0 0 12px",
        }}>{c.vocab}</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {lesson.vocab.map((v) => (
            <li key={v.de} style={{
              display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: 12, padding: "10px 14px", background: "var(--espresso-2)",
              border: "1px solid var(--creme-hair)", borderRadius: 10,
            }}>
              <span style={{ color: "var(--brass)", fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 15 }}>{v.de}</span>
              <span style={{ color: "var(--creme-soft)", fontSize: 13, textAlign: "right", overflowWrap: "anywhere" }}>
                {locale === "en" ? v.en : v.fr}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: "var(--font-jetbrains, monospace)", fontSize: 11,
          color: "var(--creme-mute)", letterSpacing: "0.1em", textTransform: "uppercase",
          margin: "0 0 12px",
        }}>{c.exercises}</h2>

        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 16 }}>
          {lesson.exercises.map((ex, i) => {
            const picked = answers[ex.id];
            const fb = feedback[ex.id];
            return (
              <li key={ex.id} style={{
                padding: "16px 18px", background: "var(--espresso-2)",
                border: "1px solid var(--creme-hair)", borderRadius: 12,
              }}>
                <p style={{ margin: "0 0 12px", color: "var(--creme)", fontSize: 14, fontWeight: 500 }}>
                  <span style={{ color: "var(--creme-mute)", marginRight: 6, fontFamily: "var(--font-jetbrains, monospace)" }}>{i + 1}.</span>
                  {promptFor(ex)}
                </p>
                <div role="radiogroup" aria-label={promptFor(ex)} style={{ display: "grid", gap: 8 }}>
                  {ex.options.map((opt, oi) => {
                    const isPicked = picked === oi;
                    const isCorrect = fb !== null && fb !== undefined && oi === ex.correctIndex;
                    return (
                      <button
                        key={oi}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        onClick={() => {
                          setAnswers((prev) => ({ ...prev, [ex.id]: oi }));
                          setFeedback((prev) => ({ ...prev, [ex.id]: null }));
                        }}
                        style={{
                          textAlign: "left", padding: "10px 14px",
                          background: isCorrect ? "rgba(184, 135, 62, 0.12)" : isPicked ? "var(--brass-glow)" : "rgba(244, 235, 220, 0.02)",
                          color: isPicked ? "var(--creme)" : "var(--creme-soft)",
                          border: `1px solid ${isCorrect ? "var(--brass)" : isPicked ? "var(--brass-edge)" : "var(--creme-hair)"}`,
                          borderRadius: 10, cursor: "pointer", minHeight: 44, fontSize: 13,
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    disabled={picked === undefined || picked === null}
                    onClick={() => check(ex.id, ex.correctIndex)}
                    className="row-btn"
                    style={{ minHeight: 40 }}
                  >
                    {c.check}
                  </button>
                  {/* aria-live pour lecteur d'écran (P2 hardening §12) */}
                  <span role="status" aria-live="polite" style={{ display: "inline-flex", gap: 6 }}>
                    {fb === true && (
                      <span style={{ color: "var(--brass)", fontSize: 12 }}>✓ {c.correct}</span>
                    )}
                    {fb === false && (
                      <span style={{ color: "var(--oxblood)", fontSize: 12 }}>· {c.incorrect}</span>
                    )}
                  </span>
                </div>
                {fb !== null && fb !== undefined && (
                  <p style={{ margin: "8px 0 0", color: "var(--creme-mute)", fontSize: 12, lineHeight: 1.5 }}>
                    {explFor(ex)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {saveError && (
        <div style={{ marginBottom: 20 }}>
          <StateBlock
            kind="offline"
            compact
            soul="La maison attend le réseau. *Ta progression est sauvegardée.*"
            body={c.savingErr}
            action={{ label: c.retry, onClick: finish }}
          />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          type="button"
          className="entry-cta entry-cta-primary"
          disabled={!allChecked || saving}
          onClick={finish}
          style={{ minHeight: 48 }}
        >
          {saving ? c.saving : (allCorrect ? c.next : c.next)}
        </button>
      </div>
    </main>
  );
}
