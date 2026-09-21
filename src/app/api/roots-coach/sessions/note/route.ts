import { NextRequest, NextResponse } from "next/server";
import { isRootsCoachWorkspaceActive } from "@/lib/flags";
import { resolveRootsCoachActor } from "@/lib/permissions/rootsCoach";
import { mapErrorToResponse } from "@/lib/api/circleErrors";
import { isSameOriginRequest } from "@/lib/security/requestOrigin";
import { upsertRootsCoachSessionNote } from "@/lib/rootsCoach/sessions";

export async function PUT(req: NextRequest) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "origin_mismatch" }, { status: 403 });
  if (!isRootsCoachWorkspaceActive()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const actor = await resolveRootsCoachActor();
    const body = (await req.json().catch(() => ({}))) as { sessionId?: unknown; body?: unknown };
    if (typeof body.sessionId !== "string" || body.sessionId.length < 4) return NextResponse.json({ error: "session_required" }, { status: 400 });
    if (typeof body.body !== "string") return NextResponse.json({ error: "note_required" }, { status: 400 });
    const note = body.body.trim();
    if (note.length < 1 || note.length > 2000) return NextResponse.json({ error: "note_length_invalid" }, { status: 400 });
    const updated = await upsertRootsCoachSessionNote({ coachUserId: actor.userId, sessionId: body.sessionId, body: note });
    if (!updated) return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapErrorToResponse(error);
  }
}
