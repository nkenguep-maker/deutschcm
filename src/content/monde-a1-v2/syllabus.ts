export type A1SyllabusOrigin = "LEGACY_EDITORIAL_REFONTE" | "NEW_RECONSTRUCTION";

export type A1SyllabusLesson = {
  order: 1 | 2 | 3 | 4 | 5;
  phase: "Comprends" | "Pratique" | "Produis" | "Valide";
  title: string;
};

export type A1SyllabusUnit = {
  id: string;
  order: number;
  title: string;
  origin: A1SyllabusOrigin;
  guidedMinutesTarget: number;
  lexicalItemsTarget: number;
  exerciseFloor: number;
  canDo: string;
  lessons: A1SyllabusLesson[];
};

const unit = (
  order: number,
  title: string,
  origin: A1SyllabusOrigin,
  lexicalItemsTarget: number,
  canDo: string,
  lessons: A1SyllabusLesson[],
): A1SyllabusUnit => ({
  id: `de-a1-u${order}`,
  order,
  title,
  origin,
  guidedMinutesTarget: 180,
  lexicalItemsTarget,
  exerciseFloor: 15,
  canDo,
  lessons,
});

export const A1_V2_SYLLABUS: A1SyllabusUnit[] = [
  unit(1, "Saluer et se présenter", "LEGACY_EDITORIAL_REFONTE", 40,
    "Je peux comprendre et mener une première rencontre très simple.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre une première rencontre" },
      { order: 2, phase: "Pratique", title: "Dire qui tu es" },
      { order: 3, phase: "Pratique", title: "Poser les bonnes questions" },
      { order: 4, phase: "Produis", title: "Saluer, prononcer et enchaîner" },
      { order: 5, phase: "Valide", title: "Mission finale : première rencontre" },
    ]),
  unit(2, "Parler de sa famille", "LEGACY_EDITORIAL_REFONTE", 40,
    "Je peux présenter des proches et donner quelques informations simples sur eux.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre un portrait de famille" },
      { order: 2, phase: "Pratique", title: "Nommer les proches" },
      { order: 3, phase: "Pratique", title: "Dire ce qu’on a et à qui cela appartient" },
      { order: 4, phase: "Produis", title: "Décrire une personne simplement" },
      { order: 5, phase: "Valide", title: "Mission finale : présenter sa famille" },
    ]),
  unit(3, "Commander au café", "LEGACY_EDITORIAL_REFONTE", 40,
    "Je peux commander, préciser une quantité simple et demander l’addition.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre une commande" },
      { order: 2, phase: "Pratique", title: "Nommer boissons, plats et quantités" },
      { order: 3, phase: "Pratique", title: "Commander poliment" },
      { order: 4, phase: "Produis", title: "Demander le prix et payer" },
      { order: 5, phase: "Valide", title: "Mission finale : commander et payer" },
    ]),
  unit(4, "Décrire sa journée", "LEGACY_EDITORIAL_REFONTE", 42,
    "Je peux dire l’heure et raconter une routine quotidienne simple.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre une journée typique" },
      { order: 2, phase: "Pratique", title: "Nommer les actions du quotidien" },
      { order: 3, phase: "Pratique", title: "Utiliser les verbes séparables" },
      { order: 4, phase: "Produis", title: "Dire l’heure et organiser sa journée" },
      { order: 5, phase: "Valide", title: "Mission finale : ma journée" },
    ]),
  unit(5, "Se déplacer en ville", "LEGACY_EDITORIAL_REFONTE", 42,
    "Je peux demander et comprendre un chemin simple et acheter un billet.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre des indications" },
      { order: 2, phase: "Pratique", title: "Repérer les lieux et directions" },
      { order: 3, phase: "Pratique", title: "Demander son chemin" },
      { order: 4, phase: "Produis", title: "Utiliser un transport simple" },
      { order: 5, phase: "Valide", title: "Mission finale : trouver sa destination" },
    ]),
  unit(6, "Faire des achats et organiser une sortie", "LEGACY_EDITORIAL_REFONTE", 42,
    "Je peux acheter un article simple et convenir d’un lieu et d’une heure.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre un achat" },
      { order: 2, phase: "Pratique", title: "Couleurs, tailles et prix" },
      { order: 3, phase: "Pratique", title: "Demander et essayer un article" },
      { order: 4, phase: "Produis", title: "Proposer une sortie" },
      { order: 5, phase: "Valide", title: "Mission finale : achat et rendez-vous" },
    ]),
  unit(7, "Habiter et décrire son logement", "NEW_RECONSTRUCTION", 42,
    "Je peux décrire un logement et dire où se trouvent les objets essentiels.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre une annonce simple" },
      { order: 2, phase: "Pratique", title: "Pièces, meubles et objets essentiels" },
      { order: 3, phase: "Pratique", title: "Dire ce qu’il y a et où c’est" },
      { order: 4, phase: "Produis", title: "Décrire son logement" },
      { order: 5, phase: "Valide", title: "Mission finale : visiter un logement" },
    ]),
  unit(8, "Travail, études et compétences", "NEW_RECONSTRUCTION", 42,
    "Je peux parler très simplement de mon activité, de mes horaires et de ce que je sais faire.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre une présentation professionnelle" },
      { order: 2, phase: "Pratique", title: "Métiers, études et lieux de travail" },
      { order: 3, phase: "Pratique", title: "Parler d’horaires et de tâches" },
      { order: 4, phase: "Produis", title: "Dire ce que je peux faire" },
      { order: 5, phase: "Valide", title: "Mission finale : me présenter au travail" },
    ]),
  unit(9, "Santé et rendez-vous", "NEW_RECONSTRUCTION", 42,
    "Je peux décrire un problème courant et fixer un rendez-vous simple.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre un problème de santé simple" },
      { order: 2, phase: "Pratique", title: "Corps et symptômes courants" },
      { order: 3, phase: "Pratique", title: "Dire ce qui fait mal et ce dont j’ai besoin" },
      { order: 4, phase: "Produis", title: "Prendre un rendez-vous" },
      { order: 5, phase: "Valide", title: "Mission finale : pharmacie ou cabinet" },
    ]),
  unit(10, "Services et démarches du quotidien", "NEW_RECONSTRUCTION", 40,
    "Je peux demander une information ou une aide simple dans un service.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre une consigne de service" },
      { order: 2, phase: "Pratique", title: "Dates, numéros et informations personnelles" },
      { order: 3, phase: "Pratique", title: "Demander de répéter ou d’expliquer" },
      { order: 4, phase: "Produis", title: "Remplir et confirmer des informations simples" },
      { order: 5, phase: "Valide", title: "Mission finale : demander de l’aide" },
    ]),
  unit(11, "Voyager, météo et projets proches", "NEW_RECONSTRUCTION", 40,
    "Je peux comprendre des informations de voyage simples et parler d’un projet proche.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre une information de voyage" },
      { order: 2, phase: "Pratique", title: "Météo, jours et dates" },
      { order: 3, phase: "Pratique", title: "Dire où et quand je vais" },
      { order: 4, phase: "Produis", title: "Préparer un petit déplacement" },
      { order: 5, phase: "Valide", title: "Mission finale : organiser un voyage court" },
    ]),
  unit(12, "Consolider son autonomie A1", "NEW_RECONSTRUCTION", 38,
    "Je peux combiner les fonctions essentielles du niveau dans plusieurs situations quotidiennes.",
    [
      { order: 1, phase: "Comprends", title: "Comprendre plusieurs situations A1" },
      { order: 2, phase: "Pratique", title: "Réparer les erreurs les plus fréquentes" },
      { order: 3, phase: "Pratique", title: "Réactiver le lexique du niveau" },
      { order: 4, phase: "Produis", title: "Enchaîner deux situations réelles" },
      { order: 5, phase: "Valide", title: "Bilan A1 avant examens blancs" },
    ]),
];

export const A1_V2_SYLLABUS_TOTALS = {
  units: A1_V2_SYLLABUS.length,
  lessons: A1_V2_SYLLABUS.reduce((sum, item) => sum + item.lessons.length, 0),
  guidedMinutes: A1_V2_SYLLABUS.reduce((sum, item) => sum + item.guidedMinutesTarget, 0),
  lexicalItems: A1_V2_SYLLABUS.reduce((sum, item) => sum + item.lexicalItemsTarget, 0),
  exerciseFloor: A1_V2_SYLLABUS.reduce((sum, item) => sum + item.exerciseFloor, 0),
} as const;
