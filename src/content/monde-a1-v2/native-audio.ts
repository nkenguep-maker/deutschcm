import { A1_V2_UNITS } from "./index";
import { getA1V2Dialogue, resolveA1V2AudioText } from "./audio";

export type A1NativeAudioAssetKind = "dialogue" | "exercise" | "shadowing" | "card";

export type A1NativeAudioAsset = {
  ref: string;
  kind: A1NativeAudioAssetKind;
  unitId: string;
  lessonId?: string;
  text: string;
  publicPath: string;
};

export function a1NativeAudioPublicPath(ref: string) {
  const stem = ref.replace(/[^a-zA-Z0-9._-]+/g, "--");
  return `/audio/monde-a1-v2/native/${stem}.mp3`;
}

export function buildA1V2NativeAudioInventory(): A1NativeAudioAsset[] {
  const byRef = new Map<string, A1NativeAudioAsset>();

  const add = (
    ref: string,
    kind: A1NativeAudioAssetKind,
    unitId: string,
    lessonId?: string,
  ) => {
    if (byRef.has(ref)) return;
    byRef.set(ref, {
      ref,
      kind,
      unitId,
      lessonId,
      text: resolveA1V2AudioText(ref) ?? "",
      publicPath: a1NativeAudioPublicPath(ref),
    });
  };

  for (const unit of A1_V2_UNITS) {
    for (const card of unit.cards) {
      if (card.audioRef) add(card.audioRef, "card", unit.id, card.introducedIn);
    }

    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        if (block.type !== "dialogueRef" || !block.dialogueId) continue;
        const dialogue = getA1V2Dialogue(block.dialogueId);
        if (!dialogue) {
          throw new Error(`A1_NATIVE_AUDIO_DIALOGUE_NOT_FOUND:${block.dialogueId}`);
        }
        for (const line of dialogue.lines) {
          add(`${dialogue.id}#${line.id}`, "dialogue", unit.id, lesson.id);
        }
      }

      for (const exercise of lesson.exercises) {
        if (exercise.audioRef) add(exercise.audioRef, "exercise", unit.id, lesson.id);
        for (const target of exercise.targets ?? []) {
          add(target.audioRef, "shadowing", unit.id, lesson.id);
        }
      }
    }
  }

  return [...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref));
}
