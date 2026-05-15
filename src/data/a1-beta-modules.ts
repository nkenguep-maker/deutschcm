// ── A1 Beta Track — Original Yema Languages Content ──────────────────────────
// 5 lessons × 5 modules (LESSON · HOEREN · CONVERSATION · SCHREIBEN · QUIZ)
// All German examples are grammatically correct.
// Not derived from or affiliated with any copyrighted textbook.

export type BetaModuleType = "LESSON" | "HOEREN" | "CONVERSATION" | "SCHREIBEN" | "QUIZ"

export interface BetaModule {
  id: string
  title: string
  titleDE: string
  type: BetaModuleType
  level: string
  topic: string
  xpReward: number
  duration: number
  content: Record<string, unknown>
}

// ── LESSON 1 — Willkommen! (Greetings & Introductions) ───────────────────────

const L1_LESEN: BetaModule = {
  id: "a1-beta-1-lesen",
  title: "Willkommen! — Leçon",
  titleDE: "Beta 1 — Lesen & Grammatik",
  type: "LESSON",
  level: "A1",
  topic: "Salutations et présentations",
  xpReward: 50,
  duration: 15,
  content: {
    introduction:
      "Dans cette leçon, vous apprendrez les formules de salutation essentielles et comment vous présenter en allemand. Ces phrases sont indispensables pour tout premier contact, qu'il s'agisse d'un entretien, d'une rencontre formelle ou d'une conversation amicale.",
    kulturhinweis:
      "En Allemagne, le vouvoiement (Sie) est essentiel dans les contextes formels — bureau, administrations, rencontres avec des inconnus. L'informel (du) est réservé aux amis et à la famille.",
    wortschatz: [
      { de: "Hallo",          fr: "Salut / Bonjour (informel)",  article: null,  example: "Hallo! Wie heißen Sie?",            audio: true },
      { de: "Guten Tag",      fr: "Bonjour (formel)",            article: null,  example: "Guten Tag, Herr Weber.",             audio: true },
      { de: "Guten Morgen",   fr: "Bonjour (le matin)",          article: null,  example: "Guten Morgen! Wie geht es Ihnen?",  audio: true },
      { de: "Guten Abend",    fr: "Bonsoir",                     article: null,  example: "Guten Abend, Frau Müller.",          audio: true },
      { de: "Auf Wiedersehen",fr: "Au revoir (formel)",           article: null,  example: "Auf Wiedersehen! Bis morgen.",      audio: true },
      { de: "Tschüss",        fr: "Salut / Au revoir (informel)", article: null, example: "Tschüss, bis später!",              audio: true },
      { de: "Bitte",          fr: "S'il vous plaît / De rien",   article: null,  example: "Einen Kaffee, bitte.",              audio: true },
      { de: "Danke schön",    fr: "Merci beaucoup",              article: null,  example: "Danke schön! Das ist nett.",        audio: true },
      { de: "Entschuldigung", fr: "Excusez-moi / Pardon",        article: null,  example: "Entschuldigung, wie heißen Sie?",  audio: true },
      { de: "Wie geht es Ihnen?", fr: "Comment allez-vous ?",   article: null,  example: "Wie geht es Ihnen? — Gut, danke!", audio: true },
    ],
    grammatik: {
      rule: "Le verbe 'sein' (être) au présent",
      ruleDE: "Das Verb 'sein' im Präsens",
      explanation:
        "Le verbe 'sein' est le verbe le plus important de l'allemand. Il est irrégulier — mémorisez ces formes ! Chaque pronom a sa propre forme unique.",
      table: {
        headers: ["Pronom", "Forme", "Exemple"],
        rows: [
          ["ich",       "bin",  "Ich bin Student."],
          ["du",        "bist", "Du bist nett."],
          ["er/sie/es", "ist",  "Er ist Lehrer."],
          ["wir",       "sind", "Wir sind Freunde."],
          ["ihr",       "seid", "Ihr seid müde."],
          ["sie/Sie",   "sind", "Sie sind willkommen."],
        ],
      },
      commonMistakes: [
        { wrong: "Ich ist Student",  correct: "Ich bin Student",  explanation: "Avec 'ich', on utilise toujours 'bin'" },
        { wrong: "Du bin nett",      correct: "Du bist nett",     explanation: "Avec 'du', c'est toujours 'bist'" },
        { wrong: "Wir ist müde",     correct: "Wir sind müde",    explanation: "Avec 'wir', c'est toujours 'sind'" },
        { wrong: "Ihr ist hier",     correct: "Ihr seid hier",    explanation: "Avec 'ihr', c'est toujours 'seid'" },
      ],
    },
    lesetext: {
      title: "Eine neue Bekanntschaft — Une nouvelle rencontre",
      context: "Amara Diallo, étudiant camerounais, rencontre Lisa Bauer pour la première fois à l'école de langues.",
      text:
        "Amara: Guten Tag! Ich heiße Amara Diallo. Ich komme aus Kamerun.\n" +
        "Lisa: Sehr angenehm! Ich bin Lisa Bauer. Ich bin Deutschlehrerin.\n" +
        "Amara: Freut mich, Frau Bauer! Ich lerne seit drei Monaten Deutsch.\n" +
        "Lisa: Das ist wunderbar! Woher kommen Sie genau?\n" +
        "Amara: Ich komme aus Douala. Es ist eine große Stadt.\n" +
        "Lisa: Willkommen im Kurs, Herr Diallo! Wir sind eine freundliche Gruppe.",
      translation:
        "Amara : Bonjour ! Je m'appelle Amara Diallo. Je viens du Cameroun.\n" +
        "Lisa : Enchanté ! Je suis Lisa Bauer. Je suis professeure d'allemand.\n" +
        "Amara : Ravi de vous connaître, Madame Bauer ! J'apprends l'allemand depuis trois mois.\n" +
        "Lisa : C'est merveilleux ! D'où venez-vous exactement ?\n" +
        "Amara : Je viens de Douala. C'est une grande ville.\n" +
        "Lisa : Bienvenue dans le cours, Monsieur Diallo ! Nous sommes un groupe sympathique.",
    },
  },
}

