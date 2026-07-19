"use client";

// YemaSpine · sœur de CefrSpine, même anatomie SpineItem partagée.
// É1→É5 · Écoute · Voix · Récit · Palabre · Foyer. Au survol · panneau
// avec ancre culturelle + can-do statements + équivalence ACTFL.

import { useState } from "react";
import { SpineItem, type SpineStatus } from "./SpineItem";
import { YEMA_LEVELS } from "@/lib/yemaScale";
import type { SpineDetail } from "./spineDetail";

export function YemaSpine({
  current = "É1",
  locale = "fr",
  compact = false,
  interactive = true,
  activeCode = null,
  onDetailChange,
}: {
  current?: string;
  locale?: "fr" | "en";
  compact?: boolean;
  interactive?: boolean;
  activeCode?: string | null;
  onDetailChange?: (detail: SpineDetail | null) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const codes = YEMA_LEVELS.map((l) => l.code);
  const currentIdx = Math.max(0, codes.indexOf(current));
  const pct = ((currentIdx + 0.5) / codes.length) * 100;
  const isFr = locale === "fr";

  const emitDetail = (code: string | null) => {
    if (!onDetailChange) return;
    if (!code) { onDetailChange(null); return; }
    const lvl = YEMA_LEVELS.find((l) => l.code === code);
    if (!lvl) { onDetailChange(null); return; }
    onDetailChange({
      source: "yema",
      code: lvl.code,
      headline: isFr ? lvl.name : lvl.nameEn,
      anchor: isFr ? lvl.anchor : lvl.anchorEn,
      skills: isFr ? lvl.canDo : lvl.canDoEn,
      actfl: lvl.actfl,
      fine: isFr
        ? "Ce que vous saurez faire à ce palier."
        : "What you can actually do at this stage.",
    });
  };

  const onEnter = interactive
    ? (code: string) => { setHovered(code); emitDetail(code); }
    : undefined;
  const onSelect = interactive
    ? (code: string) => {
        const next = activeCode === code ? null : code;
        setHovered(next);
        emitDetail(next);
      }
    : undefined;

  return (
    <div className="spine-wrap">
      <ul
        className="spine-list spine-list-yema"
        style={{ ["--spine-paint" as string]: `${pct}%` }}
        aria-label={isFr
          ? `Progression YEMA — palier actuel ${current}`
          : `YEMA progression — current stage ${current}`}
        onMouseLeave={() => { setHovered(null); emitDetail(null); }}
      >
        <span className="spine-bar" aria-hidden="true" />
        <span className="spine-bar-fill" aria-hidden="true" />

        {YEMA_LEVELS.map((lvl, i) => {
          const status: SpineStatus = i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
          const name = isFr ? lvl.name : lvl.nameEn;
          const selected = (activeCode ?? hovered) === lvl.code;
          return (
            <SpineItem
              key={lvl.id}
              code={lvl.code}
              label={compact ? "" : name}
              status={status}
              ariaLabel={`${lvl.code} — ${name}`}
              onEnter={onEnter ? () => onEnter(lvl.code) : undefined}
              onFocus={onEnter ? () => onEnter(lvl.code) : undefined}
              onBlur={interactive ? () => { setHovered(null); emitDetail(null); } : undefined}
              onSelect={onSelect ? () => onSelect(lvl.code) : undefined}
              selected={selected}
            />
          );
        })}
      </ul>
    </div>
  );
}
