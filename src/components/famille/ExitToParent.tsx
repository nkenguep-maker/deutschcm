"use client";

// ExitToParent · sortie de l'espace enfant vers l'espace parent.
// Jamais un simple bouton — un maintien long (2 s) ou un petit calcul
// adulte, au choix du parent. La spec de sécurité mineurs demande une
// confirmation active d'un adulte. On implémente la voie maintien-long
// par défaut (plus rapide), avec fallback calcul si tap accidentel.
//
// Trigger : petit rond mono discret en bas de l'écran enfant.
// Aria : bouton clairement labellisé « Espace parent (adulte) ».

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ExitToParentProps {
  locale: string;
  loc: "fr" | "en";
}

export function ExitToParent({ locale, loc }: ExitToParentProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"hidden" | "hold" | "calc">("hidden");
  const [held, setHeld] = useState(0); // ms
  const holdRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);

  const [a, b] = useState(() => {
    // Deux entiers 3..9 dont la somme est ≤ 18, faciles pour un
    // adulte, hors de portée d'un enfant < 6 ans par frappe rapide.
    const rand = () => 3 + Math.floor(Math.random() * 7);
    return [rand(), rand()];
  })[0] as unknown as [number, number];
  const answer = a + b;
  const [entry, setEntry] = useState("");

  useEffect(() => {
    return () => {
      if (holdRef.current) window.clearInterval(holdRef.current);
    };
  }, []);

  const startHold = () => {
    holdStartRef.current = performance.now();
    setHeld(0);
    holdRef.current = window.setInterval(() => {
      const elapsed = performance.now() - holdStartRef.current;
      setHeld(elapsed);
      if (elapsed >= 2000) {
        if (holdRef.current) window.clearInterval(holdRef.current);
        holdRef.current = null;
        router.push(`/${locale}/famille`);
      }
    }, 50);
  };
  const stopHold = () => {
    if (holdRef.current) window.clearInterval(holdRef.current);
    holdRef.current = null;
    setHeld(0);
  };

  const holdPct = Math.min(100, (held / 2000) * 100);

  const openLabel = loc === "en" ? "Parent space (adult)" : "Espace parent (adulte)";
  const holdLabel = loc === "en"
    ? "Hold to unlock"
    : "Maintenez pour ouvrir";
  const calcQ = loc === "en"
    ? `Adult check: ${a} + ${b} = ?`
    : `Contrôle adulte : ${a} + ${b} = ?`;
  const useCalc = loc === "en" ? "Rather use a calculation" : "Utiliser plutôt un calcul";

  if (mode === "hidden") {
    return (
      <button
        type="button"
        className="child-exit-trigger"
        aria-label={openLabel}
        onClick={() => setMode("hold")}
      >
        <span aria-hidden="true">⌂</span>
      </button>
    );
  }

  if (mode === "hold") {
    return (
      <div className="child-exit-panel" role="dialog" aria-label={openLabel}>
        <p className="child-exit-h">{openLabel}</p>
        <button
          type="button"
          className="child-exit-hold"
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          onTouchCancel={stopHold}
          aria-label={holdLabel}
        >
          <span className="child-exit-hold-inner" style={{ width: `${holdPct}%` }} />
          <span className="child-exit-hold-lbl">{holdLabel}</span>
        </button>
        <button type="button" className="child-exit-alt" onClick={() => setMode("calc")}>
          {useCalc}
        </button>
        <button type="button" className="child-exit-close" onClick={() => setMode("hidden")}>
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="child-exit-panel" role="dialog" aria-label={openLabel}>
      <p className="child-exit-h">{calcQ}</p>
      <input
        type="number"
        className="child-exit-input"
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && Number(entry) === answer) {
            router.push(`/${locale}/famille`);
          }
        }}
        inputMode="numeric"
        aria-label={calcQ}
      />
      <button
        type="button"
        className="child-exit-alt"
        disabled={Number(entry) !== answer}
        onClick={() => {
          if (Number(entry) === answer) router.push(`/${locale}/famille`);
        }}
      >
        {loc === "en" ? "Open" : "Ouvrir"}
      </button>
      <button type="button" className="child-exit-close" onClick={() => setMode("hidden")}>
        ×
      </button>
    </div>
  );
}