const L1_HOEREN: BetaModule = {
  id: "a1-beta-1-hoeren",
  title: "Willkommen! — Écoute",
  titleDE: "Beta 1 — Hören",
  type: "HOEREN",
  level: "A1",
  topic: "Dialogues de salutation",
  xpReward: 30,
  duration: 10,
  content: {
    dialogs: [
      {
        title: "Am Sprachzentrum — Au centre de langues",
        context_fr: "Fatima arrive pour son premier cours d'allemand.",
        lines: [
          { sprecher: "Sekretärin", text: "Guten Morgen! Willkommen im Yema Sprachzentrum.", translation: "Bonjour ! Bienvenue au centre de langues Yema.", gender: "female", pause_after_ms: 800 },
          { sprecher: "Fatima",     text: "Guten Morgen. Ich heiße Fatima Oumarou. Ich bin neu hier.", translation: "Bonjour. Je m'appelle Fatima Oumarou. Je suis nouvelle ici.", gender: "female", pause_after_ms: 700 },
          { sprecher: "Sekretärin", text: "Sehr angenehm, Frau Oumarou! Wie geht es Ihnen?", translation: "Enchantée, Madame Oumarou ! Comment allez-vous ?", gender: "female", pause_after_ms: 600 },
          { sprecher: "Fatima",     text: "Mir geht es gut, danke! Und Ihnen?", translation: "Je vais bien, merci ! Et vous ?", gender: "female", pause_after_ms: 600 },
          { sprecher: "Sekretärin", text: "Auch gut, danke. Ihr Kurs beginnt um neun Uhr.", translation: "Bien aussi, merci. Votre cours commence à neuf heures.", gender: "female" },
        ],
      },
      {
        title: "Zwei Kursteilnehmer — Deux participants au cours",
        context_fr: "Paul et Marie se rencontrent avant le cours.",
        lines: [
          { sprecher: "Paul",  text: "Hallo! Ich bin Paul. Woher kommst du?", translation: "Salut ! Je suis Paul. D'où viens-tu ?", gender: "male", pause_after_ms: 700 },
          { sprecher: "Marie", text: "Hallo Paul! Ich heiße Marie. Ich komme aus Yaoundé.", translation: "Salut Paul ! Je m'appelle Marie. Je viens de Yaoundé.", gender: "female", pause_after_ms: 700 },
          { sprecher: "Paul",  text: "Cool! Ich bin auch aus Kamerun. Ich komme aus Douala.", translation: "Cool ! Moi aussi je suis du Cameroun. Je viens de Douala.", gender: "male", pause_after_ms: 600 },
          { sprecher: "Marie", text: "Super! Wir sind Nachbarn. Lernst du schon lange Deutsch?", translation: "Super ! Nous sommes voisins. Tu apprends l'allemand depuis longtemps ?", gender: "female", pause_after_ms: 700 },
          { sprecher: "Paul",  text: "Seit zwei Monaten. Und du?", translation: "Depuis deux mois. Et toi ?", gender: "male" },
        ],
      },
    ],
  },
}

const L1_SPRECHEN: BetaModule = {
  id: "a1-beta-1-sprechen",
  title: "Willkommen! — Expression orale",
  titleDE: "Beta 1 — Sprechen",
  type: "CONVERSATION",
  level: "A1",
  topic: "Salutations et présentations orales",
  xpReward: 40,
  duration: 15,
  content: {
    exercises: [
      {
        instruction: "Répétez ces phrases après le modèle audio :",
        phrases: [
          { de: "Guten Tag! Ich heiße Paul Nkengue.", fr: "Bonjour ! Je m'appelle Paul Nkengue." },
          { de: "Ich komme aus Kamerun.",             fr: "Je viens du Cameroun." },
          { de: "Ich bin Student.",                   fr: "Je suis étudiant." },
          { de: "Wie heißen Sie, bitte?",             fr: "Comment vous appelez-vous, s'il vous plaît ?" },
          { de: "Mir geht es gut, danke.",            fr: "Je vais bien, merci." },
        ],
      },
    ],
    freeTask: {
      instruction: "Présentez-vous en allemand (30 à 60 secondes).",
      prompt: "Dites votre nom, votre origine et comment vous allez.",
      example: "Hallo! Ich heiße... Ich komme aus... Mir geht es...",
    },
  },
}

const L1_SCHREIBEN: BetaModule = {
  id: "a1-beta-1-schreiben",
  title: "Willkommen! — Écriture",
  titleDE: "Beta 1 — Schreiben",
  type: "SCHREIBEN",
  level: "A1",
  topic: "Se présenter à l'écrit",
  xpReward: 35,
  duration: 15,
  content: {
    task: "Écrivez un court message de présentation à votre nouveau groupe de cours. Mentionnez votre nom, votre pays d'origine et un souhait pour le cours.",
    taskDE: "Schreiben Sie eine kurze Vorstellung für Ihre neue Kursgruppe. Nennen Sie Ihren Namen, Ihr Herkunftsland und einen Wunsch für den Kurs.",
    minWords: 25,
    maxWords: 60,
    example: "Hallo! Ich heiße Amara Diallo. Ich bin Student und ich komme aus Douala in Kamerun. Ich bin sehr froh, hier zu sein. Ich möchte gerne Deutsch lernen. Auf Wiedersehen!",
  },
}

const L1_QUIZ: BetaModule = {
  id: "a1-beta-1-quiz",
  title: "Willkommen! — Quiz",
  titleDE: "Beta 1 — Quiz",
  type: "QUIZ",
  level: "A1",
  topic: "Salutations, présentations et verbe sein — A1",
  xpReward: 80,
  duration: 12,
  content: {},
}

// ── LESSON 2 — Meine Familie (Personal Information & Family) ──────────────────

