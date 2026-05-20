import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { callAI } from "@/lib/ai/provider";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const FALLBACK_QUESTIONS_FR = [
  // ── A1 (6 questions) ──────────────────────────────────────────────────────
  { id:"q01", level:"A1", type:"article",   question:"Quel est l'article défini de «Haus» (maison) ?", options:["der","die","das","ein"], correct:2, explanation:"«Haus» est neutre en allemand → «das Haus»." },
  { id:"q02", level:"A1", type:"qcm",       question:"Comment dit-on «Bonjour» (le matin) en allemand ?", options:["Gute Nacht!","Guten Morgen!","Auf Wiedersehen!","Tschüss!"], correct:1, explanation:"«Guten Morgen» = Bonjour (matin). «Gute Nacht» = Bonne nuit." },
  { id:"q03", level:"A1", type:"fill",      question:"Complétez : «Ich ___ Student.»", options:["habe","bin","ist","bist"], correct:1, explanation:"«ich bin» = «je suis». Conjugaison de «sein» à la 1ʳᵉ personne du singulier." },
  { id:"q04", level:"A1", type:"article",   question:"Quel est l'article défini de «Mann» (homme) ?", options:["das","die","der","ein"], correct:2, explanation:"«Mann» est masculin → «der Mann»." },
  { id:"q05", level:"A1", type:"translate", question:"Choisissez la bonne traduction de «Danke schön» :", options:["S'il vous plaît","Au revoir","Merci beaucoup","Bonjour"], correct:2, explanation:"«Danke schön» = «Merci beaucoup». «Bitte» = «S'il vous plaît / De rien»." },
  { id:"q06", level:"A1", type:"qcm",       question:"Comment demande-t-on poliment «Comment allez-vous ?» en allemand ?", options:["Wie heißen Sie?","Woher kommen Sie?","Wie geht es Ihnen?","Was machen Sie?"], correct:2, explanation:"«Wie geht es Ihnen?» = «Comment allez-vous?» (forme polie)." },
  // ── A2 (6 questions) ──────────────────────────────────────────────────────
  { id:"q07", level:"A2", type:"fill",      question:"Complétez au Perfekt : «Ich ___ gestern ins Kino gegangen.»", options:["bin","habe","war","hatte"], correct:0, explanation:"«gehen» est un verbe de mouvement → auxiliaire «sein». «bin gegangen» = suis allé(e)." },
  { id:"q08", level:"A2", type:"qcm",       question:"Quel modal exprime une obligation : «Du ___ mehr Wasser trinken.»", options:["kannst","sollst","musst","darfst"], correct:2, explanation:"«müssen» = devoir (obligation). «müssen» → «musst» (2ᵉ pers. singulier)." },
  { id:"q09", level:"A2", type:"translate", question:"Traduisez : «Il y a deux jours»", options:["In zwei Tagen","Seit zwei Tagen","Vor zwei Tagen","Vor zwei Jahren"], correct:2, explanation:"«vor» + datif = «il y a». «Vor zwei Tagen» = il y a deux jours." },
  { id:"q10", level:"A2", type:"error",     question:"Trouvez l'erreur dans : «Ich habe gestern ins Kino gegangen.»", options:["«Ich» mal placé","«habe» au lieu de «bin»","«gestern» incorrect","«Kino» sans article"], correct:1, explanation:"«gehen» → auxiliaire «sein», pas «haben». Correct : «Ich bin gestern ins Kino gegangen.»" },
  { id:"q11", level:"A2", type:"qcm",       question:"Quel est le pluriel de «das Kind» ?", options:["die Kinds","die Kindes","die Kinder","die Kinden"], correct:2, explanation:"«Kind» → pluriel irrégulier «Kinder». À mémoriser absolument." },
  { id:"q12", level:"A2", type:"fill",      question:"Choisissez la bonne préposition : «Ich warte ___ den Bus.»", options:["auf","an","für","mit"], correct:0, explanation:"«warten auf» = attendre (qqch/qqn) → toujours avec l'accusatif." },
  // ── B1 (6 questions) ──────────────────────────────────────────────────────
  { id:"q13", level:"B1", type:"fill",      question:"Konjunktiv II — Complétez : «Wenn ich Zeit ___, würde ich reisen.»", options:["hatte","hätte","habe","haben"], correct:1, explanation:"Le Konjunktiv II de «haben» est «hätte». Il exprime une condition irréelle." },
  { id:"q14", level:"B1", type:"qcm",       question:"Transformez en passif présent : «Die Lehrerin erklärt die Grammatik.»", options:["Die Grammatik wird erklärt.","Die Grammatik ist erklärt.","Die Grammatik erklärt wird.","Die Grammatik wurde erklärt."], correct:0, explanation:"Passif présent = «werden» conjugué + participe passé. «wird erklärt» = est expliquée." },
  { id:"q15", level:"B1", type:"fill",      question:"Complétez avec le pronom relatif : «Das ist der Mann, ___ ich gestern getroffen habe.»", options:["der","den","dem","dessen"], correct:1, explanation:"«treffen» → Akkusativ → pronom relatif masculin en Akkusativ = «den»." },
  { id:"q16", level:"B1", type:"qcm",       question:"Quel est l'Akkusativ de «der alte Mann» ?", options:["der alte Mann","den alten Mann","dem alten Mann","des alten Mannes"], correct:1, explanation:"En Akkusativ, l'article défini masculin «der» devient «den» et l'adjectif prend «-en»." },
  { id:"q17", level:"B1", type:"error",     question:"Trouvez l'erreur : «Obwohl er müde war, er hat weitergearbeitet.»", options:["«Obwohl» incorrect","Verbe «hat» doit aller en fin de subordonnée","«müde» incorrect","«weitergearbeitet» mal formé"], correct:1, explanation:"Dans une subordonnée «obwohl», le verbe conjugué va en fin : «obwohl er müde war, hat er weitergearbeitet.»" },
  { id:"q18", level:"B1", type:"translate", question:"Traduisez : «Je lui ai demandé de venir.»", options:["Ich habe ihn gebeten, zu kommen.","Ich habe ihn gebeten, kommen.","Ich bat ihn kommen zu.","Ich habe ihm zu kommen gebeten."], correct:0, explanation:"Construction infinitive avec «zu» : «bitten + Akkusativ + zu + infinitif». Virgule obligatoire avant la proposition infinitive." },
  // ── B2 (6 questions) ──────────────────────────────────────────────────────
  { id:"q19", level:"B2", type:"qcm",       question:"Quelle conjonction de subordination exprime une concession formelle ?", options:["weil","damit","wenngleich","sobald"], correct:2, explanation:"«wenngleich» = bien que / quoique (registre formel). Équivalent soutenu de «obwohl»." },
  { id:"q20", level:"B2", type:"fill",      question:"Génitif — complétez : «Das Auto ___ Mannes ist rot.»", options:["des","dem","den","der"], correct:0, explanation:"Le génitif masculin/neutre utilise «des» + -s/-es sur le nom : «des Mannes» = de l'homme." },
  { id:"q21", level:"B2", type:"qcm",       question:"Quand utilise-t-on «als» plutôt que «wenn» pour des actions passées ?", options:["Quand l'action se répète dans le passé","Quand l'action est unique dans le passé","Pour le présent uniquement","Ils sont toujours interchangeables"], correct:1, explanation:"«als» = quand (action unique, ponctuelle dans le passé). «wenn» = lorsque (répétition ou présent/futur)." },
  { id:"q22", level:"B2", type:"error",     question:"Trouvez l'erreur dans : «Er hat versucht, das Problem lösen.»", options:["«versucht» au mauvais temps","Il manque «zu» avant «lösen»","«das» incorrect","«Problem» sans article"], correct:1, explanation:"Construction infinitive avec «versuchen» → «zu + infinitif» obligatoire : «Er hat versucht, das Problem zu lösen.»" },
  { id:"q23", level:"B2", type:"translate", question:"Traduisez : «Le rapport doit être remis dans les délais.»", options:["Der Bericht muss fristgerecht eingereicht werden.","Der Bericht soll fristgerecht einreichen.","Der Bericht muss fristgerecht eingereicht sein.","Der Bericht wird fristgerecht eingereicht haben."], correct:0, explanation:"«müssen + Passiv» = obligation passive. «eingereicht werden» = être remis (Passiv Präsens)." },
  { id:"q24", level:"B2", type:"qcm",       question:"Quelle forme de Konjunktiv I est correcte pour le discours indirect : «Er sagt, er ___ krank.»", options:["ist","war","sei","wäre"], correct:2, explanation:"Le Konjunktiv I du verbe «sein» est «sei». Il s'utilise pour le discours indirect formel/journalistique." },
  // ── C1 (6 questions) ──────────────────────────────────────────────────────
  { id:"q25", level:"C1", type:"qcm",       question:"Dans quel contexte «indem» est-il utilisé ?", options:["Pour exprimer une cause","Pour exprimer un moyen/une façon de faire","Pour exprimer une concession","Pour exprimer une conséquence"], correct:1, explanation:"«indem» = en faisant qqch, par le biais de. Ex: «Er lernt, indem er täglich übt.» = Il apprend en pratiquant quotidiennement." },
  { id:"q26", level:"C1", type:"fill",      question:"Konjunktiv II passé — Complétez : «Ich hätte das Buch gelesen, wenn ich Zeit gehabt ___.»", options:["hätte","wäre","habe","hatte"], correct:0, explanation:"«hätte» est l'auxiliaire du Konjunktiv II passé de «haben». La structure est : Konjunktiv II de l'auxiliaire + participe passé." },
  { id:"q27", level:"C1", type:"translate", question:"Traduisez formellement : «Quoique la situation soit difficile, ils persévèrent.»", options:["Obschon die Lage schwierig ist, beharren sie.","Weil die Lage schwierig ist, beharren sie.","Damit die Lage schwierig ist, beharren sie.","Da die Lage schwierig ist, beharren sie."], correct:0, explanation:"«obschon» / «wenngleich» = quoique / bien que (registre C1 formel). Notez la position du verbe." },
  { id:"q28", level:"C1", type:"error",     question:"Trouvez l'erreur subtile : «Die Maßnahmen, die ergriffen worden sind, haben sich als wirksam erwiesen haben.»", options:["«ergriffen worden sind» incorrect","«haben» final en trop (double «haben»)","«Maßnahmen» sans article","«wirksam» incorrect"], correct:1, explanation:"Avec «sich erweisen als», le participe passé est «erwiesen» et l'auxiliaire «haben» n'apparaît qu'une fois à la fin." },
  { id:"q29", level:"C1", type:"qcm",       question:"Quelle préposition régit le cas génitif en registre soutenu ?", options:["mit","wegen","nach","von"], correct:1, explanation:"«wegen» régit le génitif en langue soignée : «wegen des schlechten Wetters». En langage courant, on utilise parfois le datif." },
  { id:"q30", level:"C1", type:"fill",      question:"Complétez avec la forme correcte : «Es ___ wichtig, dass alle Beteiligten informiert werden.»", options:["ist","sei","wäre","würde sein"], correct:1, explanation:"«es sei wichtig, dass...» = discours indirect formel (Konjunktiv I). Introduit une proposition avec nuance de citation indirecte." },
];

