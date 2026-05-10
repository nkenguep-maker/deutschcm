import type { CourseModule, LessonContent, QuizContent } from "@/types/courses";

// ─── Lektion 1 — Guten Tag! (A1) ─────────────────────────────────────────────

const GUTEN_TAG_LESSON_1: LessonContent = {
  introduction:
    "In dieser Lektion lernen Sie grundlegende Begrüßungen und höfliche Ausdrücke auf Deutsch. Diese Phrasen sind unerlässlich für die erste Kontaktaufnahme in Deutschland — beim Konsulat, auf der Straße oder im Büro.",
  grammar: {
    title: "Das Verb 'sein' im Präsens",
    explanation:
      "'Sein' (être) est le verbe le plus important de l'allemand. Il est irrégulier et indispensable pour se présenter. Il s'utilise avec le nominatif.",
    conjugation: [
      { pronoun: "ich",       form: "bin",  example: "Ich bin Paul."          },
      { pronoun: "du",        form: "bist", example: "Du bist nett."          },
      { pronoun: "er/sie/es", form: "ist",  example: "Er ist Lehrer."         },
      { pronoun: "wir",       form: "sind", example: "Wir sind Freunde."      },
      { pronoun: "ihr",       form: "seid", example: "Ihr seid müde."         },
      { pronoun: "sie/Sie",   form: "sind", example: "Sie sind Deutschlehrerin." },
    ],
    examples: [
      "Ich bin aus Kamerun. → Je suis du Cameroun.",
      "Das ist Herr Bauer. → C'est M. Bauer.",
      "Wir sind Studenten. → Nous sommes étudiants.",
    ],
  },
  vocabulary: [
    { de: "Hallo",             fr: "Salut / Bonjour (informel)", example: "Hallo, ich bin Paul!"           },
    { de: "Guten Tag",         fr: "Bonjour (formel)",           example: "Guten Tag, Herr Müller."        },
    { de: "Auf Wiedersehen",   fr: "Au revoir (formel)",         example: "Auf Wiedersehen und danke!"     },
    { de: "Bitte",             fr: "S'il vous plaît / De rien",  example: "Einen Kaffee, bitte."           },
    { de: "Danke",             fr: "Merci",                      example: "Danke schön, das ist nett!"     },
  ],
  sentences: [
    { de: "Guten Morgen! Wie geht es Ihnen?",           fr: "Bonjour ! Comment allez-vous ?" },
    { de: "Mir geht es gut, danke.",                    fr: "Je vais bien, merci." },
    { de: "Mein Name ist Paul. Ich komme aus Kamerun.", fr: "Je m'appelle Paul. Je viens du Cameroun." },
    { de: "Auf Wiedersehen! Schönen Tag noch!",         fr: "Au revoir ! Bonne journée !" },
  ],
};

const GUTEN_TAG_LESSON_2: LessonContent = {
  introduction:
    "In dieser Lektion lernen Sie das Alphabet und die Zahlen 1-10 auf Deutsch. Diese Grundlagen sind entscheidend für das Buchstabieren von Namen und das Verstehen von Adressen und Telefonnummern.",
  grammar: {
    title: "Das Verb 'heißen' im Präsens",
    explanation:
      "'Heißen' (s'appeler) est utilisé pour donner son nom. C'est un verbe régulier très utile lors des présentations formelles.",
    conjugation: [
      { pronoun: "ich",       form: "heiße",  example: "Ich heiße Paul Nkengue."  },
      { pronoun: "du",        form: "heißt",  example: "Wie heißt du?"            },
      { pronoun: "er/sie/es", form: "heißt",  example: "Er heißt Klaus Bauer."    },
      { pronoun: "wir",       form: "heißen", example: "Wir heißen Schmidt."      },
      { pronoun: "ihr",       form: "heißt",  example: "Wie heißt ihr?"           },
      { pronoun: "sie/Sie",   form: "heißen", example: "Wie heißen Sie, bitte?"   },
    ],
    examples: [
      "Wie heißen Sie? → Comment vous appelez-vous ?",
      "Ich heiße Maria. → Je m'appelle Maria.",
      "Können Sie das buchstabieren? → Pouvez-vous épeler cela ?",
    ],
  },
  vocabulary: [
    { de: "der Name",        fr: "le nom",             example: "Mein Name ist Paul."          },
    { de: "buchstabieren",   fr: "épeler",              example: "Können Sie das buchstabieren?" },
    { de: "Woher kommen Sie?", fr: "D'où venez-vous ?", example: "Woher kommen Sie, bitte?"      },
    { de: "Ich komme aus…",  fr: "Je viens de…",        example: "Ich komme aus Kamerun."        },
    { de: "Entschuldigung",  fr: "Excusez-moi / Pardon",example: "Entschuldigung, wie bitte?"    },
  ],
  sentences: [
    { de: "Wie heißen Sie, bitte?",        fr: "Comment vous appelez-vous, s'il vous plaît ?" },
    { de: "Mein Name ist Paul Nkengue.",   fr: "Mon nom est Paul Nkengue." },
    { de: "Woher kommen Sie?",             fr: "D'où venez-vous ?" },
    { de: "Entschuldigung, wie bitte?",    fr: "Excusez-moi, comment ?" },
  ],
};

