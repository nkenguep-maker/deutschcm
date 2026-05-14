export const LANGUAGES = {
  deutsch: {
    id: "deutsch",
    name: "Allemand",
    flag: "🇩🇪",
    available: true,
    levels: ["A1","A2","B1","B2","C1"],
    framework: "CEFR + Goethe-Institut",
    exams: ["Goethe-Zertifikat","TestDaF","DSH"],
    ttsVoices: {
      female: "de-DE-KatjaNeural",
      male: "de-DE-ConradNeural"
    },
    speechLang: "de-DE",
    color: "#10b981"
  },
  english: {
    id: "english",
    name: "Anglais",
    flag: "🇬🇧",
    available: false, // Phase 2
    levels: ["A1","A2","B1","B2","C1","C2"],
    framework: "CEFR + Cambridge",
    exams: ["TOEFL","IELTS","Cambridge B2 First"],
    ttsVoices: {
      female: "en-US-JennyNeural",
      male: "en-US-GuyNeural"
    },
    speechLang: "en-US",
    color: "#60a5fa"
  },
  francais: {
    id: "francais",
    name: "Français",
    flag: "🇫🇷",
    available: false, // Phase 3
    levels: ["A1","A2","B1","B2","C1","C2"],
    framework: "CEFR + Alliance Française",
    exams: ["DELF","DALF","TCF"],
    ttsVoices: {
      female: "fr-FR-DeniseNeural",
      male: "fr-FR-HenriNeural"
    },
    speechLang: "fr-FR",
    color: "#f59e0b"
  },
  espagnol: {
    id: "espagnol",
    name: "Espagnol",
    flag: "🇪🇸",
    available: false, // Phase 4
    levels: ["A1","A2","B1","B2","C1"],
    framework: "CEFR + Instituto Cervantes",
    exams: ["DELE","SIELE"],
    ttsVoices: {
      female: "es-ES-ElviraNeural",
      male: "es-ES-AlvaroNeural"
    },
    speechLang: "es-ES",
    color: "#a78bfa"
  }
}

export type LanguageId = keyof typeof LANGUAGES
export const AVAILABLE_LANGUAGES = Object.values(LANGUAGES).filter(l => l.available)
export const COMING_SOON = Object.values(LANGUAGES).filter(l => !l.available)