const FALLBACK_QUESTIONS_EN = [
  // ── A1 (6 questions) ──────────────────────────────────────────────────────
  { id:"q01", level:"A1", type:"article",   question:"What is the definite article for «Haus» (house)?", options:["der","die","das","ein"], correct:2, explanation:"«Haus» is neuter in German → «das Haus»." },
  { id:"q02", level:"A1", type:"qcm",       question:"How do you say «Good morning» in German?", options:["Gute Nacht!","Guten Morgen!","Auf Wiedersehen!","Tschüss!"], correct:1, explanation:"«Guten Morgen» = Good morning. «Gute Nacht» = Good night." },
  { id:"q03", level:"A1", type:"fill",      question:"Complete: «Ich ___ Student.»", options:["habe","bin","ist","bist"], correct:1, explanation:"«ich bin» = «I am». Conjugation of «sein» in the 1st person singular." },
  { id:"q04", level:"A1", type:"article",   question:"What is the definite article for «Mann» (man)?", options:["das","die","der","ein"], correct:2, explanation:"«Mann» is masculine → «der Mann»." },
  { id:"q05", level:"A1", type:"translate", question:"Choose the correct translation of «Danke schön»:", options:["Please","Goodbye","Thank you very much","Hello"], correct:2, explanation:"«Danke schön» = «Thank you very much». «Bitte» = «Please / You're welcome»." },
  { id:"q06", level:"A1", type:"qcm",       question:"How do you politely ask «How are you?» in German?", options:["Wie heißen Sie?","Woher kommen Sie?","Wie geht es Ihnen?","Was machen Sie?"], correct:2, explanation:"«Wie geht es Ihnen?» = «How are you?» (formal form)." },
  // ── A2 (6 questions) ──────────────────────────────────────────────────────
  { id:"q07", level:"A2", type:"fill",      question:"Complete in the Perfekt: «Ich ___ gestern ins Kino gegangen.»", options:["bin","habe","war","hatte"], correct:0, explanation:"«gehen» is a movement verb → auxiliary «sein». «bin gegangen» = went / have gone." },
  { id:"q08", level:"A2", type:"qcm",       question:"Which modal expresses obligation: «Du ___ mehr Wasser trinken.»", options:["kannst","sollst","musst","darfst"], correct:2, explanation:"«müssen» = must / have to (obligation). «musst» is the 2nd person singular form." },
  { id:"q09", level:"A2", type:"translate", question:"Translate: «Two days ago»", options:["In zwei Tagen","Seit zwei Tagen","Vor zwei Tagen","Vor zwei Jahren"], correct:2, explanation:"«vor» + dative = «ago». «Vor zwei Tagen» = two days ago." },
  { id:"q10", level:"A2", type:"error",     question:"Find the error in: «Ich habe gestern ins Kino gegangen.»", options:["«Ich» is misplaced","«habe» should be «bin»","«gestern» is wrong","«Kino» without article"], correct:1, explanation:"«gehen» → auxiliary «sein», not «haben». Correct: «Ich bin gestern ins Kino gegangen.»" },
  { id:"q11", level:"A2", type:"qcm",       question:"What is the plural of «das Kind»?", options:["die Kinds","die Kindes","die Kinder","die Kinden"], correct:2, explanation:"«Kind» → irregular plural «Kinder». Essential to memorise." },
  { id:"q12", level:"A2", type:"fill",      question:"Choose the correct preposition: «Ich warte ___ den Bus.»", options:["auf","an","für","mit"], correct:0, explanation:"«warten auf» = to wait for (something/someone) → always with the accusative." },
  // ── B1 (6 questions) ──────────────────────────────────────────────────────
  { id:"q13", level:"B1", type:"fill",      question:"Konjunktiv II — Complete: «Wenn ich Zeit ___, würde ich reisen.»", options:["hatte","hätte","habe","haben"], correct:1, explanation:"Konjunktiv II of «haben» is «hätte». It expresses an unreal condition." },
  { id:"q14", level:"B1", type:"qcm",       question:"Turn into passive present: «Die Lehrerin erklärt die Grammatik.»", options:["Die Grammatik wird erklärt.","Die Grammatik ist erklärt.","Die Grammatik erklärt wird.","Die Grammatik wurde erklärt."], correct:0, explanation:"Passive present = conjugated «werden» + past participle. «wird erklärt» = is explained." },
  { id:"q15", level:"B1", type:"fill",      question:"Complete with the relative pronoun: «Das ist der Mann, ___ ich gestern getroffen habe.»", options:["der","den","dem","dessen"], correct:1, explanation:"«treffen» → Akkusativ → masculine relative pronoun in Akkusativ = «den»." },
  { id:"q16", level:"B1", type:"qcm",       question:"What is the Akkusativ form of «der alte Mann»?", options:["der alte Mann","den alten Mann","dem alten Mann","des alten Mannes"], correct:1, explanation:"In the Akkusativ, masculine «der» becomes «den» and the adjective takes «-en»." },
  { id:"q17", level:"B1", type:"error",     question:"Find the error: «Obwohl er müde war, er hat weitergearbeitet.»", options:["«Obwohl» is wrong","Verb «hat» must go to end of subordinate clause","«müde» is wrong","«weitergearbeitet» is incorrectly formed"], correct:1, explanation:"In an «obwohl» clause, the conjugated verb goes to the end: «obwohl er müde war, hat er weitergearbeitet.»" },
  { id:"q18", level:"B1", type:"translate", question:"Translate: «I asked him to come.»", options:["Ich habe ihn gebeten, zu kommen.","Ich habe ihn gebeten, kommen.","Ich bat ihn kommen zu.","Ich habe ihm zu kommen gebeten."], correct:0, explanation:"Infinitive construction: «bitten + Akkusativ + zu + infinitive». A comma is required before the infinitive clause." },
  // ── B2 (6 questions) ──────────────────────────────────────────────────────
  { id:"q19", level:"B2", type:"qcm",       question:"Which subordinating conjunction expresses a formal concession?", options:["weil","damit","wenngleich","sobald"], correct:2, explanation:"«wenngleich» = although (formal register). Formal equivalent of «obwohl»." },
  { id:"q20", level:"B2", type:"fill",      question:"Genitive — complete: «Das Auto ___ Mannes ist rot.»", options:["des","dem","den","der"], correct:0, explanation:"Masculine/neuter genitive uses «des» + -s/-es on the noun: «des Mannes» = of the man." },
  { id:"q21", level:"B2", type:"qcm",       question:"When do you use «als» rather than «wenn» for past actions?", options:["When the action repeats in the past","When the action is a single past event","For the present only","They are always interchangeable"], correct:1, explanation:"«als» = when (a single one-time event in the past). «wenn» = when/whenever (repetition or present/future)." },
  { id:"q22", level:"B2", type:"error",     question:"Find the error in: «Er hat versucht, das Problem lösen.»", options:["«versucht» wrong tense","«zu» is missing before «lösen»","«das» is wrong","«Problem» without article"], correct:1, explanation:"Infinitive construction with «versuchen» → «zu + infinitive» required: «Er hat versucht, das Problem zu lösen.»" },
  { id:"q23", level:"B2", type:"translate", question:"Translate: «The report must be submitted on time.»", options:["Der Bericht muss fristgerecht eingereicht werden.","Der Bericht soll fristgerecht einreichen.","Der Bericht muss fristgerecht eingereicht sein.","Der Bericht wird fristgerecht eingereicht haben."], correct:0, explanation:"«müssen + Passiv» = passive obligation. «eingereicht werden» = to be submitted (Passiv Präsens)." },
  { id:"q24", level:"B2", type:"qcm",       question:"Which Konjunktiv I form is correct for reported speech: «Er sagt, er ___ krank.»", options:["ist","war","sei","wäre"], correct:2, explanation:"Konjunktiv I of «sein» is «sei». Used for formal and journalistic reported speech." },
  // ── C1 (6 questions) ──────────────────────────────────────────────────────
  { id:"q25", level:"C1", type:"qcm",       question:"In which context is «indem» used?", options:["To express a cause","To express a means or manner","To express a concession","To express a consequence"], correct:1, explanation:"«indem» = by doing something. Ex: «Er lernt, indem er täglich übt.» = He learns by practising daily." },
  { id:"q26", level:"C1", type:"fill",      question:"Konjunktiv II past — Complete: «Ich hätte das Buch gelesen, wenn ich Zeit gehabt ___.»", options:["hätte","wäre","habe","hatte"], correct:0, explanation:"«hätte» is the Konjunktiv II auxiliary of «haben». Structure: Konjunktiv II auxiliary + past participle." },
  { id:"q27", level:"C1", type:"translate", question:"Formally translate: «Although the situation is difficult, they persevere.»", options:["Obschon die Lage schwierig ist, beharren sie.","Weil die Lage schwierig ist, beharren sie.","Damit die Lage schwierig ist, beharren sie.","Da die Lage schwierig ist, beharren sie."], correct:0, explanation:"«obschon» / «wenngleich» = although (C1 formal register). Note the verb-final position in the clause." },
  { id:"q28", level:"C1", type:"error",     question:"Find the subtle error: «Die Maßnahmen, die ergriffen worden sind, haben sich als wirksam erwiesen haben.»", options:["«ergriffen worden sind» is wrong","Final «haben» is redundant (double auxiliary)","«Maßnahmen» without article","«wirksam» is wrong"], correct:1, explanation:"With «sich erweisen als», the past participle is «erwiesen» and «haben» appears only once at the end." },
  { id:"q29", level:"C1", type:"qcm",       question:"Which preposition governs the genitive case in formal writing?", options:["mit","wegen","nach","von"], correct:1, explanation:"«wegen» governs the genitive in formal language: «wegen des schlechten Wetters». In informal speech the dative is sometimes used." },
  { id:"q30", level:"C1", type:"fill",      question:"Complete with the correct form: «Es ___ wichtig, dass alle Beteiligten informiert werden.»", options:["ist","sei","wäre","würde sein"], correct:1, explanation:"«es sei wichtig, dass...» = formal reported speech (Konjunktiv I). Introduces a clause with an indirect citation nuance." },
];

