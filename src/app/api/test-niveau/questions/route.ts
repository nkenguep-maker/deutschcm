import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getCached, setCached, cacheKey } from "@/lib/geminiCache"

const PROMPT: Record<string, string> = {
  fr: `Génère exactement 30 questions de test de niveau allemand CEFR pour apprenants francophones.
Distribution : A1(6) A2(6) B1(6) B2(6) C1(6)

Retourne UNIQUEMENT ce JSON :
{
  "questions": [
    {
      "id": "q1",
      "level": "A1",
      "type": "qcm",
      "question_fr": "Question en français",
      "options": ["A","B","C","D"],
      "correct": "bonne réponse",
      "correct_index": 0,
      "explanation_fr": "explication courte",
      "points": 1
    }
  ]
}`,
  en: `Generate exactly 30 CEFR German level test questions for English-speaking learners.
Distribution: A1(6) A2(6) B1(6) B2(6) C1(6)

Return ONLY this JSON:
{
  "questions": [
    {
      "id": "q1",
      "level": "A1",
      "type": "qcm",
      "question_fr": "Question in English",
      "options": ["A","B","C","D"],
      "correct": "correct answer",
      "correct_index": 0,
      "explanation_fr": "short explanation in English",
      "points": 1
    }
  ]
}`,
}

export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "fr"
  const key = cacheKey("test-niveau", "questions", `v1-${locale}`)
  const cached = getCached(key)
  if (cached) return NextResponse.json({ success: true, questions: cached, fromCache: true })

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.2, maxOutputTokens: 4000, responseMimeType: "application/json" }
  })

  try {
    const result = await model.generateContent(PROMPT[locale])
    const parsed = JSON.parse(result.response.text().replace(/```json|```/g, "").trim())
    setCached(key, parsed.questions)
    return NextResponse.json({ success: true, questions: parsed.questions })
  } catch {
    const fallback = locale === "en" ? FALLBACK_QUESTIONS_EN : FALLBACK_QUESTIONS_FR
    return NextResponse.json({ success: true, questions: fallback, fromCache: false })
  }
}

