import type { InternalPersonaId } from "@/lib/internalPersona";
import type { StatusTone, YemaUniverse } from "@/features/dashboards/shared";

export type LocalizedCopy = { fr: string; en: string };
export type InternalPersonaSectionKind = "hero" | "metrics" | "list" | "timeline" | "chat" | "status";

export type InternalPersonaMetric = {
  label: LocalizedCopy;
  value: string;
  hint?: LocalizedCopy;
};

export type InternalPersonaRow = {
  title: LocalizedCopy;
  meta?: LocalizedCopy;
  chip?: LocalizedCopy;
  tone?: StatusTone;
};

export type InternalPersonaSection = {
  id: string;
  title: LocalizedCopy;
  description?: LocalizedCopy;
  kind: InternalPersonaSectionKind;
  eyebrow?: LocalizedCopy;
  progress?: number;
  cta?: LocalizedCopy;
  metrics?: InternalPersonaMetric[];
  rows?: InternalPersonaRow[];
};

export type InternalPersonaUiContract = {
  id: InternalPersonaId;
  title: LocalizedCopy;
  subtitle: LocalizedCopy;
  route: string;
  universe: YemaUniverse;
  tabs: Array<{ id: string; label: LocalizedCopy; badge?: number }>;
  sections: InternalPersonaSection[];
};

const c = (fr: string, en: string): LocalizedCopy => ({ fr, en });
const row = (fr: string, en: string, metaFr?: string, metaEn?: string, chipFr?: string, chipEn?: string, tone: StatusTone = "neutral"): InternalPersonaRow => ({
  title: c(fr, en),
  meta: metaFr && metaEn ? c(metaFr, metaEn) : undefined,
  chip: chipFr && chipEn ? c(chipFr, chipEn) : undefined,
  tone,
});

