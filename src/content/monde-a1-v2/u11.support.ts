// U11 is NEW_RECONSTRUCTION content based on the canonical syllabus.
// Travel information is generic language-learning content.

export const A1_V2_U11_DIALOGUE = {
  id: "de-a1-u11-dialogue",
  title: "Information am Bahnhof",
  context: "Lea hört eine kurze Information zu ihrem Zug.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Ansage", de: "Der Zug nach Hamburg fährt um acht Uhr zehn von Gleis vier ab.", fr: "Le train pour Hambourg part à 8 h 10 de la voie 4." },
    { id: "seg2", speaker: "Ansage", de: "Der Zug hat heute zehn Minuten Verspätung.", fr: "Le train a aujourd’hui dix minutes de retard." },
    { id: "seg3", speaker: "Lea", de: "Also Gleis vier und zehn Minuten Verspätung.", fr: "Donc voie 4 et dix minutes de retard." },
    { id: "seg4", speaker: "Mina", de: "Wie ist das Wetter in Hamburg?", fr: "Quel temps fait-il à Hambourg ?" },
    { id: "seg5", speaker: "Lea", de: "Es ist kalt, aber sonnig.", fr: "Il fait froid, mais ensoleillé." },
    { id: "seg6", speaker: "Mina", de: "Gute Reise!", fr: "Bon voyage !" },
  ],
};
export const A1_V2_U11_AUDIO_OVERRIDES: Record<string, string> = {};
export const A1_V2_U11_DRILLS: Record<string, string> = {
  "drill.u11.weather1": "Es ist sonnig.",
  "drill.u11.weather2": "Es regnet.",
  "drill.u11.weather3": "Es ist windig.",
  "drill.u11.when": "Am Samstag fahre ich nach Hamburg.",
  "drill.u11.plan1": "Wann fährst du?",
  "drill.u11.plan2": "Was nimmst du mit?",
  "drill.u11.plan3": "Gute Reise!",
  "drill.u11.final-dictation": "Am Samstag fahre ich nach Hamburg.",
  "drill.u11.final-weather": "Es ist sonnig.",
};
