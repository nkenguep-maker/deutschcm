import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { A1_V2_UNITS, MONDE_A1_V2_MANIFEST } from "@/content/monde-a1-v2";
import { getA1V2Dialogue } from "@/content/monde-a1-v2/audio";
import {
  a1NativeAudioPublicPath,
  buildA1V2NativeAudioInventory,
} from "@/content/monde-a1-v2/native-audio";

const REPO = resolve(__dirname, "../../..");

describe("German A1 refonte v2 audio coverage", () => {
  it("resolves every required QA audio script across all 12 units", () => {
    expect(A1_V2_UNITS).toHaveLength(12);
    const inventory = buildA1V2NativeAudioInventory();

    expect(inventory.length).toBeGreaterThan(100);
    expect(new Set(inventory.map((asset) => asset.ref)).size).toBe(inventory.length);
    expect(inventory.every((asset) => asset.text.trim().length > 0)).toBe(true);
    expect(inventory.every((asset) => asset.publicPath === a1NativeAudioPublicPath(asset.ref))).toBe(true);
  });

  it("includes every line of every referenced unit dialogue in the native-audio inventory", () => {
    const inventoryRefs = new Set(buildA1V2NativeAudioInventory().map((asset) => asset.ref));

    for (const unit of A1_V2_UNITS) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (block.type !== "dialogueRef" || !block.dialogueId) continue;
          const dialogue = getA1V2Dialogue(block.dialogueId);
          expect(dialogue, block.dialogueId).toBeTruthy();
          for (const line of dialogue!.lines) {
            expect(inventoryRefs.has(`${dialogue!.id}#${line.id}`), `${unit.id}:${line.id}`).toBe(true);
          }
        }
      }
    }
  });

  it("keeps critical native audio fail-closed until every deterministic MP3 exists", () => {
    const inventory = buildA1V2NativeAudioInventory();
    const missing = inventory.filter((asset) => {
      const relative = asset.publicPath.replace(/^\//, "");
      return !existsSync(resolve(REPO, "public", relative));
    });

    if (MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady) {
      expect(missing, "criticalNativeAudioReady=true requires every native MP3").toHaveLength(0);
    } else {
      expect(missing.length).toBeGreaterThan(0);
    }

    expect(MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady).toBe(false);
    expect(MONDE_A1_V2_MANIFEST.status).toBe("REFONTE_IN_PROGRESS");
  });

  it("never treats QA browser/TTS scripts as final native recordings", () => {
    const inventory = buildA1V2NativeAudioInventory();
    expect(inventory.some((asset) => asset.kind === "dialogue")).toBe(true);
    expect(inventory.some((asset) => asset.kind === "exercise")).toBe(true);
    expect(inventory.some((asset) => asset.kind === "shadowing")).toBe(true);
    expect(inventory.some((asset) => asset.kind === "mock-exam")).toBe(true);
    expect(MONDE_A1_V2_MANIFEST.readiness.criticalNativeAudioReady).toBe(false);
  });
});
