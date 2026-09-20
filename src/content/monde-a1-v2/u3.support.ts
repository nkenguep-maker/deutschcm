// Editorial dialogue retained from the archived 2026.08.04 unit 3.
// These scripts power QA TTS only. Native critical audio remains a READY gate.

export const A1_V2_U3_DIALOGUE = {
  id: "de-a1-u3-dialogue",
  title: "Im Café",
  context: "Nora commande au comptoir.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Service", de: "Guten Tag. Was möchten Sie?", fr: "Bonjour. Que désirez-vous ?" },
    { id: "seg2", speaker: "Nora", de: "Ich hätte gern einen Kaffee und ein Käsebrötchen, bitte.", fr: "Je voudrais un café et un petit pain au fromage, s’il vous plaît." },
    { id: "seg3", speaker: "Service", de: "Mit Milch?", fr: "Avec du lait ?" },
    { id: "seg4", speaker: "Nora", de: "Ja, bitte. Aber ohne Zucker.", fr: "Oui, s’il vous plaît. Mais sans sucre." },
    { id: "seg5", speaker: "Service", de: "Sonst noch etwas?", fr: "Autre chose ?" },
    { id: "seg6", speaker: "Nora", de: "Nein, danke. Was kostet das?", fr: "Non merci. Combien cela coûte ?" },
    { id: "seg7", speaker: "Service", de: "Das macht sieben Euro zwanzig.", fr: "Cela fait 7,20 euros." },
    { id: "seg8", speaker: "Nora", de: "Kann ich mit Karte bezahlen?", fr: "Puis-je payer par carte ?" },
    { id: "seg9", speaker: "Service", de: "Ja, natürlich.", fr: "Oui, bien sûr." },
  ],
};

export const A1_V2_U3_AUDIO_OVERRIDES: Record<string, string> = {};

export const A1_V2_U3_DRILLS: Record<string, string> = {
  "drill.u3.order1": "Ich hätte gern einen Kaffee.",
  "drill.u3.order2": "Einen Kaffee mit Milch, bitte.",
  "drill.u3.order3": "Einen Tee ohne Zucker, bitte.",
  "drill.u3.einen-kaffee": "Ich hätte gern einen Kaffee.",
  "drill.u3.article-discrimination": "Ich hätte gern einen Kaffee.",
  "drill.u3.price-720": "Das macht sieben Euro zwanzig.",
  "drill.u3.pay1": "Was kostet das?",
  "drill.u3.pay2": "Die Rechnung, bitte.",
  "drill.u3.pay3": "Kann ich mit Karte bezahlen?",
  "drill.u3.final-dictation": "Kann ich mit Karte bezahlen?",
  "drill.u3.final-listening": "Einen Kaffee mit Milch, aber ohne Zucker, bitte.",
};