const FALLBACK_QUESTIONS_FR = [
  // A1
  { id:"q1", level:"A1", type:"qcm", question_fr:"Comment dit-on 'bonjour' formellement?", options:["Hallo","Guten Tag","Tschüss","Danke"], correct:"Guten Tag", correct_index:1, explanation_fr:"Guten Tag = bonjour formel", points:1 },
  { id:"q2", level:"A1", type:"qcm", question_fr:"Complétez : Ich ___ Student.", options:["bin","bist","ist","sind"], correct:"bin", correct_index:0, explanation_fr:"ich → bin", points:1 },
  { id:"q3", level:"A1", type:"qcm", question_fr:"Quel est l'article de 'Mann' (homme)?", options:["die","das","der","den"], correct:"der", correct_index:2, explanation_fr:"Mann est masculin → der", points:1 },
  { id:"q4", level:"A1", type:"qcm", question_fr:"Comment dit-on 'merci'?", options:["Bitte","Danke","Ja","Nein"], correct:"Danke", correct_index:1, explanation_fr:"Danke = merci", points:1 },
  { id:"q5", level:"A1", type:"qcm", question_fr:"Que signifie 'Wie heißen Sie?'", options:["Comment allez-vous?","Comment vous appelez-vous?","D'où venez-vous?","Quel âge avez-vous?"], correct:"Comment vous appelez-vous?", correct_index:1, explanation_fr:"heißen = s'appeler", points:1 },
  { id:"q6", level:"A1", type:"qcm", question_fr:"Comment dit-on 'au revoir'?", options:["Hallo","Danke","Auf Wiedersehen","Bitte"], correct:"Auf Wiedersehen", correct_index:2, explanation_fr:"Auf Wiedersehen = au revoir formel", points:1 },
  // A2
  { id:"q7", level:"A2", type:"qcm", question_fr:"Complétez : Ich ___ gestern ins Kino gegangen.", options:["bin","habe","wurde","hatte"], correct:"bin", correct_index:0, explanation_fr:"gehen → sein au parfait", points:1 },
  { id:"q8", level:"A2", type:"qcm", question_fr:"Que signifie 'Ich möchte ein Zimmer reservieren'?", options:["Je veux un ticket","Je voudrais réserver une chambre","Je cherche un restaurant","Je veux partir"], correct:"Je voudrais réserver une chambre", correct_index:1, explanation_fr:"möchten = vouloir (poli), Zimmer = chambre", points:1 },
  { id:"q9", level:"A2", type:"qcm", question_fr:"Quel est le pluriel de 'das Kind'?", options:["die Kinds","die Kinder","die Kindes","die Kinde"], correct:"die Kinder", correct_index:1, explanation_fr:"Kind → Kinder (pluriel irrégulier)", points:1 },
  { id:"q10", level:"A2", type:"qcm", question_fr:"Complétez : Er arbeitet ___ einer Bank.", options:["in","bei","an","auf"], correct:"bei", correct_index:1, explanation_fr:"bei = chez/dans (employeur)", points:1 },
  { id:"q11", level:"A2", type:"qcm", question_fr:"Que signifie 'Könnten Sie bitte langsamer sprechen?'", options:["Parlez plus fort","Parlez plus lentement","Répétez svp","Merci"], correct:"Parlez plus lentement", correct_index:1, explanation_fr:"langsam = lent/lentement", points:1 },
  { id:"q12", level:"A2", type:"qcm", question_fr:"Complétez : Wir ___ morgen nach Berlin.", options:["fahren","fahrst","fährt","geht"], correct:"fahren", correct_index:0, explanation_fr:"wir fahren = nous allons (en véhicule)", points:1 },
  // B1
  { id:"q13", level:"B1", type:"qcm", question_fr:"Quel mode utilise-t-on pour exprimer une hypothèse?", options:["Indikativ","Imperativ","Konjunktiv II","Infinitiv"], correct:"Konjunktiv II", correct_index:2, explanation_fr:"Konjunktiv II = conditionnel/hypothèse", points:1 },
  { id:"q14", level:"B1", type:"qcm", question_fr:"Complétez : Obwohl es regnete, ___ wir spazieren.", options:["gingen","gehen","gegangen","ginge"], correct:"gingen", correct_index:0, explanation_fr:"obwohl = bien que → Präteritum", points:1 },
  { id:"q15", level:"B1", type:"qcm", question_fr:"Que signifie 'Ich lasse mir die Haare schneiden'?", options:["Je me coupe les cheveux","Je fais couper mes cheveux","Je veux couper","Je coupe ses cheveux"], correct:"Je fais couper mes cheveux", correct_index:1, explanation_fr:"lassen + infinitif = faire faire quelque chose", points:1 },
  { id:"q16", level:"B1", type:"qcm", question_fr:"Quel connecteur exprime la conséquence?", options:["obwohl","weil","deshalb","damit"], correct:"deshalb", correct_index:2, explanation_fr:"deshalb = c'est pourquoi/donc", points:1 },
  { id:"q17", level:"B1", type:"qcm", question_fr:"Complétez : Das Buch, ___ ich lese, ist interessant.", options:["der","die","das","den"], correct:"das", correct_index:2, explanation_fr:"Buch est neutre → pronom relatif 'das'", points:1 },
  { id:"q18", level:"B1", type:"qcm", question_fr:"Que signifie 'Es kommt darauf an'?", options:["Ça arrive","Ça dépend","Ça vient de là","Ça compte"], correct:"Ça dépend", correct_index:1, explanation_fr:"Es kommt darauf an = ça dépend", points:1 },
  // B2
  { id:"q19", level:"B2", type:"qcm", question_fr:"Quel registre utilise 'Man nehme...' en cuisine?", options:["Impératif","Konjunktiv I","Präteritum","Futur II"], correct:"Konjunktiv I", correct_index:1, explanation_fr:"Konjunktiv I s'utilise dans les recettes et discours indirect", points:1 },
  { id:"q20", level:"B2", type:"qcm", question_fr:"Complétez : ___ du früher gekommen wärst, hätten wir...", options:["Wenn","Als","Ob","Da"], correct:"Wenn", correct_index:0, explanation_fr:"wenn + Konjunktiv II = condition irréelle passée", points:1 },
  { id:"q21", level:"B2", type:"qcm", question_fr:"Que signifie 'Das lässt sich nicht leugnen'?", options:["On ne peut pas le nier","On ne peut pas le voir","On ne peut pas l'apprendre","On ne peut pas le changer"], correct:"On ne peut pas le nier", correct_index:0, explanation_fr:"leugnen = nier", points:1 },
  { id:"q22", level:"B2", type:"qcm", question_fr:"Quel préfixe rend 'möglich' négatif?", options:["un-","in-","mis-","nicht-"], correct:"un-", correct_index:0, explanation_fr:"unmöglich = impossible", points:1 },
  { id:"q23", level:"B2", type:"qcm", question_fr:"Complétez : Er bestand ___ seiner Meinung.", options:["auf","an","in","bei"], correct:"auf", correct_index:0, explanation_fr:"bestehen auf = insister sur", points:1 },
  { id:"q24", level:"B2", type:"qcm", question_fr:"Que signifie 'die Nachhaltigkeit'?", options:["La durabilité","La nuit","La nature","La nouveauté"], correct:"La durabilité", correct_index:0, explanation_fr:"Nachhaltigkeit = durabilité/développement durable", points:1 },
  // C1
  { id:"q25", level:"C1", type:"qcm", question_fr:"Quel est le sens de 'etw. in Frage stellen'?", options:["Poser une question","Remettre en question","Répondre à une question","Ignorer"], correct:"Remettre en question", correct_index:1, explanation_fr:"in Frage stellen = remettre en cause", points:1 },
  { id:"q26", level:"C1", type:"qcm", question_fr:"Complétez : Angesichts ___ Situation müssen wir handeln.", options:["dieser","diesen","diesem","dieses"], correct:"dieser", correct_index:0, explanation_fr:"Angesichts + Genitiv : der Situation → dieser", points:1 },
  { id:"q27", level:"C1", type:"qcm", question_fr:"Que signifie 'die Ambivalenz'?", options:["L'ambiguïté","L'ambivalence","L'ambition","L'ambulance"], correct:"L'ambivalence", correct_index:1, explanation_fr:"Ambivalenz = sentiment contradictoire simultané", points:1 },
  { id:"q28", level:"C1", type:"qcm", question_fr:"Quel est l'équivalent de 'néanmoins'?", options:["deshalb","trotzdem","obwohl","damit"], correct:"trotzdem", correct_index:1, explanation_fr:"trotzdem = néanmoins/quand même", points:1 },
  { id:"q29", level:"C1", type:"qcm", question_fr:"Complétez : Je länger er wartete, ___ ungeduldiger wurde er.", options:["so","desto","umso","als"], correct:"desto", correct_index:1, explanation_fr:"je...desto = plus...plus (comparatif progressif)", points:1 },
  { id:"q30", level:"C1", type:"qcm", question_fr:"Que signifie 'etw. unter Beweis stellen'?", options:["Prouver quelque chose","Mettre sous preuve","Douter de quelque chose","Cacher quelque chose"], correct:"Prouver quelque chose", correct_index:0, explanation_fr:"unter Beweis stellen = démontrer/prouver", points:1 },
]

