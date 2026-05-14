import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getCached, setCached, cacheKey } from "@/lib/geminiCache"

export async function GET() {
  const key = cacheKey("test-niveau", "questions", "v1")
  const cached = getCached(key)
  if (cached) return NextResponse.json({ success: true, questions: cached, fromCache: true })

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.2, maxOutputTokens: 4000, responseMimeType: "application/json" }
  })

  const prompt = `Génère exactement 30 questions de test de niveau allemand CEFR pour apprenants francophones.
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
}`

  try {
    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text().replace(/```json|```/g, "").trim())
    setCached(key, parsed.questions)
    return NextResponse.json({ success: true, questions: parsed.questions })
  } catch {
    return NextResponse.json({ success: true, questions: FALLBACK_QUESTIONS, fromCache: false })
  }
}

const FALLBACK_QUESTIONS = [
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
