// stories.ts — recueil des récits audio YEMA « La Veillée ».
// Les cinq voix rééquilibrent le marché : trois territoires (Franchir,
// Grandir, Transmettre), quatre langues (allemand, anglais, français,
// wolof), quatre pays. Chaque récit s'ouvre par un proverbe.
//
// Placeholder : MP3 non encore livrés. Les timings et transcriptions
// sont éditoriaux, prêts à recevoir les vraies voix.

export interface VoixCue {
  from: number;
  to: number;
  native: string;
  translation: string;
  translationEn: string;
}

export interface VoixProverb {
  native: string;
  translation: string;
  translationEn: string;
  audioSrc: string;
  attribution?: string;
}

export interface VoixStory {
  id: string;
  language: string;
  languageEn: string;
  langCode: string;
  speaker: string;
  /** Une phrase qui présente le récit — le titre visible dans le player */
  title: string;
  titleEn: string;
  /** Un récit long-form court, affiché sous la citation */
  narrative: string;
  narrativeEn: string;
  /** Cap final atteint, en mono JetBrains */
  cap: string;
  capEn: string;
  duration: number;
  territory: "world" | "sources";
  portraitSrc?: string;
  monogram: string;
  audioSrc: string;
  proverb: VoixProverb;
  cues: VoixCue[];
}