const GUTEN_TAG_QUIZ: QuizContent = {
  questions: [
    {
      id: "q1",
      question: "Was bedeutet 'Guten Tag' auf Französisch?",
      options: ["Bonne nuit", "Bonjour (formel)", "Au revoir", "Bonsoir"],
      correct: 1,
      explanation:
        "'Guten Tag' signifie 'Bonjour' dans un contexte formel. On l'utilise pour saluer des personnes que l'on ne connaît pas ou dans un cadre professionnel.",
    },
    {
      id: "q2",
      question: "Wie sagt man 'Merci beaucoup' auf Deutsch?",
      options: ["Bitte schön", "Hallo!", "Danke schön!", "Gern geschehen"],
      correct: 2,
      explanation:
        "'Danke schön' bedeutet 'Merci beaucoup'. Man kann auch einfach 'Danke' sagen. 'Bitte schön' signifie 'De rien' ou 'Voilà'.",
    },
    {
      id: "q3",
      question: "Ergänzen Sie: 'Ich _____ Studentin aus Kamerun.'",
      options: ["bist", "bin", "ist", "sind"],
      correct: 1,
      explanation:
        "La première personne du singulier de 'sein' est 'bin'. Ich → bin, du → bist, er/sie → ist, wir/sie/Sie → sind.",
    },
    {
      id: "q4",
      question: "Was bedeutet 'Auf Wiedersehen'?",
      options: ["Bonjour", "S'il vous plaît", "Au revoir (formel)", "Merci"],
      correct: 2,
      explanation:
        "'Auf Wiedersehen' est la forme formelle de 'Au revoir'. Pour une occasion informelle, on dit 'Tschüss'.",
    },
    {
      id: "q5",
      question: "Korrekte Antwort auf 'Wie geht es Ihnen?'",
      options: [
        "Ich heiße Paul.",
        "Mir geht es gut, danke.",
        "Ich komme aus Kamerun.",
        "Das ist richtig.",
      ],
      correct: 1,
      explanation:
        "'Mir geht es gut, danke' (Je vais bien, merci) est la réponse standard. 'Wie geht es Ihnen?' est la forme formelle de 'Comment allez-vous?'.",
    },
  ],
};

// ─── Module registry ───────────────────────────────────────────────────────────

export const COURSE_MODULES: Record<string, CourseModule[]> = {
  "a1-1": [
    {
      id: "m1",
      courseId: "a1-1",
      type: "lesson",
      title: "Vocabulaire : Begrüßungen",
      description: "Salutations, formules de politesse et verbe sein",
      xp: 50,
      duration: 10,
      lessonContent: GUTEN_TAG_LESSON_1,
    },
    {
      id: "m2",
      courseId: "a1-1",
      type: "quiz",
      title: "Quiz — Guten Tag!",
      description: "5 questions sur le vocabulaire et la grammaire",
      xp: 100,
      duration: 5,
      quizContent: GUTEN_TAG_QUIZ,
    },
    {
      id: "m3",
      courseId: "a1-1",
      type: "lesson",
      title: "Se présenter : heißen & kommen",
      description: "Verbe heißen, alphabet, pays d'origine",
      xp: 50,
      duration: 10,
      lessonContent: GUTEN_TAG_LESSON_2,
    },
    {
      id: "m4",
      courseId: "a1-1",
      type: "conversation",
      title: "Simulation — Premier contact",
      description: "Entraîne-toi avec le simulateur d'ambassade",
      xp: 150,
      duration: 15,
      conversationScenario: "visa_touriste",
    },
  ],
};

export const COURSE_TITLES: Record<string, { titleDE: string; titleFR: string; icon: string; level: string }> = {
  "a1-1": { titleDE: "Guten Tag!", titleFR: "Salutations", icon: "👋", level: "A1" },
};
