// Copy éditoriale · Sprint « Le Foyer » — étape 2.
// Les 4 configs de cap sont désormais explicitement différenciées :
//   Franchir    · précis, distance en LEÇONS (jamais en jours)
//   Grandir     · doux, à son rythme, zéro urgence
//   Transmettre · chaleureux, « ce soir — le conte », rituel du foyer
//   Moi         · sobre, pas de compte à rebours

import type { Cap } from "./types";

interface HeadCopy {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  capLabel: string;
  capName: Record<Cap, string>;
  /** Petit lien discret « Changer » à côté du cap — bascule /onboarding/student. */
  changeCap: string;
  /** Version « Poser mon cap » quand aucun cap n'est encore choisi. */
  setCap: string;
}

interface HeroCopy {
  kicker: string;
  emptyNoCap: { soul: string; action: string };
  emptyNoLesson: { soul: string; action: string };
  ctaResume: string;
  ctaListen: string;
  ctaOpenFirst: string;
  transmettreKicker: string;
  transmettreTitle: (conteTitre: string) => string;
  transmettreSub: (minutes: number) => string;
  franchirKicker: string;
  franchirSub: (level: string, remaining: number) => string;
  grandirKicker: string;
  grandirSub: string;
  moiKicker: string;
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
  jalonReady: string;
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
  /** Une trousse par cap · Transmettre a la sienne (contes/chansons/
   *  jeux/nos-mots), Franchir cible l'examen (simulateur/quiz/examen
   *  blanc/historique), Grandir la vie réelle (simulateur/écrit/
   *  procédure/veillée), Moi le rythme libre (simulateur/quiz/
   *  veillée/historique). */
  tools: Record<Cap | "default", ToolSpec[]>;
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
    changeCap: "Changer",
    setCap: "Poser mon cap",
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
    transmettreKicker: "Ce soir",
    transmettreTitle: (conteTitre) => `Le conte — *${conteTitre}.*`,
    transmettreSub: (minutes) => `*À écouter ensemble* — ${minutes} min.`,
    franchirKicker: "Reprendre",
    franchirSub: (level, remaining) =>
      remaining === 0
        ? `Vous êtes prêt·e — *l'examen blanc ${level} vous attend.*`
        : remaining === 1
          ? `Encore *une leçon* avant votre examen blanc ${level}.`
          : `Encore *${remaining} leçons* avant votre examen blanc ${level}.`,
    grandirKicker: "Reprendre",
    grandirSub: "À votre rythme, *ce soir*.",
    moiKicker: "Reprendre",
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
    // FRANCHIR · le jalon, distance en LEÇONS jamais en jours
    jalonTitle: "Prochain jalon",
    jalonSub: (level) => `Examen blanc ${level}`,
    jalonRemaining: (n) => (n === 1 ? "1 leçon reste à faire." : `${n} leçons restent à faire.`),
    jalonReady: "Le niveau est complet. *Le blanc peut s'ouvrir.*",
    jalonEmpty: "Le curriculum se met en place.",
    // GRANDIR · la procédure, zéro urgence
    procedureTitle: "Ma procédure",
    procedureEmpty: {
      soul: "Votre procédure vous ressemble — *racontez-la.*",
      action: "Décrire ma procédure",
    },
    procedureLine: (done, total) => `${done} dossier${done > 1 ? "s" : ""} sur ${total}.`,
    // TRANSMETTRE · le rituel, chaleureux
    ritualTitle: "Le rituel",
    ritualLine: (soirs) =>
      soirs === 0
        ? "Aucun soir cette semaine. *Le foyer vous attend.*"
        : soirs === 1
          ? "Un soir cette semaine — *une voix a été portée.*"
          : `${soirs} soirs cette semaine — *chaque conte laisse une trace.*`,
    // MOI · le rythme, aucune pression
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
      franchir: [
        { key: "sim",       title: "Le simulateur",     desc: "Ambassade, entretien, guichet — les scènes de l'examen.", href: `/${urlLocale}/simulateur` },
        { key: "quiz",      title: "Quiz",              desc: "Points de grammaire, révisions ciblées.",                 href: `/${urlLocale}/quiz` },
        { key: "examen",    title: "Examen blanc",      desc: "Une répétition complète, corrigée.",                      href: `/${urlLocale}/test-niveau` },
        { key: "historique",title: "Mon historique",    desc: "Les modules déjà traversés.",                             href: `/${urlLocale}/progress` },
      ],
      grandir: [
        { key: "sim",       title: "Le simulateur",     desc: "Situations réelles — appartement, banque, mairie.",       href: `/${urlLocale}/simulateur` },
        { key: "ecrit",     title: "Écrit relu",        desc: "Vos lettres, vos formulaires — correction humaine.",      href: `/${urlLocale}/schreiben` },
        { key: "procedure", title: "Ma procédure",      desc: "Le dossier qui vous concerne, une étape à la fois.",      href: `/${urlLocale}/settings` },
        { key: "veillee",   title: "La Veillée",        desc: "Une pause chaleureuse dans la semaine.",                  href: `/${urlLocale}/hoeren` },
      ],
      transmettre: [
        { key: "contes",   title: "Les contes",   desc: "À écouter ensemble, chaque soir.",              href: `/${urlLocale}/hoeren` },
        { key: "chansons", title: "Les chansons", desc: "Comptines et refrains à reprendre.",            href: `/${urlLocale}/hoeren` },
        { key: "jeux",     title: "Les jeux",     desc: "Devinettes et prises de langue.",               href: `/${urlLocale}/quiz` },
        { key: "nosmots",  title: "Nos mots",     desc: "Le lexique familial qu'on veut transmettre.",   href: `/${urlLocale}/schreiben` },
      ],
      moi: [
        { key: "sim",       title: "Le simulateur",     desc: "Des scénarios réels. Voix, correction, encouragement.",   href: `/${urlLocale}/simulateur` },
        { key: "quiz",      title: "Quiz",              desc: "Grammaire, vocabulaire — au fil de l'envie.",             href: `/${urlLocale}/quiz` },
        { key: "veillee",   title: "La Veillée",        desc: "Vos récits natals, portés à l'oral.",                     href: `/${urlLocale}/hoeren` },
        { key: "historique",title: "Mon historique",    desc: "Les modules déjà traversés.",                             href: `/${urlLocale}/progress` },
      ],
      default: [
        { key: "sim",       title: "Le simulateur",     desc: "Des scénarios réels. Voix, correction, encouragement.",   href: `/${urlLocale}/simulateur` },
        { key: "quiz",      title: "Quiz",              desc: "Points de grammaire, révisions ciblées.",                 href: `/${urlLocale}/quiz` },
        { key: "veillee",   title: "La Veillée",        desc: "Vos récits natals, portés à l'oral.",                     href: `/${urlLocale}/hoeren` },
        { key: "historique",title: "Mon historique",    desc: "Les modules déjà traversés.",                             href: `/${urlLocale}/progress` },
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
    changeCap: "Change",
    setCap: "Set my cap",
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
    transmettreKicker: "Tonight",
    transmettreTitle: (conteTitre) => `The tale — *${conteTitre}.*`,
    transmettreSub: (minutes) => `*To listen together* — ${minutes} min.`,
    franchirKicker: "Resume",
    franchirSub: (level, remaining) =>
      remaining === 0
        ? `You're ready — *the ${level} mock exam awaits.*`
        : remaining === 1
          ? `*One lesson* before your ${level} mock exam.`
          : `*${remaining} lessons* before your ${level} mock exam.`,
    grandirKicker: "Resume",
    grandirSub: "At your pace, *tonight*.",
    moiKicker: "Resume",
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
    jalonReady: "The level is complete. *The mock can open.*",
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
      franchir: [
        { key: "sim",       title: "The simulator", desc: "Embassy, interview, counter — the exam scenes.",  href: `/${urlLocale}/simulateur` },
        { key: "quiz",      title: "Quiz",          desc: "Grammar points, targeted review.",                href: `/${urlLocale}/quiz` },
        { key: "mock",      title: "Mock exam",     desc: "A full rehearsal, corrected.",                    href: `/${urlLocale}/test-niveau` },
        { key: "history",   title: "My history",    desc: "Modules already crossed.",                        href: `/${urlLocale}/progress` },
      ],
      grandir: [
        { key: "sim",       title: "The simulator", desc: "Real situations — apartment, bank, town hall.",   href: `/${urlLocale}/simulateur` },
        { key: "writing",   title: "Reviewed writing", desc: "Your letters, your forms — human review.",     href: `/${urlLocale}/schreiben` },
        { key: "procedure", title: "My procedure",  desc: "The file that concerns you, one step at a time.", href: `/${urlLocale}/settings` },
        { key: "veillee",   title: "The Veillée",   desc: "A warm pause in the week.",                       href: `/${urlLocale}/hoeren` },
      ],
      transmettre: [
        { key: "tales",   title: "Tales",     desc: "To listen to together, every evening.", href: `/${urlLocale}/hoeren` },
        { key: "songs",   title: "Songs",     desc: "Rhymes and refrains to sing back.",     href: `/${urlLocale}/hoeren` },
        { key: "games",   title: "Games",     desc: "Riddles and language plays.",           href: `/${urlLocale}/quiz` },
        { key: "ourwords",title: "Our words", desc: "The family lexicon to pass on.",        href: `/${urlLocale}/schreiben` },
      ],
      moi: [
        { key: "sim",       title: "The simulator", desc: "Real scenarios. Voice, correction, encouragement.", href: `/${urlLocale}/simulateur` },
        { key: "quiz",      title: "Quiz",          desc: "Grammar, vocabulary — as you please.",              href: `/${urlLocale}/quiz` },
        { key: "veillee",   title: "The Veillée",   desc: "Your native stories, carried aloud.",               href: `/${urlLocale}/hoeren` },
        { key: "history",   title: "My history",    desc: "Modules already crossed.",                          href: `/${urlLocale}/progress` },
      ],
      default: [
        { key: "sim",       title: "The simulator", desc: "Real scenarios. Voice, correction, encouragement.", href: `/${urlLocale}/simulateur` },
        { key: "quiz",      title: "Quiz",          desc: "Grammar, targeted review.",                         href: `/${urlLocale}/quiz` },
        { key: "veillee",   title: "The Veillée",   desc: "Your native stories, carried aloud.",               href: `/${urlLocale}/hoeren` },
        { key: "history",   title: "My history",    desc: "Modules already crossed.",                          href: `/${urlLocale}/progress` },
      ],
    },
  }),
};
