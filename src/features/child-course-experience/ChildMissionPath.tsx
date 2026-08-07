"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChildUnit } from "@/content/child-courses/types";
import styles from "./ChildPreview.module.css";

type Progress = { completedLessonIds: string[]; xp: number };

function readProgress(courseId: string): Progress {
  try {
    const raw = window.localStorage.getItem(`yema.prod.child.${courseId}`);
    if (!raw) return { completedLessonIds: [], xp: 0 };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds.filter((id): id is string => typeof id === "string") : [],
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
    };
  } catch {
    return { completedLessonIds: [], xp: 0 };
  }
}

export function ChildMissionPath({ locale, courseId, units }: { locale: string; courseId: string; units: ChildUnit[] }) {
  const [progress, setProgress] = useState<Progress>({ completedLessonIds: [], xp: 0 });
  useEffect(() => setProgress(readProgress(courseId)), [courseId]);

  const completedByUnit = useMemo(() => units.map((unit) => unit.lessons.every((lesson) => progress.completedLessonIds.includes(lesson.id))), [progress.completedLessonIds, units]);
  const completedUnits = completedByUnit.filter(Boolean).length;
  const currentUnitIndex = Math.min(completedUnits, units.length - 1);

  return (
    <section className={styles.pathSection}>
      <div className={styles.pathHeader}>
        <div><span className={styles.kicker}>🗺️ TON CHEMIN</span><h2>Choisis ta prochaine mission</h2></div>
        <div className={styles.pathScore}>⭐ {progress.xp} XP</div>
      </div>
      <div className={styles.missionPath}>
        {units.map((unit, index) => {
          const done = completedByUnit[index];
          const active = index === currentUnitIndex;
          return (
            <Link
              key={unit.id}
              className={`${styles.missionNode} ${done ? styles.missionNodeDone : ""} ${active ? styles.missionNodeActive : ""}`}
              href={`/${locale}/qa/child-course-preview/${courseId}/${unit.id}`}
              aria-label={`Mission ${unit.order}: ${unit.title}`}
            >
              <span className={styles.nodeBubble}>{done ? "✓" : unit.order}</span>
              <span className={styles.nodeCopy}><strong>{unit.title}</strong><small>{unit.mission}</small></span>
              {active ? <span className={styles.playTag}>JOUER</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
