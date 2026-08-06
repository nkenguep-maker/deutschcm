import { NextResponse } from "next/server";
import { DE_A1_COURSE } from "@/data/courses/registry";
import { buildA1AudioCoverage } from "@/lib/course-content/audio";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const units = buildA1AudioCoverage(DE_A1_COURSE.units);
  const lessons = units.flatMap((unit) => unit.lessons);
  const failedLessons = lessons.filter((lesson) => lesson.total === 0);
  const dialogueLines = lessons.reduce((sum, lesson) => sum + lesson.dialogue, 0);
  const phrases = lessons.reduce((sum, lesson) => sum + lesson.phrases, 0);
  const pronunciationDrills = lessons.reduce((sum, lesson) => sum + lesson.pronunciation, 0);

  const audit = {
    ok: failedLessons.length === 0 && units.length === 6 && lessons.length === 36,
    courseId: DE_A1_COURSE.course.id,
    unitCount: units.length,
    lessonCount: lessons.length,
    coveredLessons: lessons.length - failedLessons.length,
    dialogueLines,
    phrases,
    pronunciationDrills,
    failedLessons,
    units,
  };

  return NextResponse.json(audit, { status: audit.ok ? 200 : 500 });
}
