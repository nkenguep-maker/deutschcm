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
      const basePath = `/fr/qa/persona-preview/${contract.id}`;
      const pages = [];

      for (const [index, section] of contract.sections.entries()) {
        const requestedPath = index === 0 ? basePath : `${basePath}/view/${section.id}`;
        const url = new URL(requestedPath, origin);
        const response = await fetch(url, {
          cache: "no-store",
          redirect: "follow",
          headers: { "x-yema-persona-audit": "1" },
        });
        const html = await response.text();
        const dashboardMarker = `data-internal-persona-dashboard="${contract.id}"`;
        const activeMarker = `data-persona-active-section="${section.id}"`;
        const sectionMarker = `data-persona-section="${section.id}"`;
        const unexpectedSections = contract.sections
          .filter((candidate) => candidate.id !== section.id)
          .map((candidate) => candidate.id)
          .filter((candidateId) => html.includes(`data-persona-section="${candidateId}"`));

        pages.push({
          sectionId: section.id,
          requestedPath,
          finalUrl: response.url,
          status: response.status,
          rendered:
            response.ok &&
            html.includes(dashboardMarker) &&
            html.includes(activeMarker) &&
            html.includes(sectionMarker),
          unexpectedSections,
          redirectedToLogin: response.url.includes("/login"),
        });
      }

      return {
        id: contract.id,
        expectedPages: contract.sections.length,
        renderedPages: pages.filter((page) => page.rendered).length,
        missingPages: pages.filter((page) => !page.rendered).map((page) => page.sectionId),
        pages,
      };
    }),
  );

  const ok = results.every((result) =>
    result.pages.every(
      (page) =>
        page.status === 200 &&
        page.rendered &&
        page.unexpectedSections.length === 0 &&
        !page.redirectedToLogin,
    ),
  );

  return NextResponse.json(
    {
      ok,
      auditedAt: new Date().toISOString(),
      personaCount: results.length,
      pageCount: results.reduce((total, result) => total + result.expectedPages, 0),
      results,
    },
    { status: ok ? 200 : 500 },
  );
}
