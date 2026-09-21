"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getA1V2Card } from "@/content/monde-a1-v2";
import { getA1V2Dialogue } from "@/content/monde-a1-v2/audio";
import type {
  A1Exercise,
  A1LessonV2,
  A1Remediation,
  A1UnitReference,
} from "@/content/monde-a1-v2/types";
import {
  evaluateA1Exercise,
  type A1ExerciseEvaluation,
} from "@/lib/course-content/a1-v2/evaluation";
import styles from "@/features/course-experience/CourseExperience.module.css";

type ResponseValue = string | string[];
type ResultState = {
  evaluation: A1ExerciseEvaluation;
  attempts: number;
  persisted: boolean;
};
type WakeCard = { id: string; kind: string; de: string; fr: string };
type NextLesson = { unitId: string; lessonId: string; title: string } | null;
type ProgressResult = {
  ok: true;
  score: number;
  passScore: number;
  completed: boolean;
  reviewRecommended: boolean;
  completionMessage: string;
  xpAwarded: number;
};

function normalizeResponse(value: ResponseValue): string | string[] {
  if (!Array.isArray(value)) return value;
  return value.map((item) =>
    item.includes(":") ? item.split(":").slice(1).join(":") : item,
  );
}

function fallbackWakeCards(lesson: A1LessonV2): WakeCard[] {
  return lesson.reveil.cardIds
    .map((id) => getA1V2Card(id))
    .filter((card): card is NonNullable<ReturnType<typeof getA1V2Card>> => Boolean(card))
    .map((card) => ({ id: card.id, kind: card.kind, de: card.de, fr: card.fr }));
}

function RemediationPanel({ remediation }: { remediation: A1Remediation }) {
  return (
    <section className={styles.remediationCard}>
      <div className={styles.eyebrow}>
        REMÉDIATION · {Math.max(1, Math.round(remediation.durationSeconds / 60))} MIN
      </div>
      <h2 className={styles.compactTitle}>On reprend ce point maintenant</h2>
      <p className={styles.muted}>{remediation.explanation}</p>
      <div className={styles.contrastGrid}>
        {remediation.contrast.map((item, index) => (
          <div className={styles.contrastItem} key={remediation.id + "-" + index}>
            <strong className={styles.de}>{item.de}</strong>
            <div className={styles.fr}>{item.ok ? item.fr : item.why}</div>
          </div>
        ))}
      </div>
      <div className={styles.eyebrow}>ITEMS CIBLÉS</div>
      <div className={styles.miniStack}>
        {remediation.items.map((item) => (
          <div className={styles.noteBox} key={item.id}>{item.prompt}</div>
        ))}
      </div>
    </section>
  );
}

function DialoguePanel({
  dialogueId,
  instruction,
}: {
  dialogueId?: string;
  instruction?: string;
}) {
  const dialogue = getA1V2Dialogue(dialogueId);
  if (!dialogue) return null;

  return (
    <>
      {instruction ? <p className={styles.muted}>{instruction}</p> : null}
      <div className={styles.dialogue}>
        {dialogue.lines.map((line) => (
          <div className={styles.line} key={line.id}>
            <strong>{line.speaker}</strong>
            <div className={styles.de}>{line.de}</div>
            <div className={styles.fr}>{line.fr}</div>
          </div>
        ))}
      </div>
      <div className={styles.audioPending}>
        Audio allemand · TTS / MP3 sera branché dans le lot audio
      </div>
    </>
  );
}

