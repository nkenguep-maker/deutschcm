"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CourseBlock, CourseContent, CourseExercise, CourseLesson, CourseUnit } from "@/data/courses/types";
import styles from "./CourseExperience.module.css";

type AnswerState = Record<string, string | string[] | boolean>;
type CheckState = Record<string, boolean>;

type NextLesson = { unitId: string; lessonId: string; title: string } | null;

type Props = {
  course: CourseContent;
  unit: CourseUnit;
  lesson: CourseLesson;
  locale: string;
  alreadyCompleted: boolean;
  accessActive: boolean;
  nextLesson: NextLesson;
};

const phases = ["Comprends", "Pratique", "Produis", "Valide"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function answerMatches(exercise: CourseExercise, value: string | string[] | boolean | undefined): boolean {
  if (exercise.type === "oralRecording" || exercise.type === "oralAssessment") return value === true;
  if (exercise.type === "guidedWriting" || exercise.type === "selfProduction") {
    return typeof value === "string" && wordCount(value) >= (exercise.minimumWords ?? 1);
  }
  if (Array.isArray(exercise.answer)) {
    return Array.isArray(value) && value.join(" ").trim() === exercise.answer.join(" ").trim();
  }
  const expected = typeof exercise.answer === "string" ? exercise.answer.trim().toLocaleLowerCase() : "";
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized === expected) return true;
  return (exercise.acceptedAnswers ?? []).some((item) => item.trim().toLocaleLowerCase() === normalized);
}

function GenericList({ items }: { items: unknown }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className={styles.list}>
      {items.map((item, index) => {
        if (typeof item === "string") return <li key={`${item}-${index}`}>{item}</li>;
        if (!isRecord(item)) return null;
        const de = stringValue(item.de) ?? stringValue(item.name) ?? stringValue(item.label) ?? stringValue(item.title);
        const fr = stringValue(item.fr) ?? stringValue(item.translation) ?? stringValue(item.description) ?? stringValue(item.text);
        const price = stringValue(item.price);
        return (
          <li key={`${de ?? fr ?? "item"}-${index}`}>
            {de ? <strong>{de}</strong> : null}{price ? ` · ${price}` : null}{fr ? <div className={styles.muted}>{fr}</div> : null}
          </li>
        );
      })}
    </ul>
  );
}

