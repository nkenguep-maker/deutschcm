import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-B.2 · invariants d'autorisation Realtime.
//
// Ces tests structurels verrouillent au niveau du code source :
//   1. Tous les channels Messagerie déclarent config.private = true
//   2. Le publisher serveur utilise SUPABASE_SERVICE_ROLE_KEY
//   3. Le payload Presence ne contient AUCUNE identité (persona, userId, ...)
//   4. La migration realtime.messages est présente et cite les fonctions clés
//   5. La session enfant ne reçoit PAS de canal Realtime

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

describe("Canaux Realtime · private:true obligatoire", () => {
  it("useMessagingRealtime crée toujours des channels privés", () => {
    const src = read("features/messaging/hooks/useMessagingRealtime.ts");
    // Regex tolérante multiline · sb.channel(...) doit contenir private:true
    const channelBlock = src.match(/sb\.channel\([\s\S]*?\}\)/);
    expect(channelBlock).toBeTruthy();
    expect(channelBlock![0]).toMatch(/private:\s*true/);
  });

  it("realtimePublisher crée toujours des channels privés côté serveur", () => {
    const src = read("lib/messaging/realtimePublisher.ts");
    const channelBlock = src.match(/sb\.channel\([\s\S]*?\)/);
    expect(channelBlock).toBeTruthy();
    expect(channelBlock![0]).toMatch(/private:\s*true/);
  });

  it("aucune variante publique · pas de channel messagerie sans config", () => {
    const src = read("features/messaging/hooks/useMessagingRealtime.ts");
    // Cherche `sb.channel(name)` sans deuxième argument config
    expect(src).not.toMatch(/sb\.channel\(name\)/);
    expect(src).not.toMatch(/sb\.channel\(name,\s*\{\s*\}\s*\)/);
  });
});

