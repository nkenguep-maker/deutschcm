// Copy éditoriale · Sprint « Le Foyer » — refonte premium, étape 1.
// La voix de la maison, centralisée. Les composants n'ont pas de
// strings inline — tout passe par ce fichier pour rester relisible
// d'un coup et respecter la doctrine (Fraunces sur les fragments *…*).

import type { Cap } from "./types";

interface HeadCopy {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  capLabel: string;
  capName: Record<Cap, string>;
}

interface HeroCopy {
  kicker: string;
  emptyNoCap: { soul: string; action: string };
  emptyNoLesson: { soul: string; action: string };
  ctaResume: string;
  ctaListen: string;
  ctaOpenFirst: string;
  transmettreTitle: (conteTitre: string) => string;
  transmettreSub: (minutes: number) => string;
  franchirSub: (level: string, remaining: number) => string;
  grandirSub: string;
  moiSub: string;
  minutesUnit: string;
}

interface SpineCopy {
  title: string;
  empty: { soul: string };
}

interface CapCardCopy {
  emptyNoCap: { soul: string; action: string };
  jalonTitle: string;
  jalonSub: (level: string) => string;
  jalonRemaining: (n: number) => string;
  jalonEmpty: string;
  procedureTitle: string;
  procedureEmpty: { soul: string; action: string };
  procedureLine: (done: number, total: number) => string;
  ritualTitle: string;
  ritualLine: (soirs: number) => string;
  rythmeTitle: string;
  rythmeLine: string;
}

interface ClasseCopy {
  title: string;
  withPrefix: string;
  empty: { soul: string; action: string };
}

interface AutreVoixCopy {
  kicker: string;
  singlePrefix: string;
  singleSuffix: string;
}

interface ToolSpec {
  key: string;
  title: string;
  desc: string;
  href: string;
}

interface ToolsCopy {
  title: string;
  tools: {
    standard: ToolSpec[];
    transmettre: ToolSpec[];
  };
}

interface FoyerCopy {
  head: HeadCopy;
  hero: HeroCopy;
  spine: SpineCopy;
  capCard: CapCardCopy;
  classe: ClasseCopy;
  autreVoix: AutreVoixCopy;
  tools: (urlLocale: string) => ToolsCopy;
}

// ── FR ────────────────────────────────────────────────────────────
export const COPY_FR: FoyerCopy = {
  head: {
    greetingMorning: "Bonjour",
    greetingAfternoon: "Bon après-midi",
    greetingEvening: "Bonsoir",
    capLabel: "Votre cap",
    capName: {
      franchir: "Franchir",
      grandir: "Grandir",
      transmettre: "Transmettre",
      moi: "Apprendre pour vous",
    },
  },
  hero: {
    kicker: "Reprendre",
    emptyNoCap: {
      soul: "Posez votre cap — *la maison suivra.*",
      action: "Choisir mon but",
    },
    emptyNoLesson: {
      soul: "La première leçon — *ouvrez la porte.*",
      action: "Ouvrir",
    },
    ctaResume: "Reprendre",
    ctaListen: "Écouter ce soir",
    ctaOpenFirst: "Ouvrir",
    transmettreTitle: (conteTitre) => `Ce soir — *${conteTitre}.*`,
    transmettreSub: (minutes) => `*À écouter ensemble* — ${minutes} min.`,
    franchirSub: (level, remaining) =>
      remaining === 1
        ? `Encore *une leçon* avant votre examen blanc ${level}.`
        : `Encore *${remaining} leçons* avant votre examen blanc ${level}.`,
    grandirSub: "À votre rythme, *ce soir*.",
    moiSub: "Une porte parmi d'autres — *à votre main*.",
    minutesUnit: "min",
  },
  spine: {
    title: "Mon échelle",
    empty: { soul: "L'échelle se dessinera à la *première leçon.*" },
  },
  capCard: {
    emptyNoCap: {
      soul: "Le chemin s'écrit — *posez votre but.*",
      action: "Compléter mon profil",
    },
    jalonTitle: "Prochain jalon",
    jalonSub: (level) => `Examen blanc ${level}`,
    jalonRemaining: (n) => (n === 1 ? "1 leçon reste à faire." : `${n} leçons restent à faire.`),
    jalonEmpty: "Le curriculum se met en place.",
    procedureTitle: "Ma procédure",
    procedureEmpty: {
      soul: "Votre procédure vous ressemble — *racontez-la.*",
      action: "Décrire ma procédure",
    },
    procedureLine: (done, total) => `${done} dossier${done > 1 ? "s" : ""} sur ${total}.`,
    ritualTitle: "Le rituel",
    ritualLine: (soirs) =>
      soirs === 0
        ? "Aucun soir cette semaine. *Le foyer vous attend.*"
        : soirs === 1
          ? "Un soir cette semaine — *une voix a été portée.*"
          : `${soirs} soirs cette semaine — *chaque conte laisse une trace.*`,
    rythmeTitle: "Mon rythme",
    rythmeLine: "Sans compte à rendre. Sans compte à rebours.",
  },
  classe: {
    title: "Ma classe",
    withPrefix: "Avec",
    empty: {
      soul: "Aucune classe pour l'instant. *Rejoignez avec un code.*",
      action: "Entrer un code",
    },
  },
  autreVoix: {
    kicker: "L'autre voix",
    singlePrefix: "L'autre voix vous attend.",
    singleSuffix: "Passer au",
  },
  tools: (urlLocale: string) => ({
    title: "Vos outils",
    tools: {
      standard: [
        { key: "sim",       title: "Le simulateur", desc: "Des scénarios réels. Voix, correction, encouragement.", href: `/${urlLocale}/simulateur` },
        { key: "quiz",      title: "Quiz",          desc: "Points de grammaire, révisions ciblées.",              href: `/${urlLocale}/quiz` },
        { key: "veillee",   title: "La Veillée",    desc: "Vos récits natals, portés à l'oral.",                  href: `/${urlLocale}/hoeren` },
        { key: "historique",title: "Mon historique",desc: "Les modules déjà traversés.",                          href: `/${urlLocale}/progress` },
      ],
      transmettre: [
        { key: "contes",   title: "Les contes",  desc: "À écouter ensemble, chaque soir.",           href: `/${urlLocale}/hoeren` },
        { key: "chansons", title: "Les chansons",desc: "Comptines et refrains à reprendre.",         href: `/${urlLocale}/hoeren` },
        { key: "jeux",     title: "Les jeux",    desc: "Devinettes et prises de langue.",            href: `/${urlLocale}/quiz` },
        { key: "nosmots",  title: "Nos mots",    desc: "Le lexique familial qu'on veut transmettre.",href: `/${urlLocale}/schreiben` },
      ],
    },
  }),
};

