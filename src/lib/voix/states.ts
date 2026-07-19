// states audio — les mots à afficher via <StateBlock> quand la voix
// charge ou s'égare. Voix éditoriale YEMA : pas de "Chargement en
// cours…", pas de "Une erreur est survenue".

export const VOIX_STATES = {
  loading: {
    fr: {
      soul: "La voix arrive —",
      soulEm: "écoutez.",
    },
    en: {
      soul: "The voice is coming —",
      soulEm: "listen.",
    },
  },
  error: {
    fr: {
      soul: "La voix s'est perdue en route.",
      soulEm: "Pas la vôtre.",
      action: "Réessayer",
    },
    en: {
      soul: "The voice got lost on the way.",
      soulEm: "Not yours.",
      action: "Try again",
    },
  },
} as const;