const L2_LESEN: BetaModule = {
  id: "a1-beta-2-lesen",
  title: "Meine Familie — Leçon",
  titleDE: "Beta 2 — Lesen & Grammatik",
  type: "LESSON",
  level: "A1",
  topic: "Famille et informations personnelles",
  xpReward: 50,
  duration: 15,
  content: {
    introduction:
      "Dans cette leçon, vous apprendrez à parler de votre famille et de vos informations personnelles en allemand. Vous apprendrez aussi le verbe 'haben' (avoir), essentiel pour exprimer ce que vous possédez ou ce dont vous avez besoin.",
    kulturhinweis:
      "En Allemagne, les noms de famille (Familienname) viennent après le prénom. Dans les formulaires officiels, on demande souvent d'abord le Nachname (nom de famille) puis le Vorname (prénom).",
    wortschatz: [
      { de: "die Familie",   fr: "la famille",        article: "die", example: "Meine Familie ist groß.",         audio: true },
      { de: "die Mutter",    fr: "la mère",           article: "die", example: "Meine Mutter ist Ärztin.",        audio: true },
      { de: "der Vater",     fr: "le père",           article: "der", example: "Mein Vater ist Ingenieur.",       audio: true },
      { de: "der Bruder",    fr: "le frère",          article: "der", example: "Ich habe einen Bruder.",         audio: true },
      { de: "die Schwester", fr: "la sœur",           article: "die", example: "Meine Schwester ist 18 Jahre alt.", audio: true },
      { de: "verheiratet",   fr: "marié(e)",           article: null,  example: "Meine Eltern sind verheiratet.", audio: true },
      { de: "ledig",         fr: "célibataire",        article: null,  example: "Ich bin ledig.",                 audio: true },
      { de: "das Kind",      fr: "l'enfant",           article: "das", example: "Wir haben zwei Kinder.",        audio: true },
      { de: "alt",           fr: "âgé / vieux",        article: null,  example: "Wie alt bist du?",              audio: true },
      { de: "jung",          fr: "jeune",              article: null,  example: "Meine Schwester ist jung.",      audio: true },
    ],
    grammatik: {
      rule: "Le verbe 'haben' (avoir) au présent",
      ruleDE: "Das Verb 'haben' im Präsens",
      explanation:
        "Le verbe 'haben' est utilisé pour exprimer la possession. Il est légèrement irrégulier — notez la forme 'du hast' (pas 'du habst') et 'er hat' (pas 'er habt').",
      table: {
        headers: ["Pronom", "Forme", "Exemple"],
        rows: [
          ["ich",       "habe",  "Ich habe einen Bruder."],
          ["du",        "hast",  "Du hast eine große Familie."],
          ["er/sie/es", "hat",   "Er hat zwei Schwestern."],
          ["wir",       "haben", "Wir haben ein Haus."],
          ["ihr",       "habt",  "Ihr habt viele Freunde."],
          ["sie/Sie",   "haben", "Sie haben drei Kinder."],
        ],
      },
      commonMistakes: [
        { wrong: "Ich hat einen Bruder",   correct: "Ich habe einen Bruder",   explanation: "Avec 'ich', c'est 'habe', jamais 'hat'" },
        { wrong: "Du habe eine Schwester", correct: "Du hast eine Schwester",  explanation: "Avec 'du', c'est 'hast', jamais 'habe'" },
        { wrong: "Er haben ein Kind",      correct: "Er hat ein Kind",         explanation: "Avec 'er/sie/es', c'est 'hat'" },
        { wrong: "Wir hat eine Familie",   correct: "Wir haben eine Familie",  explanation: "Avec 'wir', c'est 'haben'" },
      ],
    },
    lesetext: {
      title: "Meine Familie — Ma famille",
      context: "Amara décrit sa famille dans une lettre à son correspondant allemand Lukas.",
      text:
        "Hallo Lukas! Ich heiße Amara und ich komme aus Yaoundé.\n" +
        "Ich habe eine große Familie. Mein Vater heißt Jean-Pierre. Er ist Ingenieur.\n" +
        "Meine Mutter heißt Christine. Sie ist Ärztin.\n" +
        "Ich habe einen Bruder. Er heißt Marcel und er ist 15 Jahre alt.\n" +
        "Wir haben auch eine Katze. Sie heißt Bella.\n" +
        "Meine Familie ist sehr wichtig für mich. Wir sind glücklich.\n" +
        "Viele Grüße, Amara",
      translation:
        "Salut Lukas ! Je m'appelle Amara et je viens de Yaoundé.\n" +
        "J'ai une grande famille. Mon père s'appelle Jean-Pierre. Il est ingénieur.\n" +
        "Ma mère s'appelle Christine. Elle est médecin.\n" +
        "J'ai un frère. Il s'appelle Marcel et il a 15 ans.\n" +
        "Nous avons aussi un chat. Il s'appelle Bella.\n" +
        "Ma famille est très importante pour moi. Nous sommes heureux.\n" +
        "Bien cordialement, Amara",
    },
  },
}

const L2_HOEREN: BetaModule = {
  id: "a1-beta-2-hoeren",
  title: "Meine Familie — Écoute",
  titleDE: "Beta 2 — Hören",
  type: "HOEREN",
  level: "A1",
  topic: "Conversations sur la famille",
  xpReward: 30,
  duration: 10,
  content: {
    dialogs: [
      {
        title: "Familie vorstellen — Présenter sa famille",
        context_fr: "Nadia montre des photos de sa famille à son professeur.",
        lines: [
          { sprecher: "Lehrerin", text: "Nadia, haben Sie Geschwister?",           translation: "Nadia, avez-vous des frères et sœurs ?",   gender: "female", pause_after_ms: 700 },
          { sprecher: "Nadia",    text: "Ja! Ich habe einen Bruder und eine Schwester.", translation: "Oui ! J'ai un frère et une sœur.", gender: "female", pause_after_ms: 800 },
          { sprecher: "Lehrerin", text: "Wie alt sind sie?",                        translation: "Quel âge ont-ils ?",                       gender: "female", pause_after_ms: 600 },
          { sprecher: "Nadia",    text: "Mein Bruder ist 20 Jahre alt. Meine Schwester ist 16.", translation: "Mon frère a 20 ans. Ma sœur en a 16.", gender: "female", pause_after_ms: 700 },
          { sprecher: "Lehrerin", text: "Und Ihre Eltern?",                         translation: "Et vos parents ?",                         gender: "female", pause_after_ms: 600 },
          { sprecher: "Nadia",    text: "Meine Mutter ist Lehrerin und mein Vater ist Arzt.", translation: "Ma mère est enseignante et mon père est médecin.", gender: "female" },
        ],
      },
    ],
  },
}

const L2_SPRECHEN: BetaModule = {
  id: "a1-beta-2-sprechen",
  title: "Meine Familie — Expression orale",
  titleDE: "Beta 2 — Sprechen",
  type: "CONVERSATION",
  level: "A1",
  topic: "Parler de sa famille en allemand",
  xpReward: 40,
  duration: 15,
  content: {
    exercises: [
      {
        instruction: "Répétez ces phrases après le modèle audio :",
        phrases: [
          { de: "Ich habe eine Familie.",              fr: "J'ai une famille." },
          { de: "Mein Vater ist Ingenieur.",           fr: "Mon père est ingénieur." },
          { de: "Meine Mutter heißt Christine.",       fr: "Ma mère s'appelle Christine." },
          { de: "Ich habe einen Bruder.",              fr: "J'ai un frère." },
          { de: "Wir haben zwei Kinder.",              fr: "Nous avons deux enfants." },
        ],
      },
    ],
    freeTask: {
      instruction: "Parlez de votre famille en allemand (30 à 60 secondes).",
      prompt: "Décrivez votre famille : combien de membres, leurs prénoms et leurs professions.",
      example: "Ich habe eine Familie. Mein Vater heißt... Er ist... Meine Mutter...",
    },
  },
}

const L2_SCHREIBEN: BetaModule = {
  id: "a1-beta-2-schreiben",
  title: "Meine Familie — Écriture",
  titleDE: "Beta 2 — Schreiben",
  type: "SCHREIBEN",
  level: "A1",
  topic: "Décrire sa famille à l'écrit",
  xpReward: 35,
  duration: 15,
  content: {
    task: "Écrivez un court paragraphe sur votre famille. Mentionnez au moins deux membres, leurs prénoms et leurs professions.",
    taskDE: "Schreiben Sie einen kurzen Absatz über Ihre Familie. Nennen Sie mindestens zwei Mitglieder, ihre Vornamen und ihre Berufe.",
    minWords: 30,
    maxWords: 70,
    example: "Ich habe eine kleine Familie. Mein Vater heißt Robert. Er ist Lehrer. Meine Mutter heißt Alice. Sie ist Ärztin. Ich habe eine Schwester. Sie heißt Sophie und sie ist 14 Jahre alt. Wir wohnen in Douala.",
  },
}

