"use client";

// VeilleeVoix · la Veillée devient AUDIO-FIRST.
// Sélecteur de langues (africaines + du monde) au-dessus, un player
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
  /** Limite le nombre de récits affichés (aperçu home = 3, page /veillee = tout). */
  limit?: number;
}

export function VeilleeVoix({ locale, defaultStoryId, limit }: VeilleeVoixProps) {
  // Règle de vérité · seuls les récits enregistrés + relus par le
  // locuteur natif s'affichent. Aucun persona éditorial n'atteint
  // l'audience finale. Si aucun n'est validé, on rend un état vide.
  const validated = useMemo(
    () => STORIES.filter((s) => s.validated === true),
    [],
  );
  const visible = limit ? validated.slice(0, limit) : validated;
  const [storyId, setStoryId] = useState<string>(
    defaultStoryId ?? visible[0]?.id ?? "",
  );
  const story: VoixStory | undefined = useMemo(
    () => visible.find((s) => s.id === storyId) ?? visible[0],
    [storyId, visible],
  );
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);

  if (!story) {
    // État vide · aucun récit validé encore. La Veillée respire, on
    // attend les vraies voix. Aucun persona de remplissage.
    return (
      <div className="veillee-voix veillee-voix-empty" role="status">
        <p className="veillee-voix-note">
          {t(locale === "en"
            ? "The Veillée is being prepared. Real voices are on their way."
            : "La Veillée se prépare. Les vraies voix arrivent.")}
        </p>
      </div>
    );
  }

  return (
    <div className="veillee-voix">
      {/* Sélecteur de voix — puce par récit */}
      <div className="veillee-picker" role="tablist"
           aria-label={locale === "en" ? "Choose a voice" : "Choisir une voix"}>
        {visible.map((s) => {
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
