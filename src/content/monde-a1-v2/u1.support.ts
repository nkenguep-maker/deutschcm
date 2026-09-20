// Editorial material retained from the archived 2026.08.04 unit 1.
// The refonte doctrine explicitly keeps the Karim persona and the strong
// communicative material, while replacing the learning mechanics.

export const A1_V2_U1_DIALOGUE = {
  id: "de-a1-u1-dialogue",
  title: "Première rencontre",
  context: "Anna et Karim se rencontrent pendant un événement.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Anna", de: "Guten Morgen! Ich heiße Anna. Und du?", fr: "Bonjour ! Je m’appelle Anna. Et toi ?" },
    { id: "seg2", speaker: "Karim", de: "Hallo! Ich heiße Karim.", fr: "Salut ! Je m’appelle Karim." },
    { id: "seg3", speaker: "Anna", de: "Freut mich. Woher kommst du?", fr: "Enchantée. D’où viens-tu ?" },
    { id: "seg4", speaker: "Karim", de: "Ich komme aus Kamerun und wohne in Berlin. Und du?", fr: "Je viens du Cameroun et j’habite à Berlin. Et toi ?" },
    { id: "seg5", speaker: "Anna", de: "Ich komme aus Deutschland.", fr: "Je viens d’Allemagne." },
    { id: "seg6", speaker: "Karim", de: "Sprichst du Französisch?", fr: "Tu parles français ?" },
    { id: "seg7", speaker: "Anna", de: "Ein bisschen. Ich spreche Deutsch und Englisch.", fr: "Un peu. Je parle allemand et anglais." },
    { id: "seg8", speaker: "Karim", de: "Schön, dich kennenzulernen.", fr: "Ravi de faire ta connaissance." },
    { id: "seg9", speaker: "Anna", de: "Ebenso!", fr: "Moi aussi !" },
  ],
};

export const A1_V2_U1_DRILLS: Record<string, string> = {
  "drill.u1.wo-woher": "Woher kommst du?",
  "drill.u1.s1": "Ich heiße Karim.",
  "drill.u1.s2": "Ich heiße Karim und ich komme aus Kamerun.",
  "drill.u1.s3": "Ich heiße Karim, ich komme aus Kamerun und ich wohne in Berlin.",
};
