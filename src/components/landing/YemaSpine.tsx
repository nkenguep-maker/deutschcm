"use client";

// YemaSpine · sœur de CefrSpine, même anatomie SpineItem partagée.
// É1→É5 · Écoute · Voix · Récit · Palabre · Foyer. Au survol · panneau
// avec ancre culturelle + can-do statements + équivalence ACTFL.

import { useState } from "react";
import { SpineItem, type SpineStatus } from "./SpineItem";
import { YEMA_LEVELS } from "@/lib/yemaScale";

export function YemaSpine({
  current = "É1",
  locale = "fr",
  compact = false,
  interactive = true,
}: {
  current?: string;
  locale?: "fr" | "en";
  compact?: boolean;
  interactive?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const codes = YEMA_LEVELS.map((l) => l.code);
  const currentIdx = Math.max(0, codes.indexOf(current));
  const pct = ((currentIdx + 0.5) / codes.length) * 100;
  const isFr = locale === "fr";

  return (
    <div className="spine-wrap">
      <ul
        className="spine-list spine-list-yema"
        style={{ ["--spine-paint" as string]: `${pct}%` }}
        aria-label={isFr
          ? `Progression YEMA — palier actuel ${current}`
          : `YEMA progression — current stage ${current}`}
        onMouseLeave={() => setHovered(null)}
      >
        <span className="spine-bar" aria-hidden="true" />
        <span className="spine-bar-fill" aria-hidden="true" />

        {YEMA_LEVELS.map((lvl, i) => {
          const status: SpineStatus = i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
          const name = isFr ? lvl.name : lvl.nameEn;
          return (
            <SpineItem
              key={lvl.id}
              code={lvl.code}
              label={compact ? "" : name}
              status={status}
              ariaLabel={`${lvl.code} — ${name}`}
              ariaDescribedBy={`yema-panel-${lvl.id}`}
              onEnter={interactive ? () => setHovered(lvl.code) : undefined}
              onFocus={interactive ? () => setHovered(lvl.code) : undefined}
              onBlur={interactive ? () => setHovered(null) : undefined}
            />
          );
        })}
      </ul>

      {interactive && hovered
        ? (() => {
            const lvl = YEMA_LEVELS.find((l) => l.code === hovered);
            if (!lvl) return null;
            const name = isFr ? lvl.name : lvl.nameEn;
            const anchor = isFr ? lvl.anchor : lvl.anchorEn;
            const canDo = isFr ? lvl.canDo : lvl.canDoEn;
            return (
              <aside
                id={`yema-panel-${lvl.id}`}
                className="spine-panel spine-panel-yema"
                role="tooltip"
              >
                <div className="spine-panel-code" aria-hidden="true">{lvl.code}</div>
                <div className="spine-panel-head">{name}</div>
                <p className="spine-panel-anchor">{anchor}</p>
                <ul className="spine-panel-list">
                  {canDo.map((c) => (<li key={c}>{c}</li>))}
                </ul>
                <div className="spine-panel-fine spine-panel-actfl">{lvl.actfl}</div>
              </aside>
            );
          })()
        : null}
    </div>
  );
}
