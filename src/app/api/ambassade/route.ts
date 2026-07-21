import { NextResponse } from "next/server"

// Feature IA supprimée. Voir AUDIT.md §11.
// Aucun appel fournisseur — réponse déterministe 410.
export async function POST() {
  return NextResponse.json(
    { error: "FEATURE_REMOVED", code: "AI_FEATURE_REMOVED" },
    { status: 410 },
  )
}

export async function GET() {
  return NextResponse.json(
    { error: "FEATURE_REMOVED", code: "AI_FEATURE_REMOVED" },
    { status: 410 },
  )
}