// Ordre d'affichage · Franchir (Kevin, Aïcha) · Grandir (Fatima, Jean) ·
// Transmettre (Bintou). Le fond terre-latérite est réservé aux natales
// (sources) — seule Bintou en profite.
export const STORIES: readonly VoixStory[] = [
  {
    id: "kevin-allemand",
    language: "allemand",
    languageEn: "German",
    langCode: "DE",
    speaker: "Kevin",
    title: "Kevin — de Yaoundé à Berlin",
    titleEn: "Kevin — from Yaoundé to Berlin",
    narrative: "Trois lettres l'obsédaient : A2, B1, B2. Il les a gravies une à une, le soir, après les cours. Le jour de l'entretien, il a répondu sans trembler.",
    narrativeEn: "Three letters obsessed him: A2, B1, B2. He climbed them one by one, in the evenings after class. On interview day, he answered without trembling.",
    cap: "B2 ATTEINT · ÉTUDES À BERLIN",
    capEn: "B2 REACHED · STUDIES IN BERLIN",
    duration: 82,
    territory: "world",
    portraitSrc: "/portraits/kevin.avif",
    monogram: "K",
    audioSrc: "/audio/voix/kevin-allemand.mp3",
    proverb: {
      native: "Übung macht den Meister.",
      translation: "C'est en s'exerçant qu'on devient maître.",
      translationEn: "Practice makes the master.",
      audioSrc: "/audio/proverbs/kevin-allemand.mp3",
      attribution: "Proverbe allemand",
    },
    cues: [
      { from: 0, to: 8, native: "Als ich klein war, wollte ich Berlin sehen.", translation: "Quand j'étais petit, je voulais voir Berlin.", translationEn: "When I was little, I wanted to see Berlin." },
      { from: 8, to: 18, native: "A2, B1, B2 — drei Buchstaben haben mich Jahre gekostet.", translation: "A2, B1, B2 — trois lettres qui m'ont coûté des années.", translationEn: "A2, B1, B2 — three letters that cost me years." },
      { from: 18, to: 32, native: "Jeden Abend saß ich vor demselben Bildschirm.", translation: "Chaque soir, je m'asseyais devant le même écran.", translationEn: "Every evening, I sat in front of the same screen." },
      { from: 32, to: 50, native: "Am Prüfungstag zitterte meine Stimme nicht.", translation: "Le jour de l'examen, ma voix ne tremblait pas.", translationEn: "On exam day, my voice didn't tremble." },
      { from: 50, to: 82, native: "Heute studiere ich in Berlin. Auf Deutsch. Zuhause.", translation: "Aujourd'hui, j'étudie à Berlin. En allemand. Chez moi.", translationEn: "Today I study in Berlin. In German. At home." },
    ],
  },
  {
    id: "fatima-allemand",
    language: "allemand",
    languageEn: "German",
    langCode: "DE",
    speaker: "Fatima",
    title: "Fatima — Francfort, déjà chez elle",
    titleEn: "Fatima — Frankfurt, already home",
    narrative: "Infirmière depuis quatre ans en Allemagne. Ce n'est plus un visa qu'elle vise — c'est un passeport. Le B2 de la naturalisation se prépare le soir, à son rythme.",
    narrativeEn: "A nurse for four years in Germany. It's no longer a visa she's after — it's a passport. The B2 for naturalization is prepared in the evenings, at her own pace.",
    cap: "GRANDIR SUR PLACE · CAP NATURALISATION",
    capEn: "GROW ON PLACE · NATURALIZATION AHEAD",
    duration: 88,
    territory: "world",
    portraitSrc: "/portraits/fatima.avif",
    monogram: "F",
    audioSrc: "/audio/voix/fatima-allemand.mp3",
    proverb: {
      native: "Wer wagt, gewinnt.",
      translation: "Qui ose gagne.",
      translationEn: "Who dares wins.",
      audioSrc: "/audio/proverbs/fatima-allemand.mp3",
      attribution: "Proverbe allemand",
    },
    cues: [
      { from: 0, to: 10, native: "Ich arbeite seit vier Jahren als Krankenschwester.", translation: "Je travaille comme infirmière depuis quatre ans.", translationEn: "I've been working as a nurse for four years." },
      { from: 10, to: 22, native: "Meine Patienten verstehen mich. Meine Kollegen auch.", translation: "Mes patients me comprennent. Mes collègues aussi.", translationEn: "My patients understand me. My colleagues too." },
      { from: 22, to: 40, native: "Aber der Pass — den kriegt man nicht mit dem Akzent.", translation: "Mais le passeport — on ne l'obtient pas avec l'accent.", translationEn: "But the passport — you don't get that with an accent." },
      { from: 40, to: 62, native: "Also lerne ich jeden Abend. Nach der Schicht.", translation: "Alors j'apprends chaque soir. Après le service.", translationEn: "So I learn every evening. After the shift." },
      { from: 62, to: 88, native: "Ich will nicht weg. Ich will bleiben — mit allem, was dazu gehört.", translation: "Je ne veux pas partir. Je veux rester — avec tout ce que ça implique.", translationEn: "I don't want to leave. I want to stay — with everything that entails." },
    ],
  },
  {
    id: "aicha-anglais",
    language: "anglais",
    languageEn: "English",
    langCode: "EN",
    speaker: "Aïcha",
    title: "Aïcha — d'Abidjan à Toronto",
    titleEn: "Aïcha — from Abidjan to Toronto",
    narrative: "Son dossier canadien exigeait une note d'anglais qu'elle n'avait pas encore. Six mois de pratique — l'oreille d'abord, l'oral ensuite. La note est tombée. Le départ aussi.",
    narrativeEn: "Her Canadian application required an English score she didn't yet have. Six months of practice — the ear first, speaking after. The score came. So did the departure.",
    cap: "OBJECTIF ATTEINT · DÉPART VALIDÉ",
    capEn: "OBJECTIVE REACHED · DEPARTURE APPROVED",
    duration: 78,
    territory: "world",
    portraitSrc: "/portraits/aicha.avif",
    monogram: "A",
    audioSrc: "/audio/voix/aicha-anglais.mp3",
    proverb: {
      native: "Where there is a will, there is a way.",
      translation: "Qui veut, peut.",
      translationEn: "Where there is a will, there is a way.",
      audioSrc: "/audio/proverbs/aicha-anglais.mp3",
      attribution: "English proverb",
    },
    cues: [
      { from: 0, to: 8, native: "My file was ready. Almost ready.", translation: "Mon dossier était prêt. Presque prêt.", translationEn: "My file was ready. Almost ready." },
      { from: 8, to: 20, native: "One score was missing. English. Real English.", translation: "Un score manquait. L'anglais. Le vrai.", translationEn: "One score was missing. English. Real English." },
      { from: 20, to: 36, native: "Six months. Listening first, always. Speaking after.", translation: "Six mois. L'écoute d'abord, toujours. L'oral ensuite.", translationEn: "Six months. Listening first, always. Speaking after." },
      { from: 36, to: 55, native: "I stopped being afraid of my mistakes.", translation: "J'ai arrêté d'avoir peur de mes erreurs.", translationEn: "I stopped being afraid of my mistakes." },
      { from: 55, to: 78, native: "The score came. And then the ticket.", translation: "La note est tombée. Puis le billet.", translationEn: "The score came. And then the ticket." },
    ],
  },
  {
    id: "jean-francais",
    language: "français",
    languageEn: "French",
    langCode: "FR",
    speaker: "Jean",
    title: "Jean — Bamenda, les deux voix du pays",
    titleEn: "Jean — Bamenda, the country's two voices",
    narrative: "Anglophone de naissance, il voulait le français des concours — celui qui ouvre Douala et Yaoundé sans baisser les yeux. Deux langues officielles, une seule ambition.",
    narrativeEn: "An anglophone by birth, he wanted the French of the exams — the one that opens Douala and Yaoundé without looking down. Two official languages, one ambition.",
    cap: "FRANÇAIS PROFESSIONNEL · CONCOURS EN VUE",
    capEn: "PROFESSIONAL FRENCH · EXAMS IN SIGHT",
    duration: 76,
    territory: "world",
    portraitSrc: "/portraits/jean.avif",
    monogram: "J",
    audioSrc: "/audio/voix/jean-francais.mp3",
    proverb: {
      native: "Petit à petit, l'oiseau fait son nid.",
      translation: "Petit à petit, l'oiseau fait son nid.",
      translationEn: "Little by little, the bird builds its nest.",
      audioSrc: "/audio/proverbs/jean-francais.mp3",
      attribution: "Proverbe français",
    },
    cues: [
      { from: 0, to: 8, native: "Je suis né à Bamenda. J'ai grandi en anglais.", translation: "Je suis né à Bamenda. J'ai grandi en anglais.", translationEn: "I was born in Bamenda. I grew up in English." },
      { from: 8, to: 22, native: "Mon pays parle deux voix. Je n'en portais qu'une.", translation: "Mon pays parle deux voix. Je n'en portais qu'une.", translationEn: "My country speaks with two voices. I carried only one." },
      { from: 22, to: 40, native: "Je veux les concours. Ceux de Douala. Ceux de Yaoundé.", translation: "Je veux les concours. Ceux de Douala. Ceux de Yaoundé.", translationEn: "I want the exams. The ones in Douala. The ones in Yaoundé." },
      { from: 40, to: 58, native: "Aujourd'hui, je réponds en français sans baisser les yeux.", translation: "Aujourd'hui, je réponds en français sans baisser les yeux.", translationEn: "Today, I answer in French without lowering my eyes." },
      { from: 58, to: 76, native: "Deux langues officielles. Une seule ambition.", translation: "Deux langues officielles. Une seule ambition.", translationEn: "Two official languages. One ambition." },
    ],
  },
  {
    id: "bintou-wolof",
    language: "wolof",
    languageEn: "Wolof",
    langCode: "WO",
    speaker: "Bintou",
    title: "Bintou — le wolof de sa mère, pour sa fille",
    titleEn: "Bintou — her mother's Wolof, for her daughter",
    narrative: "À Paris, sa fille répondait en français aux voice notes de la grand-mère. Bintou a rouvert la langue — le soir, toutes les deux, un conte à la fois.",
    narrativeEn: "In Paris, her daughter answered in French to the grandmother's voice notes. Bintou reopened the language — in the evenings, together, one tale at a time.",
    cap: "É2 VOIX · TRANSMISSION EN COURS",
    capEn: "É2 VOICE · TRANSMISSION UNDERWAY",
    duration: 92,
    territory: "sources",
    portraitSrc: "/portraits/bintou.avif",
    monogram: "B",
    audioSrc: "/audio/voix/bintou-wolof.mp3",
    proverb: {
      native: "Nit, nitay garabam.",
      translation: "L'humain est le remède de l'humain.",
      translationEn: "The human is the human's remedy.",
      audioSrc: "/audio/proverbs/bintou-wolof.mp3",
      attribution: "Proverbe wolof",
    },
    cues: [
      { from: 0, to: 8, native: "Sama xale bi dafay tontu ci frãse.", translation: "Ma fille répondait en français.", translationEn: "My daughter would answer in French." },
      { from: 8, to: 18, native: "Sama maam dafay yeneen ay léebu.", translation: "Ma grand-mère envoyait des voice notes.", translationEn: "My grandmother would send voice notes." },
      { from: 18, to: 34, native: "Ba mu jang wolof, dinaa yëkkatalé làkkam.", translation: "En apprenant le wolof, je relève sa langue.", translationEn: "By learning Wolof, I lift her language up." },
      { from: 34, to: 55, native: "Guddi guddi, danuy jang léeb ba pare.", translation: "Chaque soir, on apprend un conte à la fois.", translationEn: "Every evening, we learn one tale at a time." },
      { from: 55, to: 76, native: "Sama xale bi tontuwaat na ci wolof.", translation: "Ma fille répond, maintenant, en wolof.", translationEn: "My daughter answers now, in Wolof." },
      { from: 76, to: 92, native: "Sama maam moom mooy jang wolof yakk.", translation: "C'est ma grand-mère qui parle par sa bouche.", translationEn: "It's my grandmother speaking through her mouth." },
    ],
  },
];

export function getStoryById(id: string): VoixStory | undefined {
  return STORIES.find((s) => s.id === id);
}
