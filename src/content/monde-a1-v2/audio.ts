import {
  A1_V2_U1_AUDIO_OVERRIDES,
  A1_V2_U1_DIALOGUE,
  A1_V2_U1_DRILLS,
} from "./u1.support";
import {
  A1_V2_U2_AUDIO_OVERRIDES,
  A1_V2_U2_DIALOGUE,
  A1_V2_U2_DRILLS,
} from "./u2.support";
import {
  A1_V2_U3_AUDIO_OVERRIDES,
  A1_V2_U3_DIALOGUE,
  A1_V2_U3_DRILLS,
} from "./u3.support";
import { A1_V2_U4_AUDIO_OVERRIDES, A1_V2_U4_DIALOGUE, A1_V2_U4_DRILLS } from "./u4.support";
import { A1_V2_U5_AUDIO_OVERRIDES, A1_V2_U5_DIALOGUE, A1_V2_U5_DRILLS } from "./u5.support";
import {
  A1_V2_U6_AUDIO_OVERRIDES,
  A1_V2_U6_DIALOGUE,
  A1_V2_U6_DRILLS,
} from "./u6.support";
import {
  A1_V2_U7_AUDIO_OVERRIDES,
  A1_V2_U7_DIALOGUE,
  A1_V2_U7_DRILLS,
} from "./u7.support";
import {
  A1_V2_U8_AUDIO_OVERRIDES,
  A1_V2_U8_DIALOGUE,
  A1_V2_U8_DRILLS,
} from "./u8.support";

export type A1Dialogue = {
  id: string;
  title: string;
  context: string;
  audioStatus: string;
  lines: Array<{ id: string; speaker: string; de: string; fr: string }>;
};

export const A1_V2_DIALOGUES: Record<string, A1Dialogue> = {
  [A1_V2_U1_DIALOGUE.id]: A1_V2_U1_DIALOGUE,
  [A1_V2_U2_DIALOGUE.id]: A1_V2_U2_DIALOGUE,
  [A1_V2_U3_DIALOGUE.id]: A1_V2_U3_DIALOGUE,
  [A1_V2_U4_DIALOGUE.id]: A1_V2_U4_DIALOGUE,
  [A1_V2_U5_DIALOGUE.id]: A1_V2_U5_DIALOGUE,
  [A1_V2_U6_DIALOGUE.id]: A1_V2_U6_DIALOGUE,
  [A1_V2_U7_DIALOGUE.id]: A1_V2_U7_DIALOGUE,
  [A1_V2_U8_DIALOGUE.id]: A1_V2_U8_DIALOGUE,
};

export const A1_V2_AUDIO_OVERRIDES: Record<string, string> = {
  ...A1_V2_U1_AUDIO_OVERRIDES,
  ...A1_V2_U2_AUDIO_OVERRIDES,
  ...A1_V2_U3_AUDIO_OVERRIDES,
  ...A1_V2_U4_AUDIO_OVERRIDES,
  ...A1_V2_U5_AUDIO_OVERRIDES,
  ...A1_V2_U6_AUDIO_OVERRIDES,
  ...A1_V2_U7_AUDIO_OVERRIDES,
  ...A1_V2_U8_AUDIO_OVERRIDES,
};

export const A1_V2_DRILLS: Record<string, string> = {
  ...A1_V2_U1_DRILLS,
  ...A1_V2_U2_DRILLS,
  ...A1_V2_U3_DRILLS,
  ...A1_V2_U4_DRILLS,
  ...A1_V2_U5_DRILLS,
  ...A1_V2_U6_DRILLS,
  ...A1_V2_U7_DRILLS,
  ...A1_V2_U8_DRILLS,
};

export function getA1V2Dialogue(dialogueId?: string) {
  if (!dialogueId) return null;
  return A1_V2_DIALOGUES[dialogueId] ?? null;
}

export function resolveA1V2AudioText(ref?: string) {
  if (!ref) return null;
  const override = A1_V2_AUDIO_OVERRIDES[ref];
  if (override) return override;

  const separator = ref.indexOf("#");
  if (separator > 0) {
    const dialogueId = ref.slice(0, separator);
    const segmentId = ref.slice(separator + 1);
    const dialogue = getA1V2Dialogue(dialogueId);
    return dialogue?.lines.find((line) => line.id === segmentId)?.de ?? null;
  }

  return A1_V2_DRILLS[ref] ?? null;
}