const L2_QUIZ: BetaModule = {
  id: "a1-beta-2-quiz",
  title: "Meine Familie — Quiz",
  titleDE: "Beta 2 — Quiz",
  type: "QUIZ",
  level: "A1",
  topic: "Famille, informations personnelles et verbe haben — A1",
  xpReward: 80,
  duration: 12,
  content: {},
}

// ── LESSON 3 — Mein Alltag (Daily Life & Numbers) ────────────────────────────

const L3_LESEN: BetaModule = {
  id: "a1-beta-3-lesen",
  title: "Mein Alltag — Leçon",
  titleDE: "Beta 3 — Lesen & Grammatik",
  type: "LESSON",
  level: "A1",
  topic: "Vie quotidienne et chiffres",
  xpReward: 50,
  duration: 15,
  content: {
    introduction:
      "Dans cette leçon, vous apprendrez les chiffres de 1 à 20, les moments de la journée et les activités quotidiennes. Vous verrez aussi comment conjuguer les verbes réguliers au présent.",
    kulturhinweis:
      "En Allemagne, les horaires sont très importants. 'Pünktlichkeit' (ponctualité) est une valeur culturelle forte. Les Allemands disent souvent : 'Pünktlichkeit ist eine Tugend' — la ponctualité est une vertu.",
    wortschatz: [
      { de: "der Morgen",     fr: "le matin",                article: "der", example: "Am Morgen trinke ich Kaffee.",     audio: true },
      { de: "der Nachmittag", fr: "l'après-midi",            article: "der", example: "Am Nachmittag lerne ich Deutsch.", audio: true },
      { de: "der Abend",      fr: "le soir",                 article: "der", example: "Am Abend esse ich zu Hause.",      audio: true },
      { de: "aufstehen",      fr: "se lever",                article: null,  example: "Ich stehe um sechs Uhr auf.",      audio: true },
      { de: "frühstücken",    fr: "prendre le petit-dé j.",  article: null,  example: "Ich frühstücke um sieben Uhr.",   audio: true },
      { de: "arbeiten",       fr: "travailler",              article: null,  example: "Ich arbeite von neun bis fünf.",   audio: true },
      { de: "lernen",         fr: "apprendre / étudier",     article: null,  example: "Ich lerne jeden Tag Deutsch.",    audio: true },
      { de: "schlafen",       fr: "dormir",                  article: null,  example: "Ich schlafe um zehn Uhr.",        audio: true },
      { de: "die Uhr",        fr: "l'heure / la montre",     article: "die", example: "Wie viel Uhr ist es?",            audio: true },
      { de: "jeden Tag",      fr: "chaque jour",             article: null,  example: "Ich lerne jeden Tag.",            audio: true },
    ],
    grammatik: {
      rule: "Les verbes réguliers au présent",
      ruleDE: "Regelmäßige Verben im Präsens",
      explanation:
        "La grande majorité des verbes allemands sont réguliers. On enlève le '-en' de l'infinitif et on ajoute les terminaisons : -e, -st, -t, -en, -t, -en. Exemple avec 'lernen' (apprendre).",
      table: {
        headers: ["Pronom", "Terminaison", "Exemple"],
        rows: [
          ["ich",       "-e",  "Ich lerne Deutsch."],
          ["du",        "-st", "Du lernst gut."],
          ["er/sie/es", "-t",  "Er lernt jeden Tag."],
          ["wir",       "-en", "Wir lernen zusammen."],
          ["ihr",       "-t",  "Ihr lernt fleißig."],
          ["sie/Sie",   "-en", "Sie lernen Deutsch."],
        ],
      },
      commonMistakes: [
        { wrong: "Ich arbeitet",    correct: "Ich arbeite",     explanation: "Avec 'ich', terminaison '-e', pas '-t'" },
        { wrong: "Du lernst nicht", correct: "Du lernst nicht", explanation: "Correct ! 'du' prend '-st'" },
        { wrong: "Er arbeiten",     correct: "Er arbeitet",     explanation: "Avec 'er', terminaison '-t', pas '-en'" },
      ],
    },
    lesetext: {
      title: "Ein typischer Tag — Une journée typique",
      context: "Thomas décrit sa journée habituelle pendant ses cours d'allemand.",
      text:
        "Ich heiße Thomas. Mein Tag beginnt um sechs Uhr.\n" +
        "Ich stehe auf und frühstücke. Ich esse Brot und trinke Kaffee.\n" +
        "Um acht Uhr gehe ich zur Sprachschule. Ich lerne dort Deutsch.\n" +
        "Der Unterricht dauert drei Stunden. Wir lernen Vokabeln und Grammatik.\n" +
        "Am Nachmittag esse ich zu Mittag und ruhe mich aus.\n" +
        "Am Abend lerne ich zu Hause. Ich übe die Aussprache.\n" +
        "Um zehn Uhr schlafe ich. Morgen lerne ich wieder!",
      translation:
        "Je m'appelle Thomas. Ma journée commence à six heures.\n" +
        "Je me lève et prends mon petit-déjeuner. Je mange du pain et bois du café.\n" +
        "À huit heures, je vais à l'école de langues. J'y apprends l'allemand.\n" +
        "Le cours dure trois heures. Nous apprenons le vocabulaire et la grammaire.\n" +
        "L'après-midi, je mange le déjeuner et me repose.\n" +
        "Le soir, j'étudie à la maison. Je pratique la prononciation.\n" +
        "À dix heures, je me couche. Demain j'apprends encore !",
    },
  },
}

const L3_HOEREN: BetaModule = {
  id: "a1-beta-3-hoeren",
  title: "Mein Alltag — Écoute",
  titleDE: "Beta 3 — Hören",
  type: "HOEREN",
  level: "A1",
  topic: "Vie quotidienne et horaires",
  xpReward: 30,
  duration: 10,
  content: {
    dialogs: [
      {
        title: "Wie viel Uhr ist es? — Quelle heure est-il ?",
        context_fr: "Paul et Marie parlent de leur emploi du temps.",
        lines: [
          { sprecher: "Paul",  text: "Hallo Marie! Um wie viel Uhr stehst du auf?",            translation: "Salut Marie ! À quelle heure te lèves-tu ?", gender: "male",   pause_after_ms: 700 },
          { sprecher: "Marie", text: "Ich stehe um halb sieben auf. Das ist sehr früh!",        translation: "Je me lève à six heures et demie. C'est très tôt !", gender: "female", pause_after_ms: 700 },
          { sprecher: "Paul",  text: "Ich stehe um sieben Uhr auf. Wann beginnt dein Unterricht?", translation: "Je me lève à sept heures. Quand commence ton cours ?", gender: "male", pause_after_ms: 700 },
          { sprecher: "Marie", text: "Um acht Uhr dreißig. Und du?",                            translation: "À huit heures trente. Et toi ?",                gender: "female", pause_after_ms: 600 },
          { sprecher: "Paul",  text: "Ich habe Unterricht um neun Uhr. Dann haben wir eine Stunde frei.", translation: "J'ai cours à neuf heures. Puis nous avons une heure libre.", gender: "male" },
        ],
      },
    ],
  },
}

