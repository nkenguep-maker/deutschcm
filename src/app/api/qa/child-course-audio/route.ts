import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { resolveChildExerciseSpeech } from "@/lib/child-course-audio";

const ALLOWED_COURSES = new Set([
  "monde-child-de-a1",
  "racines-child-byv-e1",
  "racines-child-ln-e1",
]);

function instructionsFor(languageCode: string, languageLabel: string): string {
  if (languageCode === "de") {
    return "Speak natural German for a young child. Read only the supplied text, slowly and clearly, with short pauses. Do not translate, explain, or add words.";
  }
  if (languageCode === "ln") {
    return "Speak Lingala as used in the Democratic Republic of Congo for a young child. Read only the supplied text exactly as written, slowly and clearly, with short pauses. Do not translate, explain, or add words. This is a temporary QA voice pending native-speaker validation.";
  }
  return `Speak ${languageLabel} / Medumba (Bangangté, Cameroon) for a young child. Read only the supplied text exactly as written, slowly and clearly, with short pauses. Do not translate, explain, or add words. This is a temporary QA voice pending native-speaker validation.`;
}

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId") ?? "";
  const unitId = request.nextUrl.searchParams.get("unitId") ?? "";
  const lessonId = request.nextUrl.searchParams.get("lessonId") ?? "";
  const exerciseId = request.nextUrl.searchParams.get("exerciseId") ?? "";

  if (!ALLOWED_COURSES.has(courseId) || !unitId || !lessonId || !exerciseId) {
    return NextResponse.json({ error: "INVALID_AUDIO_TARGET" }, { status: 400 });
  }

  const target = resolveChildExerciseSpeech(courseId, unitId, lessonId, exerciseId);
  if (!target) {
    return NextResponse.json({ error: "AUDIO_TARGET_NOT_FOUND" }, { status: 404 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AUDIO_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: target.languageCode === "de" ? "marin" : target.languageCode === "ln" ? "coral" : "sage",
      input: target.text.slice(0, 1800),
      instructions: instructionsFor(target.languageCode, target.languageLabel),
      response_format: "mp3",
      speed: target.kind === "scene" ? 0.86 : 0.82,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Yema-Audio-Status": target.track === "racines" ? "qa-ai-native-review-required" : "qa-generated",
      },
    });
  } catch (error) {
    console.error("[child-course-audio] generation failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "AUDIO_GENERATION_FAILED" }, { status: 502 });
  }
}
