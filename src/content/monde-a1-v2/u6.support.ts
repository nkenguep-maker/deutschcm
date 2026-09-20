// Editorial dialogue retained from the archived 2026.08.04 unit 6.
// The legacy "A1 finished" framing is deliberately not retained.

export const A1_V2_U6_DIALOGUE = {
  id: "de-a1-u6-dialogue",
  title: "Einkaufen und verabreden",
  context: "Lina achète une veste puis appelle son ami Ben.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Verkäufer", de: "Kann ich Ihnen helfen?", fr: "Puis-je vous aider ?" },
    { id: "seg2", speaker: "Lina", de: "Ja, ich suche eine schwarze Jacke in Größe M.", fr: "Oui, je cherche une veste noire en taille M." },
    { id: "seg3", speaker: "Verkäufer", de: "Diese hier kostet sechzig Euro.", fr: "Celle-ci coûte 60 euros." },
    { id: "seg4", speaker: "Lina", de: "Kann ich sie anprobieren?", fr: "Puis-je l’essayer ?" },
    { id: "seg5", speaker: "Verkäufer", de: "Natürlich. Die Umkleidekabine ist dort rechts.", fr: "Bien sûr. La cabine d’essayage est là-bas à droite." },
    { id: "seg6", speaker: "Lina", de: "Sie passt gut. Ich nehme sie.", fr: "Elle me va bien. Je la prends." },
    { id: "seg7", speaker: "Lina", de: "Hallo Ben, hast du heute Abend Zeit?", fr: "Salut Ben, as-tu du temps ce soir ?" },
    { id: "seg8", speaker: "Ben", de: "Ja. Wollen wir ins Kino gehen?", fr: "Oui. On va au cinéma ?" },
    { id: "seg9", speaker: "Lina", de: "Gern. Treffen wir uns um halb acht vor dem Kino?", fr: "Avec plaisir. On se retrouve à 19 h 30 devant le cinéma ?" },
    { id: "seg10", speaker: "Ben", de: "Perfekt. Bis später!", fr: "Parfait. À plus tard !" },
  ],
};

export const A1_V2_U6_AUDIO_OVERRIDES: Record<string, string> = {};

export const A1_V2_U6_DRILLS: Record<string, string> = {
  "drill.u6.shop1": "Welche Größe haben Sie?",
  "drill.u6.shop2": "Es ist zu klein.",
  "drill.u6.shop3": "Ich nehme es.",
  "drill.u6.modal-discrimination": "Kann ich die Jacke anprobieren?",
  "drill.u6.meet1": "Hast du heute Abend Zeit?",
  "drill.u6.meet2": "Wollen wir ins Kino gehen?",
  "drill.u6.meet3": "Treffen wir uns um halb acht vor dem Kino?",
  "drill.u6.final-dictation": "Wollen wir einen Kaffee trinken?",
  "drill.u6.final-listening": "Treffen wir uns um acht vor dem Kino?",
};
