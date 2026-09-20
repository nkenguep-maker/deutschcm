// Editorial dialogue retained from the archived 2026.08.04 unit 2.
// Native recordings remain a READY gate; these scripts/drills are QA-only TTS sources.

export const A1_V2_U2_DIALOGUE = {
  id: "de-a1-u2-dialogue",
  title: "Das ist meine Familie",
  context: "Mila montre une photo à Jonas.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Jonas", de: "Ist das deine Familie?", fr: "C’est ta famille ?" },
    { id: "seg2", speaker: "Mila", de: "Ja. Das ist meine Mutter. Sie heißt Sofia.", fr: "Oui. Voici ma mère. Elle s’appelle Sofia." },
    { id: "seg3", speaker: "Jonas", de: "Und wer ist das?", fr: "Et qui est-ce ?" },
    { id: "seg4", speaker: "Mila", de: "Das ist mein Bruder Leo. Er ist achtzehn Jahre alt.", fr: "C’est mon frère Leo. Il a dix-huit ans." },
    { id: "seg5", speaker: "Jonas", de: "Hast du auch eine Schwester?", fr: "Tu as aussi une sœur ?" },
    { id: "seg6", speaker: "Mila", de: "Nein, ich habe keine Schwester. Aber ich habe zwei Cousinen.", fr: "Non, je n’ai pas de sœur. Mais j’ai deux cousines." },
    { id: "seg7", speaker: "Jonas", de: "Wo wohnen deine Eltern?", fr: "Où habitent tes parents ?" },
    { id: "seg8", speaker: "Mila", de: "Sie wohnen in Wien.", fr: "Ils habitent à Vienne." },
  ],
};

export const A1_V2_U2_AUDIO_OVERRIDES: Record<string, string> = {};

export const A1_V2_U2_DRILLS: Record<string, string> = {
  "drill.u2.parents-wien": "Sie wohnen in Wien.",
  "drill.u2.mutter": "Das ist meine Mutter.",
  "drill.u2.bruder": "Das ist mein Bruder.",
  "drill.u2.grossmutter": "Das ist meine Großmutter.",
  "drill.u2.ich-habe": "Ich habe einen Bruder.",
  "drill.u2.er": "Mein Bruder heißt Leo. Er wohnt in Wien.",
  "drill.u2.pron-bruder": "Bruder",
  "drill.u2.pron-mutter": "Meine Mutter wohnt in Köln.",
  "drill.u2.pron-bruder-satz": "Mein Bruder heißt Musa.",
  "drill.u2.pron-wohnen": "Meine Großmutter wohnt in Bonn.",
  "drill.u2.final-dictation": "Meine Eltern wohnen in Wien.",
  "drill.u2.final-listening": "Hast du Geschwister?",
};