const LEVEL_TEST_SYSTEM_PROMPT: Record<string, string> = {
  fr: `Tu es un générateur de questions de test de niveau CEFR d'allemand.
Distribution OBLIGATOIRE : 6 questions A1 + 6 A2 + 6 B1 + 6 B2 + 6 C1 = 30 questions au total.
Types à varier : "qcm" (choix multiple), "fill" (compléter la phrase), "translate" (choisir bonne traduction), "error" (identifier erreur grammaticale), "article" (choisir der/die/das).
Chaque question a exactement 4 options.
Les explications sont en français, claires, 1-2 phrases.
Les questions sont progressives et variées dans chaque niveau.

Retourne UNIQUEMENT ce JSON valide :
{ "questions": [ { "id": "q01", "level": "A1", "type": "qcm", "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..." }, ... ] }`,
  en: `You are a CEFR German level test question generator.
REQUIRED distribution: 6 A1 + 6 A2 + 6 B1 + 6 B2 + 6 C1 = 30 questions total.
Types to vary: "qcm" (multiple choice), "fill" (fill in the blank), "translate" (choose correct translation), "error" (identify grammar error), "article" (choose der/die/das).
Each question has exactly 4 options.
Explanations are in English, clear, 1-2 sentences.
Questions are progressive and varied within each level.

Return ONLY this valid JSON:
{ "questions": [ { "id": "q01", "level": "A1", "type": "qcm", "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..." }, ... ] }`,
};

