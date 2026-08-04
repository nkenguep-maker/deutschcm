import { NextResponse } from "next/server";
import { INTERNAL_PERSONA_UI_CONTRACTS } from "@/features/dashboards/internal-test/contracts";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    personas: Object.values(INTERNAL_PERSONA_UI_CONTRACTS).map((contract) => ({
      id: contract.id,
      route: contract.route,
      universe: contract.universe,
      tabs: contract.tabs.map((tab) => tab.id),
      sections: contract.sections.map((section) => ({ id: section.id, kind: section.kind })),
      sectionCount: contract.sections.length,
    })),
  });
}