export const INTERNAL_PERSONA_UI_CONTRACTS: Record<InternalPersonaId, InternalPersonaUiContract> = {
  student_monde: {
    id: "student_monde",
    title: c("Awa Diop", "Awa Diop"),
    subtitle: c("Élève Monde · Allemand A1 · Étudier à Berlin", "World learner · German A1 · Study in Berlin"),
    route: "/dashboard",
    universe: "neutral",
    tabs: [
      { id: "accueil", label: c("Accueil", "Home") },
      { id: "mon-cours", label: c("Cours", "Course") },
      { id: "mes-devoirs", label: c("Devoirs", "Assignments"), badge: 2 },
      { id: "mon-parcours", label: c("Parcours", "Journey") },
      { id: "messages", label: c("Messages", "Messages"), badge: 1 },
    ],
    sections: [
      { id: "accueil", kind: "hero", eyebrow: c("UNIT 04 · LEÇON 3/6", "UNIT 04 · LESSON 3/6"), title: c("Présenter votre parcours et parler de vos projets", "Introduce your background and discuss your plans"), description: c("Votre prochaine étape en allemand A1.", "Your next step in German A1."), progress: 62, cta: c("Reprendre la leçon", "Resume lesson") },
      { id: "objectif", kind: "status", title: c("Parcours actif", "Active journey"), description: c("Étudier à Berlin · priorité écrit formel et vocabulaire académique", "Study in Berlin · formal writing and academic vocabulary priority"), rows: [row("Prochain jalon", "Next milestone", "Examen A1 · dans 34 jours", "A1 exam · in 34 days", "EN COURS", "ACTIVE", "gold")] },
      { id: "progression", kind: "metrics", title: c("Progression", "Progress"), metrics: [{ label: c("Niveau A1", "A1 level"), value: "38 %", hint: c("12 leçons terminées", "12 lessons completed") }, { label: c("Série", "Streak"), value: "4 jours", hint: c("Cette semaine", "This week") }, { label: c("Minutes", "Minutes"), value: "86", hint: c("7 derniers jours", "Last 7 days") }] },
      { id: "mes-devoirs", kind: "list", title: c("Mes devoirs", "My assignments"), rows: [row("Présenter mon projet d’études", "Present my study plan", "U4 · Claire · échéance jeudi", "U4 · Claire · due Thursday", "À rendre", "Due", "gold"), row("Courriel à l’université", "Email to the university", "Brouillon sauvegardé · v1", "Draft saved · v1", "Brouillon", "Draft", "muted"), row("Se présenter à l’oral", "Introduce yourself orally", "Feedback de Claire disponible", "Claire's feedback available", "Feedback reçu", "Feedback", "success")] },
      { id: "mon-cours", kind: "timeline", title: c("Mon cours", "My course"), description: c("Unité 4 · Sich vorstellen", "Unit 4 · Sich vorstellen"), rows: [row("L1 · Saluer", "L1 · Greet", "Terminé", "Completed", "✓", "✓", "success"), row("L2 · Se présenter", "L2 · Introduce yourself", "Terminé", "Completed", "✓", "✓", "success"), row("L3 · Parler de ses projets", "L3 · Discuss plans", "62 %", "62%", "En cours", "Active", "gold"), row("L4 · Poser des questions", "L4 · Ask questions", "S’ouvre après L3", "Opens after L3", "Verrouillé", "Locked", "muted")] },
      { id: "mon-parcours", kind: "timeline", title: c("Mon parcours A1 → C2", "My A1 → C2 journey"), rows: [row("A1 · Se présenter", "A1 · Introduce yourself", "Niveau actuel", "Current level", "38 %", "38%", "gold"), row("A2 · S’exprimer", "A2 · Express yourself", "À venir", "Upcoming", "A2", "A2", "muted"), row("B1 · Argumenter", "B1 · Make a case", "À venir", "Upcoming", "B1", "B1", "muted"), row("B2 · Nuancer", "B2 · Add nuance", "À venir", "Upcoming", "B2", "B2", "muted"), row("C1 · Débattre", "C1 · Debate", "À venir", "Upcoming", "C1", "C1", "muted"), row("C2 · Transmettre", "C2 · Convey", "À venir", "Upcoming", "C2", "C2", "muted")] },
      { id: "ma-classe", kind: "list", title: c("Ma classe internationale", "My international class"), description: c("Allemand A1 · prochain rendez-vous mardi 18 h CET", "German A1 · next meeting Tuesday 6 pm CET"), rows: [row("Sofia Martinez", "Sofia Martinez", "A1 · Voyage · UTC−5", "A1 · Travel · UTC−5", "46 %", "46%", "neutral"), row("Minh Tran", "Minh Tran", "A1 · Travail · UTC+7", "A1 · Work · UTC+7", "41 %", "41%", "neutral"), row("Omar Haddad", "Omar Haddad", "A1 · Vie quotidienne · UTC+3", "A1 · Daily life · UTC+3", "35 %", "35%", "neutral")] },
      { id: "messages", kind: "chat", title: c("Messages", "Messages"), rows: [row("Claire Mercier · 09:12", "Claire Mercier · 09:12", "J’ai laissé un retour audio sur votre présentation.", "I left audio feedback on your presentation.", "0:38 audio", "0:38 audio", "gold"), row("Vous · 09:20", "You · 09:20", "Merci, je reprends le devoir ce soir.", "Thanks, I’ll revise the assignment tonight.")] },
    ],
  },
  student_racines: {
    id: "student_racines",
    title: c("Mor Kane", "Mor Kane"),
    subtitle: c("Élève Racines · Wolof · Étape É2", "Roots learner · Wolof · Stage E2"),
    route: "/dashboard",
    universe: "racines",
    tabs: [{ id: "accueil", label: c("Accueil", "Home") }, { id: "mes-etapes", label: c("Étapes", "Stages") }, { id: "ecoutes", label: c("Écoutes", "Listening") }, { id: "mon-coach", label: c("Coach", "Coach"), badge: 1 }, { id: "cercle", label: c("Palabre", "Circle") }],
    sections: [
      { id: "accueil", kind: "hero", eyebrow: c("ORAL · ÉTAPE 2/5", "ORAL · STAGE 2/5"), title: c("Présenter sa famille en wolof", "Introduce your family in Wolof"), description: c("D’abord écouter, ensuite répéter, puis raconter.", "Listen first, then repeat, then tell."), progress: 45, cta: c("Écouter et répéter", "Listen and repeat") },
      { id: "mot-du-jour", kind: "status", title: c("Mot du jour", "Word of the day"), rows: [row("Njaboot", "Njaboot", "[nja-boot] · la famille", "[nja-boot] · family", "+5 XP en famille", "+5 XP with family", "gold")] },
      { id: "mes-etapes", kind: "timeline", title: c("Mes étapes", "My stages"), rows: [row("É1 · Écoute", "E1 · Listening", "Je peux reconnaître des salutations.", "I can recognise greetings.", "Validée", "Completed", "success"), row("É2 · Famille", "E2 · Family", "Je peux nommer trois proches.", "I can name three relatives.", "En cours", "Active", "gold"), row("É3 · Récit", "E3 · Story", "Je peux raconter une scène courte.", "I can tell a short scene.", "À venir", "Upcoming", "muted"), row("É4 · Palabre", "E4 · Circle", "Je peux prendre la parole dans le cercle.", "I can speak in the circle.", "À venir", "Upcoming", "muted"), row("É5 · Foyer", "E5 · Home", "Je peux transmettre un rituel familial.", "I can pass on a family ritual.", "À venir", "Upcoming", "muted")] },
      { id: "ecoutes", kind: "list", title: c("Écoutes", "Listening"), rows: [row("Séquence É2 · Njaboot", "E2 sequence · Njaboot", "À réécouter · 4 min", "Listen again · 4 min", "+10 XP", "+10 XP", "gold"), row("Salutations", "Greetings", "Maîtrisées · 3 écoutes", "Mastered · 3 listens", "Validé", "Completed", "success"), row("Thème 3 · La maison", "Theme 3 · The home", "Découverte · 6 min", "Discovery · 6 min", "Nouveau", "New", "neutral"), row("Mon enregistrement", "My recording", "Envoyé au coach · 0:42", "Sent to coach · 0:42", "Audio", "Audio", "neutral")] },
      { id: "mon-coach", kind: "list", title: c("Mon coach", "My coach"), rows: [row("Fatou Ndiaye", "Fatou Ndiaye", "Jeudi · 18 h · Présenter sa famille", "Thursday · 6 pm · Introduce your family", "Rejoindre", "Join", "gold"), row("Message non lu", "Unread message", "« Réécoute la deuxième phrase avant jeudi. »", "“Listen to the second sentence again before Thursday.”", "1", "1", "alert"), row("Historique", "History", "4 séances · 92 % d’assiduité", "4 sessions · 92% attendance", "Voir", "View", "neutral")] },
      { id: "cercle", kind: "chat", title: c("Cercle de palabre", "Conversation circle"), rows: [row("Fatou · 18:04", "Fatou · 18:04", "Qui veut raconter un souvenir de famille ?", "Who wants to share a family memory?"), row("Mor · 18:07", "Mor · 18:07", "Message vocal envoyé.", "Voice message sent.", "+20 XP", "+20 XP", "gold"), row("Groupe Wolof É2", "Wolof E2 group", "6 personnes · prochain cercle samedi", "6 people · next circle Saturday", "Enregistrer ma voix", "Record my voice", "gold")] },
      { id: "messages", kind: "chat", title: c("Messages", "Messages"), rows: [row("Fatou · 10:30", "Fatou · 10:30", "Ton rythme est bon. Continue avec des écoutes courtes.", "Your pace is good. Keep listening in short sessions.")] },
    ],
  },
  teacher: {
    id: "teacher",
    title: c("Claire Mercier", "Claire Mercier"),
    subtitle: c("Enseignante vérifiée · Centre YEMA Berlin", "Verified teacher · YEMA Berlin Centre"),
    route: "/teacher",
    universe: "neutral",
    tabs: [{ id: "accueil", label: c("Accueil", "Home") }, { id: "classes", label: c("Classes", "Classes") }, { id: "corrections", label: c("Corrections", "Corrections"), badge: 12 }, { id: "devoirs", label: c("Devoirs", "Assignments") }, { id: "messages", label: c("Messages", "Messages"), badge: 3 }],
    sections: [
      { id: "accueil", kind: "metrics", title: c("Tableau de bord", "Dashboard"), metrics: [{ label: c("À corriger", "To review"), value: "12", hint: c("4 urgents", "4 urgent") }, { label: c("Devoirs", "Assignments"), value: "8", hint: c("3 publiés", "3 published") }, { label: c("Classes", "Classes"), value: "3", hint: c("47 élèves", "47 learners") }, { label: c("Taux", "Rate"), value: "87 %", hint: c("Complétion moyenne", "Average completion") }] },
      { id: "corrections", kind: "list", title: c("File de correction", "Review queue"), rows: [row("Awa Diop · Présenter mon projet", "Awa Diop · Present my project", "v2 · Études · examen dans 34 jours · écrit formel", "v2 · Studies · exam in 34 days · formal writing", "Corriger", "Review", "gold"), row("Minh Tran · Entretien professionnel", "Minh Tran · Professional interview", "v1 · Travail · priorité oral", "v1 · Work · speaking priority", "Corriger", "Review", "gold"), row("Omar Haddad · Vie quotidienne", "Omar Haddad · Daily life", "v3 · oral + écrit court", "v3 · speaking + short writing", "Feedback prêt", "Feedback ready", "success")] },
      { id: "classes", kind: "list", title: c("Mes classes", "My classes"), rows: [row("Allemand A1 · Études & mobilité", "German A1 · Studies & mobility", "U4 · 18 élèves · 62 %", "U4 · 18 learners · 62%", "2 alertes", "2 alerts", "alert"), row("Français B1 · Vie professionnelle", "French B1 · Professional life", "U7 · 14 élèves · 71 %", "U7 · 14 learners · 71%", "Stable", "Stable", "success"), row("Anglais A2 · Voyage & quotidien", "English A2 · Travel & daily life", "U3 · 15 élèves · 58 %", "U3 · 15 learners · 58%", "1 alerte", "1 alert", "alert")] },
      { id: "devoirs", kind: "list", title: c("Devoirs", "Assignments"), rows: [row("Courriel à l’université", "Email to the university", "Brouillon · 0 rendu", "Draft · 0 submissions", "Brouillon", "Draft", "muted"), row("Présentation orale", "Oral presentation", "Publié · 12/18 rendus", "Published · 12/18 submissions", "Publié", "Published", "gold"), row("Bilan unité 3", "Unit 3 review", "Clos · 15/15 rendus", "Closed · 15/15 submissions", "Clos", "Closed", "success")] },
      { id: "ressources", kind: "list", title: c("Ressources", "Resources"), rows: [row("Modèle audio · présentation A1", "Audio model · A1 introduction", "2:14 · utilisable en classe", "2:14 · ready for class", "Audio", "Audio", "neutral"), row("Grille de feedback écrit", "Written feedback rubric", "CECRL A1 · version 3", "CEFR A1 · version 3", "PDF", "PDF", "neutral")] },
      { id: "messages", kind: "chat", title: c("Messages de classe", "Class messages"), rows: [row("Groupe A1 G2 · Claire", "A1 G2 group · Claire", "Rappel : apportez votre version audio mardi.", "Reminder: bring your audio version Tuesday.", "3 non lus", "3 unread", "gold"), row("Audio modèle", "Audio model", "Guten Tag, ich heiße…", "Guten Tag, ich heiße…", "0:31", "0:31", "neutral")] },
    ],
  },
  coach: {
    id: "coach",
    title: c("Fatou Ndiaye", "Fatou Ndiaye"),
    subtitle: c("Coach Racines · Wolof · 4 cercles actifs", "Roots coach · Wolof · 4 active circles"),
    route: "/coach/racines",
    universe: "racines",
    tabs: [{ id: "accueil", label: c("Accueil", "Home") }, { id: "apprenants", label: c("Apprenants", "Learners") }, { id: "seances", label: c("Séances", "Sessions"), badge: 3 }, { id: "messages", label: c("Messages", "Messages"), badge: 2 }, { id: "notes", label: c("Notes", "Notes") }],
    sections: [
      { id: "accueil", kind: "metrics", title: c("Aujourd’hui", "Today"), metrics: [{ label: c("Séances", "Sessions"), value: "3", hint: c("Aujourd’hui", "Today") }, { label: c("Cercles", "Circles"), value: "4/6", hint: c("Capacité active", "Active capacity") }, { label: c("Apprenants", "Learners"), value: "18/24", hint: c("Suivis actifs", "Active learners") }, { label: c("Notes", "Notes"), value: "3", hint: c("À rédiger", "To draft") }] },
      { id: "seances-du-jour", kind: "list", title: c("Séances du jour", "Today's sessions"), rows: [row("09:00 · Aïcha", "09:00 · Aïcha", "É1 · salutations et rythme", "E1 · greetings and rhythm", "Terminée", "Done", "success"), row("15:30 · Mor", "15:30 · Mor", "É2 · présenter sa famille", "E2 · introduce family", "À venir", "Upcoming", "gold"), row("18:00 · Cercle Njaboot", "18:00 · Njaboot circle", "6 participants · prise de parole", "6 participants · speaking practice", "Groupe", "Group", "neutral")] },
      { id: "apprenants", kind: "list", title: c("Mes apprenants", "My learners"), rows: [row("Mor Kane", "Mor Kane", "É2 · focus famille · prochaine séance jeudi · 92 %", "E2 · family focus · next Thursday · 92%", "Actif", "Active", "success"), row("Aïcha Sow", "Aïcha Sow", "É1 · salutations · prochaine séance lundi · 84 %", "E1 · greetings · next Monday · 84%", "Actif", "Active", "success"), row("Lina Diop", "Lina Diop", "É3 · récit · une absence", "E3 · story · one absence", "À suivre", "Watch", "alert")] },
      { id: "seances", kind: "timeline", title: c("Semaine", "Week"), rows: [row("Lundi", "Monday", "2 séances", "2 sessions", "Fait", "Done", "success"), row("Mardi", "Tuesday", "1 séance", "1 session", "Aujourd’hui", "Today", "gold"), row("Jeudi", "Thursday", "2 séances", "2 sessions", "À venir", "Upcoming", "muted"), row("Samedi", "Saturday", "1 cercle", "1 circle", "À venir", "Upcoming", "muted")] },
      { id: "messages", kind: "chat", title: c("Messages", "Messages"), rows: [row("Mor · 10:42", "Mor · 10:42", "Message vocal · exercice Njaboot", "Voice message · Njaboot exercise", "0:44", "0:44", "gold"), row("Fatou · 10:48", "Fatou · 10:48", "Très bien. Répète la deuxième phrase plus lentement.", "Very good. Repeat the second sentence more slowly.")] },
      { id: "notes", kind: "list", title: c("Notes de séance", "Session notes"), rows: [row("Mor · 31 juillet", "Mor · 31 July", "Prononciation familiale · note à rédiger", "Family pronunciation · note to draft", "À rédiger", "To draft", "alert"), row("Aïcha · 30 juillet", "Aïcha · 30 July", "Salutations · note publiée", "Greetings · note published", "Publiée", "Published", "success"), row("Cercle Njaboot · 29 juillet", "Njaboot circle · 29 July", "Participation collective · note publiée", "Group participation · note published", "Publiée", "Published", "success")] },
    ],
  },
  center_admin: {
    id: "center_admin",
    title: c("Ibrahima Sow", "Ibrahima Sow"),
    subtitle: c("Administrateur · Centre YEMA Dakar · vérifié", "Administrator · YEMA Dakar Centre · verified"),
    route: "/center",
    universe: "neutral",
    tabs: [{ id: "centre", label: c("Centre", "Centre") }, { id: "eleves", label: c("Élèves", "Learners") }, { id: "classes", label: c("Classes", "Classes") }, { id: "facturation", label: c("Facturation", "Billing") }, { id: "messages", label: c("Messages", "Messages"), badge: 2 }],
    sections: [
      { id: "centre", kind: "metrics", title: c("Vue du centre", "Centre overview"), metrics: [{ label: c("Élèves", "Learners"), value: "214", hint: c("198 actifs", "198 active") }, { label: c("Enseignants", "Teachers"), value: "12", hint: c("11 vérifiés", "11 verified") }, { label: c("Classes", "Classes"), value: "18", hint: c("15 actives", "15 active") }, { label: c("Présence", "Attendance"), value: "91 %", hint: c("Cette semaine", "This week") }] },
      { id: "a-traiter", kind: "list", title: c("À traiter", "To do"), rows: [row("3 inscriptions en attente", "3 pending enrolments", "Allemand A1 · vérifier les dossiers", "German A1 · review applications", "Priorité", "Priority", "alert"), row("1 enseignant à valider", "1 teacher to verify", "Documents reçus hier", "Documents received yesterday", "Vérifier", "Review", "gold"), row("5 rappels de paiement", "5 payment reminders", "Échéance dépassée de 3 jours", "3 days overdue", "Relancer", "Remind", "alert")] },
      { id: "eleves", kind: "list", title: c("Élèves", "Learners"), rows: [row("Awa Diop", "Awa Diop", "Allemand A1 · 96 % présence", "German A1 · 96% attendance", "Actif", "Active", "success"), row("Minh Tran", "Minh Tran", "Français B1 · 88 % présence", "French B1 · 88% attendance", "Actif", "Active", "success"), row("Omar Haddad", "Omar Haddad", "Anglais A2 · 72 % présence", "English A2 · 72% attendance", "À suivre", "Watch", "alert")] },
      { id: "enseignants", kind: "list", title: c("Enseignants", "Teachers"), rows: [row("Claire Mercier", "Claire Mercier", "Allemand · 3 classes · vérifiée", "German · 3 classes · verified", "Vérifiée", "Verified", "success"), row("Fatou Ndiaye", "Fatou Ndiaye", "Wolof · 4 cercles · vérifiée", "Wolof · 4 circles · verified", "Vérifiée", "Verified", "success"), row("Daniel Kim", "Daniel Kim", "Anglais · documents à contrôler", "English · documents to review", "En attente", "Pending", "alert")] },
      { id: "classes", kind: "list", title: c("Classes", "Classes"), rows: [row("Allemand A1 · G2", "German A1 · G2", "18/20 places · 62 % progression", "18/20 seats · 62% progress", "90 %", "90%", "success"), row("Français B1 · Pro", "French B1 · Pro", "14/18 places · 71 % progression", "14/18 seats · 71% progress", "78 %", "78%", "neutral"), row("Wolof É2 · Njaboot", "Wolof E2 · Njaboot", "6/8 places · 45 % progression orale", "6/8 seats · 45% oral progress", "75 %", "75%", "neutral")] },
      { id: "facturation", kind: "metrics", title: c("Facturation", "Billing"), metrics: [{ label: c("Encaissé", "Collected"), value: "3,4 M", hint: c("FCFA ce mois", "XAF this month") }, { label: c("À recevoir", "Receivable"), value: "620 k", hint: c("FCFA", "XAF") }, { label: c("Factures", "Invoices"), value: "186", hint: c("174 payées", "174 paid") }, { label: c("Retards", "Overdue"), value: "5", hint: c("Rappels à envoyer", "Reminders to send") }] },
      { id: "factures", kind: "list", title: c("Factures récentes", "Recent invoices"), rows: [row("INV-2026-0804 · Awa Diop", "INV-2026-0804 · Awa Diop", "49 000 FCFA · Passage A1", "XAF 49,000 · A1 Passage", "Payée", "Paid", "success"), row("INV-2026-0798 · Minh Tran", "INV-2026-0798 · Minh Tran", "58 000 FCFA · Passage B1", "XAF 58,000 · B1 Passage", "En attente", "Pending", "gold") ] },
      { id: "messages", kind: "chat", title: c("Messages", "Messages"), rows: [row("Interne · Claire", "Internal · Claire", "La classe A1 G2 est presque complète.", "The A1 G2 class is nearly full.", "1 non lu", "1 unread", "gold"), row("Paiement · système", "Billing · system", "5 rappels sont prêts à être envoyés.", "5 reminders are ready to send.", "1 non lu", "1 unread", "alert")] },
      { id: "parametres", kind: "status", title: c("Paramètres", "Settings"), rows: [row("Centre vérifié", "Verified centre", "Code YEMA-DAKAR · plan Pro", "YEMA-DAKAR code · Pro plan", "Actif", "Active", "success")] },
    ],
  },
  super_admin: {
    id: "super_admin",
    title: c("Super Admin", "Super Admin"),
    subtitle: c("Console YEMA · Preview P-1 · QA mode actif", "YEMA console · P-1 Preview · QA mode active"),
    route: "/admin",
    universe: "neutral",
    tabs: [{ id: "console", label: c("Console", "Console") }, { id: "comptes", label: c("Comptes", "Accounts") }, { id: "audit", label: c("Audit", "Audit") }, { id: "environnement", label: c("Env.", "Env.") }],
    sections: [
      { id: "console", kind: "status", title: c("Console", "Console"), rows: [row("Production intacte", "Production intact", "Les données de démonstration sont isolées du produit réel.", "Demo data is isolated from the real product.", "OK", "OK", "success"), row("Mode QA", "QA mode", "Session propriétaire · 120 minutes max", "Owner session · max 120 minutes", "Actif", "Active", "gold"), row("Déploiement", "Deployment", "Vercel Preview · build READY", "Vercel Preview · build READY", "READY", "READY", "success")] },
      { id: "comptes", kind: "list", title: c("Tester comme…", "Test as…"), description: c("Les neuf personas sont fonctionnels et disposent d’un contenu de démonstration complet.", "All nine personas are functional and contain complete demo content."), rows: [row("Super Admin", "Super Admin", "/admin · ADMIN · YEMA_ADMIN", "/admin · ADMIN · YEMA_ADMIN", "Tester", "Test", "gold"), row("Administrateur centre", "Centre administrator", "/center · CENTER_ADMIN", "/center · CENTER_ADMIN", "Tester", "Test", "gold"), row("Enseignante", "Teacher", "/teacher · TEACHER", "/teacher · TEACHER", "Tester", "Test", "gold"), row("Coach Racines", "Roots coach", "/coach/racines · RACINES_COACH", "/coach/racines · RACINES_COACH", "Tester", "Test", "gold"), row("Élève Monde", "World learner", "/dashboard · MONDE", "/dashboard · MONDE", "Tester", "Test", "gold"), row("Élève Racines", "Roots learner", "/dashboard · RACINES", "/dashboard · RACINES", "Tester", "Test", "gold"), row("Famille", "Family", "/family · PARENT", "/family · PARENT", "Tester", "Test", "gold"), row("Enfant Monde", "World child", "/dashboard · child session", "/dashboard · child session", "Tester", "Test", "gold"), row("Enfant Racines", "Roots child", "/dashboard · child session", "/dashboard · child session", "Tester", "Test", "gold")] },
      { id: "audit", kind: "list", title: c("Audit récent", "Recent audit"), rows: [row("QA_IMPERSONATION_STARTED", "QA_IMPERSONATION_STARTED", "owner · student_monde", "owner · student_monde", "Aujourd’hui", "Today", "neutral"), row("FEEDBACK_PUBLISHED", "FEEDBACK_PUBLISHED", "teacher · submission v2", "teacher · submission v2", "09:12", "09:12", "success"), row("ASSIGNMENT_PUBLISHED", "ASSIGNMENT_PUBLISHED", "teacher · Présentation orale", "teacher · Oral presentation", "Hier", "Yesterday", "gold"), row("SUBMISSION_SUBMITTED", "SUBMISSION_SUBMITTED", "student · v2", "student · v2", "Hier", "Yesterday", "neutral")] },
      { id: "environnement", kind: "metrics", title: c("Environnement", "Environment"), metrics: [{ label: c("Vercel", "Vercel"), value: "Preview", hint: c("P-1", "P-1") }, { label: c("Supabase", "Supabase"), value: "P-1", hint: c("Projet isolé", "Isolated project") }, { label: c("QA mode", "QA mode"), value: "ON", hint: c("YEMA_QA_MODE_ENABLED", "YEMA_QA_MODE_ENABLED") }, { label: c("Session", "Session"), value: "120 min", hint: c("Durée maximale", "Maximum duration") }] },
    ],
  },
  family: {
    id: "family",
    title: c("Famille Diop", "Diop family"),
    subtitle: c("Foyer actif · 2 enfants · Monde et Racines", "Active household · 2 children · World and Roots"),
    route: "/family",
    universe: "neutral",
    tabs: [{ id: "accueil", label: c("Accueil", "Home") }, { id: "enfants", label: c("Enfants", "Children") }, { id: "progression", label: c("Progression", "Progress") }, { id: "paiements", label: c("Paiements", "Payments") }, { id: "messages", label: c("Messages", "Messages"), badge: 2 }],
    sections: [
      { id: "accueil", kind: "metrics", title: c("Mon foyer", "My household"), metrics: [{ label: c("Enfants", "Children"), value: "2", hint: c("2 profils actifs", "2 active profiles") }, { label: c("Places", "Seats"), value: "2/4", hint: c("2 disponibles", "2 available") }, { label: c("Accès adulte", "Adult access"), value: "2", hint: c("Monde · Racines", "World · Roots") }, { label: c("Temps", "Time"), value: "96 min", hint: c("Cette semaine", "This week") }] },
      { id: "enfants", kind: "list", title: c("Mes enfants", "My children"), rows: [row("Lina · Enfant Monde", "Lina · World child", "Allemand · objectif vie quotidienne · 120 XP", "German · daily-life goal · 120 XP", "Ouvrir", "Open", "gold"), row("Aïcha · Enfant Racines", "Aïcha · Roots child", "Wolof · Étape É2 · 3 contes", "Wolof · Stage E2 · 3 tales", "Ouvrir", "Open", "gold")] },
      { id: "progression", kind: "list", title: c("Progression", "Progress"), rows: [row("Lina · Allemand", "Lina · German", "Niveau M1 · 62 % · 54 min cette semaine", "Level M1 · 62% · 54 min this week", "En cours", "Active", "gold"), row("Aïcha · Wolof", "Aïcha · Wolof", "Étape É2 · 45 % · 42 min cette semaine", "Stage E2 · 45% · 42 min this week", "En cours", "Active", "gold")] },
      { id: "activite-prioritaire", kind: "status", title: c("Activité prioritaire", "Priority activity"), rows: [row("Avec Lina", "With Lina", "Jouez une situation quotidienne pendant trois minutes.", "Role-play a daily situation for three minutes.", "5 min", "5 min", "neutral"), row("Avec Aïcha", "With Aïcha", "Dites ensemble le mot Njaboot avant le dîner.", "Say the word Njaboot together before dinner.", "+5 XP", "+5 XP", "gold")] },
      { id: "histoires-jeux", kind: "list", title: c("Histoires, jeux et devoirs", "Stories, games and assignments"), rows: [row("Lina · Memory sonore", "Lina · Sound memory", "Jeu recommandé · animaux", "Recommended game · animals", "Nouveau", "New", "neutral"), row("Aïcha · Conte de Leuk", "Aïcha · Tale of Leuk", "Deuxième écoute recommandée", "Second listen recommended", "+10 XP", "+10 XP", "gold"), row("Lina · Devoir avec Claire", "Lina · Assignment with Claire", "Salutations · échéance vendredi", "Greetings · due Friday", "À rendre", "Due", "gold")] },
      { id: "seances", kind: "list", title: c("Séances", "Sessions"), rows: [row("Aïcha avec Fatou", "Aïcha with Fatou", "Jeudi · 18 h · Wolof É2", "Thursday · 6 pm · Wolof E2", "Confirmée", "Confirmed", "success"), row("Lina avec Claire", "Lina with Claire", "Mardi · 17 h · Allemand M1", "Tuesday · 5 pm · German M1", "Confirmée", "Confirmed", "success")] },
      { id: "paiements", kind: "list", title: c("Paiements", "Payments"), rows: [row("Racines Famille", "Roots Family", "99 000 FCFA/an · prochain renouvellement 02/2027", "XAF 99,000/year · next renewal 02/2027", "Actif", "Active", "success"), row("Passage Monde A1", "World A1 Passage", "49 000 FCFA · accès jusqu’au 12/2026", "XAF 49,000 · access until 12/2026", "Payé", "Paid", "success")] },
      { id: "messages", kind: "chat", title: c("Messages", "Messages"), rows: [row("Claire · 08:55", "Claire · 08:55", "Lina peut reprendre l’activité de salutations.", "Lina can resume the greetings activity.", "1 non lu", "1 unread", "gold"), row("Fatou · 09:10", "Fatou · 09:10", "Aïcha a très bien participé au dernier cercle.", "Aïcha participated very well in the last circle.", "1 non lu", "1 unread", "gold")] },
      { id: "parametres", kind: "status", title: c("Paramètres du foyer", "Household settings"), rows: [row("Responsables", "Guardians", "1 responsable principal · payeur enregistré", "1 primary guardian · payer registered", "Sécurisé", "Secure", "success"), row("PIN enfants", "Child PINs", "Deux profils protégés par PIN", "Two profiles protected by PIN", "Actif", "Active", "success")] },
    ],
  },
  child_monde: {
    id: "child_monde",
    title: c("Bonjour Lina !", "Hello Lina!"),
    subtitle: c("Enfant Monde · Allemand · NIV 3", "World child · German · LVL 3"),
    route: "/dashboard",
    universe: "neutral",
    tabs: [{ id: "maison", label: c("Maison", "Home") }, { id: "jeux", label: c("Jeux", "Games") }, { id: "histoires", label: c("Histoires", "Stories") }, { id: "badges", label: c("Badges", "Badges"), badge: 5 }],
    sections: [
      { id: "maison", kind: "metrics", title: c("Ma progression", "My progress"), metrics: [{ label: c("XP", "XP"), value: "120/200", hint: c("Exploratrice des animaux", "Animal explorer") }, { label: c("Série", "Streak"), value: "3 jours", hint: c("Cette semaine", "This week") }, { label: c("Étoiles", "Stars"), value: "8", hint: c("Gagnées", "Earned") }, { label: c("Badges", "Badges"), value: "3/5", hint: c("Encore 2", "2 to go") }] },
      { id: "quete", kind: "hero", eyebrow: c("QUÊTE DU JOUR · +30 XP", "TODAY'S QUEST · +30 XP"), title: c("Reconnais les animaux", "Recognise the animals"), description: c("Écoute, montre, puis mime trois animaux.", "Listen, point, then mime three animals."), progress: 60, cta: c("Commencer la quête", "Start quest") },
      { id: "chemin", kind: "timeline", title: c("Mon chemin", "My path"), rows: [row("Bonjour", "Hello", "Terminé", "Completed", "✓", "✓", "success"), row("Couleurs", "Colours", "Terminé", "Completed", "✓", "✓", "success"), row("Animaux", "Animals", "Étape actuelle", "Current stage", "▶", "▶", "gold"), row("Nombres", "Numbers", "Verrouillé", "Locked", "🔒", "🔒", "muted"), row("Trésor", "Treasure", "Encore 80 XP", "80 XP to go", "Coffre", "Chest", "muted")] },
      { id: "missions", kind: "list", title: c("Missions", "Missions"), rows: [row("Écoute les trois animaux", "Listen to the three animals", "Seule · 4 min", "Solo · 4 min", "+10 XP", "+10 XP", "gold"), row("Mime l’éléphant", "Mime the elephant", "Avec un adulte · 5 min", "With an adult · 5 min", "+15 XP", "+15 XP", "gold"), row("Répète les mots", "Repeat the words", "Deuxième écoute", "Second listen", "+10 XP bonus", "+10 XP bonus", "gold")] },
      { id: "recompense", kind: "status", title: c("Prochaine récompense", "Next reward"), rows: [row("Coffre à surprises", "Surprise chest", "Encore 80 XP · nouveau compagnon", "80 XP to go · new companion", "Bientôt", "Soon", "gold")] },
      { id: "jeux", kind: "list", title: c("Mes jeux", "My games"), rows: [row("Memory sonore", "Sound memory", "Animaux · meilleur score 8/10", "Animals · best score 8/10", "+15 XP", "+15 XP", "gold"), row("Mime et trouve", "Mime and guess", "Actions · avec un adulte", "Actions · with an adult", "Nouveau", "New", "neutral"), row("Compter jusqu’à dix", "Count to ten", "Nombres · verrouillé", "Numbers · locked", "🔒", "🔒", "muted")] },
      { id: "histoires", kind: "list", title: c("Mes histoires", "My stories"), rows: [row("Lina et le petit renard", "Lina and the little fox", "École et forêt · 4 min", "School and forest · 4 min", "Écoutée", "Listened", "success"), row("Le bus des couleurs", "The colour bus", "Ville · 5 min · deuxième écoute bonifiée", "City · 5 min · second listen bonus", "+10 XP", "+10 XP", "gold") ] },
      { id: "badges", kind: "list", title: c("Mes badges", "My badges"), rows: [row("Oreille attentive", "Careful listener", "Obtenu après 5 écoutes", "Earned after 5 listens", "Obtenu", "Earned", "success"), row("Super mime", "Super mime", "Obtenu après 3 gestes", "Earned after 3 gestures", "Obtenu", "Earned", "success"), row("Exploratrice", "Explorer", "Encore 80 XP", "80 XP to go", "80 XP", "80 XP", "gold")] },
      { id: "avec-adulte", kind: "list", title: c("Avec un adulte", "With an adult"), rows: [row("Jeu des objets de la maison", "Home objects game", "5 minutes · sans écran après l’écoute", "5 minutes · screen-free after listening", "+15 XP", "+15 XP", "gold")] },
    ],
  },
  child_racines: {
    id: "child_racines",
    title: c("Salaam Aïcha !", "Salaam Aïcha!"),
    subtitle: c("Enfant Racines · Wolof · Étape É2", "Roots child · Wolof · Stage E2"),
    route: "/dashboard",
    universe: "racines",
    tabs: [{ id: "case", label: c("Ma case", "My home") }, { id: "contes", label: c("Contes", "Tales") }, { id: "chansons", label: c("Chansons", "Songs") }, { id: "badges", label: c("Badges", "Badges"), badge: 4 }],
    sections: [
      { id: "case", kind: "metrics", title: c("Ma progression orale", "My oral progress"), metrics: [{ label: c("XP", "XP"), value: "145/200", hint: c("Gardienne des histoires", "Story keeper") }, { label: c("Série", "Streak"), value: "3 jours", hint: c("Cette semaine", "This week") }, { label: c("Contes", "Tales"), value: "3", hint: c("Terminés", "Completed") }, { label: c("Badges", "Badges"), value: "3/4", hint: c("Encore 1", "1 to go") }] },
      { id: "quete", kind: "hero", eyebrow: c("QUÊTE DU JOUR · +30 XP", "TODAY'S QUEST · +30 XP"), title: c("Écoute le conte de Leuk", "Listen to the tale of Leuk"), description: c("Écoute une première fois, puis raconte un passage.", "Listen once, then retell one part."), progress: 72, cta: c("Écouter le conte", "Listen to tale") },
      { id: "chemin", kind: "timeline", title: c("Mon chemin", "My path"), rows: [row("Nuyoo", "Nuyoo", "Terminé", "Completed", "✓", "✓", "success"), row("Njaboot", "Njaboot", "Terminé", "Completed", "✓", "✓", "success"), row("Leuk", "Leuk", "Étape actuelle", "Current stage", "▶", "▶", "gold"), row("Kocc", "Kocc", "Verrouillé", "Locked", "🔒", "🔒", "muted"), row("Trésor", "Treasure", "Encore 55 XP", "55 XP to go", "Coffre", "Chest", "muted")] },
      { id: "missions", kind: "list", title: c("Missions", "Missions"), rows: [row("Première écoute", "First listen", "Seule · 6 min", "Solo · 6 min", "+10 XP", "+10 XP", "gold"), row("Deuxième écoute", "Second listen", "Répétition bonifiée", "Rewarded repetition", "+10 XP bonus", "+10 XP bonus", "gold"), row("Raconte à ton tour", "Tell it in your own words", "Audio envoyé au coach", "Audio sent to coach", "+20 XP", "+20 XP", "gold"), row("Mot magique : Jërëjëf", "Magic word: Jërëjëf", "À dire en famille", "Say it with family", "+5 XP", "+5 XP", "gold")] },
      { id: "contes", kind: "list", title: c("Mes contes", "My tales"), rows: [row("Leuk le lièvre", "Leuk the hare", "Écouté deux fois · 6 min", "Listened twice · 6 min", "En cours", "Active", "gold"), row("Kocc Barma", "Kocc Barma", "Disponible après Leuk", "Available after Leuk", "À venir", "Upcoming", "neutral"), row("Bouki", "Bouki", "Verrouillé", "Locked", "🔒", "🔒", "muted")] },
      { id: "chansons", kind: "list", title: c("Mes chansons", "My songs"), rows: [row("Ayo Néné", "Ayo Néné", "Berceuse · 3 écoutes", "Lullaby · 3 listens", "Maîtrisée", "Mastered", "success"), row("Nuyoo", "Nuyoo", "Chanson des salutations · 2 min", "Greetings song · 2 min", "+10 XP", "+10 XP", "gold"), row("Comptine des nombres", "Counting rhyme", "À découvrir", "Discover", "Nouveau", "New", "neutral")] },
      { id: "badges", kind: "list", title: c("Mes badges", "My badges"), rows: [row("Oreille du village", "Village listener", "3 contes terminés", "3 tales completed", "Obtenu", "Earned", "success"), row("Voix courageuse", "Brave voice", "2 récits envoyés", "2 stories sent", "Obtenu", "Earned", "success"), row("Mot de la maison", "Home word", "Encore 5 mots en famille", "5 family words to go", "5 mots", "5 words", "gold")] },
      { id: "famille", kind: "status", title: c("En famille", "With family"), rows: [row("Rituel du soir", "Evening ritual", "Dire Jërëjëf avant le repas et demander sa signification.", "Say Jërëjëf before dinner and ask what it means.", "+5 XP", "+5 XP", "gold")] },
    ],
  },
};

export function localize(copy: LocalizedCopy, locale: "fr" | "en"): string {
  return copy[locale];
}
