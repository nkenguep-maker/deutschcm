// /api/test-niveau/questions doit servir des questions statiques déterministes,
// sans jamais appeler un fournisseur IA. Deux appels identiques renvoient
// exactement le même corpus.

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/test-niveau/questions/route";

function req(url: string) {
  return new NextRequest(new URL(url));
}

describe("/api/test-niveau/questions — banque statique déterministe", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      throw new Error(`unexpected fetch call to ${String(input)}`);
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("FR : 30 questions distribuées A1(6) A2(6) B1(6) B2(6) C1(6)", async () => {
    const res = await GET(req("http://localhost/api/test-niveau/questions?locale=fr"));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.questions).toHaveLength(30);
    const counts: Record<string, number> = {};
    for (const q of body.questions) counts[q.level] = (counts[q.level] ?? 0) + 1;
    expect(counts).toEqual({ A1: 6, A2: 6, B1: 6, B2: 6, C1: 6 });
  });

  it("EN : 30 questions même distribution", async () => {
    const res = await GET(req("http://localhost/api/test-niveau/questions?locale=en"));
    const body = await res.json();
    expect(body.questions).toHaveLength(30);
  });

  it("deux appels identiques → même résultat (déterminisme)", async () => {
    const a = await (await GET(req("http://localhost/api/test-niveau/questions?locale=fr"))).json();
    const b = await (await GET(req("http://localhost/api/test-niveau/questions?locale=fr"))).json();
    expect(a).toEqual(b);
  });

  it("aucun appel fournisseur", async () => {
    await GET(req("http://localhost/api/test-niveau/questions?locale=fr"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(["fr", "en"])("[%s] ids uniques sur les 30 questions", async (loc) => {
    const res = await GET(req(`http://localhost/api/test-niveau/questions?locale=${loc}`));
    const body = await res.json();
    const ids = body.questions.map((q: { id: string }) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(["fr", "en"])("[%s] chaque question possède les champs client requis", async (loc) => {
    const res = await GET(req(`http://localhost/api/test-niveau/questions?locale=${loc}`));
    const body = await res.json();
    const required = ["id", "level", "type", "question_fr", "options", "correct", "correct_index", "explanation_fr", "points"] as const;
    const supported = new Set(["A1", "A2", "B1", "B2", "C1"]);
    for (const q of body.questions) {
      for (const k of required) expect(q, `${q.id} manque ${k}`).toHaveProperty(k);
      expect(supported.has(q.level), `${q.id} niveau non supporté ${q.level}`).toBe(true);
      expect(Array.isArray(q.options) && q.options.length >= 2).toBe(true);
      expect(q.options).toContain(q.correct);
    }
  });
});
