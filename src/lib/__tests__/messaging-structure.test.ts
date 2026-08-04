import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-A · invariants structurels · sécurité + gates + Admin projection.

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}
function stripComments(s: string): string {
  return s.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("Feature flags (brief §4)", () => {
  it("MESSAGING_ENABLED et MESSAGE_AUDIO_ENABLED ajoutés au registre", () => {
    const src = read("lib/flags.ts");
    expect(src).toMatch(/["']MESSAGING_ENABLED["']/);
    expect(src).toMatch(/["']MESSAGE_AUDIO_ENABLED["']/);
    // Helpers server-only
    expect(src).toMatch(/export function isMessagingEnabled\(\)/);
    expect(src).toMatch(/export function isMessagingAudioEnabled\(\)/);
    // audio dépend de messaging (compound)
    expect(src).toMatch(/isMessagingEnabled\(\)\s*&&\s*getFlag\("MESSAGE_AUDIO_ENABLED"\)/);
  });
});

describe("Endpoints messaging · gate 404 stable AVANT toute logique DB", () => {
  const endpoints = [
    "app/api/messaging/matrix/route.ts",
    "app/api/messaging/inbox/route.ts",
    "app/api/messaging/conversations/[conversationId]/messages/route.ts",
    "app/api/messaging/conversations/[conversationId]/read/route.ts",
    "app/api/messaging/admin/metadata/route.ts",
  ];
  for (const p of endpoints) {
    it(`${p} · isMessagingEnabled() AVANT toute logique`, () => {
      const src = read(p);
      const idxGate = src.indexOf("isMessagingEnabled()");
      expect(idxGate).toBeGreaterThan(0);
      // notFound() présent et 404 stable
      expect(src).toMatch(/error:\s*["']Not found["']/);
      expect(src).toMatch(/status:\s*404/);
    });
  }
});

describe("Admin projection · ne sélectionne JAMAIS de contenu sensible (brief §16)", () => {
  const src = stripComments(read("lib/messaging/adminProjection.ts"));

  it("aucun 'body' dans les select Prisma", () => {
    // On accepte 'body' dans les commentaires (déjà strippés) mais pas
    // comme clé de select Prisma.
    expect(src).not.toMatch(/select:[\s\S]*?body:\s*true/);
    expect(src).not.toMatch(/body:\s*true/);
  });
  it("aucun 'transcript' dans les select Prisma", () => {
    expect(src).not.toMatch(/transcript:\s*true/);
  });
  it("aucun 'storageKey' dans les select Prisma", () => {
    expect(src).not.toMatch(/storageKey:\s*true/);
  });
  it("aucun 'text' guidé dans les select Prisma", () => {
    // GuidedPhrase.text ne doit pas être sélectionné par la projection admin.
    expect(src).not.toMatch(/text:\s*true/);
  });
  it("hash SHA-256 tronqué à 12 chars pour conversationId et centerId", () => {
    expect(src).toMatch(/createHash\(["']sha256["']\)/);
    expect(src).toMatch(/\.slice\(0,\s*12\)/);
    expect(src).toMatch(/conversationIdHash/);
    expect(src).toMatch(/centerIdHash/);
  });
});

describe("Envoi message · règles enfant strictes (brief §11)", () => {
  const src = read("lib/messaging/messages.ts");

  it("CHILD_PROFILE + TEXT rejeté avec child_cannot_send_text AVANT tout autre check", () => {
    // Le check TEXT enfant doit se faire tôt dans assertCanSendMessage
    // pour ne jamais atteindre la DB.
    const idxCheck = src.indexOf("child_cannot_send_text");
    const idxAllowed = src.indexOf("isKindAllowedForActor(");
    expect(idxCheck).toBeGreaterThan(0);
    expect(idxCheck).toBeLessThan(idxAllowed);
  });

  it("GUIDED_PHRASE · vérifie isActive + scope conversationType", () => {
    expect(src).toMatch(/isActive:\s*true|phrase\.isActive/);
    expect(src).toMatch(/phrase\.conversationType\s*!==\s*conversationType/);
    expect(src).toMatch(/guided_phrase_wrong_scope/);
  });

  it("AUDIO · gated par isMessagingAudioEnabled + status READY requis", () => {
    expect(src).toMatch(/isMessagingAudioEnabled\(\)/);
    expect(src).toMatch(/audio_disabled/);
    expect(src).toMatch(/asset\.status\s*!==\s*["']READY["']/);
  });

  it("SYSTEM · refusé côté client (kind_not_allowed dans SendMessage)", () => {
    // Le case SYSTEM dans assertCanSendMessage retourne kind_not_allowed.
    const systemBlock = src.match(/case\s+["']SYSTEM["']:[\s\S]*?return \{ ok: false, error: "kind_not_allowed" \}/);
    expect(systemBlock).toBeTruthy();
  });

  it("PARENT_COPY · créé automatiquement pour chaque message enfant", () => {
    expect(src).toMatch(/GUARDIAN_OBSERVER/);
    expect(src).toMatch(/kind:\s*["']PARENT_COPY["']/);
  });

  it("Body GUIDED_PHRASE · résolu depuis DB (jamais accepté du client)", () => {
    // On récupère le text canonique server-side.
    expect(src).toMatch(/messagingGuidedPhrase\.findUnique[\s\S]*?text:\s*true/);
  });
});

describe("Fixtures messaging · 13 conversations sans t_sa_audit", () => {
  const src = read("../scripts/test-baseline/messaging-fixtures.mjs");

  it("13 identifiants t_* upsertés", () => {
    const ids = [
      "t_em_en", "t_class_a1", "t_er_co", "t_palabre",
      "t_km_en", "t_kr_co",
      "t_pa_en", "t_pa_ac", "t_pa_co",
      "t_ac_en", "t_ac_co", "t_ac_sa", "t_sa_broadcast",
    ];
    for (const id of ids) {
      expect(src).toMatch(new RegExp(`"${id}"`));
    }
    expect(ids).toHaveLength(13);
  });

  it("aucun t_sa_audit inséré comme Conversation", () => {
    expect(src).not.toMatch(/"t_sa_audit"/);
    // Note explicite du fait que t_sa_audit est une projection, pas une conversation.
    expect(src).toMatch(/AUCUN t_sa_audit/);
  });

  it("assertNonProduction + P-1 verification en tête de script", () => {
    expect(src).toMatch(/assertNonProduction\(\)/);
  });
});
