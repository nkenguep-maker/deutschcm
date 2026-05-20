import { NextResponse } from "next/server";
import { getProviderForFeature } from "@/lib/ai/types";

export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    ai: {
      openai: {
        hasKey: !!openaiKey,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini (default)",
      },
      gemini: {
        hasKey: !!geminiKey,
        model: process.env.GEMINI_MODEL || "gemini-1.5-pro (default)",
      },
    },
    routing: {
      simulator: getProviderForFeature("simulator"),
      writing: getProviderForFeature("writing"),
      speech: getProviderForFeature("speech"),
      quiz: getProviderForFeature("quiz"),
      levelTest: getProviderForFeature("level-test"),
      courseGen: getProviderForFeature("course-gen"),
    },
    features: {
      courseGeneration: process.env.ENABLE_COURSE_GENERATION ?? "unset",
    },
  });
}
