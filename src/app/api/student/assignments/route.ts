// P4.5-B2a · GET /api/student/assignments

import type { NextRequest } from "next/server";
import { runStudentRoute } from "@/lib/api/studentRouteHelper";
import { listStudentAssignments } from "@/lib/assignments/student";

export async function GET(_req: NextRequest) {
  return runStudentRoute(async (tx, actor) => {
    const assignments = await listStudentAssignments(tx, actor);
    return { assignments };
  });
}
