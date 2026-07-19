// stories.ts — recueil des récits audio YEMA « La Veillée ».
// Chaque récit vit dans une langue : natale africaine ou étrangère.
// Le locuteur commence par un proverbe (natif + traduction + audio),
// puis raconte 60-120 secondes. La transcription est bilingue,
// synchronisée par lignes (timings en secondes).
//
// Placeholder : les MP3 et VTT ne sont pas encore livrés — les
// timings et transcriptions sont éditoriaux, prêts à recevoir les
// vraies voix. Le composant supporte les fichiers manquants sans
// erreur bruyante.

export interface VoixCue {
  /** Début de la ligne, en secondes */
  from: number;
  /** Fin de la ligne, en secondes */
  to: number;
  /** Ligne dans la langue du récit (Fraunces italique laiton) */
  native: string;
  /** Traduction (crème) — locale du visiteur */
  translation: string;
  /** Traduction anglaise (si visiteur EN) */
  translationEn: string;
}

export interface VoixProverb {
  native: string;
  translation: string;
  translationEn: string;
  audioSrc: string;
  /** Attribution du proverbe (auteur ou tradition orale) */
  attribution?: string;
}

export interface VoixStory {
  id: string;
  /** Langue du récit (nom en FR pour affichage) */
  language: string;
  languageEn: string;
  /** Code 2-4 lettres du langage */
  langCode: string;
  /** Nom du locuteur */
  speaker: string;
  /** Une phrase qui présente le récit (FR / EN) */
  title: string;
  titleEn: string;
  /** Durée totale du récit en secondes (affichage mono) */
  duration: number;
  /** Territoire visuel (colore le portrait duotone) */
  territory: "world" | "sources";
  /** Portrait duotone (optionnel — fallback monogramme) */
  portraitSrc?: string;
  monogram: string;
  /** MP3 principal du récit */
  audioSrc: string;
  /** Proverbe qui ouvre le récit */
  proverb: VoixProverb;
  /** Cues bilingues synchronisées */
  cues: VoixCue[];
}

// Recueil éditorial · à enrichir avec les vraies voix.
export const STORIES: readonly VoixStory[] = [
  {
    id: "bintou-wolof",
    language: "wolof",
    languageEn: "Wolof",
    langCode: "WO",
    speaker: "Bintou",
    title: "La grand-mère qui parlait aux nuages.",
    titleEn: "The grandmother who spoke to the clouds.",
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
      { from: 0, to: 6, native: "Sama maam da nga togg ci njekka bi.", translation: "Ma grand-mère s'asseyait au seuil.", translationEn: "My grandmother would sit at the threshold." },
      { from: 6, to: 14, native: "Xale yi, yow, dangeen jang ba pare.", translation: "Enfants, disait-elle, vous apprenez pour de vrai.", translationEn: "Children, she said, you learn for real." },
      { from: 14, to: 24, native: "Waaye jang, damay yëkkatalé làkkam.", translation: "Mais apprendre, c'est aussi relever sa langue.", translationEn: "But learning is also lifting up your language." },
      { from: 24, to: 40, native: "Bu weer bi taxaw, danga xam ni yaay maam.", translation: "Quand la lune se lève, on sait à qui parle la nuit.", translationEn: "When the moon rises, you know to whom the night speaks." },
      { from: 40, to: 58, native: "Aji jang, aji xam, aji nekk fii.", translation: "Celui qui apprend, celui qui sait, celui qui est là.", translationEn: "The one who learns, the one who knows, the one who is here." },
      { from: 58, to: 76, native: "Fii, yëf yi ñuy jang, yëf yi ñuy jankoo.", translation: "Ici, les choses qu'on apprend, les choses qu'on partage.", translationEn: "Here, the things we learn, the things we share." },
      { from: 76, to: 92, native: "Sama maam nee na : làkk moom la doole.", translation: "Ma grand-mère disait : la langue, c'est la force.", translationEn: "My grandmother would say: language is strength." },
    ],
  },
  {
    id: "kevin-allemand",
    language: "allemand",
    languageEn: "German",
    langCode: "DE",
    speaker: "Kevin",
    title: "Le tramway de Berlin qui m'a appris l'article.",
    titleEn: "The Berlin tram that taught me the article.",
    duration: 78,
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
      { from: 0, to: 8, native: "Als ich zum ersten Mal in Berlin war,", translation: "La première fois que j'étais à Berlin,", translationEn: "The first time I was in Berlin," },
      { from: 8, to: 16, native: "hatte ich Angst vor der und die und das.", translation: "j'avais peur de der, die, das.", translationEn: "I was afraid of der, die, das." },
      { from: 16, to: 28, native: "Die Straßenbahn war meine Lehrerin.", translation: "Le tramway a été ma professeure.", translationEn: "The tram was my teacher." },
      { from: 28, to: 42, native: "Jede Ansage — der Bahnhof, die Straße, das Gleis.", translation: "Chaque annonce — der Bahnhof, die Straße, das Gleis.", translationEn: "Every announcement — der Bahnhof, die Straße, das Gleis." },
      { from: 42, to: 58, native: "Ich habe gelernt, indem ich zugehört habe.", translation: "J'ai appris en écoutant.", translationEn: "I learned by listening." },
      { from: 58, to: 78, native: "Heute spreche ich — nicht perfekt. Aber ich spreche.", translation: "Aujourd'hui je parle — pas parfait. Mais je parle.", translationEn: "Today I speak — not perfectly. But I speak." },
    ],
  },
  {
    id: "aicha-allemand",
    language: "allemand",
    languageEn: "German",
    langCode: "DE",
    speaker: "Aïcha",
    title: "Le mail qui a ouvert la porte de Fribourg.",
    titleEn: "The email that opened the door to Freiburg.",
    duration: 85,
    territory: "world",
    portraitSrc: "/portraits/aicha.avif",
    monogram: "A",
    audioSrc: "/audio/voix/aicha-allemand.mp3",
    proverb: {
      native: "Wer nicht wagt, der nicht gewinnt.",
      translation: "Qui ne tente rien n'a rien.",
      translationEn: "Who dares nothing, wins nothing.",
      audioSrc: "/audio/proverbs/aicha-allemand.mp3",
      attribution: "Proverbe allemand",
    },
    cues: [
      { from: 0, to: 10, native: "Sehr geehrte Frau Professor Weber,", translation: "Madame la Professeure Weber,", translationEn: "Dear Professor Weber," },
      { from: 10, to: 20, native: "ich möchte mich für Ihre Zeit bedanken.", translation: "je vous remercie pour votre temps.", translationEn: "I thank you for your time." },
      { from: 20, to: 35, native: "Ich habe drei Monate lang jeden Abend geübt.", translation: "J'ai pratiqué chaque soir pendant trois mois.", translationEn: "I practiced every evening for three months." },
      { from: 35, to: 55, native: "Der Mail — vier Zeilen — hat mir die Tür geöffnet.", translation: "Le mail — quatre lignes — m'a ouvert la porte.", translationEn: "The email — four lines — opened the door for me." },
      { from: 55, to: 85, native: "Jetzt studiere ich in Freiburg. Auf Deutsch.", translation: "Maintenant j'étudie à Fribourg. En allemand.", translationEn: "Now I study in Freiburg. In German." },
    ],
  },
];

export function getStoryById(id: string): VoixStory | undefined {
  return STORIES.find((s) => s.id === id);
}
