// P4.3a · GET /api/center/teachers · pagination + search allowlist.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isCenterRealDataActive } from "@/lib/flags";
import { resolveCenterActor } from "@/lib/permissions/center";
import { getCenterTeachers } from "@/lib/center/queries";
import { mapErrorToResponse } from "@/lib/api/circleErrors";

export async function GET(request: NextRequest) {
  if (!isCenterRealDataActive()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const actor = await resolveCenterActor();
    const url = new URL(request.url);
    const result = await getCenterTeachers(actor.centerId, {
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 25),
      query: url.searchParams.get("query") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return mapErrorToResponse(e);
  }
}
