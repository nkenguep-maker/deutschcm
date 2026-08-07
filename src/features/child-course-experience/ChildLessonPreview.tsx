"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChildExercise, ChildLesson, ChildUnit, YemaChildCourseContent } from "@/content/child-courses/types";
import audioStyles from "./ChildAudioControls.module.css";
import styles from "./ChildPreview.module.css";

type NextLesson = { unitId: string; lessonId: string; title: string } | null;
type Progress = { completedLessonIds: string[]; xp: number };
type Props = { locale: string; course: YemaChildCourseContent; unit: ChildUnit; lesson: ChildLesson; nextLesson: NextLesson };

const OBJECTIVE_TYPES = new Set(["soundHunt", "oddOneOut", "pictureChoice", "pictureRecognition", "listenTap", "listenForWord"]);

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function asString(value: unknown): string { return typeof value === "string" ? value : ""; }
function arrayRecords(value: unknown): Array<Record<string, unknown>> { return Array.isArray(value) ? value.filter(isRecord) : []; }
function progressKey(courseId: string) { return `yema.prod.child.${courseId}`; }
function emptyProgress(): Progress { return { completedLessonIds: [], xp: 0 }; }

function readProgress(courseId: string): Progress {
  try {
    const raw = window.localStorage.getItem(progressKey(courseId));
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds.filter((id): id is string => typeof id === "string") : [],
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
    };
  } catch { return emptyProgress(); }
}
function writeProgress(courseId: string, progress: Progress) { try { window.localStorage.setItem(progressKey(courseId), JSON.stringify(progress)); } catch {} }

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
  if (exercise.type === "listenTap" || exercise.type === "listenForWord") return visualChoices(unit).map((choice) => ({ value: choice.id, label: choice.label }));
  return [];
}
function expectedAnswer(exercise: ChildExercise): string { return asString(exercise.answerId) || asString(exercise.answer) || asString(exercise.visualTargetId) || asString(exercise.visualId); }
function targetText(exercise: ChildExercise): string { return asString(exercise.targetText) || asString(exercise.target) || asString(exercise.modelAnswer) || asString(exercise.childModelAnswer); }
function browserLanguage(languageCode: string) { return languageCode === "de" ? "de-DE" : languageCode === "ln" ? "ln-CD" : "byv-CM"; }
function quotedTarget(prompt: string): string { return prompt.match(/«\s*([^»]+?)\s*»/u)?.[1]?.trim() ?? ""; }

function exerciseAudioText(exercise: ChildExercise, unit: ChildUnit): string {
  const audioSceneId = asString(exercise.audioSceneId);
  if (audioSceneId && unit.audioScene?.id === audioSceneId) {
    return unit.audioScene.lines.map((line) => asString(line.target)).filter(Boolean).join(". ");
  }
  const model = targetText(exercise);
  if (model) return model;
  const sequence = Array.isArray(exercise.sequence) ? exercise.sequence.filter((item): item is string => typeof item === "string") : [];
  if (sequence.length) return sequence.join(". ");
  const rounds = Array.isArray(exercise.rounds) ? exercise.rounds.filter((item): item is string => typeof item === "string") : [];
  if (rounds.length) return rounds.join(". ");
  const pairs = arrayRecords(exercise.pairs).map((pair) => asString(pair.word) || asString(pair.target)).filter(Boolean);
  if (pairs.length) return pairs.join(". ");
  return quotedTarget(exercise.prompt);
}

function emojiFor(text: string) {
  const t = text.toLowerCase();
  const pairs: Array<[string[], string]> = [
    [["hund", "chien", "dog"], "🐶"], [["katze", "chat", "cat"], "🐱"], [["löwe", "lion"], "🦁"], [["affe", "singe", "monkey"], "🐒"],
    [["rot", "rouge", "red"], "🔴"], [["blau", "bleu", "blue"], "🔵"], [["grün", "vert", "green"], "🟢"], [["gelb", "jaune", "yellow"], "🟡"],
    [["mama", "maman", "mère", "mother"], "👩"], [["papa", "père", "father"], "👨"], [["famil", "famille"], "👨‍👩‍👧"],
    [["heureux", "happy", "froh"], "😄"], [["triste", "sad", "traurig"], "😢"], [["fâché", "angry", "wütend"], "😠"],
    [["école", "schule", "school"], "🎒"], [["livre", "buch", "book"], "📘"], [["crayon", "stift", "pencil"], "✏️"],
    [["bonjour", "hallo", "mbote"], "👋"], [["écoute", "listen"], "👂"], [["parle", "répète", "speak", "repeat"], "🗣️"],
    [["anniversaire", "birthday"], "🎂"], [["un", "deux", "trois", "nombre", "count"], "🔢"], [["maison", "home"], "🏠"],
  ];
  for (const [keys, emoji] of pairs) if (keys.some((key) => t.includes(key))) return emoji;
  return "✨";
}