// ── EN ────────────────────────────────────────────────────────────
export const COPY_EN: FoyerCopy = {
  head: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    capLabel: "Your cap",
    capName: {
      franchir: "Cross over",
      grandir: "Grow",
      transmettre: "Pass on",
      moi: "Learn for you",
    },
  },
  hero: {
    kicker: "Resume",
    emptyNoCap: {
      soul: "Set your cap — *the house will follow.*",
      action: "Choose my goal",
    },
    emptyNoLesson: {
      soul: "Your first lesson — *open the door.*",
      action: "Open",
    },
    ctaResume: "Resume",
    ctaListen: "Listen tonight",
    ctaOpenFirst: "Open",
    transmettreTitle: (conteTitre) => `Tonight — *${conteTitre}.*`,
    transmettreSub: (minutes) => `*To listen together* — ${minutes} min.`,
    franchirSub: (level, remaining) =>
      remaining === 1
        ? `*One lesson* before your ${level} mock exam.`
        : `*${remaining} lessons* before your ${level} mock exam.`,
    grandirSub: "At your pace, *tonight*.",
    moiSub: "One door among others — *yours to open*.",
    minutesUnit: "min",
  },
  spine: {
    title: "My scale",
    empty: { soul: "The scale draws itself with the *first lesson.*" },
  },
  capCard: {
    emptyNoCap: {
      soul: "The path is being written — *set your goal.*",
      action: "Complete my profile",
    },
    jalonTitle: "Next milestone",
    jalonSub: (level) => `${level} mock exam`,
    jalonRemaining: (n) => (n === 1 ? "1 lesson left." : `${n} lessons left.`),
    jalonEmpty: "The curriculum is being laid out.",
    procedureTitle: "My procedure",
    procedureEmpty: {
      soul: "Your procedure is yours — *tell it.*",
      action: "Describe my procedure",
    },
    procedureLine: (done, total) => `${done} of ${total} file${total > 1 ? "s" : ""} done.`,
    ritualTitle: "The ritual",
    ritualLine: (soirs) =>
      soirs === 0
        ? "No evening this week. *The house is waiting.*"
        : soirs === 1
          ? "One evening this week — *a voice was carried.*"
          : `${soirs} evenings this week — *each tale leaves a trace.*`,
    rythmeTitle: "My pace",
    rythmeLine: "No one to answer to. No countdown.",
  },
  classe: {
    title: "My class",
    withPrefix: "With",
    empty: {
      soul: "No class yet. *Join with a code.*",
      action: "Enter a code",
    },
  },
  autreVoix: {
    kicker: "The other voice",
    singlePrefix: "The other voice is waiting.",
    singleSuffix: "Switch to",
  },
  tools: (urlLocale: string) => ({
    title: "Your tools",
    tools: {
      standard: [
        { key: "sim",        title: "The simulator", desc: "Real scenarios. Voice, correction, encouragement.", href: `/${urlLocale}/simulateur` },
        { key: "quiz",       title: "Quiz",          desc: "Grammar points, targeted review.",                 href: `/${urlLocale}/quiz` },
        { key: "veillee",    title: "The Veillée",   desc: "Your native stories, carried aloud.",              href: `/${urlLocale}/hoeren` },
        { key: "history",    title: "My history",    desc: "Modules already crossed.",                         href: `/${urlLocale}/progress` },
      ],
      transmettre: [
        { key: "tales",   title: "Tales",     desc: "To listen to together, every evening.", href: `/${urlLocale}/hoeren` },
        { key: "songs",   title: "Songs",     desc: "Rhymes and refrains to sing back.",     href: `/${urlLocale}/hoeren` },
        { key: "games",   title: "Games",     desc: "Riddles and language plays.",           href: `/${urlLocale}/quiz` },
        { key: "ourwords",title: "Our words", desc: "The family lexicon to pass on.",        href: `/${urlLocale}/schreiben` },
      ],
    },
  }),
};
