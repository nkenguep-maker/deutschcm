export const A1_V2_U4_DIALOGUE = {
  id: "de-a1-u4-dialogue",
  title: "Ein normaler Arbeitstag",
  context: "David et Samira parlent de leur journée.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "David", de: "Wann stehst du morgens auf?", fr: "À quelle heure te lèves-tu le matin ?" },
    { id: "seg2", speaker: "Samira", de: "Ich stehe um halb sieben auf.", fr: "Je me lève à six heures et demie." },
    { id: "seg3", speaker: "David", de: "Und wann fängst du an zu arbeiten?", fr: "Et quand commences-tu à travailler ?" },
    { id: "seg4", speaker: "Samira", de: "Ich fange um acht Uhr an. Mittags esse ich oft mit meinen Kollegen.", fr: "Je commence à huit heures. À midi, je mange souvent avec mes collègues." },
    { id: "seg5", speaker: "David", de: "Wann bist du zu Hause?", fr: "Quand es-tu à la maison ?" },
    { id: "seg6", speaker: "Samira", de: "Gegen sechs. Dann koche ich und rufe meine Familie an.", fr: "Vers six heures. Ensuite, je cuisine et j’appelle ma famille." },
    { id: "seg7", speaker: "David", de: "Und wann gehst du schlafen?", fr: "Et quand vas-tu dormir ?" },
    { id: "seg8", speaker: "Samira", de: "Meistens um elf Uhr.", fr: "La plupart du temps à onze heures." },
  ],
};
export const A1_V2_U4_AUDIO_OVERRIDES: Record<string, string> = {};
export const A1_V2_U4_DRILLS: Record<string, string> = {
  "drill.u4.call-family":"Ich rufe meine Familie an.",
  "drill.u4.seq1":"Zuerst stehe ich auf.",
  "drill.u4.seq2":"Dann frühstücke ich.",
  "drill.u4.seq3":"Danach arbeite ich.",
  "drill.u4.stehe-auf":"Ich stehe um sieben Uhr auf.",
  "drill.u4.abends-anrufen":"Abends rufe ich meine Familie an.",
  "drill.u4.halb-acht":"um halb acht",
  "drill.u4.time1":"Morgens stehe ich um halb sieben auf.",
  "drill.u4.time2":"Ich arbeite von acht bis fünf.",
  "drill.u4.time3":"Gegen sechs bin ich zu Hause.",
  "drill.u4.final-dictation":"Gegen sechs bin ich zu Hause.",
  "drill.u4.final-listening":"Wann fängst du an zu arbeiten?"
};