function GenericTable({ headers, rows }: { headers: unknown; rows: unknown }) {
  const safeHeaders = stringArray(headers);
  const safeRows = Array.isArray(rows) ? rows.filter(Array.isArray) : [];
  if (safeRows.length === 0) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {safeHeaders.length > 0 ? <thead><tr>{safeHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead> : null}
        <tbody>
          {safeRows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function CourseBlockView({ block, unit }: { block: CourseBlock; unit: CourseUnit }) {
  if (block.type === "dialogueRef") {
    return (
      <section className={styles.block}>
        <div className={styles.eyebrow}>Dialogue</div>
        <h2>{unit.coreDialogue.title}</h2>
        <p className={styles.muted}>{unit.coreDialogue.context}</p>
        {stringValue(block.instruction) ? <p>{String(block.instruction)}</p> : null}
        <div className={styles.dialogue}>
          {unit.coreDialogue.audioScript.map((line, index) => (
            <div className={styles.line} key={`${line.speaker}-${index}`}>
              <strong>{line.speaker}</strong>
              <div className={styles.de}>{line.de}</div>
              <div className={styles.fr}>{line.fr}</div>
            </div>
          ))}
        </div>
        <p className={styles.muted}>{"L’audio sera ajouté après validation des voix. Le script reste disponible."}</p>
      </section>
    );
  }

  if (block.type === "vocabularyRef") {
    return (
      <section className={styles.block}>
        <div className={styles.eyebrow}>Vocabulaire</div>
        <h2>{stringValue(block.title) ?? "Expressions essentielles"}</h2>
        <div className={styles.lessonList}>
          {unit.vocabulary.map((item) => (
            <div className={styles.card} key={item.de}>
              <div className={styles.de}>{item.de}</div>
              <div className={styles.fr}>{item.fr}</div>
              <div style={{ marginTop: 10 }}><strong>{item.exampleDe}</strong><div className={styles.muted}>{item.exampleFr}</div></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "grammarRef") {
    return (
      <section className={styles.block}>
        <div className={styles.eyebrow}>Grammaire utile</div>
        <h2>{stringValue(block.title) ?? "Structure de la leçon"}</h2>
        <div className={styles.lessonList}>
          {unit.grammar.map((item) => (
            <div className={styles.card} key={item.title}>
              <h3>{item.title}</h3><p>{item.explanation}</p>
              {item.formula ? <p className={styles.de}>{item.formula}</p> : null}
              {item.examples.map((example) => <div key={example.de} style={{ marginTop: 10 }}><strong>{example.de}</strong><div className={styles.muted}>{example.fr}</div></div>)}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "pronunciationRef") {
    return (
      <section className={styles.block}>
        <div className={styles.eyebrow}>Prononciation</div>
        <h2>{unit.pronunciation.focus}</h2>
        <ul className={styles.list}>{unit.pronunciation.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        <div className={styles.chipRow}>{unit.pronunciation.drills.map((drill) => <span className={styles.chip} key={drill}>{drill}</span>)}</div>
      </section>
    );
  }

  const title = stringValue(block.title);
  const text = stringValue(block.text);
  const textDe = stringValue(block.textDe);
  const textFr = stringValue(block.textFr);
  const instruction = stringValue(block.instruction);
  const rows = block.rows;
  const headers = block.headers;
  const steps = block.steps;
  const items = block.items;
  const turns = block.turns;
  const criteria = block.criteria;
  const expectedFunctions = block.expectedFunctions;
  const groups = Array.isArray(block.groups) ? block.groups : [];
  const columns = Array.isArray(block.columns) ? block.columns : [];

  return (
    <section className={styles.block}>
      <div className={styles.eyebrow}>{block.type.replace(/([A-Z])/g, " $1")}</div>
      {title ? <h2>{title}</h2> : null}
      {instruction ? <p>{instruction}</p> : null}
      {text ? <p>{text}</p> : null}
      {textDe ? <p className={styles.de}>{textDe}</p> : null}
      {textFr ? <p className={styles.fr}>{textFr}</p> : null}
      <GenericTable headers={headers} rows={rows} />
      <GenericList items={steps} />
      <GenericList items={items} />
      <GenericList items={turns} />
      <GenericList items={criteria} />
      <GenericList items={expectedFunctions} />
      {groups.map((group, index) => isRecord(group) ? <div className={styles.card} key={index}><h3>{String(group.label ?? group.title ?? "Groupe")}</h3><GenericList items={group.items ?? group.questions} /></div> : null)}
      {columns.map((column, index) => isRecord(column) ? <div className={styles.card} key={index}><h3>{String(column.title ?? "Partie")}</h3><GenericList items={column.items ?? column.questions} /></div> : null)}
    </section>
  );
}

function ExerciseView({
  exercise,
  value,
  checked,
  onChange,
  onCheck,
}: {
  exercise: CourseExercise;
  value: string | string[] | boolean | undefined;
  checked: boolean;
  onChange: (value: string | string[] | boolean) => void;
  onCheck: () => void;
}) {
  const correct = checked && answerMatches(exercise, value);
  const feedback = correct ? exercise.feedbackCorrect ?? "Bonne réponse." : exercise.feedbackIncorrect ?? exercise.hint ?? "Réessaie.";

  if (exercise.type === "multipleChoice") {
    return (
      <article className={styles.exercise}>
        <h3>{exercise.prompt}</h3>
        {(exercise.choices ?? []).map((choice) => {
          const selected = value === choice;
          const isRight = checked && choice === exercise.answer;
          const isWrong = checked && selected && !isRight;
          return <button type="button" key={choice} className={`${styles.choice} ${selected ? styles.choiceSelected : ""} ${isRight ? styles.choiceCorrect : ""} ${isWrong ? styles.choiceWrong : ""}`} onClick={() => !checked && onChange(choice)}>{choice}</button>;
        })}
        {!checked ? <button type="button" className={styles.secondary} style={{ marginTop: 14 }} disabled={typeof value !== "string"} onClick={onCheck}>Vérifier</button> : <div className={styles.feedback}>{feedback}</div>}
      </article>
    );
  }

  if (exercise.type === "fillBlank") {
    return (
      <article className={styles.exercise}>
        <h3>{exercise.prompt}</h3>
        <input className={styles.input} value={typeof value === "string" ? value : ""} disabled={checked} onChange={(event) => onChange(event.target.value)} aria-label={exercise.prompt} />
        {exercise.hint && !checked ? <p className={styles.muted}>{exercise.hint}</p> : null}
        {!checked ? <button type="button" className={styles.secondary} style={{ marginTop: 14 }} disabled={!value} onClick={onCheck}>Vérifier</button> : <div className={styles.feedback}>{feedback}</div>}
      </article>
    );
  }

  if (exercise.type === "reorder") {
    const selected = Array.isArray(value) ? value : [];
    const available = (exercise.tokens ?? []).filter((token, index) => selected.filter((item) => item === token).length <= (exercise.tokens ?? []).slice(0, index).filter((item) => item === token).length);
    return (
      <article className={styles.exercise}>
        <h3>{exercise.prompt}</h3>
        <div className={styles.tokenRow} style={{ minHeight: 48, marginBottom: 12 }}>{selected.map((token, index) => <button type="button" className={styles.token} key={`${token}-${index}`} disabled={checked} onClick={() => onChange(selected.filter((_, itemIndex) => itemIndex !== index))}>{token}</button>)}</div>
        <div className={styles.tokenRow}>{available.map((token, index) => <button type="button" className={styles.token} key={`${token}-${index}`} disabled={checked} onClick={() => onChange([...selected, token])}>{token}</button>)}</div>
        {!checked ? <button type="button" className={styles.secondary} style={{ marginTop: 14 }} disabled={selected.length !== (exercise.tokens ?? []).length} onClick={onCheck}>Vérifier</button> : <div className={styles.feedback}>{feedback}</div>}
      </article>
    );
  }

  if (exercise.type === "guidedWriting" || exercise.type === "selfProduction") {
    const text = typeof value === "string" ? value : "";
    const minimum = exercise.minimumWords ?? 1;
    return (
      <article className={styles.exercise}>
        <h3>{exercise.prompt}</h3>
        <textarea className={styles.textarea} value={text} disabled={checked} onChange={(event) => onChange(event.target.value)} />
        <p className={styles.muted}>{wordCount(text)}/{minimum} mots minimum</p>
        {exercise.successCriteria ? <GenericList items={exercise.successCriteria} /> : null}
        {!checked ? <button type="button" className={styles.secondary} disabled={wordCount(text) < minimum} onClick={onCheck}>Valider ma production</button> : <div className={styles.feedback}>{correct ? "Production enregistrée pour cette leçon." : feedback}</div>}
      </article>
    );
  }

  if (exercise.type === "oralRecording" || exercise.type === "oralAssessment") {
    return (
      <article className={styles.exercise}>
        <h3>{exercise.prompt}</h3>
        <p className={styles.muted}>L’enregistrement audio sera activé avec les voix et le service de prononciation. Pour ce premier import, réalise la mission à voix haute puis confirme-la.</p>
        {exercise.successCriteria ? <GenericList items={exercise.successCriteria} /> : null}
        {!checked ? <button type="button" className={styles.secondary} onClick={() => { onChange(true); onCheck(); }}>J’ai réalisé l’activité orale</button> : <div className={styles.feedback}>Activité orale confirmée.</div>}
      </article>
    );
  }

  return (
    <article className={styles.exercise}>
      <h3>{exercise.prompt}</h3>
      <button type="button" className={styles.secondary} disabled={checked} onClick={() => { onChange(true); onCheck(); }}>Marquer comme réalisé</button>
      {checked ? <div className={styles.feedback}>Activité réalisée.</div> : null}
    </article>
  );
}

export function LessonExperience({ course, unit, lesson, locale, alreadyCompleted, accessActive, nextLesson }: Props) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [checked, setChecked] = useState<CheckState>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(alreadyCompleted);
  const [saveError, setSaveError] = useState<string | null>(null);

  const validCount = useMemo(() => lesson.exercises.filter((exercise) => checked[exercise.id] && answerMatches(exercise, answers[exercise.id])).length, [answers, checked, lesson.exercises]);
  const allValid = lesson.exercises.length > 0 && validCount === lesson.exercises.length;
  const score = lesson.exercises.length === 0 ? 100 : Math.round((validCount / lesson.exercises.length) * 100);

  const completeLesson = async () => {
    if (!accessActive || (!allValid && !alreadyCompleted)) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/courses/${course.course.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, score }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSaved(true);
    } catch {
      setSaveError(course.globalUiTexts.errorMessage ?? "La progression n’a pas pu être enregistrée.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href={`/${locale}`}>YEMA</Link>
          <Link className={styles.back} href={`/${locale}/learn/${course.course.id}/${unit.id}`}>← Retour à l’unité</Link>
        </header>

        <section className={styles.lessonHero}>
          <div className={styles.eyebrow}>UNITÉ {unit.order} · LEÇON {lesson.order} SUR {unit.lessons.length}</div>
          <h1 className={styles.lessonTitle}>{lesson.title}</h1>
          <p className={styles.lessonObjective}>{lesson.objective}</p>
          <div className={styles.sequence}>{phases.map((phase) => <span key={phase} className={`${styles.sequenceStep} ${phase === lesson.phase ? styles.sequenceCurrent : ""}`}>{phase}</span>)}</div>
        </section>

        <div className={styles.lessonLayout} style={{ marginTop: 24 }}>
          <div className={styles.lessonMain}>
            {lesson.blocks.map((block, index) => <CourseBlockView key={`${block.type}-${index}`} block={block} unit={unit} />)}
            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><div className={styles.eyebrow}>Activités</div><h2 className={styles.sectionTitle}>À toi de jouer</h2></div><span>{validCount}/{lesson.exercises.length} réussies</span></div>
              <div className={styles.lessonList}>
                {lesson.exercises.map((exercise) => (
                  <ExerciseView
                    key={exercise.id}
                    exercise={exercise}
                    value={answers[exercise.id]}
                    checked={Boolean(checked[exercise.id])}
                    onChange={(value) => setAnswers((current) => ({ ...current, [exercise.id]: value }))}
                    onCheck={() => setChecked((current) => ({ ...current, [exercise.id]: true }))}
                  />
                ))}
              </div>
            </section>

            {(saved || alreadyCompleted) ? (
              <section className={styles.completion}>
                <div className={styles.eyebrow}>Leçon terminée · +{lesson.xp} XP</div>
                <h2>{lesson.completionMessage}</h2>
                <p>{nextLesson ? `Prochaine étape : ${nextLesson.title}` : "Tu as terminé la dernière leçon de ce niveau."}</p>
                <Link className={styles.primary} href={nextLesson ? `/${locale}/learn/${course.course.id}/${nextLesson.unitId}/${nextLesson.lessonId}` : `/${locale}/learn/${course.course.id}`}>{nextLesson ? "Leçon suivante" : "Voir mon parcours"}</Link>
              </section>
            ) : null}
          </div>

          <aside className={styles.lessonAside}>
            <div className={styles.card}>
              <div className={styles.eyebrow}>Mission</div>
              <h3>{unit.finalMission}</h3>
              <p className={styles.muted}>{lesson.durationMinutes} min · +{lesson.xp} XP</p>
              <div className={styles.progress}><span style={{ width: `${score}%` }} /></div>
              <p>{score} % des activités validées</p>
              {!accessActive ? <Link className={styles.primary} href={`/${locale}/offers`}>Activer le cours</Link> : !saved ? <button type="button" className={styles.primary} disabled={saving || !allValid} onClick={completeLesson}>{saving ? "Enregistrement…" : lesson.primaryCta}</button> : null}
              {saveError ? <div className={styles.feedback}>{saveError}</div> : null}
            </div>
            <div className={styles.card}>
              <div className={styles.eyebrow}>Contexte culturel</div>
              <h3>{unit.culture.title}</h3>
              <p className={styles.muted}>{unit.culture.text}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
