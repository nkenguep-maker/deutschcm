// U7 is NEW_RECONSTRUCTION content based on the canonical syllabus.
// These scripts are QA TTS sources; native critical audio is still a READY gate.

export const A1_V2_U7_DIALOGUE = {
  id: "de-a1-u7-dialogue",
  title: "Wohnungsbesichtigung",
  context: "Amina besichtigt eine Wohnung bei Herrn Becker.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Becker", de: "Guten Tag. Hier ist die Wohnung.", fr: "Bonjour. Voici l’appartement." },
    { id: "seg2", speaker: "Becker", de: "Die Wohnung hat zwei Zimmer, eine Küche und ein Bad. Es gibt auch einen Balkon.", fr: "L’appartement a deux pièces, une cuisine et une salle de bain. Il y a aussi un balcon." },
    { id: "seg3", speaker: "Amina", de: "Ist das Wohnzimmer groß?", fr: "Le salon est-il grand ?" },
    { id: "seg4", speaker: "Becker", de: "Ja, es ist hell und ruhig.", fr: "Oui, il est lumineux et calme." },
    { id: "seg5", speaker: "Amina", de: "Wo ist die Waschmaschine?", fr: "Où est la machine à laver ?" },
    { id: "seg6", speaker: "Becker", de: "Die Waschmaschine ist im Bad. Der Kühlschrank ist in der Küche.", fr: "La machine à laver est dans la salle de bain. Le réfrigérateur est dans la cuisine." },
    { id: "seg7", speaker: "Amina", de: "Wie hoch ist die Miete?", fr: "Quel est le montant du loyer ?" },
    { id: "seg8", speaker: "Becker", de: "Die Miete ist siebenhundertachtzig Euro im Monat. Die Wohnung ist ab Oktober frei.", fr: "Le loyer est de 780 euros par mois. L’appartement est libre à partir d’octobre." },
  ],
};

export const A1_V2_U7_AUDIO_OVERRIDES: Record<string, string> = {};

export const A1_V2_U7_DRILLS: Record<string, string> = {
  "drill.u7.furniture1": "Der Kühlschrank ist in der Küche.",
  "drill.u7.furniture2": "Die Waschmaschine ist im Bad.",
  "drill.u7.furniture3": "Der Schrank ist im Schlafzimmer.",
  "drill.u7.position": "Die Tasche ist unter dem Tisch.",
  "drill.u7.describe1": "Die Wohnung ist hell.",
  "drill.u7.describe2": "Das Schlafzimmer ist ruhig.",
  "drill.u7.describe3": "Die Wohnung hat einen Balkon.",
  "drill.u7.final-dictation": "Die Lampe ist auf dem Tisch.",
  "drill.u7.final-rent": "Die Miete ist siebenhundertachtzig Euro im Monat.",
};
