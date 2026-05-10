import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

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

const FALLBACK_QUESTIONS = [
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

// GET /api/test-niveau — returns 30 CEFR questions A1→C1
export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `Génère exactement 30 questions de test de niveau CEFR d'allemand (A1 à C1) en JSON strict.
Format: array d'objets avec ces clés exactes:
{ "id": "q01", "level": "A1", "type": "qcm", "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..." }
Distribution OBLIGATOIRE: 6 questions A1 + 6 questions A2 + 6 questions B1 + 6 questions B2 + 6 questions C1
Types à varier: "qcm" (choix multiple), "fill" (compléter la phrase), "translate" (choisir bonne traduction), "error" (identifier erreur grammaticale), "article" (choisir der/die/das)
- options: exactement 4 chaînes
- correct: index 0-3 de la bonne réponse
- explanation: en français, 1-2 phrases claires
- questions progressives et variées dans chaque niveau
Réponds UNIQUEMENT avec le JSON array, sans markdown ni texte.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(12000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const questions = JSON.parse(cleaned);
        if (Array.isArray(questions) && questions.length >= 25) {
          return NextResponse.json({ questions });
        }
      }
    } catch {
      // Fall through to static questions
    }
  }
  return NextResponse.json({ questions: FALLBACK_QUESTIONS });
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
