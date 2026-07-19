// POST /api/events — tracker discret pour événements publics
// (polyglot.seen, seuil.miniplayer.open, etc.).
// Non authentifié. Log console + best-effort. Ne casse jamais le front.

import { NextResponse } from "next/server";

interface EventPayload {
  event?: string;
  lang?: string;
  locale?: string;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EventPayload;
    // On log serveur — un vrai pipeline analytics (Umami, Plausible,
    // ou table SQL) sera branché plus tard. La signature n'aura pas
    // à changer côté client.
    console.log("[event]", body.event ?? "unknown", body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[events] parse error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
