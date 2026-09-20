export type A1MockExamChoice = { id: string; text: string };
export type A1MockExamItem = {
  id: string;
  kind: "listening-mcq" | "reading-mcq" | "writing" | "speaking";
  prompt: string;
  maxPoints: number;
  audioRef?: string;
  audioScript?: string;
  stimulus?: string;
  choices?: A1MockExamChoice[];
  correctChoiceId?: string;
  minWords?: number;
  maxWords?: number;
  preparationSeconds?: number;
  targetSeconds?: number;
  checklist?: string[];
};
export type A1MockExamSection = {
  id: "hoeren" | "lesen" | "schreiben" | "sprechen";
  title: string;
  durationMinutes: number;
  maxPoints: number;
  items: A1MockExamItem[];
};
export type A1MockExam = {
  id: "de-a1-mock-a" | "de-a1-mock-b";
  title: string;
  version: string;
  status: "QA_DETAILED";
  durationMinutes: number;
  maxPoints: 60;
  disclaimer: string;
  sections: A1MockExamSection[];
};

const c=(id:string,text:string):A1MockExamChoice=>({id,text});
const listening=(id:string,prompt:string,audioScript:string,choices:A1MockExamChoice[],correctChoiceId:string):A1MockExamItem=>({
  id,kind:"listening-mcq",prompt,audioRef:`mock.${id}`,audioScript,choices,correctChoiceId,maxPoints:2,
});
const reading=(id:string,prompt:string,stimulus:string,choices:A1MockExamChoice[],correctChoiceId:string):A1MockExamItem=>({
  id,kind:"reading-mcq",prompt,stimulus,choices,correctChoiceId,maxPoints:2,
});
const writing=(id:string,prompt:string,minWords:number,maxWords:number,checklist:string[]):A1MockExamItem=>({
  id,kind:"writing",prompt,minWords,maxWords,checklist,maxPoints:8,
});
const speaking=(id:string,prompt:string,maxPoints:number,preparationSeconds:number,targetSeconds:number,checklist:string[]):A1MockExamItem=>({
  id,kind:"speaking",prompt,maxPoints,preparationSeconds,targetSeconds,checklist,
});

const disclaimer="Simulation interne YEMA, non officielle, sans affiliation à un organisme d’examen ou de certification.";

