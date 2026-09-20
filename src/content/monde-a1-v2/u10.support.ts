// U10 is NEW_RECONSTRUCTION content based on the canonical syllabus.
// The service context is deliberately generic and does not encode real administrative procedure.

export const A1_V2_U10_DIALOGUE = {
  id: "de-a1-u10-dialogue",
  title: "Am Serviceschalter",
  context: "Noah gibt ein Formular in einem generischen Service ab.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Service", de: "Guten Tag. Wie kann ich Ihnen helfen?", fr: "Bonjour. Comment puis-je vous aider ?" },
    { id: "seg2", speaker: "Noah", de: "Guten Tag. Ich möchte dieses Formular abgeben.", fr: "Bonjour. Je voudrais remettre ce formulaire." },
    { id: "seg3", speaker: "Service", de: "Bitte tragen Sie hier Ihren Namen und Ihre Adresse ein.", fr: "Veuillez inscrire ici votre nom et votre adresse." },
    { id: "seg4", speaker: "Service", de: "Und bitte hier unterschreiben.", fr: "Et veuillez signer ici." },
    { id: "seg5", speaker: "Noah", de: "Wie bitte? Können Sie das bitte wiederholen?", fr: "Pardon ? Pouvez-vous répéter, s’il vous plaît ?" },
    { id: "seg6", speaker: "Service", de: "Natürlich. Name und Adresse hier eintragen und hier unterschreiben.", fr: "Bien sûr. Inscrivez le nom et l’adresse ici et signez ici." },
    { id: "seg7", speaker: "Noah", de: "Danke. Ist das so richtig?", fr: "Merci. Est-ce correct ainsi ?" },
    { id: "seg8", speaker: "Service", de: "Ja, das ist richtig. Einen Moment, bitte.", fr: "Oui, c’est correct. Un instant, s’il vous plaît." },
  ],
};
export const A1_V2_U10_AUDIO_OVERRIDES: Record<string, string> = {};
export const A1_V2_U10_DRILLS: Record<string, string> = {
  "drill.u10.data1": "Meine Adresse ist Lindenstraße vierzehn.",
  "drill.u10.data2": "Meine Telefonnummer ist null eins sieben null, eins zwei drei vier fünf sechs.",
  "drill.u10.data3": "Ich bin am zwölften Mai geboren.",
  "drill.u10.repair": "Können Sie das bitte wiederholen?",
  "drill.u10.precision1": "Können Sie das buchstabieren?",
  "drill.u10.precision2": "Ist das richtig?",
  "drill.u10.precision3": "Ja, das ist richtig.",
  "drill.u10.final-dictation": "Können Sie das bitte wiederholen?",
  "drill.u10.final-instruction": "Bitte hier unterschreiben.",
};
