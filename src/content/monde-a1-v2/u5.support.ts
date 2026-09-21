export const A1_V2_U5_DIALOGUE = {
  id: "de-a1-u5-dialogue",
  title: "Wo ist die U-Bahn?",
  context: "Ibrahim demande son chemin à une passante.",
  audioStatus: "SCRIPT_ONLY_NATIVE_AUDIO_REQUIRED" as const,
  lines: [
    { id:"seg1", speaker:"Ibrahim", de:"Entschuldigung, wo ist die nächste U-Bahn-Station?", fr:"Excusez-moi, où est la station de métro la plus proche ?" },
    { id:"seg2", speaker:"Passantin", de:"Gehen Sie hier geradeaus und dann an der Ampel links.", fr:"Allez tout droit ici, puis à gauche au feu." },
    { id:"seg3", speaker:"Ibrahim", de:"Also geradeaus und dann links?", fr:"Donc tout droit, puis à gauche ?" },
    { id:"seg4", speaker:"Passantin", de:"Genau. Die Station ist neben der Apotheke.", fr:"Exactement. La station est à côté de la pharmacie." },
    { id:"seg5", speaker:"Ibrahim", de:"Ist das weit?", fr:"Est-ce loin ?" },
    { id:"seg6", speaker:"Passantin", de:"Nein, nur fünf Minuten zu Fuß.", fr:"Non, seulement cinq minutes à pied." },
    { id:"seg7", speaker:"Ibrahim", de:"Vielen Dank!", fr:"Merci beaucoup !" },
    { id:"seg8", speaker:"Passantin", de:"Gern geschehen.", fr:"Avec plaisir." }
  ],
};
export const A1_V2_U5_AUDIO_OVERRIDES: Record<string,string> = {};
export const A1_V2_U5_DRILLS: Record<string,string> = {
  "drill.u5.dir1":"Gehen Sie geradeaus.",
  "drill.u5.dir2":"Dann links.",
  "drill.u5.dir3":"An der Kreuzung rechts.",
  "drill.u5.wo-bahnhof":"Wo ist der Bahnhof?",
  "drill.u5.also-right":"Also geradeaus und dann rechts?",
  "drill.u5.ticket-potsdam":"Eine Fahrkarte nach Potsdam, bitte.",
  "drill.u5.ticket1":"Eine Fahrkarte nach Potsdam, bitte.",
  "drill.u5.ticket2":"Einfach, bitte.",
  "drill.u5.ticket3":"Wie viele Stationen?",
  "drill.u5.final-dictation":"Gehen Sie geradeaus und dann links.",
  "drill.u5.final-listening":"Also geradeaus und dann links?"
};