function playChime(success: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.08, ctx.currentTime + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .28);
    gain.connect(ctx.destination);
    const frequencies = success ? [523, 659, 784] : [330, 294];
    frequencies.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;
      osc.connect(gain);
      const start = ctx.currentTime + index * .07;
      osc.start(start);
      osc.stop(start + .14);
    });
    window.setTimeout(() => void ctx.close(), 500);
  } catch {}
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
  const [audioBusyId, setAudioBusyId] = useState<string | null>(null);
  const [audioPlayed, setAudioPlayed] = useState<Record<string, boolean>>({});
  const [audioError, setAudioError] = useState<Record<string, string>>({});
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlsRef = useRef<Record<string, string>>({});

  const courseId = course.course.id;
  const languageCode = course.course.learningLanguage.code;
  const base = `/${locale}/qa/child-course-preview/${courseId}`;
  const isRacines = course.course.track === "racines";

  useEffect(() => {
    setSaved(readProgress(courseId));
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioPlayerRef.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      Object.values(audioBlobUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [courseId]);
  useEffect(() => () => { if (recordingUrl) URL.revokeObjectURL(recordingUrl); }, [recordingUrl]);

  const isObjectiveCorrect = (exercise: ChildExercise) => checked[exercise.id] === true && answers[exercise.id] === expectedAnswer(exercise);
  const attempted = useMemo(() => lesson.exercises.filter((exercise) => OBJECTIVE_TYPES.has(exercise.type) ? checked[exercise.id] && answers[exercise.id] === expectedAnswer(exercise) : done[exercise.id]).length, [lesson.exercises, checked, answers, done]);
  const allAttempted = attempted === lesson.exercises.length;
  const alreadyCompleted = saved.completedLessonIds.includes(lesson.id);
  const activeExercise = lesson.exercises[Math.min(activeIndex, lesson.exercises.length - 1)];

  function markExerciseDone(exerciseId: string) {
    setDone((current) => current[exerciseId] ? current : { ...current, [exerciseId]: true });
    playChime(true);
  }

  function speakWithBrowser(text: string, exercise: ChildExercise, fallback = false): boolean {
    if (!text || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = browserLanguage(languageCode);
    utterance.rate = 0.76;
    utterance.onend = () => {
      setAudioBusyId((current) => current === exercise.id ? null : current);
      if (exercise.type === "listenOnly") markExerciseDone(exercise.id);
    };
    utterance.onerror = () => setAudioBusyId((current) => current === exercise.id ? null : current);
    window.speechSynthesis.speak(utterance);
    setAudioPlayed((current) => ({ ...current, [exercise.id]: true }));
    if (fallback && isRacines) {
      setAudioError((current) => ({ ...current, [exercise.id]: "Voix système de secours : prononciation à valider avec un locuteur natif." }));
    }
    return true;
  }

  async function playExerciseAudio(exercise: ChildExercise) {
    const text = exerciseAudioText(exercise, unit);
    if (!text) {
      setAudioError((current) => ({ ...current, [exercise.id]: "Le script audio de cette activité est manquant." }));
      return;
    }

    setAudioError((current) => ({ ...current, [exercise.id]: "" }));
    setAudioBusyId(exercise.id);
    audioPlayerRef.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    if (languageCode === "de" && speakWithBrowser(text, exercise)) return;

    try {
      let url = audioBlobUrlsRef.current[exercise.id];
      if (!url) {
        const params = new URLSearchParams({ courseId, unitId: unit.id, lessonId: lesson.id, exerciseId: exercise.id });
        const response = await fetch(`/api/qa/child-course-audio?${params.toString()}`);
        if (!response.ok) throw new Error(`audio-${response.status}`);
        const blob = await response.blob();
        url = URL.createObjectURL(blob);
        audioBlobUrlsRef.current[exercise.id] = url;
      }

      const player = new Audio(url);
      audioPlayerRef.current = player;
      player.onended = () => {
        setAudioBusyId((current) => current === exercise.id ? null : current);
        if (exercise.type === "listenOnly") markExerciseDone(exercise.id);
      };
      player.onerror = () => setAudioBusyId((current) => current === exercise.id ? null : current);
      await player.play();
      setAudioPlayed((current) => ({ ...current, [exercise.id]: true }));
    } catch {
      if (!speakWithBrowser(text, exercise, true)) {
        setAudioBusyId(null);
        setAudioError((current) => ({ ...current, [exercise.id]: "Impossible de lancer le son pour le moment. Réessaie dans un instant." }));
      }
    }
  }

  async function startRecording() {
    setRecordingError(null);
    try {
      if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) { setRecordingError("Tu peux faire cette activité à voix haute sans enregistrer."); return; }
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
    } catch { setRecordingError("Le micro n’est pas disponible. Dis simplement la phrase à voix haute."); }
  }
  function stopRecording() { if (recorderRef.current?.state && recorderRef.current.state !== "inactive") recorderRef.current.stop(); setRecording(false); }

  function completeLesson() {
    if (!allAttempted && !alreadyCompleted) return;
    const current = readProgress(courseId);
    const first = !current.completedLessonIds.includes(lesson.id);
    const next: Progress = { completedLessonIds: first ? [...current.completedLessonIds, lesson.id] : current.completedLessonIds, xp: first ? current.xp + lesson.xp : current.xp };
    writeProgress(courseId, next);
    setSaved(next);
    setSubmitted(true);
    playChime(true);
  }

  function choose(exercise: ChildExercise, value: string) {
    setAnswers((current) => ({ ...current, [exercise.id]: value }));
    if (checked[exercise.id]) setChecked((current) => ({ ...current, [exercise.id]: false }));
  }
  function verify(exercise: ChildExercise) {
    const selected = answers[exercise.id] ?? "";
    if (!selected) return;
    setChecked((current) => ({ ...current, [exercise.id]: true }));
    playChime(selected === expectedAnswer(exercise));
  }

  function renderAudioControl(exercise: ChildExercise) {
    const text = exerciseAudioText(exercise, unit);
    if (!text) return null;
    const busy = audioBusyId === exercise.id;
    const replay = audioPlayed[exercise.id] === true;
    const scene = asString(exercise.audioSceneId) === unit.audioScene?.id;
    const label = busy ? "🔊 Lecture…" : replay ? "↻ Réécouter" : scene ? "▶ Écouter l’histoire" : "▶ Écouter le son";
    return (
      <div className={audioStyles.audioCard}>
        <strong>🔊 D’abord, écoute</strong>
        <p>{scene ? "Écoute la petite scène. Tu peux la relancer autant de fois que tu veux." : "Écoute le mot ou la phrase avant de répondre ou de répéter."}</p>
        <button className={audioStyles.listenButton} type="button" disabled={busy} onClick={() => void playExerciseAudio(exercise)}>{label}</button>
        {isRacines ? <small className={audioStyles.note}>Voix de test uniquement · l’audio natif et la prononciation restent à valider.</small> : null}
        {audioError[exercise.id] ? <small className={audioStyles.error}>{audioError[exercise.id]}</small> : null}
      </div>
    );
  }

  function renderExercise(exercise: ChildExercise) {
    if (OBJECTIVE_TYPES.has(exercise.type)) {
      const choices = exerciseChoices(exercise, unit);
      const selected = answers[exercise.id] ?? "";
      const expected = expectedAnswer(exercise);
      const isChecked = checked[exercise.id] === true;
      const correct = isObjectiveCorrect(exercise);
      const heard = targetText(exercise) || quotedTarget(exercise.prompt) || expected;
      return (
        <>
          {renderAudioControl(exercise)}
          <div className={styles.visualPrompt} aria-hidden="true">{emojiFor(heard || exercise.prompt)}</div>
          <div className={styles.bigActions}>
            {choices.map((choice) => {
              const selectedClass = selected === choice.value ? styles.choiceActive : "";
              const checkedClass = isChecked ? choice.value === expected ? styles.choiceCorrect : selected === choice.value ? styles.choiceWrong : "" : "";
              return <button key={choice.value} type="button" className={`${styles.choice} ${selectedClass} ${checkedClass}`} onClick={() => choose(exercise, choice.value)}><span className={styles.choiceEmoji}>{emojiFor(choice.label)}</span>{choice.label}</button>;
            })}
          </div>
          {!correct ? <div className={styles.actions}><button className={styles.primary} type="button" disabled={!selected} onClick={() => verify(exercise)}>Vérifier</button></div> : null}
          {isChecked ? <div className={`${styles.feedback} ${correct ? styles.feedbackSuccess : styles.feedbackTry}`}>{correct ? `🌟 ${asString(exercise.feedbackCorrect) || "Bravo ! Tu l’as trouvé !"}` : `💛 ${asString(exercise.feedbackIncorrect) || "Presque ! Regarde bien et essaie une autre réponse."}`}</div> : null}
        </>
      );
    }

    const model = targetText(exercise);
    const sequences = Array.isArray(exercise.sequence) ? exercise.sequence.filter((item): item is string => typeof item === "string") : [];
    const pairs = arrayRecords(exercise.pairs);
    const rounds = Array.isArray(exercise.rounds) ? exercise.rounds.filter((item): item is string => typeof item === "string") : [];
    const completed = done[exercise.id] === true;
    const phrase = exerciseAudioText(exercise, unit);

    if (exercise.type === "listenOnly") {
      return (
        <>
          {renderAudioControl(exercise)}
          <div className={styles.visualPrompt} aria-hidden="true">👂</div>
          {completed ? <div className={`${styles.feedback} ${styles.feedbackSuccess}`}>🌟 C’est écouté ! Tu peux continuer.</div> : <div className={styles.feedback}>Le bouton devient une réécoute après la première lecture. L’activité se valide quand le son est terminé.</div>}
        </>
      );
    }

    return (
      <>
        {renderAudioControl(exercise)}
        <div className={styles.visualPrompt} aria-hidden="true">{emojiFor(phrase || exercise.prompt)}</div>
        {model ? <div className={styles.feedback}><strong>🎯 Essaie de dire :</strong> {model}</div> : null}
        {sequences.length ? <div className={styles.treasure}>🗣️ {sequences.join(" · ")}</div> : null}
        {rounds.length ? <div className={styles.treasure}>🎲 {rounds.join(" · ")}</div> : null}
        {pairs.length ? <div className={styles.treasure}>🧩 {pairs.length} associations à retrouver.</div> : null}
        <div className={styles.recorder}>
          <strong>🎙️ À toi de parler</strong>
          <p>Tu peux t’enregistrer pour t’écouter. Ta voix reste sur cet appareil.</p>
          {!recording ? <button type="button" className={styles.recordButton} onClick={startRecording}>● Enregistrer ma voix</button> : <button type="button" className={`${styles.recordButton} ${styles.recording}`} onClick={stopRecording}>■ J’ai fini</button>}
          {recordingUrl ? <audio controls src={recordingUrl} aria-label="Écouter ma voix" /> : null}
          {recordingError ? <div className={styles.feedback}>{recordingError}</div> : null}
          <div className={styles.actions}><button type="button" className={completed ? styles.primary : styles.secondary} onClick={() => markExerciseDone(exercise.id)}>{completed ? "🌟 C’est fait !" : "J’ai essayé à voix haute"}</button></div>
        </div>
      </>
    );
  }

  const currentAttempted = activeExercise ? (OBJECTIVE_TYPES.has(activeExercise.type) ? isObjectiveCorrect(activeExercise) : done[activeExercise.id]) : false;
  const success = alreadyCompleted || submitted;

  return (
    <main className={styles.page} data-universe={isRacines ? "racines" : "monde"}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}><span className={styles.brandMark}>Y</span> YEMA KIDS</Link>
          <Link className={styles.back} href={`${base}/${unit.id}`}>✕</Link>
        </header>

        <section className={styles.hero}>
          <p className={styles.eyebrow}>{lesson.stage} · MISSION {unit.order}</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.objective}</p>
          <div className={styles.meta}><span className={styles.chip}>⚡ {lesson.xp} XP</span><span className={styles.chip}>⭐ {saved.xp} total</span><span className={styles.chip}>{attempted}/3</span></div>
          <div className={styles.progress}><span style={{ width: `${Math.round((attempted / lesson.exercises.length) * 100)}%` }} /></div>
        </section>

        {activeExercise && !success ? (
          <section className={styles.exerciseShell}>
            <span className={styles.miniGuide} aria-hidden="true" />
            <div className={styles.exerciseTop}><span className={styles.exerciseBadge}>ACTIVITÉ {activeIndex + 1} / {lesson.exercises.length}</span></div>
            <h2>{activeExercise.prompt}</h2>
            {renderExercise(activeExercise)}
            <div className={styles.actions}>
              {activeIndex > 0 ? <button className={styles.secondary} type="button" onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}>← Retour</button> : null}
              {activeIndex < lesson.exercises.length - 1 && currentAttempted ? <button className={styles.primary} type="button" onClick={() => setActiveIndex((index) => Math.min(lesson.exercises.length - 1, index + 1))}>Continuer →</button> : null}
            </div>
          </section>
        ) : null}

        {!success && allAttempted ? <section className={styles.result}><h2>✨ Les 3 activités sont faites !</h2><p>Valide la petite mission pour gagner ta récompense.</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={completeLesson}>Gagner +{lesson.xp} XP ⭐</button></div></section> : null}

        {success ? <section className={`${styles.result} ${styles.resultSuccess}`}><h2>{lesson.completionMessage || "Bravo ! Mission réussie !"}</h2><p>Tu viens d’avancer sur ton chemin.</p><div className={styles.rewardBurst}><span>⭐</span><span>✨</span><span>🏆</span></div><div className={styles.actions}>{nextLesson ? <Link className={styles.primary} href={`${base}/${nextLesson.unitId}/${nextLesson.lessonId}`}>Prochaine étape →</Link> : <Link className={styles.primary} href={base}>Voir mon chemin →</Link>}</div></section> : null}

        <p className={styles.footer}>YEMA Kids · version de test · aucune note automatique de prononciation.</p>
      </div>
    </main>
  );
}
