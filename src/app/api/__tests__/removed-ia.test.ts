// Ces tests garantissent que les 6 routes IA neutralisées :
//   1. renvoient exactement 410 + { error: "FEATURE_REMOVED", code: "AI_FEATURE_REMOVED" }
//   2. n'appellent AUCUN fournisseur externe (fetch, OpenAI SDK, Gemini SDK)
// Voir AUDIT.md §11 · plan A.1.

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { POST as ttsPost } from "@/app/api/tts/route";
import { POST as quizGenPost } from "@/app/api/quiz/generate/route";
import { POST as speechPost } from "@/app/api/speech/analyze/route";
import { POST as schreibenPost } from "@/app/api/schreiben/analyze/route";
import { POST as ambassadePost } from "@/app/api/ambassade/route";
import { POST as coursesGenPost } from "@/app/api/courses/generate/route";

const REMOVED_ROUTES = [
  { name: "POST /api/tts", handler: ttsPost },
  { name: "POST /api/quiz/generate", handler: quizGenPost },
  { name: "POST /api/speech/analyze", handler: speechPost },
  { name: "POST /api/schreiben/analyze", handler: schreibenPost },
  { name: "POST /api/ambassade", handler: ambassadePost },
  { name: "POST /api/courses/generate", handler: coursesGenPost },
] as const;

describe("IA routes neutralized (410)", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Toute tentative d'appel réseau fait échouer le test.
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      throw new Error(`unexpected fetch call to ${String(input)}`);
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  for (const { name, handler } of REMOVED_ROUTES) {
    it(`${name} → 410 sans appel fournisseur`, async () => {
      const res = await handler();
      expect(res.status).toBe(410);
      const body = await res.json();
      expect(body).toEqual({ error: "FEATURE_REMOVED", code: "AI_FEATURE_REMOVED" });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  }
});
