"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CourseBlock, CourseContent, CourseExercise, CourseLesson, CourseUnit } from "@/data/courses/types";
import { evaluateLessonAttempt, getLessonPassScore } from "@/lib/course-content/validation";
import styles from "./CourseExperience.module.css";
import resultStyles from "./LessonResult.module.css";

type AnswerState = Record<string, string | string[] | boolean>;
type CheckState = Record<string, boolean>;

type NextLesson = { unitId: string; lessonId: string; title: string } | null;

type Props = {
  course: CourseContent;
  unit: CourseUnit;
  lesson: CourseLesson;
  locale: string;
  alreadyCompleted: boolean;
  initialScore?: number | null;
  accessActive: boolean;
  nextLesson: NextLesson;
};

type LessonResult = {
  ok: true;
  score: number;
  passScore: number;
  attemptedCount: number;
  correctCount: number;
  totalCount: number;
  status: "IN_PROGRESS" | "COMPLETED";
  completed: boolean;
  passed: boolean;
  reviewRecommended: boolean;
  firstCompletion: boolean;
  xpAwarded: number;
  completionMessage: string;
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
        <p className={styles.muted}>L’audio sera ajouté après validation des voix. Le script reste disponible.</p>
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

function ExerciseFeedback({ correct, feedback, onRetry }: { correct: boolean; feedback: string; onRetry: () => void }) {
  return (
    <div className={styles.feedback}>
      <div>{feedback}</div>
      {!correct ? <button type="button" className={`${styles.secondary} ${resultStyles.retryInline}`} onClick={onRetry}>Réessayer</button> : null}
    </div>
  );
}

function ExerciseView({
  exercise,
  value,
  checked,
  onChange,
  onCheck,
  onRetry,
}: {
  exercise: CourseExercise;
  value: string | string[] | boolean | undefined;
  checked: boolean;
  onChange: (value: string | string[] | boolean) => void;
  onCheck: () => void;
  onRetry: () => void;
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
        {!checked ? <button type="button" className={styles.secondary} style={{ marginTop: 14 }} disabled={typeof value !== "string"} onClick={onCheck}>Vérifier</button> : <ExerciseFeedback correct={correct} feedback={feedback} onRetry={onRetry} />}
      </article>
    );
  }

  if (exercise.type === "fillBlank") {
    return (
      <article className={styles.exercise}>
        <h3>{exercise.prompt}</h3>
        <input className={styles.input} value={typeof value === "string" ? value : ""} disabled={checked} onChange={(event) => onChange(event.target.value)} aria-label={exercise.prompt} />
        {exercise.hint && !checked ? <p className={styles.muted}>{exercise.hint}</p> : null}
        {!checked ? <button type="button" className={styles.secondary} style={{ marginTop: 14 }} disabled={!value} onClick={onCheck}>Vérifier</button> : <ExerciseFeedback correct={correct} feedback={feedback} onRetry={onRetry} />}
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
        {!checked ? <button type="button" className={styles.secondary} style={{ marginTop: 14 }} disabled={selected.length !== (exercise.tokens ?? []).length} onClick={onCheck}>Vérifier</button> : <ExerciseFeedback correct={correct} feedback={feedback} onRetry={onRetry} />}
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
        {!checked ? <button type="button" className={styles.secondary} disabled={wordCount(text) < minimum} onClick={onCheck}>Valider ma production</button> : <ExerciseFeedback correct={correct} feedback={correct ? "Production enregistrée pour cette leçon." : feedback} onRetry={onRetry} />}
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

function LessonResultPanel({
  lesson,
  unit,
  course,
  locale,
  nextLesson,
  result,
  missedExercises,
  hasAttemptDetails,
  onRetry,
}: {
  lesson: CourseLesson;
  unit: CourseUnit;
  course: CourseContent;
  locale: string;
  nextLesson: NextLesson;
  result: LessonResult;
  missedExercises: CourseExercise[];
  hasAttemptDetails: boolean;
  onRetry: () => void;
}) {
  const unitValidated = result.completed && lesson.phase === "Valide";
  const lastLesson = !nextLesson;
  const title = result.completed
    ? unitValidated
      ? lastLesson ? `Niveau ${course.course.framework.level} terminé` : `Unité ${unit.order} validée`
      : "Leçon terminée"
    : "Mission à retravailler";
  const xpValue = result.firstCompletion ? `+${result.xpAwarded}` : result.completed ? `${lesson.xp}` : "0";
  const nextHref = nextLesson
    ? `/${locale}/learn/${course.course.id}/${nextLesson.unitId}/${nextLesson.lessonId}`
    : `/${locale}/learn/${course.course.id}`;

  return (
    <section className={`${resultStyles.result} ${result.reviewRecommended ? resultStyles.resultReview : ""}`} aria-live="polite">
      <div>
        <div className={resultStyles.resultEyebrow}>{result.reviewRecommended ? "Révision recommandée" : "Résultat enregistré"}</div>
        <h2 className={resultStyles.resultTitle}>{title}</h2>
        <p className={resultStyles.resultLead}>{result.completionMessage}</p>
      </div>

      <div className={resultStyles.metrics}>
        <div className={resultStyles.metric}><strong>{result.score} %</strong><span>Score obtenu</span></div>
        <div className={resultStyles.metric}><strong>{result.correctCount}/{result.totalCount}</strong><span>Activités réussies</span></div>
        <div className={resultStyles.metric}><strong>{xpValue} XP</strong><span>{result.firstCompletion ? "XP gagnés" : "XP de la leçon"}</span></div>
      </div>

      <div className={resultStyles.reviewBox}>
        <h3>Compétence travaillée</h3>
        <p>{lesson.objective}</p>
      </div>

      {hasAttemptDetails && missedExercises.length > 0 ? (
        <div className={resultStyles.reviewBox}>
          <h3>{result.completed ? "À revoir sans bloquer ta progression" : `À corriger pour atteindre ${result.passScore} %`}</h3>
          <ul className={resultStyles.reviewList}>{missedExercises.map((exercise) => <li key={exercise.id}>{exercise.prompt}</li>)}</ul>
        </div>
      ) : null}

      <div className={resultStyles.actions}>
        {result.completed ? (
          <Link className={resultStyles.primaryAction} href={nextHref}>{nextLesson ? "Leçon suivante" : "Voir mon parcours"}</Link>
        ) : (
          <button type="button" className={resultStyles.primaryAction} onClick={onRetry}>Reprendre les points à corriger</button>
        )}
        <Link className={resultStyles.secondaryAction} href={`/${locale}/learn/${course.course.id}/${unit.id}`}>Retour à l’unité</Link>
      </div>
    </section>
  );
}

export function LessonExperience({ course, unit, lesson, locale, alreadyCompleted, initialScore, accessActive, nextLesson }: Props) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [checked, setChecked] = useState<CheckState>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(alreadyCompleted);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<LessonResult | null>(() => {
    if (!alreadyCompleted) return null;
    const totalCount = lesson.exercises.length;
    const score = initialScore ?? 100;
    return {
      ok: true,
      score,
      passScore: getLessonPassScore(lesson),
      attemptedCount: totalCount,
      correctCount: totalCount === 0 ? 0 : Math.min(totalCount, Math.round((score / 100) * totalCount)),
      totalCount,
      status: "COMPLETED",
      completed: true,
      passed: true,
      reviewRecommended: false,
      firstCompletion: false,
      xpAwarded: 0,
      completionMessage: lesson.completionMessage,
    };
  });

  const attemptedCount = useMemo(() => lesson.exercises.filter((exercise) => checked[exercise.id]).length, [checked, lesson.exercises]);
  const correctCount = useMemo(() => lesson.exercises.filter((exercise) => checked[exercise.id] && answerMatches(exercise, answers[exercise.id])).length, [answers, checked, lesson.exercises]);
  const attempt = useMemo(() => evaluateLessonAttempt(lesson, attemptedCount, correctCount), [lesson, attemptedCount, correctCount]);
  const missedExercises = useMemo(() => lesson.exercises.filter((exercise) => checked[exercise.id] && !answerMatches(exercise, answers[exercise.id])), [answers, checked, lesson.exercises]);
  const hasAttemptDetails = Object.keys(checked).length > 0;

  const resetExercise = (exerciseId: string) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });
    setChecked((current) => {
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });
    setResult(null);
    setSaveError(null);
  };

  const retryIncorrect = () => {
    const incorrectIds = new Set(missedExercises.map((exercise) => exercise.id));
    setAnswers((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !incorrectIds.has(id))));
    setChecked((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !incorrectIds.has(id))));
    setResult(null);
    setSaved(false);
    setSaveError(null);
  };

  const completeLesson = async () => {
    if (!accessActive || !attempt.readyToSubmit) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/courses/${course.course.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, attemptedCount, correctCount }),
      });
      const payload = await response.json().catch(() => null) as (LessonResult & { error?: string }) | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`);
      setResult(payload);
      setSaved(payload.completed);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : course.globalUiTexts.errorMessage ?? "La progression n’a pas pu être enregistrée.");
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
              <div className={styles.sectionHeader}>
                <div><div className={styles.eyebrow}>Activités</div><h2 className={styles.sectionTitle}>À toi de jouer</h2></div>
                <span>{attemptedCount}/{lesson.exercises.length} réalisées · {correctCount} réussies</span>
              </div>
              <div className={styles.lessonList}>
                {lesson.exercises.map((exercise) => (
                  <ExerciseView
                    key={exercise.id}
                    exercise={exercise}
                    value={answers[exercise.id]}
                    checked={Boolean(checked[exercise.id])}
                    onChange={(value) => setAnswers((current) => ({ ...current, [exercise.id]: value }))}
                    onCheck={() => setChecked((current) => ({ ...current, [exercise.id]: true }))}
                    onRetry={() => resetExercise(exercise.id)}
                  />
                ))}
              </div>
            </section>

            {result ? <LessonResultPanel lesson={lesson} unit={unit} course={course} locale={locale} nextLesson={nextLesson} result={result} missedExercises={missedExercises} hasAttemptDetails={hasAttemptDetails} onRetry={retryIncorrect} /> : null}
          </div>

          <aside className={styles.lessonAside}>
            <div className={styles.card}>
              <div className={styles.eyebrow}>{lesson.phase === "Valide" ? "Validation de l’unité" : "Progression de la leçon"}</div>
              <h3>{unit.finalMission}</h3>
              <p className={styles.muted}>{lesson.durationMinutes} min · +{lesson.xp} XP</p>
              <div className={styles.progress}><span style={{ width: `${attempt.score}%` }} /></div>
              <p>{attempt.score} % · {attemptedCount}/{lesson.exercises.length} activités réalisées</p>
              {lesson.phase === "Valide" ? <p className={styles.muted}>{attempt.passScore} % requis pour valider l’unité.</p> : <p className={styles.muted}>Toutes les activités doivent être tentées. Le score est enregistré sans bloquer la suite.</p>}
              {!accessActive ? <Link className={styles.primary} href={`/${locale}/offers`}>Activer le cours</Link> : !saved && !result ? <button type="button" className={styles.primary} disabled={saving || !attempt.readyToSubmit} onClick={completeLesson}>{saving ? "Enregistrement…" : lesson.phase === "Valide" ? "Voir mon résultat" : lesson.primaryCta}</button> : null}
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
