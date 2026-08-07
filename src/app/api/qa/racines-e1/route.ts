import { NextResponse } from "next/server";
import { lingalaE1, medumbaE1, isRacinesCoursePubliclyReady } from "@/content/racines-e1-solo";

export const dynamic = "force-dynamic";

export async function GET() {
  const courses = [medumbaE1, lingalaE1].map((course) => ({
    courseId: course.course.id,
    language: course.course.learningLanguage.labelFr,
    status: course.status,
    stage: course.course.framework.stage,
    sequence: course.course.signatureSequence,
    units: course.units.length,
    lessons: course.units.reduce((sum, unit) => sum + unit.lessons.length, 0),
    exercises: course.units.reduce((sum, unit) => sum + unit.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.exercises.length, 0), 0),
    validation: "6/8",
    audioStatus: typeof course.audioManifest.status === "string" ? course.audioManifest.status : null,
    publiclyReady: isRacinesCoursePubliclyReady(course),
    nativeReviewRequired: course.status.includes("review-required"),
  }));

  return NextResponse.json({ ok: true, universe: "RACINES", persona: "solo", audience: "adulte", courses });
}
