import { NextResponse } from "next/server";
import { runA1ValidationAudit } from "@/lib/course-content/a1Audit";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const audit = runA1ValidationAudit();
  return NextResponse.json(audit, { status: audit.ok ? 200 : 500 });
}
