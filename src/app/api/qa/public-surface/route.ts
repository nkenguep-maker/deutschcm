import { NextResponse } from "next/server";
import { PUBLIC_SURFACE, isPubliclyLinked } from "@/lib/release/publicSurface";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const entries = Object.entries(PUBLIC_SURFACE).map(([id, definition]) => ({
    id,
    ...definition,
    publiclyLinked: isPubliclyLinked(id as keyof typeof PUBLIC_SURFACE),
  }));

  return NextResponse.json({
    ok: true,
    summary: {
      live: entries.filter((entry) => entry.status === "LIVE").length,
      beta: entries.filter((entry) => entry.status === "BETA").length,
      private: entries.filter((entry) => entry.status === "PRIVATE").length,
      hidden: entries.filter((entry) => entry.status === "HIDDEN").length,
    },
    entries,
  });
}
