// Lot 7A · configuration centralisée des 5 parcours Monde.
//
// Record<MondePath, MondePathConfig> · exhaustivité TypeScript enforce
// que les 5 parcours sont couverts. AUCUNE donnée personnelle · uniquement
// des identifiants pilotant l'affichage (label i18n key, module central
// discriminated union, ordre des devoirs, etc.).

import type { MondePath } from "./mondePath";

export type PathModuleKind =
  | "ADMISSION_CHECKLIST"    // STUDIES
  | "INTERVIEW_TOPICS"       // WORK
  | "TRAVEL_SITUATIONS"      // TRAVEL
  | "EXAM_SKILLS"            // EXAM
  | "DAILY_TOPICS";          // DAILY_LIFE

export type PathStatisticDefinition = {
  key: string;               // i18n key sous studentMonde.ivory.stats.<key>
  format: "minutes" | "count" | "streak";
};

export interface MondePathConfig {
  code: MondePath;
  signalLabelKey: string;    // i18n · brief §6-10 (NEXT STOP · DÉPART DANS · EXAMEN DANS · ...)
  moduleKind: PathModuleKind;
  stepLabel: "STEP" | "BLOC";
  milestoneKey: string;      // i18n key studentMonde.ivory.milestone.<key>
  peerContextKey: string;    // i18n key studentMonde.ivory.peers.<key>
  priorityKey: string;       // i18n key studentMonde.ivory.priority.<key>
  statistics: readonly PathStatisticDefinition[];
}

export const MONDE_PATH_CONFIG: Readonly<Record<MondePath, MondePathConfig>> = {
  STUDIES: {
    code: "STUDIES",
    signalLabelKey: "signal.next_stop",
    moduleKind: "ADMISSION_CHECKLIST",
    stepLabel: "STEP",
    milestoneKey: "milestone.studies_a1",
    peerContextKey: "peers.studies",
    priorityKey: "priority.studies",
    statistics: [
      { key: "minutes_learned", format: "minutes" },
      { key: "streak_active",   format: "streak"  },
      { key: "assignments_done", format: "count"  },
    ],
  },
  WORK: {
    code: "WORK",
    signalLabelKey: "signal.next_stop",
    moduleKind: "INTERVIEW_TOPICS",
    stepLabel: "STEP",
    milestoneKey: "milestone.work_interview",
    peerContextKey: "peers.work",
    priorityKey: "priority.work",
    statistics: [
      { key: "minutes_learned",    format: "minutes" },
      { key: "oral_exercises",     format: "count"   },
      { key: "lexicon_words",      format: "count"   },
    ],
  },
  TRAVEL: {
    code: "TRAVEL",
    signalLabelKey: "signal.travel_countdown",
    moduleKind: "TRAVEL_SITUATIONS",
    stepLabel: "BLOC",
    milestoneKey: "milestone.travel_conversation",
    peerContextKey: "peers.travel",
    priorityKey: "priority.travel",
    statistics: [
      { key: "situations_ready", format: "count"   },
      { key: "useful_phrases",   format: "count"   },
      { key: "general_progress", format: "count"   },
    ],
  },
  EXAM: {
    code: "EXAM",
    signalLabelKey: "signal.exam_countdown",
    moduleKind: "EXAM_SKILLS",
    stepLabel: "BLOC",
    milestoneKey: "milestone.exam_day",
    peerContextKey: "peers.exam",
    priorityKey: "priority.exam",
    statistics: [
      { key: "mock_exams",       format: "count"   },
      { key: "avg_score",        format: "count"   },
      { key: "priority_skill",   format: "count"   },
    ],
  },
  DAILY_LIFE: {
    code: "DAILY_LIFE",
    signalLabelKey: "signal.next_stop",
    moduleKind: "DAILY_TOPICS",
    stepLabel: "STEP",
    milestoneKey: "milestone.daily_dinner",
    peerContextKey: "peers.daily",
    priorityKey: "priority.daily",
    statistics: [
      { key: "minutes_spoken",    format: "minutes" },
      { key: "topics_practiced",  format: "count"   },
      { key: "exchanges_done",    format: "count"   },
    ],
  },
} as const;

export function getPathConfig(path: MondePath): MondePathConfig {
  return MONDE_PATH_CONFIG[path];
}
