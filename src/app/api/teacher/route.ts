// P4.3b · Endpoint legacy déprécié.
//
// Cette route acceptait des body/query permettant à un Teacher de créer un
// `assignment` sur un `classroomId` arbitraire ou de gradest une submission
// sans vérification d'ownership sur la classe/submission. Elle est
// remplacée par ·
//   `/api/teacher/{me,dashboard,classes,classes/[id],classes/[id]/students,students,schedule}`
// qui résolvent le Teacher via `resolveTeacherActor()` côté serveur et
// valident tout `classroomId` via `assertTeacherOwnsClassroom`.
//
// Les workflows d'assignments et de grading appartiennent à P4.5 (avec
// contrôle d'ownership sur `AssignmentSubmission.assignment.classroom`).
// La création directe de classroom par le Teacher est reportée au workflow
// signé P4.3b/P4.4. Aucun consommateur interne restant.
//
// Réponse stable · `404 teacher_endpoint_deprecated` pour tous les verbes.

import { NextResponse } from "next/server";

function deprecated() {
  return NextResponse.json(
    { error: "Not found", code: "teacher_endpoint_deprecated" },
    { status: 404 },
  );
}

export async function GET() { return deprecated(); }
export async function POST() { return deprecated(); }
export async function PUT() { return deprecated(); }
export async function PATCH() { return deprecated(); }
export async function DELETE() { return deprecated(); }