const FALLBACK_QUESTIONS_EN = [
  // A1
  { id:"q1", level:"A1", type:"qcm", question_fr:"How do you say 'hello' formally?", options:["Hallo","Guten Tag","Tschüss","Danke"], correct:"Guten Tag", correct_index:1, explanation_fr:"Guten Tag = formal hello", points:1 },
  { id:"q2", level:"A1", type:"qcm", question_fr:"Complete: Ich ___ Student.", options:["bin","bist","ist","sind"], correct:"bin", correct_index:0, explanation_fr:"ich → bin (I am)", points:1 },
  { id:"q3", level:"A1", type:"qcm", question_fr:"What is the article for 'Mann' (man)?", options:["die","das","der","den"], correct:"der", correct_index:2, explanation_fr:"Mann is masculine → der", points:1 },
  { id:"q4", level:"A1", type:"qcm", question_fr:"How do you say 'thank you'?", options:["Bitte","Danke","Ja","Nein"], correct:"Danke", correct_index:1, explanation_fr:"Danke = thank you", points:1 },
  { id:"q5", level:"A1", type:"qcm", question_fr:"What does 'Wie heißen Sie?' mean?", options:["How are you?","What is your name?","Where are you from?","How old are you?"], correct:"What is your name?", correct_index:1, explanation_fr:"heißen = to be called", points:1 },
  { id:"q6", level:"A1", type:"qcm", question_fr:"How do you say 'goodbye'?", options:["Hallo","Danke","Auf Wiedersehen","Bitte"], correct:"Auf Wiedersehen", correct_index:2, explanation_fr:"Auf Wiedersehen = formal goodbye", points:1 },
  // A2
  { id:"q7", level:"A2", type:"qcm", question_fr:"Complete: Ich ___ gestern ins Kino gegangen.", options:["bin","habe","wurde","hatte"], correct:"bin", correct_index:0, explanation_fr:"gehen → sein in the Perfekt", points:1 },
  { id:"q8", level:"A2", type:"qcm", question_fr:"What does 'Ich möchte ein Zimmer reservieren' mean?", options:["I want a ticket","I would like to book a room","I am looking for a restaurant","I want to leave"], correct:"I would like to book a room", correct_index:1, explanation_fr:"möchten = would like, Zimmer = room", points:1 },
  { id:"q9", level:"A2", type:"qcm", question_fr:"What is the plural of 'das Kind'?", options:["die Kinds","die Kinder","die Kindes","die Kinde"], correct:"die Kinder", correct_index:1, explanation_fr:"Kind → Kinder (irregular plural)", points:1 },
  { id:"q10", level:"A2", type:"qcm", question_fr:"Complete: Er arbeitet ___ einer Bank.", options:["in","bei","an","auf"], correct:"bei", correct_index:1, explanation_fr:"bei = at/for (employer)", points:1 },
  { id:"q11", level:"A2", type:"qcm", question_fr:"What does 'Könnten Sie bitte langsamer sprechen?' mean?", options:["Speak louder","Speak more slowly","Please repeat","Thank you"], correct:"Speak more slowly", correct_index:1, explanation_fr:"langsam = slow/slowly", points:1 },
  { id:"q12", level:"A2", type:"qcm", question_fr:"Complete: Wir ___ morgen nach Berlin.", options:["fahren","fahrst","fährt","geht"], correct:"fahren", correct_index:0, explanation_fr:"wir fahren = we go (by vehicle)", points:1 },
  // B1
  { id:"q13", level:"B1", type:"qcm", question_fr:"Which mood expresses a hypothesis?", options:["Indikativ","Imperativ","Konjunktiv II","Infinitiv"], correct:"Konjunktiv II", correct_index:2, explanation_fr:"Konjunktiv II = conditional / hypothetical", points:1 },
  { id:"q14", level:"B1", type:"qcm", question_fr:"Complete: Obwohl es regnete, ___ wir spazieren.", options:["gingen","gehen","gegangen","ginge"], correct:"gingen", correct_index:0, explanation_fr:"obwohl = although → Präteritum", points:1 },
  { id:"q15", level:"B1", type:"qcm", question_fr:"What does 'Ich lasse mir die Haare schneiden' mean?", options:["I cut my own hair","I am having my hair cut","I want to cut hair","I cut someone's hair"], correct:"I am having my hair cut", correct_index:1, explanation_fr:"lassen + infinitive = to have something done", points:1 },
  { id:"q16", level:"B1", type:"qcm", question_fr:"Which connector expresses consequence?", options:["obwohl","weil","deshalb","damit"], correct:"deshalb", correct_index:2, explanation_fr:"deshalb = therefore / that is why", points:1 },
  { id:"q17", level:"B1", type:"qcm", question_fr:"Complete: Das Buch, ___ ich lese, ist interessant.", options:["der","die","das","den"], correct:"das", correct_index:2, explanation_fr:"Buch is neuter → relative pronoun 'das'", points:1 },
  { id:"q18", level:"B1", type:"qcm", question_fr:"What does 'Es kommt darauf an' mean?", options:["It happens","It depends","It comes from there","It matters"], correct:"It depends", correct_index:1, explanation_fr:"Es kommt darauf an = it depends", points:1 },
  // B2
  { id:"q19", level:"B2", type:"qcm", question_fr:"Which register uses 'Man nehme...' in recipes?", options:["Imperative","Konjunktiv I","Präteritum","Futur II"], correct:"Konjunktiv I", correct_index:1, explanation_fr:"Konjunktiv I is used in recipes and reported speech", points:1 },
  { id:"q20", level:"B2", type:"qcm", question_fr:"Complete: ___ du früher gekommen wärst, hätten wir...", options:["Wenn","Als","Ob","Da"], correct:"Wenn", correct_index:0, explanation_fr:"wenn + Konjunktiv II = unreal past condition", points:1 },
  { id:"q21", level:"B2", type:"qcm", question_fr:"What does 'Das lässt sich nicht leugnen' mean?", options:["That cannot be denied","That cannot be seen","That cannot be learned","That cannot be changed"], correct:"That cannot be denied", correct_index:0, explanation_fr:"leugnen = to deny", points:1 },
  { id:"q22", level:"B2", type:"qcm", question_fr:"Which prefix makes 'möglich' negative?", options:["un-","in-","mis-","nicht-"], correct:"un-", correct_index:0, explanation_fr:"unmöglich = impossible", points:1 },
  { id:"q23", level:"B2", type:"qcm", question_fr:"Complete: Er bestand ___ seiner Meinung.", options:["auf","an","in","bei"], correct:"auf", correct_index:0, explanation_fr:"bestehen auf = to insist on", points:1 },
  { id:"q24", level:"B2", type:"qcm", question_fr:"What does 'die Nachhaltigkeit' mean?", options:["Sustainability","The night","Nature","Novelty"], correct:"Sustainability", correct_index:0, explanation_fr:"Nachhaltigkeit = sustainability", points:1 },
  // C1
  { id:"q25", level:"C1", type:"qcm", question_fr:"What does 'etw. in Frage stellen' mean?", options:["To ask a question","To call into question","To answer a question","To ignore"], correct:"To call into question", correct_index:1, explanation_fr:"in Frage stellen = to challenge / call into question", points:1 },
  { id:"q26", level:"C1", type:"qcm", question_fr:"Complete: Angesichts ___ Situation müssen wir handeln.", options:["dieser","diesen","diesem","dieses"], correct:"dieser", correct_index:0, explanation_fr:"Angesichts + Genitiv: der Situation → dieser", points:1 },
  { id:"q27", level:"C1", type:"qcm", question_fr:"What does 'die Ambivalenz' mean?", options:["Ambiguity","Ambivalence","Ambition","Ambulance"], correct:"Ambivalence", correct_index:1, explanation_fr:"Ambivalenz = ambivalence (mixed feelings)", points:1 },
  { id:"q28", level:"C1", type:"qcm", question_fr:"What is the equivalent of 'nevertheless'?", options:["deshalb","trotzdem","obwohl","damit"], correct:"trotzdem", correct_index:1, explanation_fr:"trotzdem = nevertheless / anyway", points:1 },
  { id:"q29", level:"C1", type:"qcm", question_fr:"Complete: Je länger er wartete, ___ ungeduldiger wurde er.", options:["so","desto","umso","als"], correct:"desto", correct_index:1, explanation_fr:"je...desto = the more...the more (progressive comparison)", points:1 },
  { id:"q30", level:"C1", type:"qcm", question_fr:"What does 'etw. unter Beweis stellen' mean?", options:["To prove something","To put under proof","To doubt something","To hide something"], correct:"To prove something", correct_index:0, explanation_fr:"unter Beweis stellen = to demonstrate / prove", points:1 },
]
