import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_PERSONA_UI_CONTRACTS } from "@/features/dashboards/internal-test/contracts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const origin = request.nextUrl.origin;
  const contracts = Object.values(INTERNAL_PERSONA_UI_CONTRACTS);

  const results = await Promise.all(
    contracts.map(async (contract) => {
      const url = new URL(`/fr/qa/persona-preview/${contract.id}`, origin);
      const response = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        headers: { "x-yema-persona-audit": "1" },
      });
      const html = await response.text();
      const dashboardMarker = `data-internal-persona-dashboard="${contract.id}"`;
      const missingSections = contract.sections
        .map((section) => section.id)
        .filter((sectionId) => !html.includes(`data-persona-section="${sectionId}"`));

      return {
        id: contract.id,
        requestedPath: url.pathname,
        finalUrl: response.url,
        status: response.status,
        rendered: response.ok && html.includes(dashboardMarker),
        expectedSections: contract.sections.length,
        renderedSections: contract.sections.length - missingSections.length,
        missingSections,
        redirectedToLogin: response.url.includes("/login"),
      };
    }),
  );

  const ok = results.every(
    (result) =>
      result.status === 200 &&
      result.rendered &&
      result.missingSections.length === 0 &&
      !result.redirectedToLogin,
  );

  return NextResponse.json(
    {
      ok,
      auditedAt: new Date().toISOString(),
      personaCount: results.length,
      results,
    },
    { status: ok ? 200 : 500 },
  );
}
