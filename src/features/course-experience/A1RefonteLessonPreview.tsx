"use client";

import { useMemo, useState } from "react";
import refonte from "@/data/courses/monde/adulte/de-a1-refonte/u1.json";
import legacyU1 from "@/data/courses/monde/adulte/de-a1/u1.json";
import type {
  GermanA1RefonteUnit,
  RefonteExercise,
  RefonteLesson,
  RefonteRemediation,
} from "@/data/courses/monde/adulte/de-a1-refonte/types";
import { evaluateRefonteExercise } from "@/lib/course-content/refonteScoring";
import styles from "@/features/course-experience/CourseExperience.module.css";

const data = refonte as unknown as GermanA1RefonteUnit;
type AnswerValue = string | string[] | boolean;
type AnswerMap = Record<string, AnswerValue>;
type CheckMap = Record<string, boolean>;

function audioText(ref: string | undefined): string | null {
  if (!ref) return null;
  const dialogue = legacyU1.coreDialogue.audioScript;
  const dialogueMap: Record<string, string> = {
    "de-a1-u1-dialogue#seg1b": "Ich heiße Anna.",
    "de-a1-u1-dialogue#seg2": dialogue[1]?.de ?? "Ich heiße Karim.",
    "de-a1-u1-dialogue#seg4": dialogue[3]?.de ?? "Ich komme aus Kamerun und wohne in Berlin.",
    "drill.u1.wo-woher": "Woher kommst du?",
    "drill.u1.s1": "Ich heiße Karim.",
    "drill.u1.s2": "Ich heiße Karim und ich komme aus Kamerun.",
    "drill.u1.s3": "Ich heiße Karim, ich komme aus Kamerun und ich wohne in Berlin.",
  };
  return dialogueMap[ref] ?? null;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function AudioButton({ audioRef, label = "Écouter" }: { audioRef?: string; label?: string }) {
  const text = audioText(audioRef);
  if (!text) return null;
  return (
    <button type="button" className={styles.secondary} onClick={() => speak(text)}>
      ▶ {label}
    </button>
  );
}

function Reveille({ lesson }: { lesson: RefonteLesson }) {
  const cards = data.cards.filter((card) => lesson.reveil.cardIds.includes(card.id));
  return (
    <section className={styles.card}>
      <div className={styles.eyebrow}>RÉVEIL · 60–90 S</div>
      <h2>{cards.length > 0 ? "Réactive avant d’apprendre" : "Première leçon du niveau"}</h2>
      {cards.length > 0 ? (
        <div className={styles.lessonList}>
          {cards.map((card) => (
            <div className={styles.card} key={card.id}>
              <strong className={styles.de}>{card.de}</strong>
              <div className={styles.fr}>{card.fr}</div>
              <div className={styles.muted}>J+{card.srs.intervals.join(" · J+")}</div>
            </div>
          ))}
        </div>
      ) : null}
      {lesson.reveil.note ? <p className={styles.muted}>{lesson.reveil.note}</p> : null}
      {lesson.reveil.selection ? <p className={styles.muted}>{lesson.reveil.selection}</p> : null}
    </section>
  );
}

function BlockView({ block }: { block: RefonteLesson["blocks"][number] }) {
  const title = typeof block.title === "string" ? block.title : null;
  const text = typeof block.text === "string" ? block.text : null;
  const textDe = typeof block.textDe === "string" ? block.textDe : null;
  const textFr = typeof block.textFr === "string" ? block.textFr : null;

  if (block.type === "dialogueRef") {
    return (
      <section className={styles.block}>
        <div className={styles.eyebrow}>ÉCOUTE</div>
        <h2>Première rencontre</h2>
        <p>{typeof block.instruction === "string" ? block.instruction : null}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button type="button" className={styles.secondary} onClick={() => {
            const full = legacyU1.coreDialogue.audioScript.map((line) => line.de).join(" ");
            if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(full);
            utterance.lang = "de-DE";
            utterance.rate = 0.72;
            window.speechSynthesis.speak(utterance);
          }}>▶ Lent</button>
          <button type="button" className={styles.secondary} onClick={() => {
            const full = legacyU1.coreDialogue.audioScript.map((line) => line.de).join(" ");
            if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(full);
            utterance.lang = "de-DE";
            utterance.rate = 0.98;
            window.speechSynthesis.speak(utterance);
          }}>▶ Naturel</button>
        </div>
        <div className={styles.dialogue}>
          {legacyU1.coreDialogue.audioScript.map((line, index) => (
            <div className={styles.line} key={`${line.speaker}-${index}`}>
              <strong>{line.speaker}</strong>
              <div className={styles.de}>{line.de}</div>
              <div className={styles.fr}>{line.fr}</div>
            </div>
          ))}
        </div>
        <p className={styles.muted}>Voix de maquette du navigateur · audio natif requis avant A1 READY.</p>
      </section>
    );
  }

  return (
    <section className={styles.block}>
      <div className={styles.eyebrow}>{block.type.replace(/([A-Z])/g, " $1")}</div>
      {title ? <h2>{title}</h2> : null}
      {text ? <p>{text}</p> : null}
      {textDe ? <p className={styles.de}>{textDe}</p> : null}
      {textFr ? <p className={styles.fr}>{textFr}</p> : null}
    </section>
  );
}

function RemediationPanel({ remediation }: { remediation: RefonteRemediation }) {
  return (
    <section className={styles.card} style={{ borderStyle: "dashed" }}>
      <div className={styles.eyebrow}>REMÉDIATION · {Math.round(remediation.durationSeconds / 60)} MIN</div>
      <p>{remediation.explanation}</p>
      <div className={styles.lessonList}>
        {remediation.contrast.map((item) => (
          <div className={styles.card} key={item.de}>
            <strong className={styles.de}>{item.ok ? "✓ " : "✕ "}{item.de}</strong>
            {item.fr ? <div className={styles.fr}>{item.fr}</div> : null}
            {item.why ? <div className={styles.muted}>{item.why}</div> : null}
          </div>
        ))}
      </div>
      <div className={styles.muted}>Puis deux items neufs ciblés sur ce point.</div>
      <ul className={styles.list}>
        {remediation.items.map((item) => <li key={item.id}>{item.prompt}</li>)}
      </ul>
    </section>
  );
}

function ExerciseCard({
  exercise,
  value,
  checked,
  onValue,
  onCheck,
  onRetry,
}: {
  exercise: RefonteExercise;
  value: AnswerValue | undefined;
  checked: boolean;
  onValue: (value: AnswerValue) => void;
  onCheck: () => void;
  onRetry: () => void;
}) {
  const result = checked ? evaluateRefonteExercise(exercise, value) : null;
  const audio = audioText(exercise.audioRef);

  if (exercise.type === "multipleChoice" || exercise.type === "listeningDiscrimination") {
    return (
      <article className={styles.exercise}>
        <div className={styles.eyebrow}>{exercise.promptLang.toUpperCase()}</div>
        <h3>{exercise.prompt}</h3>
        {audio ? <AudioButton audioRef={exercise.audioRef} /> : null}
        <div className={styles.lessonList} style={{ marginTop: 12 }}>
          {(exercise.choices ?? []).map((choice) => {
            const selected = value === choice.id;
            return (
              <button
                type="button"
                key={choice.id}
                className={`${styles.choice} ${selected ? styles.choiceSelected : ""}`}
                disabled={checked}
                onClick={() => onValue(choice.id)}
              >
                {choice.text}
              </button>
            );
          })}
        </div>
        {!checked ? (
          <button type="button" className={styles.secondary} style={{ marginTop: 12 }} disabled={typeof value !== "string"} onClick={onCheck}>Vérifier</button>
        ) : (
          <div className={styles.feedback}>
            <strong>{result?.correct ? "✓" : "À reprendre"}</strong> {result?.feedback}
            {!result?.correct ? <button type="button" className={styles.secondary} style={{ marginLeft: 10 }} onClick={onRetry}>Réessayer</button> : null}
          </div>
        )}
      </article>
    );
  }

  if (exercise.type === "reorder") {
    const selected = Array.isArray(value) ? value : [];
    const tokens = exercise.tokens ?? [];
    const available = tokens.filter((token, index) => selected.filter((item) => item === token).length <= tokens.slice(0, index).filter((item) => item === token).length);
    return (
      <article className={styles.exercise}>
        <div className={styles.eyebrow}>{exercise.promptLang.toUpperCase()}</div>
        <h3>{exercise.prompt}</h3>
        <div className={styles.tokenRow} style={{ minHeight: 48, marginBottom: 12 }}>
          {selected.map((token, index) => <button type="button" className={styles.token} key={`${token}-sel-${index}`} disabled={checked} onClick={() => onValue(selected.filter((_, i) => i !== index))}>{token}</button>)}
        </div>
        <div className={styles.tokenRow}>
          {available.map((token, index) => <button type="button" className={styles.token} key={`${token}-av-${index}`} disabled={checked} onClick={() => onValue([...selected, token])}>{token}</button>)}
        </div>
        {!checked ? <button type="button" className={styles.secondary} style={{ marginTop: 12 }} disabled={selected.length !== tokens.length} onClick={onCheck}>Vérifier</button> : <div className={styles.feedback}>{result?.feedback}</div>}
      </article>
    );
  }

  if (exercise.type === "shadowing") {
    return (
      <article className={styles.exercise}>
        <div className={styles.eyebrow}>ORAL CONTRAINT</div>
        <h3>{exercise.prompt}</h3>
        <div className={styles.lessonList}>
          {(exercise.targets ?? []).map((target) => (
            <div className={styles.card} key={target.id}>
              <strong className={styles.de}>{target.de}</strong>
              <div style={{ marginTop: 8 }}><AudioButton audioRef={target.audioRef} label="Écouter puis répéter" /></div>
            </div>
          ))}
        </div>
        <p className={styles.muted}>Le scoring Whisper contraint décrit dans la doctrine n’est pas encore branché dans le repo ; cette Preview ne prétend donc pas noter l’oral.</p>
        {!checked ? <button type="button" className={styles.secondary} onClick={() => { onValue(true); onCheck(); }}>J’ai répété les trois blocs</button> : <div className={styles.feedback}>✓ Répétition terminée.</div>}
      </article>
    );
  }

  if (exercise.type === "guidedProduction") {
    const text = typeof value === "string" ? value : "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return (
      <article className={styles.exercise}>
        <div className={styles.eyebrow}>PRODUCTION</div>
        <h3>{exercise.prompt}</h3>
        <textarea className={styles.textarea} value={text} disabled={checked} onChange={(event) => onValue(event.target.value)} />
        <p className={styles.muted}>{words}/{exercise.minimumWords ?? 1} mots minimum</p>
        <ul className={styles.list}>{(exercise.successCriteria ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
        {!checked ? <button type="button" className={styles.secondary} disabled={words < (exercise.minimumWords ?? 1)} onClick={onCheck}>Auto-vérifier mes blocs</button> : <div className={styles.feedback}>{result?.feedback}</div>}
      </article>
    );
  }

  const text = typeof value === "string" ? value : "";
  return (
    <article className={styles.exercise}>
      <div className={styles.eyebrow}>{exercise.promptLang.toUpperCase()} · {exercise.type}</div>
      <h3>{exercise.prompt}</h3>
      {audio ? <AudioButton audioRef={exercise.audioRef} /> : null}
      <input className={styles.input} style={{ marginTop: 12 }} value={text} disabled={checked} onChange={(event) => onValue(event.target.value)} />
      {!checked ? (
        <button type="button" className={styles.secondary} style={{ marginTop: 12 }} disabled={!text.trim()} onClick={onCheck}>Vérifier</button>
      ) : (
        <div className={styles.feedback}>
          <strong>{result?.correct ? "✓" : "À reprendre"}</strong> {result?.feedback}
          {!result?.correct ? <button type="button" className={styles.secondary} style={{ marginLeft: 10 }} onClick={onRetry}>Réessayer</button> : null}
        </div>
      )}
    </article>
  );
}

export function A1RefonteLessonPreview({ lesson }: { lesson: RefonteLesson }) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [checked, setChecked] = useState<CheckMap>({});
  const [failuresByObjective, setFailuresByObjective] = useState<Record<string, number>>({});

  const objectiveLabels = useMemo(() => new Map(data.objectives.map((item) => [item.id, item.label])), []);
  const revealedRemediations = useMemo(() => {
    const refs = new Set<string>();
    for (const exercise of lesson.exercises) {
      if (!exercise.remediationRef) continue;
      if ((failuresByObjective[exercise.objectiveId] ?? 0) >= 2) refs.add(exercise.remediationRef);
    }
    return [...refs]
      .map((id) => data.remediations.find((item) => item.id === id) ?? null)
      .filter((item): item is RefonteRemediation => item !== null);
  }, [failuresByObjective, lesson.exercises]);

  const checkedCount = lesson.exercises.filter((exercise) => checked[exercise.id]).length;
  const correctCount = lesson.exercises.filter((exercise) => checked[exercise.id] && evaluateRefonteExercise(exercise, answers[exercise.id]).correct).length;

  const check = (exercise: RefonteExercise) => {
    const evaluation = evaluateRefonteExercise(exercise, answers[exercise.id]);
    setChecked((current) => ({ ...current, [exercise.id]: true }));
    if (!evaluation.correct) {
      setFailuresByObjective((current) => ({
        ...current,
        [exercise.objectiveId]: (current[exercise.objectiveId] ?? 0) + 1,
      }));
    }
  };

  const retry = (id: string) => {
    setChecked((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setAnswers((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.lessonHero}>
          <div className={styles.eyebrow}>A1 REFONTE · U1 · L{lesson.order} · {data.status}</div>
          <h1 className={styles.lessonTitle}>{lesson.title}</h1>
          <p className={styles.lessonObjective}>{lesson.objectiveIds.map((id) => objectiveLabels.get(id)).filter(Boolean).join(" · ")}</p>
          <div className={styles.sequence}>
            {["Comprends", "Pratique", "Produis", "Valide"].map((phase) => <span className={`${styles.sequenceStep} ${phase === lesson.phase ? styles.sequenceCurrent : ""}`} key={phase}>{phase}</span>)}
          </div>
        </section>

        <div className={styles.lessonLayout} style={{ marginTop: 24 }}>
          <div className={styles.lessonMain}>
            <Reveille lesson={lesson} />
            {lesson.blocks.map((block) => <BlockView block={block} key={block.id} />)}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div><div className={styles.eyebrow}>ACTIVITÉS</div><h2 className={styles.sectionTitle}>Rappel avant reconnaissance</h2></div>
                <span>{checkedCount}/{lesson.exercises.length} tentées · {correctCount} réussies</span>
              </div>
              <div className={styles.lessonList}>
                {lesson.exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    value={answers[exercise.id]}
                    checked={Boolean(checked[exercise.id])}
                    onValue={(value) => setAnswers((current) => ({ ...current, [exercise.id]: value }))}
                    onCheck={() => check(exercise)}
                    onRetry={() => retry(exercise.id)}
                  />
                ))}
              </div>
            </section>

            {revealedRemediations.map((remediation) => <RemediationPanel key={remediation.id} remediation={remediation} />)}

            {checkedCount === lesson.exercises.length ? (
              <section className={styles.state}>
                <div className={styles.eyebrow}>LEÇON TERMINÉE</div>
                <h2>{lesson.completionMessage}</h2>
                <p className={styles.muted}>{correctCount}/{lesson.exercises.length} activités réussies au premier passage enregistré dans cette session.</p>
              </section>
            ) : null}
          </div>

          <aside className={styles.lessonAside}>
            <div className={styles.card}>
              <div className={styles.eyebrow}>DOCTRINE V2</div>
              <h3>{data.contentVersion}</h3>
              <p className={styles.muted}>{data.note}</p>
            </div>
            <div className={styles.card}>
              <div className={styles.eyebrow}>OBJECTIFS</div>
              <ul className={styles.list}>
                {lesson.objectiveIds.map((id) => <li key={id}>{objectiveLabels.get(id)}</li>)}
              </ul>
            </div>
            <div className={styles.card}>
              <div className={styles.eyebrow}>QUALITÉ</div>
              <p className={styles.muted}>QCM max {Math.round(data.qualityGates.exerciseMix.recognitionMax * 100)} % · productif écrit min {Math.round(data.qualityGates.exerciseMix.productiveWrittenMin * 100)} % · oral min {Math.round(data.qualityGates.exerciseMix.oralMin * 100)} %.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