const L3_SPRECHEN: BetaModule = {
  id: "a1-beta-3-sprechen",
  title: "Mein Alltag — Expression orale",
  titleDE: "Beta 3 — Sprechen",
  type: "CONVERSATION",
  level: "A1",
  topic: "Décrire sa journée en allemand",
  xpReward: 40,
  duration: 15,
  content: {
    exercises: [
      {
        instruction: "Répétez ces phrases après le modèle audio :",
        phrases: [
          { de: "Ich stehe um sechs Uhr auf.",    fr: "Je me lève à six heures." },
          { de: "Ich frühstücke um sieben Uhr.",  fr: "Je prends mon petit-déjeuner à sept heures." },
          { de: "Ich lerne jeden Tag Deutsch.",   fr: "J'apprends l'allemand chaque jour." },
          { de: "Wie viel Uhr ist es?",           fr: "Quelle heure est-il ?" },
          { de: "Es ist zehn Uhr.",               fr: "Il est dix heures." },
        ],
      },
    ],
    freeTask: {
      instruction: "Décrivez votre journée typique en allemand.",
      prompt: "Mentionnez l'heure à laquelle vous vous levez, mangez et étudiez.",
      example: "Ich stehe um... Uhr auf. Dann frühstücke ich... Am Abend...",
    },
  },
}

const L3_SCHREIBEN: BetaModule = {
  id: "a1-beta-3-schreiben",
  title: "Mein Alltag — Écriture",
  titleDE: "Beta 3 — Schreiben",
  type: "SCHREIBEN",
  level: "A1",
  topic: "Décrire sa routine quotidienne à l'écrit",
  xpReward: 35,
  duration: 15,
  content: {
    task: "Décrivez votre journée typique en allemand. Mentionnez au moins quatre activités avec leurs horaires.",
    taskDE: "Beschreiben Sie Ihren typischen Tag auf Deutsch. Nennen Sie mindestens vier Aktivitäten mit Uhrzeiten.",
    minWords: 35,
    maxWords: 80,
    example: "Mein Tag beginnt um sechs Uhr. Ich stehe auf und frühstücke. Um acht Uhr gehe ich zur Arbeit. Ich arbeite von neun bis fünf Uhr. Am Abend koche ich und lerne Deutsch. Um elf Uhr schlafe ich.",
  },
}

const L3_QUIZ: BetaModule = {
  id: "a1-beta-3-quiz",
  title: "Mein Alltag — Quiz",
  titleDE: "Beta 3 — Quiz",
  type: "QUIZ",
  level: "A1",
  topic: "Vie quotidienne, chiffres et verbes réguliers — A1",
  xpReward: 80,
  duration: 12,
  content: {},
}

// ── LESSON 4 — Einkaufen & Essen (Food, Shopping & Appointments) ──────────────

const L4_LESEN: BetaModule = {
  id: "a1-beta-4-lesen",
  title: "Einkaufen & Essen — Leçon",
  titleDE: "Beta 4 — Lesen & Grammatik",
  type: "LESSON",
  level: "A1",
  topic: "Alimentation, achats et rendez-vous",
  xpReward: 55,
  duration: 15,
  content: {
    introduction:
      "Dans cette leçon, vous apprendrez le vocabulaire essentiel pour faire des achats, commander au café et prendre rendez-vous. Vous verrez aussi l'accusatif avec les articles indéfinis.",
    kulturhinweis:
      "En Allemagne, les marchés (Wochenmarkt) sont très populaires le week-end. On y trouve des légumes frais, du pain artisanal et des spécialités régionales. Il est courant de demander les prix avant d'acheter.",
    wortschatz: [
      { de: "das Brot",       fr: "le pain",                article: "das", example: "Ein Brot kostet zwei Euro.",      audio: true },
      { de: "die Milch",      fr: "le lait",                article: "die", example: "Ich kaufe eine Milch.",           audio: true },
      { de: "der Apfel",      fr: "la pomme",               article: "der", example: "Ich möchte einen Apfel.",        audio: true },
      { de: "kaufen",         fr: "acheter",                article: null,  example: "Ich kaufe Brot und Milch.",       audio: true },
      { de: "bezahlen",       fr: "payer",                  article: null,  example: "Ich bezahle fünf Euro.",          audio: true },
      { de: "Was kostet das?",fr: "Combien ça coûte ?",     article: null,  example: "Was kostet das Brot?",           audio: true },
      { de: "der Termin",     fr: "le rendez-vous",         article: "der", example: "Ich habe einen Termin.",         audio: true },
      { de: "ich möchte",     fr: "je voudrais",            article: null,  example: "Ich möchte einen Kaffee, bitte.", audio: true },
      { de: "der Supermarkt", fr: "le supermarché",         article: "der", example: "Ich gehe in den Supermarkt.",    audio: true },
      { de: "der Markt",      fr: "le marché",              article: "der", example: "Am Samstag gehe ich zum Markt.", audio: true },
    ],
    grammatik: {
      rule: "L'accusatif avec les articles indéfinis (ein/eine/einen)",
      ruleDE: "Der Akkusativ mit unbestimmten Artikeln",
      explanation:
        "En allemand, l'objet direct d'une phrase (ce qu'on achète, veut, mange) utilise l'accusatif. Pour les noms masculins, 'ein' devient 'einen'. Féminin et neutre ne changent pas.",
      table: {
        headers: ["Genre", "Nominatif", "Accusatif"],
        rows: [
          ["Masculin (der)", "ein Apfel",  "Ich kaufe einen Apfel."],
          ["Féminin (die)",  "eine Banane","Ich kaufe eine Banane."],
          ["Neutre (das)",   "ein Brot",   "Ich kaufe ein Brot."],
        ],
      },
      commonMistakes: [
        { wrong: "Ich kaufe ein Apfel",    correct: "Ich kaufe einen Apfel",   explanation: "Der Apfel (masc.) → einen Apfel à l'accusatif" },
        { wrong: "Ich möchte ein Kaffee",  correct: "Ich möchte einen Kaffee", explanation: "Der Kaffee (masc.) → einen Kaffee à l'accusatif" },
        { wrong: "Er hat eine Bruder",     correct: "Er hat einen Bruder",     explanation: "Der Bruder (masc.) → einen Bruder à l'accusatif" },
      ],
    },
    lesetext: {
      title: "Auf dem Markt — Au marché",
      context: "Samira fait ses courses au marché du week-end à Douala.",
      text:
        "Samira geht am Samstag auf den Markt. Sie möchte Obst und Gemüse kaufen.\n" +
        "Verkäufer: Guten Morgen! Was darf es sein?\n" +
        "Samira: Guten Morgen! Ich möchte einen Kilo Äpfel, bitte.\n" +
        "Verkäufer: Gerne! Die Äpfel sind sehr frisch. Das kostet zwei Euro.\n" +
        "Samira: Und was kostet das Brot?\n" +
        "Verkäufer: Das Brot kostet einen Euro fünfzig.\n" +
        "Samira: Ich nehme beides. Das macht drei Euro fünfzig.\n" +
        "Verkäufer: Genau! Bitte schön. Auf Wiedersehen!\n" +
        "Samira: Danke schön! Auf Wiedersehen!",
      translation:
        "Samira va au marché le samedi. Elle veut acheter des fruits et des légumes.\n" +
        "Vendeur : Bonjour ! Que puis-je faire pour vous ?\n" +
        "Samira : Bonjour ! Je voudrais un kilo de pommes, s'il vous plaît.\n" +
        "Vendeur : Bien sûr ! Les pommes sont très fraîches. Ça coûte deux euros.\n" +
        "Samira : Et combien coûte le pain ?\n" +
        "Vendeur : Le pain coûte un euro cinquante.\n" +
        "Samira : Je prends les deux. Ça fait trois euros cinquante.\n" +
        "Vendeur : Exactement ! Voilà. Au revoir !\n" +
        "Samira : Merci beaucoup ! Au revoir !",
    },
  },
}

