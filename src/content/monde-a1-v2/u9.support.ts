// U9 is NEW_RECONSTRUCTION content based on the canonical syllabus.
// This is language-learning content only; it does not provide medical advice.

export const A1_V2_U9_DIALOGUE = {
  id: "de-a1-u9-dialogue",
  title: "Termin in der Praxis",
  context: "Samira ruft in einer Praxis an.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Praxis", de: "Guten Morgen, Praxis Wagner.", fr: "Bonjour, cabinet Wagner." },
    { id: "seg2", speaker: "Samira", de: "Guten Morgen. Ich bin krank. Ich habe Fieber und Husten.", fr: "Bonjour. Je suis malade. J’ai de la fièvre et de la toux." },
    { id: "seg3", speaker: "Samira", de: "Ich brauche einen Termin.", fr: "J’ai besoin d’un rendez-vous." },
    { id: "seg4", speaker: "Praxis", de: "Heute leider nicht. Geht es morgen?", fr: "Aujourd’hui malheureusement non. Est-ce possible demain ?" },
    { id: "seg5", speaker: "Samira", de: "Ja. Um wie viel Uhr?", fr: "Oui. À quelle heure ?" },
    { id: "seg6", speaker: "Praxis", de: "Um zehn Uhr.", fr: "À dix heures." },
    { id: "seg7", speaker: "Samira", de: "Ja, das passt. Vielen Dank.", fr: "Oui, ça me convient. Merci beaucoup." },
    { id: "seg8", speaker: "Praxis", de: "Gern. Auf Wiederhören.", fr: "Avec plaisir. Au revoir." },
  ],
};
export const A1_V2_U9_AUDIO_OVERRIDES: Record<string, string> = {};
export const A1_V2_U9_DRILLS: Record<string, string> = {
  "drill.u9.body1": "Mein Kopf tut weh.",
  "drill.u9.body2": "Mein Bauch tut weh.",
  "drill.u9.body3": "Mein Rücken tut weh.",
  "drill.u9.pain": "Mein Rücken tut weh.",
  "drill.u9.term1": "Haben Sie heute einen Termin frei?",
  "drill.u9.term2": "Geht es morgen?",
  "drill.u9.term3": "Ja, das passt.",
  "drill.u9.final-dictation": "Haben Sie heute einen Termin frei?",
  "drill.u9.final-symptom": "Ich habe Bauchschmerzen.",
};
