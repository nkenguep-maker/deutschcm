"use client";

import { useState } from "react";
import { LessonComplete, type SkillScore } from "@/components/LessonComplete";
import { LevelUp, type LevelKind } from "@/components/LevelUp";

// Sandbox local pour valider le rythme des deux cérémonies.
// Toggles : variante (lesson|levelUp), territoire, données mock.
// Bouton "Rejouer" force un remount pour observer la cascade complète.

const SKILLS_DE: SkillScore[] = [
  { name: "Sprechen",  score: 8, total: 10 },
  { name: "Hören",     score: 9, total: 10 },
  { name: "Lesen",     score: 7, total: 10 },
  { name: "Schreiben", score: 6, total: 8  },
  { name: "Grammatik", score: 9, total: 12 },
];

const SKILLS_WO: SkillScore[] = [
  { name: "Écoute",  score: 7, total: 10 },
  { name: "Voix",    score: 5, total: 8  },
  { name: "Récit",   score: 4, total: 6  },
];

const CEFR_SEGMENTS = [
  { key: "A1", label: "Débuter" },
  { key: "A2", label: "Se débrouiller" },
  { key: "B1", label: "S'affirmer" },
  { key: "B2", label: "Nuancer" },
  { key: "C1", label: "Maîtriser" },
];

const YEMA_SEGMENTS = [
  { key: "É1", label: "Écoute" },
  { key: "É2", label: "Voix" },
  { key: "É3", label: "Récit" },
  { key: "É4", label: "Palabre" },
  { key: "É5", label: "Foyer" },
];

type Variant = "lesson" | "levelup";

export function LessonCompletePreview() {
  const [key, setKey] = useState(0);
  const [variant, setVariant] = useState<Variant>("lesson");
  const [territory, setTerritory] = useState<"world" | "sources">("world");
  const [skillCount, setSkillCount] = useState(4);
  const [newLevelIdx, setNewLevelIdx] = useState(1);

  const kind: LevelKind = territory === "world" ? "cefr" : "yema";
  const segmentsFull = kind === "cefr" ? CEFR_SEGMENTS : YEMA_SEGMENTS;
  const segments = segmentsFull.slice(0, newLevelIdx + 1);
  const newLevel = segments[segments.length - 1]?.key ?? "A1";
  const levelName = segments[segments.length - 1]?.label;

  const skills = territory === "world"
    ? SKILLS_DE.slice(0, skillCount)
    : SKILLS_WO.slice(0, Math.min(skillCount, SKILLS_WO.length));

  const lektion = territory === "world"
    ? "Lektion 4 — Wortschatz"
    : "É1 · Écoute — Salutations";

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <aside
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 100,
          background: "var(--espresso-2)",
          border: "1px solid var(--brass-edge)",
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 280,
          fontFamily: "var(--font-jetbrains, monospace)",
          fontSize: 11,
          color: "var(--creme-mute)",
          letterSpacing: "0.04em",
        }}
        aria-label="Contrôles preview"
      >
        <p style={{
          margin: 0,
          color: "var(--brass)",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}>Dev · preview</p>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>Variante</span>
          <select
            value={variant}
            onChange={(e) => { setVariant(e.target.value as Variant); setKey((k) => k + 1); }}
            style={selectStyle}
          >
            <option value="lesson">LessonComplete (fin de leçon)</option>
            <option value="levelup">LevelUp (cérémonie rare)</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>Territoire</span>
          <select
            value={territory}
            onChange={(e) => { setTerritory(e.target.value as "world" | "sources"); setKey((k) => k + 1); }}
            style={selectStyle}
          >
            <option value="world">world (du monde · CECRL)</option>
            <option value="sources">sources (africaines · YEMA)</option>
          </select>
        </label>

        {variant === "lesson" && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Compétences ({skillCount})</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={skillCount}
              onChange={(e) => { setSkillCount(Number(e.target.value)); setKey((k) => k + 1); }}
            />
          </label>
        )}

        {variant === "levelup" && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Nouveau palier ({newLevel})</span>
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={newLevelIdx}
              onChange={(e) => { setNewLevelIdx(Number(e.target.value)); setKey((k) => k + 1); }}
            />
          </label>
        )}

        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          style={{
            padding: "8px 14px",
            background: "var(--brass)",
            color: "var(--espresso)",
            border: "none",
            borderRadius: 8,
            fontFamily: "var(--font-manrope), sans-serif",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Rejouer la cascade
        </button>

        <p style={{ margin: 0, fontSize: 10, opacity: 0.7 }}>
          Route dev-only · 404 en prod
        </p>
      </aside>

      {variant === "lesson" && (
        <LessonComplete
          key={key}
          lektion={lektion}
          territory={territory}
          skills={skills}
          xpEarned={150}
          currentLevel={territory === "world" ? "A1" : "É1"}
          previousPct={42}
          newPct={68}
          nextLessonHref="/courses"
        />
      )}

      {variant === "levelup" && (
        <LevelUp
          key={key}
          kind={kind}
          territory={territory}
          newLevel={newLevel}
          levelName={kind === "yema" ? levelName : undefined}
          segments={segments}
          nextHref="/courses"
        />
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "rgba(244, 235, 220, 0.04)",
  border: "1px solid var(--creme-hair)",
  borderRadius: 8,
  color: "var(--creme)",
  padding: "6px 10px",
  fontFamily: "inherit",
  fontSize: 12,
};
