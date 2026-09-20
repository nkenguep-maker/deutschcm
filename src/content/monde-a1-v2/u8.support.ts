// U8 is NEW_RECONSTRUCTION content based on the canonical syllabus.
// Browser TTS is QA-only. Native critical audio remains a READY gate.

export const A1_V2_U8_DIALOGUE = {
  id: "de-a1-u8-dialogue",
  title: "Neu im Team",
  context: "Mara stellt sich einer neuen Kollegin vor.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Nina", de: "Hallo, ich bin Nina. Was machst du beruflich?", fr: "Salut, je suis Nina. Que fais-tu dans la vie ?" },
    { id: "seg2", speaker: "Mara", de: "Ich bin Verkäuferin. Ich arbeite in einem Geschäft.", fr: "Je suis vendeuse. Je travaille dans un magasin." },
    { id: "seg3", speaker: "Nina", de: "Wann arbeitest du?", fr: "Quand travailles-tu ?" },
    { id: "seg4", speaker: "Mara", de: "Ich arbeite von neun bis fünf. Um zwölf habe ich Pause.", fr: "Je travaille de neuf à cinq. À midi, j’ai une pause." },
    { id: "seg5", speaker: "Nina", de: "Was machst du bei der Arbeit?", fr: "Que fais-tu au travail ?" },
    { id: "seg6", speaker: "Mara", de: "Ich spreche mit Kunden und schreibe E-Mails. Ich kann gut Englisch sprechen.", fr: "Je parle avec des clients et j’écris des e-mails. Je sais bien parler anglais." },
    { id: "seg7", speaker: "Nina", de: "Super. Bis später!", fr: "Super. À plus tard !" },
  ],
};

export const A1_V2_U8_AUDIO_OVERRIDES: Record<string, string> = {};

export const A1_V2_U8_DRILLS: Record<string, string> = {
  "drill.u8.job1": "Ich bin Verkäuferin.",
  "drill.u8.job2": "Ich bin Koch.",
  "drill.u8.job3": "Ich bin Student.",
  "drill.u8.task": "Ich schreibe E-Mails.",
  "drill.u8.skill1": "Ich kann gut kochen.",
  "drill.u8.skill2": "Ich kann gut Deutsch sprechen.",
  "drill.u8.skill3": "Ich kann gut rechnen.",
  "drill.u8.final-dictation": "Ich kann gut Englisch sprechen.",
  "drill.u8.final-place": "Ich arbeite in einem Büro.",
};