function ExerciseCard({
  exercise,
  response,
  result,
  busy,
  onResponse,
  onSubmit,
}: {
  exercise: A1Exercise;
  response: ResponseValue;
  result?: ResultState;
  busy: boolean;
  onResponse: (value: ResponseValue) => void;
  onSubmit: (value?: ResponseValue) => void;
}) {
  const isChoice = Boolean(exercise.choices?.length);
  const isReorder = Array.isArray(exercise.answer);
  const isGuided = exercise.type === "guidedProduction";
  const isShadowing = exercise.type === "shadowing";

  const feedbackClass = result?.evaluation.status === "CORRECT"
    ? styles.feedbackCorrect
    : result?.evaluation.status === "INCORRECT"
      ? styles.feedbackWrong
      : styles.feedbackManual;

  return (
    <article className={styles.exercise}>
      <div className={styles.exerciseHead}>
        <div>
          <div className={styles.eyebrow}>
            {exercise.type} · CONSIGNE {exercise.promptLang.toUpperCase()}
          </div>
          <h3 className={styles.exercisePrompt}>{exercise.prompt}</h3>
        </div>
        {exercise.cardIds?.length ? (
          <span className={styles.status}>{exercise.cardIds.length} CARTE(S)</span>
        ) : null}
      </div>

      {exercise.audioRef ? (
        <div className={styles.audioPending}>Écoute requise · audio en cours d’intégration</div>
      ) : null}

      {isChoice ? (
        <div className={styles.choiceList}>
          {exercise.choices!.map((choice) => {
            const selected = response === choice.id;
            return (
              <button
                className={[
                  styles.choice,
                  selected ? styles.choiceSelected : "",
                ].filter(Boolean).join(" ")}
                type="button"
                key={choice.id}
                disabled={busy}
                onClick={() => {
                  onResponse(choice.id);
                  onSubmit(choice.id);
                }}
              >
                {choice.text}
              </button>
            );
          })}
        </div>
      ) : null}

      {isReorder ? (
        <div className={styles.miniStack}>
          <div className={styles.tokenRow}>
            {(exercise.tokens ?? []).map((token, index) => {
              const marker = String(index) + ":" + token;
              const selected = Array.isArray(response) && response.includes(marker);
              return (
                <button
                  key={marker}
                  type="button"
                  disabled={busy}
                  className={[
                    styles.token,
                    selected ? styles.tokenSelected : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => {
                    const current = Array.isArray(response) ? response : [];
                    onResponse(
                      selected
                        ? current.filter((item) => item !== marker)
                        : [...current, marker],
                    );
                  }}
                >
                  {token}
                </button>
              );
            })}
          </div>
          <div className={styles.orderPreview}>
            {Array.isArray(response)
              ? response.map((item) => item.split(":").slice(1).join(":")).join(" ")
              : ""}
          </div>
          <button
            className={styles.secondary}
            type="button"
            disabled={busy}
            onClick={() => onSubmit()}
          >
            Vérifier l’ordre
          </button>
        </div>
      ) : null}

      {!isChoice && !isReorder && !isShadowing ? (
        <div className={styles.miniStack}>
          {isGuided ? (
            <textarea
              className={styles.textarea}
              value={typeof response === "string" ? response : ""}
              onChange={(event) => onResponse(event.target.value)}
            />
          ) : (
            <input
              className={styles.input}
              value={typeof response === "string" ? response : ""}
              onChange={(event) => onResponse(event.target.value)}
            />
          )}
          <button
            className={styles.secondary}
            type="button"
            disabled={busy}
            onClick={() => onSubmit()}
          >
            {busy ? "Vérification…" : "Vérifier"}
          </button>
        </div>
      ) : null}

      {isShadowing ? (
        <div className={styles.miniStack}>
          {(exercise.targets ?? []).map((target) => (
            <div className={styles.noteBox} key={target.id}>
              <div className={styles.de}>{target.de}</div>
              <div className={styles.fr}>
                Modèle audio à connecter · aucune note libre simulée.
              </div>
            </div>
          ))}
          <button
            className={styles.secondary}
            type="button"
            disabled={busy}
            onClick={() => onSubmit("")}
          >
            J’ai répété les blocs
          </button>
        </div>
      ) : null}

      {result ? (
        <div className={[styles.feedback, feedbackClass].filter(Boolean).join(" ")}>
          <strong>
            {result.evaluation.status === "CORRECT"
              ? "Correct"
              : result.evaluation.status === "INCORRECT"
                ? "À reprendre"
                : "Réalisé · non noté"}
          </strong>
          <div>{result.evaluation.feedback}</div>
          {!result.persisted ? (
            <small>Résultat local · synchronisation non confirmée.</small>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function A1V2PlatformLesson({
  unit,
  lesson,
  locale,
  courseId,
  alreadyCompleted,
  initialScore,
  accessActive,
  nextLesson,
}: {
  unit: A1UnitReference;
  lesson: A1LessonV2;
  locale: string;
  courseId: string;
  alreadyCompleted: boolean;
  initialScore?: number | null;
  accessActive: boolean;
  nextLesson: NextLesson;
}) {
  const objectiveMap = useMemo(
    () => new Map(unit.objectives.map((objective) => [objective.id, objective.label])),
    [unit.objectives],
  );
  const remediationMap = useMemo(
    () => new Map(unit.remediations.map((remediation) => [remediation.id, remediation])),
    [unit.remediations],
  );

  const [wakeCards, setWakeCards] = useState<WakeCard[]>(() => fallbackWakeCards(lesson));
  const [wakeSource, setWakeSource] = useState<"loading" | "server" | "fallback">("loading");
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [results, setResults] = useState<Record<string, ResultState>>({});
  const [objectiveFails, setObjectiveFails] = useState<Record<string, number>>({});
  const [remediationIds, setRemediationIds] = useState<string[]>([]);
  const [busyExerciseId, setBusyExerciseId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [progressResult, setProgressResult] = useState<ProgressResult | null>(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    fetch(
      "/api/courses/monde-a1-v2/reveil?lessonId=" + encodeURIComponent(lesson.id),
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as
          | { ok?: boolean; cards?: WakeCard[] }
          | null;
        if (!alive) return;
        if (response.ok && payload?.ok && payload.cards?.length) {
          setWakeCards(payload.cards);
          setWakeSource("server");
        } else {
          setWakeSource("fallback");
        }
      })
      .catch(() => {
        if (alive) setWakeSource("fallback");
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [lesson.id]);

  const attemptedCount = lesson.exercises.filter((exercise) => Boolean(results[exercise.id])).length;
  const machineCorrectCount = lesson.exercises.filter(
    (exercise) => results[exercise.id]?.evaluation.correct === true,
  ).length;
  const manualCount = lesson.exercises.filter(
    (exercise) => results[exercise.id]?.evaluation.correct === null,
  ).length;
  const completionCreditCount = machineCorrectCount + manualCount;
  const allAttempted = attemptedCount === lesson.exercises.length;
  const currentPct = allAttempted
    ? Math.round((completionCreditCount / lesson.exercises.length) * 100)
    : Math.round((attemptedCount / lesson.exercises.length) * 100);

  const triggerRemediation = (id?: string) => {
    if (!id || !remediationMap.has(id)) return;
    setRemediationIds((current) => current.includes(id) ? current : [...current, id]);
  };

  const submitExercise = async (exercise: A1Exercise, override?: ResponseValue) => {
    const raw = override ?? responses[exercise.id] ?? "";
    const response = normalizeResponse(raw);
    const localEvaluation = evaluateA1Exercise(exercise, response);

    setResults((current) => ({
      ...current,
      [exercise.id]: {
        evaluation: localEvaluation,
        attempts: (current[exercise.id]?.attempts ?? 0) + 1,
        persisted: false,
      },
    }));

    if (exercise.objectiveId && localEvaluation.correct !== null) {
      setObjectiveFails((current) => {
        const next = localEvaluation.correct
          ? 0
          : (current[exercise.objectiveId!] ?? 0) + 1;
        if (!localEvaluation.correct && next >= 2) {
          triggerRemediation(exercise.remediationRef);
        }
        return { ...current, [exercise.objectiveId!]: next };
      });
    }

    if (!accessActive) return;

    setBusyExerciseId(exercise.id);
    setSyncMessage(null);
    try {
      const http = await fetch("/api/courses/monde-a1-v2/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, response }),
      });
      const payload = await http.json().catch(() => null) as
        | {
            ok?: boolean;
            evaluation?: A1ExerciseEvaluation;
            persisted?: boolean;
            remediation?: A1Remediation | null;
            error?: string;
          }
        | null;

      if (!http.ok || !payload?.ok || !payload.evaluation) {
        setSyncMessage(payload?.error ?? "La mémoire SRS n’a pas pu être synchronisée.");
        return;
      }

      setResults((current) => ({
        ...current,
        [exercise.id]: {
          evaluation: payload.evaluation!,
          attempts: current[exercise.id]?.attempts ?? 1,
          persisted: Boolean(payload.persisted),
        },
      }));
      if (payload.remediation?.id) triggerRemediation(payload.remediation.id);
    } catch {
      setSyncMessage(
        "Mode local actif : la synchronisation SRS est momentanément indisponible.",
      );
    } finally {
      setBusyExerciseId(null);
    }
  };

  const completeLesson = async () => {
    if (!accessActive || !allAttempted) return;
    setSaving(true);
    setSaveError(null);
    try {
      const http = await fetch("/api/courses/" + courseId + "/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          attemptedCount,
          correctCount: completionCreditCount,
        }),
      });
      const payload = await http.json().catch(() => null) as
        | (ProgressResult & { code?: string; error?: string })
        | null;

      if (!http.ok || !payload?.ok) {
        if (payload?.code === "COURSE_NOT_PROVISIONED") {
          throw new Error(
            "La leçon est intégrée, mais son module P‑1 n’est pas encore provisionné pour enregistrer la progression.",
          );
        }
        throw new Error(payload?.error ?? "HTTP " + http.status);
      }
      setProgressResult(payload);
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "La progression n’a pas pu être enregistrée.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remediations = remediationIds
    .map((id) => remediationMap.get(id) ?? null)
    .filter((item): item is A1Remediation => item !== null);

  const courseBase = "/" + locale + "/learn/" + courseId;
  const nextHref = nextLesson
    ? courseBase + "/" + nextLesson.unitId + "/" + nextLesson.lessonId
    : courseBase + "/complete";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={"/" + locale}>YEMA</Link>
          <Link className={styles.back} href={courseBase + "/" + unit.id}>
            ← Retour à l’unité
          </Link>
        </header>

        <section className={styles.lessonHero}>
          <div className={styles.eyebrow}>
            UNITÉ {unit.order} · LEÇON {lesson.order}/5 · {lesson.phase}
          </div>
          <h1 className={styles.lessonTitle}>{lesson.title}</h1>
          <div className={styles.objectiveList}>
            {lesson.objectiveIds.map((id) => (
              <span className={styles.chip} key={id}>
                {objectiveMap.get(id) ?? id}
              </span>
            ))}
          </div>
          <div className={styles.sequence}>
            {["Comprends", "Pratique", "Produis", "Valide"].map((phase) => (
              <span
                key={phase}
                className={[
                  styles.sequenceStep,
                  phase === lesson.phase ? styles.sequenceCurrent : "",
                ].filter(Boolean).join(" ")}
              >
                {phase}
              </span>
            ))}
          </div>
        </section>

        <div className={styles.lessonLayout} style={{ marginTop: 24 }}>
          <div className={styles.lessonMain}>
            <section className={[styles.card, styles.wakeCard].join(" ")}>
              <div className={styles.eyebrow}>
                RÉVEIL · {lesson.reveil.maxSeconds ?? 90} S
              </div>
              <h2 className={styles.compactTitle}>Réactive avant d’apprendre</h2>
              <div className={styles.chipRow}>
                {wakeCards.map((card) => (
                  <span className={styles.chip} key={card.id}>{card.de}</span>
                ))}
              </div>
              <p className={styles.muted}>
                {wakeSource === "server"
                  ? "Sélection personnalisée : cartes dues et erreurs récentes d’abord."
                  : lesson.reveil.selection
                    ?? lesson.reveil.note
                    ?? "Rappel ciblé avant la leçon."}
              </p>
            </section>

            {lesson.blocks.map((block) => (
              <section className={styles.block} key={block.id}>
                <div className={styles.eyebrow}>{block.type}</div>
                {block.title ? <h2>{block.title}</h2> : null}
                {block.text ? <p className={styles.muted}>{block.text}</p> : null}
                {block.textDe ? <p className={styles.de}>{block.textDe}</p> : null}
                {block.textFr ? <p className={styles.fr}>{block.textFr}</p> : null}
                {block.type === "dialogueRef" ? (
                  <DialoguePanel
                    dialogueId={block.dialogueId}
                    instruction={block.instruction}
                  />
                ) : null}
              </section>
            ))}

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.eyebrow}>TRAVAIL ACTIF</div>
                  <h2 className={styles.sectionTitle}>À toi de jouer</h2>
                </div>
                <span className={styles.muted}>
                  {attemptedCount}/{lesson.exercises.length} tentés ·{" "}
                  {machineCorrectCount} corrects
                  {manualCount > 0 ? " · " + manualCount + " non noté(s)" : ""}
                </span>
              </div>

              <div className={styles.lessonList}>
                {lesson.exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    response={
                      responses[exercise.id]
                      ?? (Array.isArray(exercise.answer) ? [] : "")
                    }
                    result={results[exercise.id]}
                    busy={busyExerciseId === exercise.id}
                    onResponse={(value) =>
                      setResponses((current) => ({
                        ...current,
                        [exercise.id]: value,
                      }))
                    }
                    onSubmit={(value) => void submitExercise(exercise, value)}
                  />
                ))}
              </div>

              {syncMessage ? (
                <div className={styles.noteBox} style={{ marginTop: 12 }}>
                  {syncMessage}
                </div>
              ) : null}
            </section>

            {remediations.map((remediation) => (
              <RemediationPanel remediation={remediation} key={remediation.id} />
            ))}

            {progressResult ? (
              <section className={styles.completion}>
                <div className={styles.eyebrow}>
                  {progressResult.completed
                    ? "LEÇON ENREGISTRÉE"
                    : "RÉVISION RECOMMANDÉE"}
                </div>
                <h2>
                  {progressResult.completed
                    ? "Progression sauvegardée"
                    : "Encore un passage pour atteindre "
                      + progressResult.passScore
                      + " %"}
                </h2>
                <p>{progressResult.completionMessage}</p>
                <div className={styles.completionActions}>
                  {progressResult.completed ? (
                    <Link className={styles.primary} href={nextHref}>
                      {nextLesson ? "Leçon suivante" : "Voir mon bilan A1"}
                    </Link>
                  ) : null}
                  <Link
                    className={styles.secondaryOnDark}
                    href={courseBase + "/" + unit.id}
                  >
                    Retour à l’unité
                  </Link>
                </div>
              </section>
            ) : null}
          </div>

          <aside className={styles.lessonAside}>
            <section className={styles.card}>
              <div className={styles.eyebrow}>PROGRESSION</div>
              <h3>{alreadyCompleted ? "Leçon déjà enregistrée" : "Leçon en cours"}</h3>
              <p className={styles.muted}>
                {lesson.durationMinutes} min · {lesson.exercises.length} activités
              </p>
              <div className={styles.progress}>
                <span style={{ width: String(currentPct) + "%" }} />
              </div>
              <p className={styles.muted}>
                {attemptedCount}/{lesson.exercises.length} tentés
                {initialScore !== null && initialScore !== undefined
                  ? " · meilleur score " + initialScore + " %"
                  : ""}
              </p>
              {!progressResult ? (
                <button
                  type="button"
                  className={styles.primary}
                  disabled={!accessActive || !allAttempted || saving}
                  onClick={() => void completeLesson()}
                >
                  {saving
                    ? "Enregistrement…"
                    : lesson.phase === "Valide"
                      ? "Valider l’unité"
                      : "Terminer la leçon"}
                </button>
              ) : null}
              {saveError ? <div className={styles.feedback}>{saveError}</div> : null}
              {alreadyCompleted && !progressResult ? (
                <Link className={styles.secondary} href={nextHref}>
                  Continuer le parcours
                </Link>
              ) : null}
            </section>

            <section className={styles.card}>
              <div className={styles.eyebrow}>MÉTHODE YEMA</div>
              <div className={styles.chipRow}>
                <span className={styles.chip}>Réveil SRS</span>
                <span className={styles.chip}>J+1 · J+3 · J+7 · J+21</span>
                <span className={styles.chip}>Feedback ciblé</span>
                <span className={styles.chip}>Remédiation après 2 erreurs</span>
              </div>
              <p className={styles.muted}>
                Une activité orale « non notée » compte comme réalisée,
                jamais comme une mesure automatique de qualité de prononciation.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
