// YemaSpine — signature YEMA pour le territoire sources. Colonne verticale
// É1→É5 (Écoute · Voix · Récit · Palabre · Foyer) qui peint le laiton
// jusqu'au palier actuel. Sœur de CefrSpine, même mécanique interactive :
// au survol/focus d'un niveau, un panneau détaille l'ancre culturelle,
// les can-do statements concrets, et l'équivalence ACTFL discrète.

"use client";

import { useState } from "react";
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
    <div className="cefr-spine-wrap yema-spine-wrap">
      <ol
        className="cefr-spine yema-spine"
        style={{
          ["--current-pct" as string]: `${pct}%`,
          ["--step" as string]: compact ? "34px" : "44px",
        }}
        aria-label={isFr
          ? `Progression YEMA — palier actuel ${current}`
          : `YEMA progression — current stage ${current}`}
        onMouseLeave={() => setHovered(null)}
      >
        {YEMA_LEVELS.map((lvl, i) => {
          const status = i < currentIdx ? "done" : i === currentIdx ? "on" : "next";
          const name = isFr ? lvl.name : lvl.nameEn;
          const inner = (
            <>
              <span className="dot" aria-hidden="true" />
              <span className="lbl">
                <span className="lvl">{lvl.code}</span>
                {!compact ? (
                  <span className="cefr-step-caption">{name}</span>
                ) : null}
              </span>
            </>
          );
          return (
            <li
              key={lvl.id}
              className={`cefr-step ${status}${hovered === lvl.code ? " hover" : ""}`}
              aria-current={status === "on" ? "step" : undefined}
            >
              {interactive ? (
                <button
                  type="button"
                  className="cefr-step-btn"
                  onMouseEnter={() => setHovered(lvl.code)}
                  onFocus={() => setHovered(lvl.code)}
                  onBlur={() => setHovered(null)}
                  aria-describedby={`yema-panel-${lvl.id}`}
                  aria-label={`${lvl.code} — ${name}`}
                >
                  {inner}
                </button>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>

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
                className="cefr-panel yema-panel"
                role="tooltip"
              >
                <div className="cefr-panel-code" aria-hidden="true">
                  {lvl.code}
                </div>
                <div className="cefr-panel-head">{name}</div>
                <p className="yema-panel-anchor">{anchor}</p>
                <ul className="cefr-panel-list">
                  {canDo.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <div className="cefr-panel-fine yema-panel-actfl">
                  {lvl.actfl}
                </div>
              </aside>
            );
          })()
        : null}
    </div>
  );
}
