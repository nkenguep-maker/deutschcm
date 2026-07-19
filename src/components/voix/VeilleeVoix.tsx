"use client";

// VeilleeVoix · la Veillée devient AUDIO-FIRST.
// Sélecteur de langues (natales + étrangères) au-dessus, un player
// <VoixPlayer> plein cadre en dessous. L'utilisateur choisit une
// voix — le player charge le récit et son proverbe d'ouverture.
//
// Jamais d'autoplay. On sélectionne, on clique lecture.

import { useMemo, useState } from "react";
import { STORIES, type VoixStory } from "@/lib/voix/stories";
import { VoixPlayer } from "./VoixPlayer";
import { frTypo } from "@/components/landing/typo";

interface VeilleeVoixProps {
  locale: "fr" | "en";
  /** Récit sélectionné par défaut. Défaut : premier de la liste. */
  defaultStoryId?: string;
}

export function VeilleeVoix({ locale, defaultStoryId }: VeilleeVoixProps) {
  const [storyId, setStoryId] = useState<string>(
    defaultStoryId ?? STORIES[0]?.id ?? "",
  );
  const story: VoixStory | undefined = useMemo(
    () => STORIES.find((s) => s.id === storyId) ?? STORIES[0],
    [storyId],
  );
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  if (!story) return null;

  return (
    <div className="veillee-voix">
      {/* Sélecteur de voix — puce par récit */}
      <div className="veillee-picker" role="tablist"
           aria-label={locale === "en" ? "Choose a voice" : "Choisir une voix"}>
        {STORIES.map((s) => {
          const active = s.id === storyId;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`veillee-picker-btn veillee-picker-${s.territory} ${active ? "on" : ""}`}
              onClick={() => setStoryId(s.id)}
            >
              <span className="veillee-picker-code">{s.langCode}</span>
              <span className="veillee-picker-info">
                <span className="veillee-picker-lang">
                  {locale === "en" ? s.languageEn : s.language}
                </span>
                <span className="veillee-picker-speaker">{s.speaker}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Player plein format */}
      <div className="veillee-voix-frame">
        <VoixPlayer
          key={story.id}
          story={story}
          locale={locale}
          size="full"
          showProverb
        />
      </div>

      <p className="veillee-voix-note">
        {t(locale === "en"
          ? "Each story opens with a proverb — a bench to sit before the road."
          : "Chaque récit s'ouvre par un proverbe — un banc où s'asseoir avant le chemin.")}
      </p>
    </div>
  );
}
