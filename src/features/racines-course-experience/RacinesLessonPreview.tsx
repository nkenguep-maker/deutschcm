"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RacinesExercise, RacinesLesson, RacinesUnit } from "@/content/racines-e1-solo/types";
import styles from "./RacinesPreview.module.css";

type NextLesson = { unitId: string; lessonId: string; title: string } | null;

type Props = {
  courseId: string;
  courseTitle: string;
  languageCode: string;
  languageLabel: string;
  unit: RacinesUnit;
  lesson: RacinesLesson;
  locale: string;
  nextLesson: NextLesson;
};

type PreviewProgress = {
  completedLessonIds: string[];
  validationScores: Record<string, number>;
  xp: number;
};

const ORAL_TYPES = new Set([
  "repeatAndRecord",
  "oralResponse",
  "shadowing",
  "guidedOralProduction",
  "memoryRecall",
  "soloTransmissionChallenge",
]);

const SINGLE_CHOICE_TYPES = new Set([
  "listenChooseMeaning",
  "listenIdentifyPhrase",
  "chooseResponse",
  "contextChoice",
  "spacedReviewChoice",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sameStrings(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function progressKey(courseId: string): string {
  return `yema.qa.racines.${courseId}`;
}

function emptyProgress(): PreviewProgress {
  return { completedLessonIds: [], validationScores: {}, xp: 0 };
}

function readProgress(courseId: string): PreviewProgress {
  try {
    const raw = window.localStorage.getItem(progressKey(courseId));
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<PreviewProgress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds.filter((id): id is string => typeof id === "string")
        : [],
      validationScores: isRecord(parsed.validationScores)
        ? Object.fromEntries(Object.entries(parsed.validationScores).filter((entry): entry is [string, number] => typeof entry[1] === "number"))
        : {},
      xp: typeof parsed.xp === "number" && Number.isFinite(parsed.xp) ? parsed.xp : 0,
    };
  } catch {
    return emptyProgress();
  }
}

function writeProgress(courseId: string, progress: PreviewProgress) {
  try {
    window.localStorage.setItem(progressKey(courseId), JSON.stringify(progress));
  } catch {
    // QA preview must remain usable even when storage is blocked.
  }
}

function objectiveCorrect(exercise: RacinesExercise, value: unknown): boolean | null {
  if (SINGLE_CHOICE_TYPES.has(exercise.type)) {
    return typeof value === "string" && value === asString(exercise.answer);
  }
  if (exercise.type === "dialogueOrder") {
    return Array.isArray(value) && sameStrings(value.filter((item): item is string => typeof item === "string"), asStringArray(exercise.answer));
  }
  if (exercise.type === "matchMeaning") {
    const pairs = Array.isArray(exercise.pairs) ? exercise.pairs.filter(isRecord) : [];
    if (!isRecord(value)) return false;
    return pairs.every((pair) => {
      const target = asString(pair.target);
      return target.length > 0 && value[target] === asString(pair.fr);
    });
  }
  return null;
}

function isAttempted(
  exercise: RacinesExercise,
  checked: Record<string, boolean>,
  oralDone: Record<string, boolean>,
  rubricScores: Record<string, Record<string, number>>,
): boolean {
  if (SINGLE_CHOICE_TYPES.has(exercise.type) || exercise.type === "dialogueOrder" || exercise.type === "matchMeaning") {
    return checked[exercise.id] === true;
  }
  if (ORAL_TYPES.has(exercise.type)) return oralDone[exercise.id] === true;
  if (exercise.type === "unitValidation") {
    const rubric = Array.isArray(exercise.rubric) ? exercise.rubric.filter(isRecord) : [];
    const scores = rubricScores[exercise.id] ?? {};
    return oralDone[exercise.id] === true && rubric.every((_item, index) => typeof scores[String(index)] === "number");
  }
  return oralDone[exercise.id] === true;
}

function validationScore(exercise: RacinesExercise, rubricScores: Record<string, Record<string, number>>): number | null {
  if (exercise.type !== "unitValidation") return null;
  const rubric = Array.isArray(exercise.rubric) ? exercise.rubric.filter(isRecord) : [];
  const scores = rubricScores[exercise.id] ?? {};
  if (!rubric.every((_item, index) => typeof scores[String(index)] === "number")) return null;
  return rubric.reduce((sum, _item, index) => sum + (scores[String(index)] ?? 0), 0);
}

function SingleChoiceExercise({
  exercise,
  value,
  checked,
  onChoose,
  onCheck,
}: {
  exercise: RacinesExercise;
  value: unknown;
  checked: boolean;
  onChoose: (value: string) => void;
  onCheck: () => void;
}) {
  const choices = asStringArray(exercise.choices);
  const answer = asString(exercise.answer);
  return (
    <>
      <div className={styles.choices}>
        {choices.map((choice) => {
          const selected = value === choice;
          const stateClass = checked
            ? choice === answer
              ? styles.choiceCorrect
              : selected
                ? styles.choiceWrong
                : ""
            : selected
              ? styles.choiceActive
              : "";
          return (
            <button key={choice} type="button" className={`${styles.choice} ${stateClass}`} onClick={() => onChoose(choice)}>
              {choice}
            </button>
          );
        })}
      </div>
      <div className={styles.recorder}>
        <button type="button" className={styles.button} disabled={typeof value !== "string"} onClick={onCheck}>Vérifier</button>
      </div>
      {checked ? (
        <div className={styles.feedback}>
          {value === answer
            ? asString(exercise.feedbackCorrect) || "Oui. La réponse correspond au modèle de la mission."
            : asString(exercise.feedbackIncorrect) || `Modèle attendu : ${answer}`}
        </div>
      ) : null}
    </>
  );
}

function DialogueOrderExercise({
  exercise,
  value,
  checked,
  onChange,
  onCheck,
}: {
  exercise: RacinesExercise;
  value: unknown;
  checked: boolean;
  onChange: (value: string[]) => void;
  onCheck: () => void;
}) {
  const items = asStringArray(exercise.items);
  const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  const available = items.filter((_item, index) => !selected.some((chosen, chosenIndex) => chosen === _item && items.indexOf(_item) === chosenIndex));
  const correct = checked && objectiveCorrect(exercise, selected) === true;
  return (
    <>
      <p>Construis l’ordre en touchant les répliques.</p>
      <div className={styles.choices}>
        {selected.map((item, index) => (
          <button key={`${item}-${index}`} type="button" className={styles.choice} onClick={() => onChange(selected.filter((_v, i) => i !== index))}>
            {index + 1}. {item}
          </button>
        ))}
        {available.map((item, index) => (
          <button key={`available-${item}-${index}`} type="button" className={styles.choice} onClick={() => onChange([...selected, item])}>
            + {item}
          </button>
        ))}
      </div>
      <div className={styles.recorder}>
        <button type="button" className={styles.button} disabled={selected.length !== items.length} onClick={onCheck}>Vérifier l’ordre</button>
        {selected.length > 0 ? <button type="button" className={styles.secondary} onClick={() => onChange([])}>Recommencer</button> : null}
      </div>
      {checked ? <div className={styles.feedback}>{correct ? "Ordre reconnu." : `Ordre modèle : ${asStringArray(exercise.answer).join(" → ")}`}</div> : null}
    </>
  );
}

function MatchMeaningExercise({
  exercise,
  value,
  checked,
  onChange,
  onCheck,
}: {
  exercise: RacinesExercise;
  value: unknown;
  checked: boolean;
  onChange: (value: Record<string, unknown>) => void;
  onCheck: () => void;
}) {
  const pairs = Array.isArray(exercise.pairs) ? exercise.pairs.filter(isRecord) : [];
  const current: Record<string, unknown> = isRecord(value) ? value : {};
  const meanings = pairs.map((pair) => asString(pair.fr)).filter(Boolean);
  const complete = pairs.every((pair) => typeof current[asString(pair.target)] === "string");
  const correct = checked && objectiveCorrect(exercise, current) === true;
  return (
    <>
      <div className={styles.rubric}>
        {pairs.map((pair) => {
          const target = asString(pair.target);
          return (
            <label key={target} className={styles.rubricRow}>
              <strong>{target}</strong>
              <select
                value={typeof current[target] === "string" ? String(current[target]) : ""}
                onChange={(event) => onChange({ ...current, [target]: event.target.value })}
              >
                <option value="">Choisir le sens</option>
                {meanings.map((meaning) => <option key={meaning} value={meaning}>{meaning}</option>)}
              </select>
            </label>
          );
        })}
      </div>
      <div className={styles.recorder}>
        <button type="button" className={styles.button} disabled={!complete} onClick={onCheck}>Vérifier les associations</button>
      </div>
      {checked ? <div className={styles.feedback}>{correct ? "Associations reconnues." : "Certaines associations sont à revoir. Réécoute les blocs avant de retenter."}</div> : null}
    </>
  );
}

function OralExercise({ exercise, done, onDone }: { exercise: RacinesExercise; done: boolean; onDone: () => void }) {
  const model = asString(exercise.modelAnswer) || asString(exercise.targetText);
  const frames = asStringArray(exercise.frames);
  const expected = asStringArray(exercise.expectedChunks);
  return (
    <>
      {model ? <p><strong>Modèle :</strong> {model}</p> : null}
      {frames.length > 0 ? <p><strong>Cadres :</strong> {frames.join(" · ")}</p> : null}
      {expected.length > 0 ? <p><strong>Blocs à retrouver :</strong> {expected.join(" · ")}</p> : null}
      <div className={styles.feedback}>Cette activité orale n’est pas notée automatiquement. Enregistre-toi ou réalise-la à voix haute, puis confirme.</div>
      <div className={styles.recorder}>
        <button type="button" className={done ? styles.primary : styles.button} onClick={onDone}>
          {done ? "Activité réalisée ✓" : "J’ai réalisé l’activité à voix haute"}
        </button>
      </div>
    </>
  );
}

function UnitValidationExercise({
  exercise,
  scores,
  done,
  onScore,
  onDone,
}: {
  exercise: RacinesExercise;
  scores: Record<string, number>;
  done: boolean;
  onScore: (index: number, score: number) => void;
  onDone: () => void;
}) {
  const rubric = Array.isArray(exercise.rubric) ? exercise.rubric.filter(isRecord) : [];
  const score = rubric.reduce((sum, _item, index) => sum + (scores[String(index)] ?? 0), 0);
  const complete = rubric.every((_item, index) => typeof scores[String(index)] === "number");
  const pass = complete && score >= Number(exercise.passingScore ?? 6);
  return (
    <>
      <div className={styles.audioNotice}>
        La prononciation n’est pas mesurée par l’application dans ce pilote. Utilise la grille après t’être réécouté ; ne donne 2/2 que si le critère est réellement tenu.
      </div>
      <div className={styles.rubric}>
        {rubric.map((item, index) => (
          <label className={styles.rubricRow} key={`${asString(item.criterion)}-${index}`}>
            <span><strong>{asString(item.criterion)}</strong>{asString(item.description) ? ` · ${asString(item.description)}` : ""}</span>
            <select value={scores[String(index)] ?? ""} onChange={(event) => onScore(index, Number(event.target.value))}>
              <option value="">—</option>
              <option value="0">0 / 2</option>
              <option value="1">1 / 2</option>
              <option value="2">2 / 2</option>
            </select>
          </label>
        ))}
      </div>
      <div className={styles.result}>
        <h2>{complete ? `${score} / ${exercise.maxScore ?? 8}` : "Grille à compléter"}</h2>
        <p>{complete ? (pass ? asString(exercise.successMessage) || "Seuil atteint." : asString(exercise.reviewMessage) || "Révision recommandée avant une nouvelle tentative.") : "Évalue les quatre critères après ta production orale."}</p>
      </div>
      <div className={styles.recorder}>
        <button type="button" className={done ? styles.primary : styles.button} onClick={onDone}>
          {done ? "Production orale réalisée ✓" : "J’ai réalisé la production orale"}
        </button>
      </div>
    </>
  );
}

export function RacinesLessonPreview({ courseId, courseTitle, languageCode, languageLabel, unit, lesson, locale, nextLesson }: Props) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [oralDone, setOralDone] = useState<Record<string, boolean>>({});
  const [rubricScores, setRubricScores] = useState<Record<string, Record<string, number>>>({});
  const [savedProgress, setSavedProgress] = useState<PreviewProgress>(emptyProgress());
  const [submitted, setSubmitted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setSavedProgress(readProgress(courseId));
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  const alreadyCompleted = savedProgress.completedLessonIds.includes(lesson.id);
  const attemptedCount = useMemo(
    () => lesson.exercises.filter((exercise) => isAttempted(exercise, checked, oralDone, rubricScores)).length,
    [lesson.exercises, checked, oralDone, rubricScores],
  );
  const allAttempted = attemptedCount === lesson.exercises.length;
  const validation = lesson.exercises.find((exercise) => exercise.type === "unitValidation") ?? null;
  const finalScore = validation ? validationScore(validation, rubricScores) : null;
  const validationPassed = !validation || (finalScore !== null && finalScore >= Number(validation.passingScore ?? 6));
  const canComplete = allAttempted && validationPassed;

  const objective = useMemo(() => {
    let total = 0;
    let correct = 0;
    for (const exercise of lesson.exercises) {
      const result = objectiveCorrect(exercise, answers[exercise.id]);
      if (result === null || !checked[exercise.id]) continue;
      total += 1;
      if (result) correct += 1;
    }
    return { total, correct };
  }, [lesson.exercises, answers, checked]);

  async function startRecording() {
    setRecordingError(null);
    try {
      if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
        setRecordingError("L’enregistrement n’est pas disponible dans ce navigateur. Réalise l’activité à voix haute et utilise la confirmation manuelle.");
        return;
      }
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(null);
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecordingError("Le microphone n’a pas pu être ouvert. Tu peux quand même faire l’activité à voix haute et la confirmer manuellement.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    setRecording(false);
  }

  function completeLesson() {
    if (!canComplete && !alreadyCompleted) return;
    const current = readProgress(courseId);
    const firstCompletion = !current.completedLessonIds.includes(lesson.id);
    const completedLessonIds = firstCompletion ? [...current.completedLessonIds, lesson.id] : current.completedLessonIds;
    const validationScores = finalScore === null
      ? current.validationScores
      : { ...current.validationScores, [lesson.id]: finalScore };
    const nextProgress: PreviewProgress = {
      completedLessonIds,
      validationScores,
      xp: firstCompletion ? current.xp + lesson.xp : current.xp,
    };
    writeProgress(courseId, nextProgress);
    setSavedProgress(nextProgress);
    setSubmitted(true);
  }

  const base = `/${locale}/qa/racines-course-preview/${courseId}`;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`${base}/${unit.id}`}>← Mission {unit.order}</Link>
        </header>

        <div className={styles.pilot} role="note">
          <strong>Prototype éditorial · {languageLabel} · test interne</strong>
          Contenu en relecture native. Les notes linguistiques et sources sont masquées côté apprenant ; aucune synthèse vocale n’est utilisée comme référence.
        </div>

        <section className={styles.lessonHero}>
          <p className={styles.eyebrow}>{lesson.stage} · MISSION {unit.order} · É1</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.objective}</p>
          <div className={styles.metaRow}>
            <span className={styles.chip}>{lesson.durationMinutes} min</span>
            <span className={styles.chip}>{lesson.xp} XP</span>
            <span className={styles.chip}>{attemptedCount}/{lesson.exercises.length} activités réalisées</span>
            <span className={styles.chip}>{savedProgress.xp} XP QA</span>
          </div>
          <div className={styles.progress}><span style={{ width: `${Math.round((attemptedCount / Math.max(1, lesson.exercises.length)) * 100)}%` }} /></div>
        </section>

        <section className={styles.card}>
          <p className={styles.eyebrow}>SCRIPT ORAL · AUDIO NATIF À PRODUIRE</p>
          <h2>{unit.coreAudioScene.title}</h2>
          <p>{unit.coreAudioScene.context}</p>
          <div className={styles.audioNotice}>Audio natif non produit — le script reste visible pour QA. Les futures pistes lentes, naturelles et ligne par ligne devront être validées par un locuteur compétent.</div>
          <div className={styles.dialogue}>
            {unit.coreAudioScene.lines.map((line, index) => (
              <div className={styles.line} key={`${line.speaker}-${index}`}>
                <strong>{line.speaker} · {line.target}</strong>
                <span>{line.fr}</span>
              </div>
            ))}
          </div>
          <div className={styles.phrases}>
            {unit.phrases.map((phrase, index) => (
              <div className={styles.phrase} key={`${phrase.target}-${index}`}>
                <strong>{phrase.target}</strong>
                <span>{phrase.fr}</span>
                <em>Prononciation : {phrase.pronunciationGuide}</em>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ta voix</h2>
          <div className={styles.card}>
            <p>Enregistrement local au navigateur pour ce test. Il n’est pas envoyé au serveur et disparaît lorsque tu quittes ou recharges la page.</p>
            <div className={styles.recorder}>
              {!recording
                ? <button type="button" className={styles.primary} onClick={startRecording}>● Enregistrer ma voix</button>
                : <button type="button" className={styles.primary} onClick={stopRecording}>■ Arrêter</button>}
              {recordingUrl ? <audio controls src={recordingUrl} aria-label="Écouter mon enregistrement" /> : null}
            </div>
            {recordingError ? <div className={styles.feedback}>{recordingError}</div> : null}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3 activités</h2>
          <div className={styles.exerciseList}>
            {lesson.exercises.map((exercise, index) => (
              <article className={styles.exercise} key={exercise.id}>
                <p className={styles.eyebrow}>ACTIVITÉ {index + 1} · {exercise.type}</p>
                <h3>{exercise.prompt}</h3>
                {SINGLE_CHOICE_TYPES.has(exercise.type) ? (
                  <SingleChoiceExercise
                    exercise={exercise}
                    value={answers[exercise.id]}
                    checked={checked[exercise.id] === true}
                    onChoose={(value) => setAnswers((current) => ({ ...current, [exercise.id]: value }))}
                    onCheck={() => setChecked((current) => ({ ...current, [exercise.id]: true }))}
                  />
                ) : exercise.type === "dialogueOrder" ? (
                  <DialogueOrderExercise
                    exercise={exercise}
                    value={answers[exercise.id]}
                    checked={checked[exercise.id] === true}
                    onChange={(value) => setAnswers((current) => ({ ...current, [exercise.id]: value }))}
                    onCheck={() => setChecked((current) => ({ ...current, [exercise.id]: true }))}
                  />
                ) : exercise.type === "matchMeaning" ? (
                  <MatchMeaningExercise
                    exercise={exercise}
                    value={answers[exercise.id]}
                    checked={checked[exercise.id] === true}
                    onChange={(value) => setAnswers((current) => ({ ...current, [exercise.id]: value }))}
                    onCheck={() => setChecked((current) => ({ ...current, [exercise.id]: true }))}
                  />
                ) : exercise.type === "unitValidation" ? (
                  <UnitValidationExercise
                    exercise={exercise}
                    scores={rubricScores[exercise.id] ?? {}}
                    done={oralDone[exercise.id] === true}
                    onScore={(rubricIndex, score) => setRubricScores((current) => ({
                      ...current,
                      [exercise.id]: { ...(current[exercise.id] ?? {}), [String(rubricIndex)]: score },
                    }))}
                    onDone={() => setOralDone((current) => ({ ...current, [exercise.id]: true }))}
                  />
                ) : (
                  <OralExercise
                    exercise={exercise}
                    done={oralDone[exercise.id] === true}
                    onDone={() => setOralDone((current) => ({ ...current, [exercise.id]: true }))}
                  />
                )}
              </article>
            ))}
          </div>
        </section>

        {validation && finalScore !== null && finalScore < Number(validation.passingScore ?? 6) ? (
          <div className={styles.result}>
            <h2>{finalScore}/8 · révision recommandée</h2>
            <p>{asString(validation.reviewMessage) || "Réécoute le modèle et refais la production avant de valider la mission."}</p>
          </div>
        ) : null}

        <div className={styles.result}>
          <h2>{alreadyCompleted || submitted ? "Étape terminée" : canComplete ? "Prêt à terminer" : "Continue la mission"}</h2>
          <p>
            {objective.total > 0 ? `${objective.correct}/${objective.total} activités à réponse objective réussies. ` : ""}
            {validation && finalScore !== null ? `Validation orale auto-évaluée : ${finalScore}/8. ` : ""}
            Les activités orales de production restent des preuves de participation et d’auto-évaluation, pas une mesure automatique de prononciation.
          </p>
          <div className={styles.resultActions}>
            {!alreadyCompleted && !submitted ? (
              <button type="button" className={styles.primary} disabled={!canComplete} onClick={completeLesson}>
                {validation ? "Valider cette mission" : "Terminer cette étape"}
              </button>
            ) : null}
            {(alreadyCompleted || submitted) && nextLesson ? (
              <Link className={styles.primary} href={`${base}/${nextLesson.unitId}/${nextLesson.lessonId}`}>Suivant · {nextLesson.title} →</Link>
            ) : null}
            {(alreadyCompleted || submitted) && !nextLesson ? (
              <Link className={styles.primary} href={base}>É1 parcouru · voir les 8 missions</Link>
            ) : null}
            <Link className={styles.secondary} href={`${base}/${unit.id}`}>Retour à la mission</Link>
          </div>
        </div>

        <p className={styles.footerNote}>QA interne · {courseTitle} · langue {languageCode}. Cette progression est locale au navigateur et n’ouvre aucun accès commercial ni certification.</p>
      </div>
    </main>
  );
}
