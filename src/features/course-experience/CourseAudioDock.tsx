"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CourseLesson, CourseUnit } from "@/data/courses/types";
import { buildLessonAudioContent, type CourseAudioItem } from "@/lib/course-content/audio";
import styles from "./CourseAudioDock.module.css";

type Props = {
  unit: CourseUnit;
  lesson: CourseLesson;
};

type RecordingState = "idle" | "recording" | "ready" | "error";

function selectGermanVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const german = voices.filter((voice) => /^de([-_]|$)/i.test(voice.lang));
  const preferred = [...german].sort((a, b) => {
    const score = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLocaleLowerCase();
      return Number(name.includes("natural")) * 8
        + Number(name.includes("neural")) * 7
        + Number(name.includes("google")) * 5
        + Number(name.includes("microsoft")) * 4
        + Number(name.includes("apple")) * 3
        + Number(voice.localService) * 1;
    };
    return score(b) - score(a);
  });
  return preferred.slice(0, 2);
}

function AudioList({
  title,
  items,
  currentId,
  onSpeak,
}: {
  title: string;
  items: CourseAudioItem[];
  currentId: string | null;
  onSpeak: (items: CourseAudioItem[]) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3>{title}</h3>
        <button type="button" className={styles.textButton} onClick={() => onSpeak(items)}>Tout écouter</button>
      </div>
      <div className={styles.itemList}>
        {items.map((item) => (
          <button
            type="button"
            className={`${styles.audioItem} ${currentId === item.id ? styles.audioItemActive : ""}`}
            key={item.id}
            onClick={() => onSpeak([item])}
          >
            <span className={styles.playIcon} aria-hidden="true">▶</span>
            <span>
              <strong>{item.label}</strong>
              <span className={styles.german}>{item.text}</span>
              {item.translation ? <span className={styles.translation}>{item.translation}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function CourseAudioDock({ unit, lesson }: Props) {
  const content = useMemo(() => buildLessonAudioContent(unit, lesson), [unit, lesson]);
  const oralExercise = lesson.exercises.find((exercise) => exercise.type === "oralRecording" || exercise.type === "oralAssessment") ?? null;
  const [open, setOpen] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "slow">("normal");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const speechRunRef = useRef(0);

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const selectedVoices = useMemo(() => selectGermanVoices(voices), [voices]);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSpeechSupported(false);
      return;
    }
    const syncVoices = () => setVoices(window.speechSynthesis.getVoices());
    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
      speechRunRef.current += 1;
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [recordingUrl]);

  const stopSpeech = () => {
    if (!speechSupported) return;
    speechRunRef.current += 1;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentId(null);
  };

  const speak = (items: CourseAudioItem[]) => {
    if (!speechSupported || items.length === 0) return;
    const synth = window.speechSynthesis;
    const runId = speechRunRef.current + 1;
    speechRunRef.current = runId;
    synth.cancel();
    setIsSpeaking(true);
    setIsPaused(false);

    const playAt = (index: number) => {
      if (speechRunRef.current !== runId) return;
      const item = items[index];
      if (!item) {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentId(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = "de-DE";
      utterance.rate = speed === "slow" ? 0.72 : 0.96;
      utterance.pitch = item.voiceSlot === 0 ? 1 : 0.94;
      utterance.volume = 1;
      const voice = selectedVoices[item.voiceSlot] ?? selectedVoices[0];
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setCurrentId(item.id);
      utterance.onend = () => playAt(index + 1);
      utterance.onerror = (event) => {
        if (event.error === "canceled" || event.error === "interrupted") return;
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentId(null);
      };
      synth.speak(utterance);
    };

    playAt(0);
  };

  const pauseOrResume = () => {
    if (!speechSupported || !isSpeaking) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const startRecording = async () => {
    setRecordingError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingState("error");
      setRecordingError("L’enregistrement n’est pas disponible sur ce navigateur.");
      return;
    }
    try {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(null);
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const supportedMime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordingUrl(URL.createObjectURL(blob));
        setRecordingState("ready");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      setRecordingState("recording");
    } catch (error) {
      setRecordingState("error");
      setRecordingError(error instanceof DOMException && error.name === "NotAllowedError"
        ? "Autorise le microphone pour t’enregistrer."
        : "Impossible de démarrer le microphone.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const closeDock = () => {
    stopSpeech();
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className={styles.floatingButton} onClick={() => setOpen(true)}>
        <span aria-hidden="true">🔊</span>
        Audio allemand
      </button>
    );
  }

  return (
    <aside className={styles.dock} aria-label="Audio de la leçon">
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>UNITÉ {unit.order} · AUDIO</div>
          <h2>{lesson.title}</h2>
        </div>
        <button type="button" className={styles.close} aria-label="Fermer l’audio" onClick={closeDock}>×</button>
      </header>

      <div className={styles.toolbar}>
        <button type="button" className={styles.primary} disabled={!speechSupported || content.all.length === 0} onClick={() => speak(content.all)}>
          ▶ Écouter la leçon
        </button>
        <button type="button" className={styles.control} disabled={!isSpeaking} onClick={pauseOrResume}>{isPaused ? "Reprendre" : "Pause"}</button>
        <button type="button" className={styles.control} disabled={!isSpeaking} onClick={stopSpeech}>Stop</button>
      </div>

      <div className={styles.speedRow} aria-label="Vitesse de lecture">
        <span>Vitesse</span>
        <button type="button" className={speed === "normal" ? styles.speedActive : styles.speed} onClick={() => setSpeed("normal")}>Normale</button>
        <button type="button" className={speed === "slow" ? styles.speedActive : styles.speed} onClick={() => setSpeed("slow")}>Lente</button>
      </div>

      {!speechSupported ? <p className={styles.notice}>La synthèse vocale n’est pas disponible sur ce navigateur. Le script écrit reste accessible dans la leçon.</p> : null}
      {speechSupported && selectedVoices.length === 0 ? <p className={styles.notice}>La voix allemande par défaut de ton appareil sera utilisée.</p> : null}

      <div className={styles.scrollArea}>
        <AudioList title="Dialogue" items={content.dialogue} currentId={currentId} onSpeak={speak} />
        <AudioList title="Phrases et modèles" items={content.phrases} currentId={currentId} onSpeak={speak} />
        <AudioList title="Prononciation" items={content.pronunciation} currentId={currentId} onSpeak={speak} />

        {oralExercise ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}><h3>Entraîne ta voix</h3></div>
            <p className={styles.recordPrompt}>{oralExercise.prompt}</p>
            {oralExercise.minimumSeconds ? <p className={styles.hint}>Objectif : au moins {oralExercise.minimumSeconds} secondes.</p> : null}
            <div className={styles.recordActions}>
              {recordingState !== "recording" ? (
                <button type="button" className={styles.recordButton} onClick={startRecording}>● S’enregistrer</button>
              ) : (
                <button type="button" className={styles.stopRecordButton} onClick={stopRecording}>■ Arrêter</button>
              )}
            </div>
            {recordingUrl ? <audio className={styles.audioPreview} controls src={recordingUrl}>Ton navigateur ne peut pas lire cet enregistrement.</audio> : null}
            {recordingError ? <p className={styles.error}>{recordingError}</p> : null}
            <p className={styles.privacy}>Cet entraînement reste sur ton appareil et n’est pas envoyé à YEMA.</p>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
