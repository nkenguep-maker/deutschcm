// P1 · Auto-évaluation déclarative · Monde 5 CECRL, Racines 5 É1-É5.
//
// Doctrine §12-13, hardening §2-3 : ni test certifiant, ni IA. Chaque
// réponse est déclarative, indicative, corrigeable. La distinction :
//
//   selfAssessmentAnswer : id 1..5 du choix effectué par l'utilisateur
//   declaredLevel        : niveau exprimé par le user (Monde CECR ou Racines É)
//   recommendedLevel     : niveau que YEMA recommande (peut différer si le user
//                          se sous-estime — pour l'instant, égal à declaredLevel)

import type { CefrLevel, RacinesStep } from "./funnel-state";

export interface SelfAssessmentOption<Level extends string> {
  id: 1 | 2 | 3 | 4 | 5;
  level: Level;
  labelFr: string;
  labelEn: string;
}

export const MONDE_OPTIONS: SelfAssessmentOption<CefrLevel>[] = [
  { id: 1, level: "A1", labelFr: "Je débute complètement.",                              labelEn: "I'm starting from scratch." },
  { id: 2, level: "A1", labelFr: "Je connais quelques mots et expressions.",             labelEn: "I know a few words and phrases." },
  { id: 3, level: "A2", labelFr: "Je comprends et utilise des phrases simples.",          labelEn: "I understand and use simple sentences." },
  { id: 4, level: "B1", labelFr: "Je peux tenir une conversation sur des sujets courants.", labelEn: "I can hold a conversation on everyday topics." },
  { id: 5, level: "B2", labelFr: "Je communique avec aisance dans la plupart des situations.", labelEn: "I communicate comfortably in most situations." },
];

export const RACINES_OPTIONS: SelfAssessmentOption<RacinesStep>[] = [
  { id: 1, level: "E1", labelFr: "Je découvre cette langue.",                             labelEn: "I'm discovering this language." },
  { id: 2, level: "E2", labelFr: "Je reconnais quelques mots et expressions.",             labelEn: "I recognise a few words and phrases." },
  { id: 3, level: "E3", labelFr: "Je peux dire des phrases simples.",                      labelEn: "I can say simple sentences." },
  { id: 4, level: "E4", labelFr: "Je peux tenir une conversation.",                        labelEn: "I can hold a conversation." },
  { id: 5, level: "E5", labelFr: "Je veux mieux raconter, échanger et transmettre.",        labelEn: "I want to tell, exchange and transmit better." },
];

/** Recommandation Monde · pour l'instant identique au niveau déclaré. */
export function recommendMondeLevel(declared: CefrLevel): CefrLevel {
  return declared;
}

/** Recommandation Racines · idem. */
export function recommendRacinesStep(declared: RacinesStep): RacinesStep {
  return declared;
}

// Persistance dans onboardingAnswers (JSON de LearningPath) · voir funnel-state.
// Clés utilisées à partir de P1 hardening :
//   selfAssessmentAnswer : 1..5
//   declaredLevel        : CefrLevel (Monde) OU RacinesStep (Racines)
//   recommendedLevel     : CefrLevel (Monde) OU RacinesStep (Racines)
// Les anciennes clés cefrSelfAssessed / racinesStep restent lues pour rétro-compat
// (voir deriveFunnelStep).
