"use client";

// AutreVoixStrip · Sprint « Le Foyer » — refonte premium, étape 1.
// Bande fine « L'autre voix vous attend » — visible UNIQUEMENT si
// l'user a 2+ langues supportées. Bascule via POST /api/language/switch
// puis reload avec une couture 240ms (--dur-move · ease-glide) où le
// body reçoit .foyer-switching pour le fade du fond terre↔espresso.
// Une seule pièce affichée à la fois, jamais deux territoires en
// parallèle.

import { frTypo } from "@/components/landing/typo";
import type { FoyerLangue } from "@/components/foyer/types";

interface Copy {
  kicker: string;
  singlePrefix: string;
  singleSuffix: string;
}

interface AutreVoixStripProps {
  locale: "fr" | "en";
  active: FoyerLangue;
  otherLanguages: FoyerLangue[];
  copy: Copy;
}

async function switchLanguage(languageId: string) {
  if (typeof document !== "undefined") {
    document.body.classList.add("foyer-switching");
  }
  try {
    await fetch("/api/language/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ languageId }),
    });
  } catch {
    if (typeof document !== "undefined") {
      document.body.classList.remove("foyer-switching");
    }
    return;
  }
  window.setTimeout(() => window.location.reload(), 240);
}

export function AutreVoixStrip({ locale, active, otherLanguages, copy }: AutreVoixStripProps) {
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);
  if (otherLanguages.length === 0) return null;

  const nameOf = (l: FoyerLangue) => (locale === "en" ? l.nameEn : l.name);

  return (
    <section
      className="foyer-other"
      aria-labelledby="foyer-other-h"
      data-active-territory={active.territory}
    >
      <p id="foyer-other-h" className="maison-kicker">{t(copy.kicker)}</p>
      {otherLanguages.length === 1 ? (
        <button
          type="button"
          className="foyer-other-single"
          onClick={() => switchLanguage(otherLanguages[0].id)}
        >
          {t(copy.singlePrefix)}{" "}
          <em>
            {t(copy.singleSuffix)} {nameOf(otherLanguages[0])} →
          </em>
        </button>
      ) : (
        <ul className="foyer-other-list">
          {otherLanguages.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                className="foyer-other-item"
                onClick={() => switchLanguage(l.id)}
              >
                <span className="foyer-other-code">{l.code}</span>
                <span className="foyer-other-name">{nameOf(l)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