const L4_HOEREN: BetaModule = {
  id: "a1-beta-4-hoeren",
  title: "Einkaufen & Essen — Écoute",
  titleDE: "Beta 4 — Hören",
  type: "HOEREN",
  level: "A1",
  topic: "Commandes et achats en allemand",
  xpReward: 30,
  duration: 10,
  content: {
    dialogs: [
      {
        title: "In der Bäckerei — À la boulangerie",
        context_fr: "Paul achète son petit-déjeuner dans une boulangerie allemande.",
        lines: [
          { sprecher: "Bäcker",  text: "Guten Morgen! Was darf es sein?",                     translation: "Bonjour ! Que voulez-vous ?",                        gender: "male",   pause_after_ms: 700 },
          { sprecher: "Paul",    text: "Guten Morgen! Ich möchte zwei Brötchen und einen Kaffee.", translation: "Bonjour ! Je voudrais deux petits pains et un café.", gender: "male",   pause_after_ms: 800 },
          { sprecher: "Bäcker",  text: "Gerne. Das macht zwei Euro achtzig.",                  translation: "Bien sûr. Ça fait deux euros quatre-vingts.",            gender: "male",   pause_after_ms: 700 },
          { sprecher: "Paul",    text: "Hier sind drei Euro. Bitte schön.",                    translation: "Voici trois euros. S'il vous plaît.",                   gender: "male",   pause_after_ms: 600 },
          { sprecher: "Bäcker",  text: "Danke! Zwanzig Cent zurück. Guten Appetit!",           translation: "Merci ! Vingt centimes de monnaie. Bon appétit !",       gender: "male" },
        ],
      },
    ],
  },
}

const L4_SPRECHEN: BetaModule = {
  id: "a1-beta-4-sprechen",
  title: "Einkaufen & Essen — Expression orale",
  titleDE: "Beta 4 — Sprechen",
  type: "CONVERSATION",
  level: "A1",
  topic: "Commander et acheter en allemand",
  xpReward: 40,
  duration: 15,
  content: {
    exercises: [
      {
        instruction: "Répétez ces phrases après le modèle audio :",
        phrases: [
          { de: "Ich möchte einen Apfel, bitte.",       fr: "Je voudrais une pomme, s'il vous plaît." },
          { de: "Was kostet das?",                      fr: "Combien ça coûte ?" },
          { de: "Ich kaufe ein Kilo Äpfel.",            fr: "J'achète un kilo de pommes." },
          { de: "Das macht fünf Euro.",                 fr: "Ça fait cinq euros." },
          { de: "Ich habe einen Termin um zehn Uhr.",   fr: "J'ai un rendez-vous à dix heures." },
        ],
      },
    ],
    freeTask: {
      instruction: "Imaginez que vous commandez dans un café allemand.",
      prompt: "Saluez, commandez une boisson et un repas, demandez le prix.",
      example: "Guten Tag! Ich möchte... Was kostet...? Danke schön!",
    },
  },
}

const L4_SCHREIBEN: BetaModule = {
  id: "a1-beta-4-schreiben",
  title: "Einkaufen & Essen — Écriture",
  titleDE: "Beta 4 — Schreiben",
  type: "SCHREIBEN",
  level: "A1",
  topic: "Écrire une liste de courses et un message",
  xpReward: 35,
  duration: 15,
  content: {
    task: "Écrivez une liste de courses en allemand avec au moins 5 articles et leurs quantités, puis ajoutez un message court pour un ami expliquant où vous allez.",
    taskDE: "Schreiben Sie eine Einkaufsliste mit mindestens fünf Artikeln und Mengen, und fügen Sie eine kurze Nachricht hinzu.",
    minWords: 30,
    maxWords: 70,
    example: "Einkaufsliste: ein Kilo Äpfel, zwei Brötchen, eine Milch, drei Bananen, ein Brot. Hallo Anna! Ich gehe heute in den Supermarkt. Ich kaufe Obst und Brot für das Frühstück. Bis später!",
  },
}

const L4_QUIZ: BetaModule = {
  id: "a1-beta-4-quiz",
  title: "Einkaufen & Essen — Quiz",
  titleDE: "Beta 4 — Quiz",
  type: "QUIZ",
  level: "A1",
  topic: "Alimentation, shopping, accusatif et rendez-vous — A1",
  xpReward: 80,
  duration: 12,
  content: {},
}

// ── LESSON 5 — Deutschland-Reise & Botschaft (Germany Journey & Embassy) ──────

