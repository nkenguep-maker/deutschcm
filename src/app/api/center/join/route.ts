// P4.3a hardening · Endpoint legacy déprécié.
//
// Cette route permettait à n'importe quel utilisateur authentifié d'attacher
// son compte à un `LanguageCenter` en fournissant un code (`{code}`). Le
// workflow attribuait immédiatement `user.centerId = center.id` sans ·
//   · validation par un administrateur du centre ;
//   · rate limiting sur les tentatives de code ;
//   · expiration du code ;
//   · résistance à l'énumération (`<3letter>-<4chars base36>` = ~1,7M).
//
// Aucun client interne n'utilise cette route (grep exhaustif). Le workflow
// d'attachement Student ↔ Center appartient à P4.3b (invitations signées,
// validation admin, TTL). On répond 404 stable pour tout verbe · aucun
// oracle sur l'existence d'un centre via code.

import { NextResponse } from "next/server";

function deprecated() {
  return NextResponse.json(
    { error: "Not found", code: "center_join_deprecated" },
    { status: 404 },
  );
}

export async function GET() { return deprecated(); }
export async function POST() { return deprecated(); }
export async function PUT() { return deprecated(); }
export async function PATCH() { return deprecated(); }
export async function DELETE() { return deprecated(); }