const LEVEL_TEST_USER_MESSAGE: Record<string, string> = {
  fr: "Génère maintenant les 30 questions de test CEFR d'allemand.",
  en: "Generate the 30 CEFR German level test questions now.",
};

// GET /api/test-niveau?locale=fr|en — returns 30 CEFR questions
export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "fr";
  const fallback = locale === "en" ? FALLBACK_QUESTIONS_EN : FALLBACK_QUESTIONS_FR;

  try {
    const result = await callAI({
      feature: "level-test",
      systemPrompt: LEVEL_TEST_SYSTEM_PROMPT[locale],
      userMessage: LEVEL_TEST_USER_MESSAGE[locale],
      temperature: 0.6,
      maxTokens: 4096,
    });
    const raw = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(raw);
    const questions = Array.isArray(parsed) ? parsed : parsed.questions;
    if (Array.isArray(questions) && questions.length >= 25) {
      return NextResponse.json({ questions });
    }
  } catch {
    // Fall through to static questions
  }

  return NextResponse.json({ questions: fallback });
}

// POST /api/test-niveau — save level + increment testAttempts
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: authUser.id },
    create: {
      supabaseId: authUser.id,
      email: authUser.email!,
      fullName: authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "Utilisateur",
      onboardingDone: true,
    },
    update: {},
  });

  const { level, score } = await request.json();

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      germanLevel: level,
      testScore: score,
      testAttempts: { increment: 1 },
      levelAssignedAt: new Date(),
      onboardingDone: true,
    },
  });

  return NextResponse.json({ ok: true, level });
}