export const A1_V2_MOCK_EXAMS:A1MockExam[]=[
  {
    id:"de-a1-mock-a",title:"YEMA A1 · Probeprüfung A",version:"2026.09.20-mock-a-r1",status:"QA_DETAILED",durationMinutes:65,maxPoints:60,disclaimer,
    sections:[
      {id:"hoeren",title:"Hören",durationMinutes:15,maxPoints:12,items:[
        listening("a-h1","Von welchem Gleis fährt der Zug?","Der Regionalzug nach Potsdam fährt heute von Gleis vier. Die Abfahrt ist um neun Uhr zehn.",[c("a","Gleis 4"),c("b","Gleis 9"),c("c","Gleis 10")],"a"),
        listening("a-h2","Was bestellt die Person?","Ich hätte gern einen Kaffee mit Milch, aber ohne Zucker, bitte.",[c("a","Kaffee mit Milch, ohne Zucker"),c("b","Tee mit Zucker"),c("c","Wasser ohne Kohlensäure")],"a"),
        listening("a-h3","Wann ist der Termin?","Ihr Termin ist am Dienstag um halb elf.",[c("a","Dienstag, 10:30 Uhr"),c("b","Dienstag, 11:30 Uhr"),c("c","Donnerstag, 10:30 Uhr")],"a"),
        listening("a-h4","Wann arbeitet die Person?","Ich arbeite von Montag bis Freitag von acht bis sechzehn Uhr.",[c("a","Mo–Fr, 8–16 Uhr"),c("b","Mo–Sa, 8–16 Uhr"),c("c","Mo–Fr, 10–18 Uhr")],"a"),
        listening("a-h5","Was hat die Wohnung?","Die Wohnung hat zwei Zimmer und einen Balkon. Die Miete ist achthundertfünfzig Euro.",[c("a","Zwei Zimmer und Balkon"),c("b","Drei Zimmer ohne Balkon"),c("c","Ein Zimmer und Terrasse")],"a"),
        listening("a-h6","Was soll die Person machen?","Bitte tragen Sie hier Ihre Telefonnummer ein und unterschreiben Sie unten.",[c("a","Telefonnummer eintragen und unterschreiben"),c("b","Nur die Adresse sagen"),c("c","Eine Fahrkarte kaufen")],"a"),
      ]},
      {id:"lesen",title:"Lesen",durationMinutes:15,maxPoints:12,items:[
        reading("a-r1","Wann ist das Geschäft wieder offen?","HEUTE GESCHLOSSEN. MORGEN AB 9 UHR GEÖFFNET.",[c("a","Morgen ab 9 Uhr"),c("b","Heute ab 9 Uhr"),c("c","Morgen ab 19 Uhr")],"a"),
        reading("a-r2","Wann und wo ist das Treffen?","Hallo Mia, ich kann heute nicht. Treffen wir uns morgen um 18 Uhr vor dem Kino?",[c("a","Morgen 18 Uhr vor dem Kino"),c("b","Heute 18 Uhr am Bahnhof"),c("c","Morgen 8 Uhr im Kino")],"a"),
        reading("a-r3","Was stimmt?","Wohnung: 2 Zimmer, Balkon, 800 Euro Miete, ab November frei.",[c("a","Die Wohnung ist ab November frei."),c("b","Die Wohnung kostet 600 Euro."),c("c","Die Wohnung hat keinen Balkon.")],"a"),
        reading("a-r4","Welche Verbindung passt?","Bus 100: Zentrum 14:10 → Bahnhof 14:25. Bus 200: Zentrum 14:20 → Universität 14:35.",[c("a","Bus 100 zum Bahnhof"),c("b","Bus 200 zum Bahnhof"),c("c","Bus 100 zur Universität")],"a"),
        reading("a-r5","Wann ist die Praxis geschlossen?","Praxis Berger: Montag–Donnerstag 8–17 Uhr, Freitag 8–12 Uhr, Samstag/Sonntag geschlossen.",[c("a","Samstag und Sonntag"),c("b","Freitagvormittag"),c("c","Montag")],"a"),
        reading("a-r6","Was soll Amir mitbringen?","Hallo Amir, bitte bring morgen deinen Ausweis und das ausgefüllte Formular mit. Termin: 9:30 Uhr.",[c("a","Ausweis und Formular"),c("b","Nur Geld"),c("c","Fahrkarte und Foto")],"a"),
      ]},
      {id:"schreiben",title:"Schreiben",durationMinutes:20,maxPoints:16,items:[
        writing("a-w1","Du kannst ein Treffen heute nicht schaffen. Schreibe einer Person eine kurze Nachricht: Grund, neuer Tag, Uhrzeit und Treffpunkt.",35,55,["Anrede","kurzer Grund","neuer Tag","Uhrzeit","Treffpunkt","freundlicher Abschluss"]),
        writing("a-w2","Du brauchst einen Termin bei einem Service. Schreibe eine kurze Nachricht mit Name, Grund, möglicher Zeit und Telefonnummer.",40,60,["Name","Grund","Zeitfenster","Telefonnummer","Bitte um Bestätigung"]),
      ]},
      {id:"sprechen",title:"Sprechen",durationMinutes:15,maxPoints:20,items:[
        speaking("a-s1","Stell dich kurz vor: Name, Herkunft, Wohnort, Sprachen, Arbeit/Studium und eine Freizeitaktivität.",6,30,60,["mindestens fünf Informationen","verständliche kurze Sätze","passende A1-Strukturen","keine freie Aussprache-Automatik"]),
        speaking("a-s2","Frage-Antwort-Karten: Familie, Wohnung und Arbeit. Stelle zu jedem Thema eine einfache Frage und beantworte eine Gegenfrage.",6,45,90,["drei passende Fragen","drei Antworten","Verbposition verständlich","Reparatur bei Bedarf"]),
        speaking("a-s3","Rollenspiel: Im Café bestellen, eine Präferenz nennen, nach dem Preis fragen und bezahlen.",8,30,90,["Bestellung","mit/ohne","Preisfrage","Zahlung","höflicher Abschluss"]),
      ]},
    ],
  },
  {
    id:"de-a1-mock-b",title:"YEMA A1 · Probeprüfung B",version:"2026.09.20-mock-b-r1",status:"QA_DETAILED",durationMinutes:65,maxPoints:60,disclaimer,
    sections:[
      {id:"hoeren",title:"Hören",durationMinutes:15,maxPoints:12,items:[
        listening("b-h1","Welche Jacke möchte die Person?","Ich suche eine schwarze Jacke in Größe M. Kann ich sie anprobieren?",[c("a","Schwarz, Größe M"),c("b","Blau, Größe S"),c("c","Rot, Größe L")],"a"),
        listening("b-h2","Wie ist das Wetter am Samstag?","Am Samstag ist es kühl und windig. Am Sonntag ist es warm und sonnig.",[c("a","Kühl und windig"),c("b","Warm und sonnig"),c("c","Es schneit")],"a"),
        listening("b-h3","Was ist das Problem?","Guten Morgen. Ich habe Kopfschmerzen und Fieber. Ich brauche einen Termin.",[c("a","Kopfschmerzen und Fieber"),c("b","Nur Zahnschmerzen"),c("c","Kein Problem")],"a"),
        listening("b-h4","Wie geht der Weg?","Gehen Sie geradeaus und an der zweiten Kreuzung rechts. Die Bank ist neben der Apotheke.",[c("a","Geradeaus, dann rechts"),c("b","Links, dann geradeaus"),c("c","Nur mit dem Bus")],"a"),
        listening("b-h5","Wer ist Lea?","Das ist meine Schwester Lea. Sie ist zwanzig Jahre alt und studiert in Köln.",[c("a","Die Schwester, 20, Studentin"),c("b","Die Mutter, 40, Lehrerin"),c("c","Die Kollegin, 20, Verkäuferin")],"a"),
        listening("b-h6","Was möchte die Person?","Entschuldigung, ich verstehe das Wort nicht. Können Sie es bitte buchstabieren?",[c("a","Das Wort buchstabiert hören"),c("b","Einen Preis wissen"),c("c","Ein Ticket kaufen")],"a"),
      ]},
      {id:"lesen",title:"Lesen",durationMinutes:15,maxPoints:12,items:[
        reading("b-r1","Wann kann man einkaufen?","Supermarkt: Mo–Sa 7–21 Uhr. Sonntag geschlossen.",[c("a","Samstag um 20 Uhr"),c("b","Sonntag um 10 Uhr"),c("c","Montag um 22 Uhr")],"a"),
        reading("b-r2","Wann fährt der Zug?","Berlin → Leipzig, Freitag 16:40, Gleis 8, Ankunft 18:05.",[c("a","Freitag 16:40"),c("b","Freitag 18:05"),c("c","Samstag 16:40")],"a"),
        reading("b-r3","Was sucht die Firma?","Kleine Bäckerei sucht Verkäufer/in. Arbeitszeit: Montag–Freitag, 7–13 Uhr. Deutsch A1/A2 reicht.",[c("a","Verkäufer/in vormittags"),c("b","Fahrer/in nachts"),c("c","Lehrer/in am Wochenende")],"a"),
        reading("b-r4","Welche Information stimmt?","Zimmer frei ab 1. Oktober. Möbliert, ruhig, 450 Euro im Monat. Küche und Bad gemeinsam.",[c("a","Möbliert und ab Oktober frei"),c("b","800 Euro im Monat"),c("c","Eigenes Bad")],"a"),
        reading("b-r5","Wann ist der Termin?","Bestätigung: Praxis König, Mittwoch, 15:20 Uhr. Bitte zehn Minuten früher kommen.",[c("a","Mittwoch 15:20 Uhr"),c("b","Donnerstag 15:20 Uhr"),c("c","Mittwoch 16:20 Uhr")],"a"),
        reading("b-r6","Was plant Noor?","Am Wochenende fahre ich nach Dresden. Samstag besuche ich Freunde, Sonntag fahre ich zurück.",[c("a","Samstag Freunde besuchen, Sonntag zurück"),c("b","Sonntag hinfahren"),c("c","Eine Woche bleiben")],"a"),
      ]},
      {id:"schreiben",title:"Schreiben",durationMinutes:20,maxPoints:16,items:[
        writing("b-w1","Du interessierst dich für ein Zimmer. Schreibe eine kurze Anfrage: Name, gewünschter Einzug, eine Frage zur Miete und eine Frage zur Wohnung.",40,60,["Name","Einzugstermin","Mietfrage","Wohnungsfrage","freundlicher Abschluss"]),
        writing("b-w2","Schreibe einer Person über einen kurzen Wochenendtrip: Ziel, Tag, Verkehrsmittel, eine Aktivität und Rückkehr.",40,60,["Ziel","Tag/Datum","Verkehrsmittel","Aktivität","Rückkehr"]),
      ]},
      {id:"sprechen",title:"Sprechen",durationMinutes:15,maxPoints:20,items:[
        speaking("b-s1","Sprich kurz über Arbeit oder Studium: Tätigkeit, Ort, Zeiten, zwei Aufgaben und eine Fähigkeit.",6,30,60,["Tätigkeit","Ort","Zeit","Aufgaben","Ich kann…"]),
        speaking("b-s2","Frage-Antwort-Karten: Gesundheit, Reise und Wohnung. Stelle je eine einfache Frage und reagiere auf eine Antwort.",6,45,90,["drei Fragen","verständliche Reaktionen","Reparaturblock bei Bedarf","A1-Wortschatz"]),
        speaking("b-s3","Rollenspiel: Du suchst den Bahnhof, prüfst die Wegbeschreibung mit also und kaufst danach eine Fahrkarte.",8,30,100,["höfliche Wegfrage","zwei Richtungen","also-Reformulierung","Ticketziel","Zusatzfrage"]),
      ]},
    ],
  },
];

export function getA1V2MockExam(examId:string){
  return A1_V2_MOCK_EXAMS.find((exam)=>exam.id===examId)??null;
}