describe("Publisher serveur · SUPABASE_SERVICE_ROLE_KEY (bypass RLS)", () => {
  const src = read("lib/messaging/realtimePublisher.ts");

  it("utilise SUPABASE_SERVICE_ROLE_KEY, pas NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    expect(src).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    // Le publisher ne doit pas utiliser l'anon key (identifiée uniquement
    // dans les commentaires OK, mais pas dans process.env.*).
    expect(src).not.toMatch(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("createClient de @supabase/supabase-js (auth persistSession false)", () => {
    expect(src).toMatch(/from\s+["']@supabase\/supabase-js["']/);
    expect(src).toMatch(/persistSession:\s*false/);
    expect(src).toMatch(/autoRefreshToken:\s*false/);
  });

  it("import 'server-only'", () => {
    expect(src).toMatch(/^import\s+"server-only";/);
  });
});

describe("Presence · payload strictement anonyme (P4.6-B.2)", () => {
  const src = read("features/messaging/hooks/useMessagingRealtime.ts");

  it("payload track ne contient QUE kind + at (aucun persona/userId/role/name)", () => {
    // Cherche le const payload: PresencePayload = {...}
    const trackBlock = src.match(/const payload:\s*PresencePayload\s*=\s*\{[\s\S]*?\};/);
    expect(trackBlock).toBeTruthy();
    // Whitelist stricte · le payload accepté par le type PresencePayload
    expect(trackBlock![0]).toMatch(/kind:\s*["']typing["']/);
    expect(trackBlock![0]).toMatch(/at:\s*now/);
    // Interdits
    expect(trackBlock![0]).not.toMatch(/persona/);
    expect(trackBlock![0]).not.toMatch(/userId/);
    expect(trackBlock![0]).not.toMatch(/childProfileId/);
    expect(trackBlock![0]).not.toMatch(/displayName/);
    expect(trackBlock![0]).not.toMatch(/role/);
    expect(trackBlock![0]).not.toMatch(/avatar/);
  });

  it("type PresencePayload verrouille la surface au minimum", () => {
    const typeBlock = src.match(/type PresencePayload\s*=\s*\{[\s\S]*?\};/);
    expect(typeBlock).toBeTruthy();
    expect(typeBlock![0]).toMatch(/kind:\s*"typing"/);
    expect(typeBlock![0]).toMatch(/at:\s*number/);
    // Aucun autre champ dans le type
    expect(typeBlock![0].split(";").filter((s) => s.trim().length > 0).length).toBeLessThanOrEqual(3);
  });

  it("presenceKey opaque, PAS la persona", () => {
    // L'option presence.key n'est plus `opts.presence.persona`.
    expect(src).not.toMatch(/presence:\s*\{\s*key:\s*opts\.presence\.persona\s*\}/);
    expect(src).toMatch(/presence:\s*\{\s*key:\s*opts\.presence\.presenceKey\s*\}/);
  });
});

describe("ConversationView · presenceKey local via useId", () => {
  const src = read("features/messaging/ConversationView.tsx");

  it("presenceKey vient de useId (opaque, unique par instance)", () => {
    expect(src).toMatch(/import\s*\{[^}]*useId[^}]*\}\s*from\s*["']react["']/);
    expect(src).toMatch(/const presenceKey = useId\(\)/);
  });

  it("passe presenceKey (pas persona) à useMessagingRealtime", () => {
    expect(src).toMatch(/presence:\s*\{[\s\S]*?presenceKey\s*,/);
    expect(src).not.toMatch(/presence:\s*\{\s*persona\s*,/);
  });

  it("enfant · aucun canal msg:conv:* (channelName forcé à null)", () => {
    expect(src).toMatch(/!isChildPersona\(persona\)\s*\?\s*`msg:conv:\$\{conversationId\}`\s*:\s*null/);
  });
});

describe("/api/messaging/self · enfant → channelName null", () => {
  const src = read("app/api/messaging/self/route.ts");

  it("actor CHILD_PROFILE → channelName: null, realtimeAvailable: false", () => {
    expect(src).toMatch(/actor\.actorType !== "USER"[\s\S]*?channelName:\s*null[\s\S]*?realtimeAvailable:\s*false/);
  });

  it("actor USER → inboxUserChannelName + realtimeAvailable: true", () => {
    expect(src).toMatch(/inboxUserChannelName\(actor\.userId!\)/);
    expect(src).toMatch(/realtimeAvailable:\s*true/);
  });

  it("aucune référence à inboxChildChannelName · le canal enfant est server-only", () => {
    expect(src).not.toMatch(/inboxChildChannelName/);
  });
});

describe("Migration realtime.messages · policies + helper functions", () => {
  const src = readFileSync(
    resolve(ROOT, "../prisma/migrations/20260731000003_p4_6_b_2_realtime_authorization/migration.sql"),
    "utf-8",
  );

  it("fonction messaging_can_access_conversation présente + STABLE + SECURITY DEFINER", () => {
    expect(src).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_can_access_conversation/);
    expect(src).toMatch(/STABLE\s*\n\s*SECURITY DEFINER/);
  });

  it("fonction messaging_is_inbox_owner présente", () => {
    expect(src).toMatch(/CREATE OR REPLACE FUNCTION public\.messaging_is_inbox_owner/);
  });

  it("policy SELECT · messaging_realtime_receive_authorized (P4.6-B.3)", () => {
    // P4.6-B.3 · nom renommé depuis 'subscribe' pour clarté doctrinale.
    expect(src).toMatch(/CREATE POLICY "messaging_realtime_receive_authorized" ON realtime\.messages/);
    expect(src).toMatch(/FOR SELECT[\s\S]*?TO authenticated/);
    expect(src).toMatch(/messaging_can_access_conversation/);
    expect(src).toMatch(/messaging_is_inbox_owner/);
  });

  it("policy INSERT présente UNIQUEMENT pour Presence sur msg:conv:* (P4.6-B.3)", () => {
    // P4.6-B.3 · la doctrine évolue · plus de policy 'deny_client'.
    // L'absence d'une policy INSERT permissive pour extension='broadcast'
    // est ce qui refuse Broadcast client. Seule Presence est autorisée.
    expect(src).toMatch(/CREATE POLICY "messaging_realtime_presence_send_authorized"/);
    expect(src).toMatch(/extension\s*=\s*['"]presence['"]/);
    // La ligne DROP POLICY IF EXISTS "messaging_realtime_send_deny_client"
    // est tolérée (nettoyage legacy P4.6-B.2 v1) · seul CREATE est interdit.
    expect(src).not.toMatch(/CREATE POLICY[^;]*messaging_realtime_send_deny_client/);
  });

  it("inbox_child · SELECT retourne false (aucun client child ne peut souscrire)", () => {
    expect(src).toMatch(/WHEN 'inbox_child' THEN[\s\S]*?false/);
  });

  it("additif strict · DROP POLICY IF EXISTS avant CREATE (idempotence · legacy + nouveau nom)", () => {
    expect(src).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_subscribe"/);
    expect(src).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_receive_authorized"/);
    expect(src).toMatch(/DROP POLICY IF EXISTS "messaging_realtime_presence_send_authorized"/);
  });

  it("ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY (idempotent)", () => {
    expect(src).toMatch(/ALTER TABLE IF EXISTS realtime\.messages ENABLE ROW LEVEL SECURITY/);
  });
});

describe("Script d'application migration · fail-closed non-P1", () => {
  const src = readFileSync(resolve(ROOT, "../scripts/apply-realtime-authorization.mjs"), "utf-8");

  it("refuse toute ref !== P1", () => {
    expect(src).toMatch(/const P1_REF = "kzzagbojjkivdzzcrmxn"/);
    expect(src).toMatch(/if \(ref !== P1_REF/);
    expect(src).toMatch(/refused non-P1 ref/);
  });

  it("blocklist explicite pour refs interdites", () => {
    expect(src).toMatch(/"sbjhvlrkbyjckdxujjsk"/);
    expect(src).toMatch(/"mamofhrurksyuuolucea"/);
    expect(src).toMatch(/"qggwvonfumuimjfsgpdz"/);
  });
});

describe("Isolation topics · enfant, publisher child channels via service_role uniquement", () => {
  const publisher = read("lib/messaging/realtimePublisher.ts");
  const selfRoute = read("app/api/messaging/self/route.ts");

  it("publisher émet toujours vers les 3 types de canaux (conv, inbox user, inbox child)", () => {
    // La couverture existe côté serveur ; la RLS empêche les clients de
    // s'abonner aux inbox child · seul le service_role peut y écrire.
    expect(publisher).toMatch(/inboxChildChannelName/);
    expect(publisher).toMatch(/inboxUserChannelName/);
    expect(publisher).toMatch(/conversationChannelName/);
  });

  it("aucun client hook n'expose inboxChildChannelName", () => {
    // Aucun fichier UI ne doit importer/construire le nom du canal enfant.
    expect(selfRoute).not.toMatch(/inboxChildChannelName/);
  });
});