const L5_LESEN: BetaModule = {
  id: "a1-beta-5-lesen",
  title: "Deutschland-Reise — Leçon",
  titleDE: "Beta 5 — Lesen & Grammatik",
  type: "LESSON",
  level: "A1",
  topic: "Voyage en Allemagne et démarches administratives",
  xpReward: 60,
  duration: 20,
  content: {
    introduction:
      "Dans cette leçon, vous apprendrez le vocabulaire essentiel pour vos démarches administratives et votre voyage en Allemagne. Vous verrez aussi les verbes modaux 'können', 'müssen' et 'möchten'.\n\nYema Languages propose une pratique linguistique indépendante alignée sur le CECRL. Cette leçon prépare à l'entretien de langue — elle n'est pas affiliée à un organisme officiel d'examen.",
    kulturhinweis:
      "En Allemagne, la ponctualité et la préparation des documents sont essentielles pour tout rendez-vous administratif. Arrivez toujours 10 minutes en avance et apportez tous vos documents originaux avec des copies.",
    wortschatz: [
      { de: "die Botschaft",    fr: "l'ambassade",               article: "die", example: "Ich gehe zur deutschen Botschaft.", audio: true },
      { de: "das Visum",        fr: "le visa",                   article: "das", example: "Ich brauche ein Visum.",            audio: true },
      { de: "der Reisepass",    fr: "le passeport",              article: "der", example: "Hier ist mein Reisepass.",          audio: true },
      { de: "das Formular",     fr: "le formulaire",             article: "das", example: "Ich fülle das Formular aus.",       audio: true },
      { de: "der Termin",       fr: "le rendez-vous",            article: "der", example: "Ich habe einen Termin.",            audio: true },
      { de: "Ich brauche",      fr: "J'ai besoin de",            article: null,  example: "Ich brauche ein Formular.",        audio: true },
      { de: "Können Sie helfen?",fr: "Pouvez-vous m'aider ?",   article: null,  example: "Können Sie mir helfen, bitte?",    audio: true },
      { de: "Wo ist...?",       fr: "Où est... ?",               article: null,  example: "Wo ist die Botschaft, bitte?",     audio: true },
      { de: "das Flugzeug",     fr: "l'avion",                   article: "das", example: "Ich fliege mit dem Flugzeug.",     audio: true },
      { de: "ankommen",         fr: "arriver",                   article: null,  example: "Ich komme um 14 Uhr an.",          audio: true },
    ],
    grammatik: {
      rule: "Les verbes modaux : können, müssen, möchten",
      ruleDE: "Modalverben: können, müssen, möchten",
      explanation:
        "Les verbes modaux expriment la capacité (können), l'obligation (müssen) ou le désir (möchten). Ils se conjuguent au début de la phrase et l'infinitif va à la fin.",
      table: {
        headers: ["Pronom", "können", "müssen", "möchten"],
        rows: [
          ["ich",       "kann",   "muss",   "möchte"],
          ["du",        "kannst", "musst",  "möchtest"],
          ["er/sie/es", "kann",   "muss",   "möchte"],
          ["wir",       "können", "müssen", "möchten"],
          ["ihr",       "könnt",  "müsst",  "möchtet"],
          ["sie/Sie",   "können", "müssen", "möchten"],
        ],
      },
      commonMistakes: [
        { wrong: "Ich kann sprechen Deutsch",    correct: "Ich kann Deutsch sprechen",      explanation: "L'infinitif va toujours à la FIN de la phrase" },
        { wrong: "Ich muss gehen zum Amt",       correct: "Ich muss zum Amt gehen",         explanation: "Infinitif en fin de phrase avec les modaux" },
        { wrong: "Wir müssen haben einen Termin",correct: "Wir müssen einen Termin haben",  explanation: "Infinitif toujours à la fin" },
      ],
    },
    lesetext: {
      title: "Der Botschaftstermin — Le rendez-vous à l'ambassade",
      context: "Paul prépare son rendez-vous à l'ambassade allemande à Yaoundé.",
      text:
        "Paul möchte nach Deutschland reisen. Er braucht ein Visum.\n" +
        "Er muss zur deutschen Botschaft in Yaoundé gehen.\n" +
        "Beamter: Guten Tag! Kann ich Ihnen helfen?\n" +
        "Paul: Guten Tag. Ich möchte einen Termin für ein Visum beantragen.\n" +
        "Beamter: Können Sie Ihren Reisepass zeigen?\n" +
        "Paul: Ja, natürlich. Hier ist mein Reisepass.\n" +
        "Beamter: Und hier ist das Formular. Sie müssen es ausfüllen.\n" +
        "Paul: Kann ich ein Formular auf Französisch haben?\n" +
        "Beamter: Ja, wir haben auch französische Formulare.\n" +
        "Paul: Vielen Dank! Wann kann ich wiederkommen?\n" +
        "Beamter: Nächste Woche, am Dienstag um zehn Uhr.",
      translation:
        "Paul veut voyager en Allemagne. Il a besoin d'un visa.\n" +
        "Il doit aller à l'ambassade allemande à Yaoundé.\n" +
        "Agent : Bonjour ! Puis-je vous aider ?\n" +
        "Paul : Bonjour. Je voudrais déposer une demande de visa.\n" +
        "Agent : Pouvez-vous montrer votre passeport ?\n" +
        "Paul : Oui, bien sûr. Voici mon passeport.\n" +
        "Agent : Et voici le formulaire. Vous devez le remplir.\n" +
        "Paul : Puis-je avoir un formulaire en français ?\n" +
        "Agent : Oui, nous avons aussi des formulaires en français.\n" +
        "Paul : Merci beaucoup ! Quand puis-je revenir ?\n" +
        "Agent : La semaine prochaine, mardi à dix heures.",
    },
  },
}

const L5_HOEREN: BetaModule = {
  id: "a1-beta-5-hoeren",
  title: "Deutschland-Reise — Écoute",
  titleDE: "Beta 5 — Hören",
  type: "HOEREN",
  level: "A1",
  topic: "Démarches administratives et voyage",
  xpReward: 30,
  duration: 10,
  content: {
    dialogs: [
      {
        title: "Am Sprachzentrum — Au bureau d'inscription",
        context_fr: "Fatima s'inscrit à un test de compétence linguistique CEFR.",
        lines: [
          { sprecher: "Mitarbeiter", text: "Guten Tag! Wie kann ich Ihnen helfen?",          translation: "Bonjour ! Comment puis-je vous aider ?",              gender: "male",   pause_after_ms: 700 },
          { sprecher: "Fatima",      text: "Guten Tag. Ich möchte mich für den Sprachtest anmelden.", translation: "Bonjour. Je voudrais m'inscrire au test de langue.", gender: "female", pause_after_ms: 800 },
          { sprecher: "Mitarbeiter", text: "Welches Niveau? A1 oder A2?",                   translation: "Quel niveau ? A1 ou A2 ?",                            gender: "male",   pause_after_ms: 600 },
          { sprecher: "Fatima",      text: "Ich denke, A1. Ich lerne seit drei Monaten Deutsch.", translation: "Je pense A1. J'apprends l'allemand depuis trois mois.", gender: "female", pause_after_ms: 700 },
          { sprecher: "Mitarbeiter", text: "Kein Problem. Können Sie mir Ihren Reisepass zeigen?", translation: "Pas de problème. Pouvez-vous me montrer votre passeport ?", gender: "male" },
        ],
      },
    ],
  },
}

