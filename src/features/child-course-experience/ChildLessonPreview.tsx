"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChildExercise, ChildLesson, ChildUnit, YemaChildCourseContent } from "@/content/child-courses/types";
import styles from "./ChildPreview.module.css";

type NextLesson = { unitId: string; lessonId: string; title: string } | null;
type Progress = { completedLessonIds: string[]; xp: number };

type Props = {
  locale: string;
  course: YemaChildCourseContent;
  unit: ChildUnit;
  lesson: ChildLesson;
  nextLesson: NextLesson;
};

const OBJECTIVE_TYPES = new Set([
  "soundHunt",
  "oddOneOut",
  "pictureChoice",
  "pictureRecognition",
  "listenTap",
  "listenForWord",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function arrayRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function progressKey(courseId: string) {
  return `yema.prod.child.${courseId}`;
}

function emptyProgress(): Progress {
  return { completedLessonIds: [], xp: 0 };
}

function readProgress(courseId: string): Progress {
  try {
    const raw = window.localStorage.getItem(progressKey(courseId));
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds.filter((id): id is string => typeof id === "string")
        : [],
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
    };
  } catch {
    return emptyProgress();
  }
}

function writeProgress(courseId: string, progress: Progress) {
  try {
    window.localStorage.setItem(progressKey(courseId), JSON.stringify(progress));
  } catch {
    // The production test still works if browser storage is blocked.
  }
}

function visualChoices(unit: ChildUnit): Array<{ id: string; label: string }> {
  const source = Array.isArray(unit.visualChoices) ? unit.visualChoices : Array.isArray(unit.visuals) ? unit.visuals : [];
  return source.filter(isRecord).map((item) => ({ id: asString(item.id), label: asString(item.label) })).filter((item) => item.id && item.label);
}

function exerciseChoices(exercise: ChildExercise, unit: ChildUnit): Array<{ value: string; label: string }> {
  if (Array.isArray(exercise.choices)) {
    return exercise.choices.map((choice) => {
      if (typeof choice === "string") return { value: choice, label: choice };
      if (isRecord(choice)) return { value: asString(choice.id) || asString(choice.label), label: asString(choice.label) || asString(choice.id) };
      return { value: "", label: "" };
    }).filter((choice) => choice.value && choice.label);
  }
  if (exercise.type === "listenTap" || exercise.type === "listenForWord") {
    return visualChoices(unit).map((choice) => ({ value: choice.id, label: choice.label }));
  }
  return [];
}

function expectedAnswer(exercise: ChildExercise): string {
  return asString(exercise.answerId) || asString(exercise.answer) || asString(exercise.visualTargetId) || asString(exercise.visualId);
}

function targetText(exercise: ChildExercise): string {
  return asString(exercise.targetText) || asString(exercise.target) || asString(exercise.modelAnswer) || asString(exercise.childModelAnswer);
}

function canBrowserSpeak(languageCode: string) {
  return languageCode === "de";
}

export function ChildLessonPreview({ locale, course, unit, lesson, nextLesson }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState<Progress>(emptyProgress());
  const [submitted, setSubmitted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const courseId = course.course.id;
  const languageCode = course.course.learningLanguage.code;
  const base = `/${locale}/qa/child-course-preview/${courseId}`;

  useEffect(() => {
    setSaved(readProgress(courseId));
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [courseId]);

  useEffect(() => () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  const attempted = useMemo(() => lesson.exercises.filter((exercise) => OBJECTIVE_TYPES.has(exercise.type) ? checked[exercise.id] : done[exercise.id]).length, [lesson.exercises, checked, done]);
  const allAttempted = attempted === lesson.exercises.length;
  const alreadyCompleted = saved.completedLessonIds.includes(lesson.id);
  const activeExercise = lesson.exercises[Math.min(activeIndex, lesson.exercises.length - 1)];

  function speak(text: string) {
    if (!text || !canBrowserSpeak(languageCode) || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  async function startRecording() {
    setRecordingError(null);
    try {
      if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
        setRecordingError("Le microphone n’est pas disponible dans ce navigateur.");
        return;
      }
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
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
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecordingError("Le navigateur n’a pas autorisé le microphone. L’activité peut être faite à voix haute sans enregistrement.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
  }

  function markExerciseDone(exerciseId: string) {
    setDone((current) => ({ ...current, [exerciseId]: true }));
  }

  function completeLesson() {
    if (!allAttempted && !alreadyCompleted) return;
    const current = readProgress(courseId);
    const first = !current.completedLessonIds.includes(lesson.id);
    const next: Progress = {
      completedLessonIds: first ? [...current.completedLessonIds, lesson.id] : current.completedLessonIds,
      xp: first ? current.xp + lesson.xp : current.xp,
    };
    writeProgress(courseId, next);
    setSaved(next);
    setSubmitted(true);
  }

  function renderExercise(exercise: ChildExercise) {
    if (OBJECTIVE_TYPES.has(exercise.type)) {
      const choices = exerciseChoices(exercise, unit);
      const selected = answers[exercise.id] ?? "";
      const expected = expectedAnswer(exercise);
      const isChecked = checked[exercise.id] === true;
      return (
        <>
          {canBrowserSpeak(languageCode) && (targetText(exercise) || expected) ? (
            <div className={styles.actions}>
              <button className={styles.secondary} type="button" onClick={() => speak(targetText(exercise) || expected)}>🔊 Écouter · voix navigateur provisoire</button>
            </div>
          ) : null}
          <div className={styles.bigActions}>
            {choices.map((choice) => {
              const selectedClass = selected === choice.value ? styles.choiceActive : "";
              const checkedClass = isChecked
                ? choice.value === expected
                  ? styles.choiceCorrect
                  : selected === choice.value
                    ? styles.choiceWrong
                    : ""
                : "";
              return (
                <button key={choice.value} type="button" className={`${styles.choice} ${selectedClass} ${checkedClass}`} onClick={() => setAnswers((current) => ({ ...current, [exercise.id]: choice.value }))}>
                  {choice.label}
                </button>
              );
            })}
          </div>
          <div className={styles.actions}>
            <button className={styles.primary} type="button" disabled={!selected} onClick={() => setChecked((current) => ({ ...current, [exercise.id]: true }))}>Vérifier</button>
          </div>
          {isChecked ? (
            <div className={styles.feedback}>
              {selected === expected ? asString(exercise.feedbackCorrect) || "Bravo !" : asString(exercise.feedbackIncorrect) || "Pas encore. Regarde et réessaie."}
            </div>
          ) : null}
        </>
      );
    }

    const model = targetText(exercise);
    const sequences = Array.isArray(exercise.sequence) ? exercise.sequence.filter((item): item is string => typeof item === "string") : [];
    const pairs = arrayRecords(exercise.pairs);
    const rounds = Array.isArray(exercise.rounds) ? exercise.rounds.filter((item): item is string => typeof item === "string") : [];
    const completed = done[exercise.id] === true;
    return (
      <>
        {model ? <div className={styles.feedback}><strong>Modèle :</strong> {model}</div> : null}
        {sequences.length ? <div className={styles.feedback}><strong>À dire :</strong> {sequences.join(" · ")}</div> : null}
        {rounds.length ? <div className={styles.feedback}><strong>Jeu :</strong> {rounds.join(" · ")}</div> : null}
        {pairs.length ? <div className={styles.feedback}><strong>Associations :</strong> {pairs.length} paires à réaliser ensemble.</div> : null}
        {canBrowserSpeak(languageCode) && (model || sequences[0]) ? (
          <div className={styles.actions}>
            <button className={styles.secondary} type="button" onClick={() => speak(model || sequences.join(". "))}>🔊 Modèle navigateur provisoire</button>
          </div>
        ) : null}
        <div className={styles.recorder}>
          <strong>Ma voix · privée sur cet appareil</strong>
          <div className={styles.actions}>
            {!recording
              ? <button type="button" className={styles.secondary} onClick={startRecording}>● Enregistrer</button>
              : <button type="button" className={styles.secondary} onClick={stopRecording}>■ J’ai fini</button>}
            <button type="button" className={completed ? styles.primary : styles.secondary} onClick={() => markExerciseDone(exercise.id)}>{completed ? "Activité faite ✓" : "J’ai fait l’activité"}</button>
          </div>
          {recordingUrl ? <audio controls src={recordingUrl} aria-label="Écouter ma voix" /> : null}
          {recordingError ? <div className={styles.feedback}>{recordingError}</div> : null}
        </div>
      </>
    );
  }

  const currentAttempted = activeExercise ? (OBJECTIVE_TYPES.has(activeExercise.type) ? checked[activeExercise.id] : done[activeExercise.id]) : false;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`${base}/${unit.id}`}>← Mission {unit.order}</Link>
        </header>
        <div className={styles.notice}>
          <strong>Test production · {course.course.learningLanguage.labelFr}</strong>
          {languageCode === "de" ? "La voix de navigateur sert seulement au test d’interface ; elle ne remplace pas les futurs enregistrements natifs." : "Aucune synthèse vocale n’est utilisée : le script reste la référence de test jusqu’à l’arrivée des voix natives."}
        </div>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{lesson.stage} · MISSION {unit.order}</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.objective}</p>
          <div className={styles.meta}>
            <span className={styles.chip}>{lesson.durationMinutes} min</span>
            <span className={styles.chip}>{lesson.xp} XP</span>
            <span className={styles.chip}>{attempted}/3 activités</span>
            <span className={styles.chip}>{saved.xp} XP total</span>
          </div>
          <div className={styles.progress}><span style={{ width: `${Math.round((attempted / 3) * 100)}%` }} /></div>
        </section>

        {activeExercise ? (
          <section className={styles.exerciseShell}>
            <p className={styles.eyebrow}>ACTIVITÉ {activeIndex + 1} / {lesson.exercises.length}</p>
            <h2>{activeExercise.prompt}</h2>
            {renderExercise(activeExercise)}
            <div className={styles.actions}>
              {activeIndex > 0 ? <button className={styles.secondary} type="button" onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}>← Précédent</button> : null}
              {activeIndex < lesson.exercises.length - 1 ? (
                <button className={styles.primary} type="button" disabled={!currentAttempted} onClick={() => setActiveIndex((index) => Math.min(lesson.exercises.length - 1, index + 1))}>Suivant →</button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className={styles.result}>
          <h2>{alreadyCompleted || submitted ? lesson.completionMessage : allAttempted ? "Mission prête !" : "Continue l’aventure"}</h2>
          <p>Les activités orales sont enregistrables localement mais ne reçoivent aucune fausse note de prononciation.</p>
          <div className={styles.actions}>
            {!alreadyCompleted && !submitted ? <button type="button" className={styles.primary} disabled={!allAttempted} onClick={completeLesson}>Terminer · +{lesson.xp} XP</button> : null}
            {(alreadyCompleted || submitted) && nextLesson ? <Link className={styles.primary} href={`${base}/${nextLesson.unitId}/${nextLesson.lessonId}`}>Suivant · {nextLesson.title} →</Link> : null}
            {(alreadyCompleted || submitted) && !nextLesson ? <Link className={styles.primary} href={base}>Parcours terminé · revoir les missions</Link> : null}
          </div>
        </section>
        <p className={styles.footer}>Production test · progression stockée localement dans ce navigateur.</p>
      </div>
    </main>
  );
}
