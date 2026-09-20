"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { A1Exercise, A1LessonV2, A1Remediation, A1UnitReference } from "@/content/monde-a1-v2/types";
import { A1_V2_U1_DIALOGUE, A1_V2_U1_DRILLS } from "@/content/monde-a1-v2/u1.support";
import { evaluateA1Exercise, type A1ExerciseEvaluation } from "@/lib/course-content/a1-v2/evaluation";
import styles from "./A1V2Preview.module.css";

type ResponseValue = string | string[];
type ResultState = { evaluation: A1ExerciseEvaluation; attempts: number };

function speak(text: string, slow = false) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = slow ? 0.72 : 0.96;
  window.speechSynthesis.speak(utterance);
}

function audioText(ref?: string) {
  if (!ref) return null;
  if (ref.startsWith("de-a1-u1-dialogue#")) {
    const segment = ref.split("#")[1];
    return A1_V2_U1_DIALOGUE.lines.find((line) => line.id === segment)?.de ?? null;
  }
  return A1_V2_U1_DRILLS[ref] ?? null;
}

function RemediationBox({ remediation }: { remediation: A1Remediation }) {
  return (
    <div className={styles.remediation}>
      <div className={styles.kicker}>REMÉDIATION · {Math.round(remediation.durationSeconds / 60)} MIN</div>
      <h3>On reprend ce point maintenant</h3>
      <p className={styles.muted}>{remediation.explanation}</p>
      <div className={styles.contrast}>
        {remediation.contrast.map((item, index) => (
          <div className={styles.contrastItem} key={index}>
            <strong className={styles.de}>{item.de}</strong>
            <div className={styles.fr}>{item.ok ? item.fr : item.why}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Exercise({
  exercise,
  result,
  response,
  onResponse,
  onSubmit,
}: {
  exercise: A1Exercise;
  result?: ResultState;
  response: ResponseValue;
  onResponse: (value: ResponseValue) => void;
  onSubmit: () => void;
}) {
  const audio = audioText(exercise.audioRef);
  const isChoice = Boolean(exercise.choices?.length);
  const isReorder = Array.isArray(exercise.answer);
  const isGuided = exercise.type === "guidedProduction";
  const isShadowing = exercise.type === "shadowing";

  return (
    <div className={styles.exercise}>
      <div className={styles.exerciseHead}>
        <div>
          <div className={styles.exerciseType}>{exercise.type} · consigne {exercise.promptLang}</div>
          <div className={styles.prompt}>{exercise.prompt}</div>
        </div>
        {exercise.cardIds?.length ? <span className={styles.status}>{exercise.cardIds.length} carte(s)</span> : null}
      </div>

      {audio ? (
        <div className={styles.audioRow}>
          <button className={styles.buttonGhost} type="button" onClick={() => speak(audio, true)}>▶ Lent</button>
          <button className={styles.buttonGhost} type="button" onClick={() => speak(audio, false)}>▶ Naturel</button>
        </div>
      ) : null}

      {isChoice ? (
        <div className={styles.choices}>
          {exercise.choices!.map((choice) => (
            <button
              className={styles.choice}
              type="button"
              key={choice.id}
              onClick={() => {
                onResponse(choice.id);
                const evaluation = evaluateA1Exercise(exercise, choice.id);
                onSubmitDirect?.(evaluation);
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      ) : null}

      {isReorder ? (
        <div>
          <div className={styles.tokenRow}>
            {(exercise.tokens ?? []).map((token, index) => {
              const selected = Array.isArray(response) && response.includes(`${index}:${token}`);
              return (
                <button
                  key={`${token}-${index}`}
                  type="button"
                  className={`${styles.token} ${selected ? styles.tokenSelected : ""}`}
                  onClick={() => {
                    const current = Array.isArray(response) ? response : [];
                    const key = `${index}:${token}`;
                    onResponse(selected ? current.filter((item) => item !== key) : [...current, key]);
                  }}
                >
                  {token}
                </button>
              );
            })}
          </div>
          <p className={styles.note}>Ordre choisi : {Array.isArray(response) ? response.map((item) => item.split(":").slice(1).join(":")).join(" ") : ""}</p>
          <button className={styles.button} type="button" onClick={onSubmit}>Vérifier l’ordre</button>
        </div>
      ) : null}

      {!isChoice && !isReorder && !isShadowing ? (
        <>
          {isGuided ? (
            <textarea className={styles.textarea} value={typeof response === "string" ? response : ""} onChange={(e) => onResponse(e.target.value)} />
          ) : (
            <input className={styles.input} value={typeof response === "string" ? response : ""} onChange={(e) => onResponse(e.target.value)} />
          )}
          <button className={styles.button} type="button" onClick={onSubmit}>Vérifier</button>
        </>
      ) : null}

      {isShadowing ? (
        <div className={styles.stack}>
          {(exercise.targets ?? []).map((target) => (
            <div className={styles.card} key={target.id}>
              <div className={styles.de}>{target.de}</div>
              <div className={styles.audioRow}>
                <button className={styles.buttonGhost} type="button" onClick={() => speak(target.de, true)}>▶ Modèle lent</button>
                <button className={styles.buttonGhost} type="button" onClick={() => speak(target.de, false)}>▶ Modèle naturel</button>
              </div>
            </div>
          ))}
          <div className={styles.note}>Le score Whisper contraint est prévu par le gabarit, mais il n’est pas simulé ici. Aucune production libre n’est auto-notée.</div>
        </div>
      ) : null}

      {result ? (
        <div className={`${styles.feedback} ${
          result.evaluation.status === "CORRECT" ? styles.correct :
          result.evaluation.status === "INCORRECT" ? styles.incorrect : styles.manual
        }`}>
          {result.evaluation.feedback}
        </div>
      ) : null}
    </div>
  );

  function onSubmitDirect(evaluation: A1ExerciseEvaluation) {
    void evaluation;
    onSubmit();
  }
}

export function A1V2LessonPreview({
  unit,
  lesson,
  locale,
}: {
  unit: A1UnitReference;
  lesson: A1LessonV2;
  locale: string;
}) {
  const objectiveMap = useMemo(() => new Map(unit.objectives.map((item) => [item.id, item])), [unit.objectives]);
  const cardMap = useMemo(() => new Map(unit.cards.map((item) => [item.id, item])), [unit.cards]);
  const remediationMap = useMemo(() => new Map(unit.remediations.map((item) => [item.id, item])), [unit.remediations]);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [results, setResults] = useState<Record<string, ResultState>>({});
  const [objectiveFails, setObjectiveFails] = useState<Record<string, number>>({});

  const submit = (exercise: A1Exercise, overrideResponse?: ResponseValue) => {
    const raw = overrideResponse ?? responses[exercise.id] ?? "";
    const response = Array.isArray(raw)
      ? raw.map((item) => item.includes(":") ? item.split(":").slice(1).join(":") : item)
      : raw;
    const evaluation = evaluateA1Exercise(exercise, response);
    setResults((current) => ({
      ...current,
      [exercise.id]: { evaluation, attempts: (current[exercise.id]?.attempts ?? 0) + 1 },
    }));
    if (exercise.objectiveId && evaluation.correct !== null) {
      setObjectiveFails((current) => ({
        ...current,
        [exercise.objectiveId!]: evaluation.correct ? 0 : (current[exercise.objectiveId!] ?? 0) + 1,
      }));
    }
  };

  const triggeredRemediations = unit.remediations.filter((remediation) =>
    (objectiveFails[remediation.objectiveId] ?? 0) >= 2,
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/qa/course-preview/de-a1-v2`}>← Refonte A1</Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.kicker}>UNITÉ 1 · {lesson.phase} · GABARIT À VALIDER</div>
          <h1 className={styles.title}>{lesson.title}</h1>
          <p className={styles.lead}>Cette version teste la nouvelle mécanique : rappel productif, feedback par erreur, Réveil SRS, remédiation et allemand comme langue de test.</p>
          <div className={styles.objectives}>
            {lesson.objectiveIds.map((id) => <div className={styles.objective} key={id}>{objectiveMap.get(id)?.label ?? id}</div>)}
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.stack}>
            <section className={`${styles.card} ${styles.wake}`}>
              <div className={styles.kicker}>RÉVEIL · 60–90 S</div>
              <h2>Réactive avant d’apprendre</h2>
              {lesson.reveil.cardIds.length === 0 ? (
                <p className={styles.muted}>{lesson.reveil.note}</p>
              ) : (
                <div className={styles.chips}>
                  {lesson.reveil.cardIds.map((id) => <span className={styles.chip} key={id}>{cardMap.get(id)?.de ?? id}</span>)}
                </div>
              )}
              {lesson.reveil.selection ? <p className={styles.note}>{lesson.reveil.selection}</p> : null}
            </section>

            {lesson.blocks.map((block) => (
              <section className={styles.card} key={block.id}>
                <div className={styles.kicker}>{block.type}</div>
                {block.title ? <h2>{block.title}</h2> : null}
                {block.text ? <p className={styles.muted}>{block.text}</p> : null}
                {block.textDe ? <p className={styles.de}>{block.textDe}</p> : null}
                {block.textFr ? <p className={styles.fr}>{block.textFr}</p> : null}
                {block.type === "dialogueRef" ? (
                  <>
                    <p className={styles.muted}>{block.instruction}</p>
                    <div className={styles.audioRow}>
                      <button className={styles.buttonGhost} type="button" onClick={() => speak(A1_V2_U1_DIALOGUE.lines.map((line) => line.de).join(" "), true)}>▶ Dialogue lent</button>
                      <button className={styles.buttonGhost} type="button" onClick={() => speak(A1_V2_U1_DIALOGUE.lines.map((line) => line.de).join(" "), false)}>▶ Dialogue naturel</button>
                    </div>
                    <div className={styles.dialogue}>
                      {A1_V2_U1_DIALOGUE.lines.map((line) => (
                        <div className={styles.line} key={line.id}>
                          <strong>{line.speaker}</strong>
                          <div className={styles.de}>{line.de}</div>
                          <div className={styles.fr}>{line.fr}</div>
                        </div>
                      ))}
                    </div>
                    <p className={styles.note}>Audio de travail : synthèse navigateur. Audio natif critique obligatoire avant READY.</p>
                  </>
                ) : null}
              </section>
            ))}

            <section className={styles.card}>
              <div className={styles.kicker}>EXERCICES · {lesson.exercises.length}</div>
              <h2>Travail actif</h2>
              <div className={styles.stack}>
                {lesson.exercises.map((exercise) => (
                  <Exercise
                    key={exercise.id}
                    exercise={exercise}
                    result={results[exercise.id]}
                    response={responses[exercise.id] ?? (Array.isArray(exercise.answer) ? [] : "")}
                    onResponse={(value) => setResponses((current) => ({ ...current, [exercise.id]: value }))}
                    onSubmit={() => {
                      const value = responses[exercise.id] ?? "";
                      submit(exercise, value);
                    }}
                  />
                ))}
              </div>
            </section>

            {triggeredRemediations.map((item) => <RemediationBox key={item.id} remediation={item} />)}
          </div>

          <aside className={styles.stack}>
            <section className={styles.card}>
              <div className={styles.kicker}>DOCTRINE</div>
              <h3>Ce qui change</h3>
              <div className={styles.chips}>
                <span className={styles.chip}>QCM ≤ 25 %</span>
                <span className={styles.chip}>J+1 · J+3 · J+7 · J+21</span>
                <span className={styles.chip}>Feedback par erreur</span>
                <span className={styles.chip}>Clavier tolérant</span>
                <span className={styles.chip}>Remédiation à 2 échecs</span>
              </div>
            </section>
            <section className={styles.card}>
              <div className={styles.kicker}>ÉTAT</div>
              <h3>Pas encore READY</h3>
              <p className={styles.muted}>Le fichier reçu est un gabarit de référence U1 avec 2 leçons. YEMA ne prétend plus que l’ancien parcours 6×6 constitue le niveau A1 complet.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