const L5_SPRECHEN: BetaModule = {
  id: "a1-beta-5-sprechen",
  title: "Deutschland-Reise — Expression orale",
  titleDE: "Beta 5 — Sprechen",
  type: "CONVERSATION",
  level: "A1",
  topic: "Demandes et démarches orales en allemand",
  xpReward: 50,
  duration: 20,
  content: {
    exercises: [
      {
        instruction: "Répétez ces phrases après le modèle audio :",
        phrases: [
          { de: "Ich möchte ein Visum beantragen.",      fr: "Je voudrais déposer une demande de visa." },
          { de: "Können Sie mir helfen, bitte?",         fr: "Pouvez-vous m'aider, s'il vous plaît ?" },
          { de: "Ich brauche einen Termin.",             fr: "J'ai besoin d'un rendez-vous." },
          { de: "Hier ist mein Reisepass.",              fr: "Voici mon passeport." },
          { de: "Wann kann ich wiederkommen?",           fr: "Quand puis-je revenir ?" },
        ],
      },
    ],
    freeTask: {
      instruction: "Simulez une demande de rendez-vous à l'ambassade en allemand.",
      prompt: "Saluez, expliquez votre besoin, demandez un rendez-vous et remerciez.",
      example: "Guten Tag! Ich möchte... Ich brauche... Können Sie...? Danke sehr!",
    },
  },
}

const L5_SCHREIBEN: BetaModule = {
  id: "a1-beta-5-schreiben",
  title: "Deutschland-Reise — Écriture",
  titleDE: "Beta 5 — Schreiben",
  type: "SCHREIBEN",
  level: "A1",
  topic: "Rédiger une demande formelle simple",
  xpReward: 45,
  duration: 20,
  content: {
    task: "Rédigez un message court pour demander un rendez-vous à un centre linguistique. Mentionnez votre nom, le type de rendez-vous souhaité et votre disponibilité.",
    taskDE: "Schreiben Sie eine kurze Nachricht, um einen Termin in einem Sprachzentrum zu beantragen. Nennen Sie Ihren Namen, den gewünschten Termin und Ihre Verfügbarkeit.",
    minWords: 30,
    maxWords: 75,
    example: "Sehr geehrte Damen und Herren, ich heiße Paul Nkengue und ich möchte einen Termin für den Deutschtest. Ich kann am Montag oder Dienstag kommen. Ich bin von neun bis zwölf Uhr frei. Vielen Dank! Mit freundlichen Grüßen, Paul Nkengue",
  },
}

const L5_QUIZ: BetaModule = {
  id: "a1-beta-5-quiz",
  title: "Deutschland-Reise — Quiz",
  titleDE: "Beta 5 — Quiz",
  type: "QUIZ",
  level: "A1",
  topic: "Ambassade, voyage et verbes modaux können/müssen/möchten — A1",
  xpReward: 100,
  duration: 12,
  content: {},
}

// ── Export ────────────────────────────────────────────────────────────────────

export const A1_BETA_MODULES: Record<string, BetaModule> = {
  // Lesson 1
  [L1_LESEN.id]:    L1_LESEN,
  [L1_HOEREN.id]:   L1_HOEREN,
  [L1_SPRECHEN.id]: L1_SPRECHEN,
  [L1_SCHREIBEN.id]:L1_SCHREIBEN,
  [L1_QUIZ.id]:     L1_QUIZ,
  // Lesson 2
  [L2_LESEN.id]:    L2_LESEN,
  [L2_HOEREN.id]:   L2_HOEREN,
  [L2_SPRECHEN.id]: L2_SPRECHEN,
  [L2_SCHREIBEN.id]:L2_SCHREIBEN,
  [L2_QUIZ.id]:     L2_QUIZ,
  // Lesson 3
  [L3_LESEN.id]:    L3_LESEN,
  [L3_HOEREN.id]:   L3_HOEREN,
  [L3_SPRECHEN.id]: L3_SPRECHEN,
  [L3_SCHREIBEN.id]:L3_SCHREIBEN,
  [L3_QUIZ.id]:     L3_QUIZ,
  // Lesson 4
  [L4_LESEN.id]:    L4_LESEN,
  [L4_HOEREN.id]:   L4_HOEREN,
  [L4_SPRECHEN.id]: L4_SPRECHEN,
  [L4_SCHREIBEN.id]:L4_SCHREIBEN,
  [L4_QUIZ.id]:     L4_QUIZ,
  // Lesson 5
  [L5_LESEN.id]:    L5_LESEN,
  [L5_HOEREN.id]:   L5_HOEREN,
  [L5_SPRECHEN.id]: L5_SPRECHEN,
  [L5_SCHREIBEN.id]:L5_SCHREIBEN,
  [L5_QUIZ.id]:     L5_QUIZ,
}

export const COURSE_TO_MODULE_IDS: Record<string, string[]> = {
  "a1-1":      ["lektion-1-lesen", "lektion-1-hoeren", "lektion-1-sprechen", "lektion-1-schreiben", "lektion-1-quiz"],
  "a1-beta-1": ["a1-beta-1-lesen", "a1-beta-1-hoeren", "a1-beta-1-sprechen", "a1-beta-1-schreiben", "a1-beta-1-quiz"],
  "a1-beta-2": ["a1-beta-2-lesen", "a1-beta-2-hoeren", "a1-beta-2-sprechen", "a1-beta-2-schreiben", "a1-beta-2-quiz"],
  "a1-beta-3": ["a1-beta-3-lesen", "a1-beta-3-hoeren", "a1-beta-3-sprechen", "a1-beta-3-schreiben", "a1-beta-3-quiz"],
  "a1-beta-4": ["a1-beta-4-lesen", "a1-beta-4-hoeren", "a1-beta-4-sprechen", "a1-beta-4-schreiben", "a1-beta-4-quiz"],
  "a1-beta-5": ["a1-beta-5-lesen", "a1-beta-5-hoeren", "a1-beta-5-sprechen", "a1-beta-5-schreiben", "a1-beta-5-quiz"],
}

export const COURSE_LABELS: Record<string, string> = {
  "a1-1":      "Lektion 1 — Guten Tag!",
  "a1-beta-1": "Beta 1 — Willkommen!",
  "a1-beta-2": "Beta 2 — Meine Familie",
  "a1-beta-3": "Beta 3 — Mein Alltag",
  "a1-beta-4": "Beta 4 — Einkaufen & Essen",
  "a1-beta-5": "Beta 5 — Deutschland-Reise",
}
