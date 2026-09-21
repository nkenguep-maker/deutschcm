// U12 is NEW_RECONSTRUCTION consolidation content.
// QA TTS only; critical native recordings remain a READY gate.

export const A1_V2_U12_DIALOGUE = {
  id: "de-a1-u12-dialogue",
  title: "Ein Vormittag, mehrere Situationen",
  context: "Lea bewältigt nacheinander Bahnhof, Café, Service und Termin.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id: "seg1", speaker: "Ansage", de: "Der Zug nach Hamburg fährt heute von Gleis sieben. Er hat zehn Minuten Verspätung.", fr: "Le train pour Hambourg part aujourd’hui de la voie 7. Il a dix minutes de retard." },
    { id: "seg2", speaker: "Lea", de: "Entschuldigung. Noch einmal, bitte.", fr: "Excusez-moi. Encore une fois, s’il vous plaît." },
    { id: "seg3", speaker: "Mitarbeiter", de: "Natürlich. Gleis sieben, zehn Minuten Verspätung.", fr: "Bien sûr. Voie 7, dix minutes de retard." },
    { id: "seg4", speaker: "Lea", de: "Ich hätte gern einen Tee ohne Zucker, bitte.", fr: "Je voudrais un thé sans sucre, s’il vous plaît." },
    { id: "seg5", speaker: "Service", de: "Bitte füllen Sie dieses Formular aus und unterschreiben Sie hier.", fr: "Veuillez remplir ce formulaire et signer ici." },
    { id: "seg6", speaker: "Lea", de: "Ich verstehe nicht. Was bedeutet dieses Wort?", fr: "Je ne comprends pas. Que signifie ce mot ?" },
    { id: "seg7", speaker: "Service", de: "Kein Problem. Ich erkläre es.", fr: "Pas de problème. Je vous l’explique." },
    { id: "seg8", speaker: "Praxis", de: "Ihr Termin ist morgen um zehn Uhr.", fr: "Votre rendez-vous est demain à dix heures." },
  ],
};

export const A1_V2_U12_AUDIO_OVERRIDES: Record<string, string> = {};

export const A1_V2_U12_DRILLS: Record<string, string> = {
  "drill.u12.repair1": "Noch einmal, bitte.",
  "drill.u12.repair2": "Langsamer, bitte.",
  "drill.u12.repair3": "Können Sie mir helfen?",
  "drill.u12.places": "Zuerst gehe ich zum Bahnhof. Danach gehe ich zur Apotheke.",
  "drill.u12.auto1": "Was soll ich machen?",
  "drill.u12.auto2": "Wo muss ich hin?",
  "drill.u12.auto3": "Ich brauche Hilfe.",
  "drill.u12.final-dictation": "Ich kann gut Deutsch sprechen.",
  "drill.u12.final-listening": "Ich brauche Hilfe beim Ausfüllen des Formulars.",
};
