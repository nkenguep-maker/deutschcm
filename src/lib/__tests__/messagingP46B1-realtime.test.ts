import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// P4.6-B.1 · invariants Realtime + fallback + typing + isolation.

const ROOT = resolve(__dirname, "../..");
function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

describe("Realtime publisher · payload minimal, aucun body sensible", () => {
  const src = read("lib/messaging/realtimePublisher.ts");

  it("import 'server-only'", () => {
    expect(src).toMatch(/^import\s+"server-only";/);
  });

  it("MessagingBroadcastEvent ne contient PAS body/kind/text/transcript/storageKey", () => {
    // Le type union définit strictement les champs autorisés.
    const evtBlock = src.match(/export type MessagingBroadcastEvent[\s\S]*?;/);
    expect(evtBlock).toBeTruthy();
    expect(evtBlock![0]).not.toMatch(/\bbody\b/);
    expect(evtBlock![0]).not.toMatch(/\btranscript\b/);
    expect(evtBlock![0]).not.toMatch(/\bstorageKey\b/);
    expect(evtBlock![0]).not.toMatch(/\btext\b/);
  });

  it("channelName functions pour conv/inbox/user/child", () => {
    expect(src).toMatch(/conversationChannelName\(conversationId: string\)/);
    expect(src).toMatch(/inboxUserChannelName\(userId: string\)/);
    expect(src).toMatch(/inboxChildChannelName\(childProfileId: string\)/);
  });

  it("broadcastMessageCreated et broadcastReadStateUpdated sont best-effort (catch)", () => {
    // Ne doit jamais throw : le write DB doit rester atomique côté API.
    expect(src).toMatch(/try\s*\{[\s\S]*?catch\s*\{[\s\S]*?\}/);
  });
});

describe("sendMessage · broadcast déclenché après write DB", () => {
  const src = read("lib/messaging/messages.ts");

  it("importe broadcastMessageCreated", () => {
    expect(src).toMatch(/import\s+\{\s*broadcastMessageCreated\s*\}/);
  });

  it("broadcast se fait APRÈS le prisma.messagingMessage.create", () => {
    const idxCreate = src.indexOf("prisma.messagingMessage.create");
    const idxBroadcast = src.indexOf("broadcastMessageCreated(");
    expect(idxCreate).toBeGreaterThan(0);
    expect(idxBroadcast).toBeGreaterThan(idxCreate);
  });

  it("broadcast wrappé dans try/catch (best-effort)", () => {
    // Regex tolérante multiline · try { ... broadcastMessageCreated ... } catch
    const broadcastBlock = src.match(/try\s*\{[\s\S]*?broadcastMessageCreated\([\s\S]*?\}\s*catch/);
    expect(broadcastBlock).toBeTruthy();
  });
});

describe("markConversationReadForActor · broadcast read state", () => {
  const src = read("lib/messaging/conversations.ts");

  it("importe broadcastReadStateUpdated", () => {
    expect(src).toMatch(/import\s+\{\s*broadcastReadStateUpdated\s*\}/);
  });

  it("broadcast APRÈS le upsert readState", () => {
    const idxUpsert = src.indexOf("messagingConversationReadState.upsert");
    const idxBroadcast = src.indexOf("broadcastReadStateUpdated(");
    expect(idxUpsert).toBeGreaterThan(0);
    expect(idxBroadcast).toBeGreaterThan(idxUpsert);
  });
});

describe("useMessagingRealtime · un canal par instance, cleanup obligatoire", () => {
  const src = read("features/messaging/hooks/useMessagingRealtime.ts");

  it("subscribe dans useEffect avec cleanup unsubscribe", () => {
    expect(src).toMatch(/ch\.subscribe\(/);
    expect(src).toMatch(/return \(\) => \{[\s\S]*?ch\.unsubscribe\(\);/);
  });

  it("gère les 4 statuts Realtime (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED)", () => {
    expect(src).toMatch(/SUBSCRIBED/);
    expect(src).toMatch(/CHANNEL_ERROR/);
    expect(src).toMatch(/TIMED_OUT/);
    expect(src).toMatch(/CLOSED/);
  });

  it("typing throttled (>= 3s entre émissions)", () => {
    expect(src).toMatch(/TYPING_THROTTLE_MS\s*=\s*3_000/);
    expect(src).toMatch(/now - lastTypingRef\.current < TYPING_THROTTLE_MS/);
  });

  it("écoute uniquement les events broadcast whitelistés (aucun postgres_changes)", () => {
    expect(src).toMatch(/CHANNEL_EVENTS\s*=\s*\["message_created",\s*"read_state_updated"\]/);
    expect(src).not.toMatch(/postgres_changes/);
  });
});

describe("useConversationSync · polling adaptatif selon realtimeConnected", () => {
  const src = read("features/messaging/hooks/useConversationSync.ts");

  it("POLL_FAST 15s et POLL_SLOW 60s", () => {
    expect(src).toMatch(/POLL_FAST_MS\s*=\s*15_000/);
    expect(src).toMatch(/POLL_SLOW_MS\s*=\s*60_000/);
  });

  it("intervalle choisi via realtimeConnected", () => {
    expect(src).toMatch(/realtimeConnected \? POLL_SLOW_MS : POLL_FAST_MS/);
  });

  it("un seul timer par instance (setInterval + clearInterval)", () => {
    const setIntervalCount = (src.match(/setInterval/g) || []).length;
    const clearIntervalCount = (src.match(/clearInterval/g) || []).length;
    expect(setIntervalCount).toBe(1);
    expect(clearIntervalCount).toBe(1);
  });

  it("refetch au visibilitychange", () => {
    expect(src).toMatch(/addEventListener\(["']visibilitychange["']/);
    expect(src).toMatch(/document\.visibilityState\s*===\s*["']visible["']/);
  });

  it("dédup par messageId via Map", () => {
    expect(src).toMatch(/new Map<string,\s*MessageRow>\(\)/);
  });

  it("connectionDropped uniquement quand !realtimeConnected && isError", () => {
    expect(src).toMatch(/connectionDropped:\s*!realtimeConnected && isError/);
  });
});

describe("ConversationView · Realtime + typing enfant interdit", () => {
  const src = read("features/messaging/ConversationView.tsx");

  it("subscribe au canal msg:conv:{id}", () => {
    expect(src).toMatch(/`msg:conv:\$\{conversationId\}`/);
  });

  it("passe realtimeConnected au sync (polling adaptatif)", () => {
    expect(src).toMatch(/useConversationSync\(conversationId,\s*\{\s*realtimeConnected\s*\}\)/);
  });

  it("typing enfant refusé (handleComposerActivity guard)", () => {
    expect(src).toMatch(/if \(isChildPersona\(persona\)\) return/);
  });

  it("bannière status affichée pour dropped/reconnecting", () => {
    expect(src).toMatch(/realtime\.status === "dropped"[\s\S]*?realtime\.status === "reconnecting"/);
    expect(src).toMatch(/tConn\(realtime\.status === "reconnecting" \? "reconnecting" : "dropped"\)/);
  });

  it("presence expiration locale via TYPING_EXPIRY_MS", () => {
    expect(src).toMatch(/TYPING_EXPIRY_MS\s*=\s*5_000/);
  });
});

describe("InboxList · Realtime inbox channel + refetch", () => {
  const src = read("features/messaging/InboxList.tsx");

  it("fetch /api/messaging/self pour obtenir le channel name", () => {
    expect(src).toMatch(/fetch\("\/api\/messaging\/self"/);
  });

  it("useMessagingRealtime sur inboxChannel avec refetch", () => {
    expect(src).toMatch(/useMessagingRealtime\(\{[\s\S]*?channelName:\s*inboxChannel[\s\S]*?onEvent:\s*\(\)\s*=>\s*refetch\(\)/);
  });
});

describe("MessagesInboxLink · Realtime badge refetch", () => {
  const src = read("features/messaging/MessagesInboxLink.tsx");

  it("subscribe uniquement si available=true (flag on)", () => {
    expect(src).toMatch(/channelName:\s*available === true \? inboxChannel : null/);
  });

  it("refetchSummary appelé par onEvent Realtime", () => {
    expect(src).toMatch(/onEvent:\s*\(\)\s*=>\s*refetchSummary\(\)/);
  });
});

describe("/api/messaging/self · gate 404 stable", () => {
  const src = read("app/api/messaging/self/route.ts");

  it("isMessagingEnabled() AVANT toute logique", () => {
    const idxGate = src.indexOf("isMessagingEnabled()");
    const idxActor = src.indexOf("resolveMessagingActor()");
    expect(idxGate).toBeGreaterThan(0);
    expect(idxGate).toBeLessThan(idxActor);
    expect(src).toMatch(/error:\s*["']Not found["']/);
    expect(src).toMatch(/status:\s*404/);
  });

  it("actor USER → inboxUserChannelName · actor CHILD_PROFILE → inboxChildChannelName", () => {
    expect(src).toMatch(/actor\.actorType === "USER"[\s\S]*?inboxUserChannelName\(actor\.userId!\)[\s\S]*?inboxChildChannelName\(actor\.childProfileId!\)/);
  });
});

describe("i18n · yemaMessaging.connection + typingIndicator parity FR/EN", () => {
  const fr = JSON.parse(readFileSync(resolve(ROOT, "../messages/fr.json"), "utf-8"));
  const en = JSON.parse(readFileSync(resolve(ROOT, "../messages/en.json"), "utf-8"));

  it("connection.dropped/reconnecting/live présent FR + EN", () => {
    for (const k of ["dropped", "reconnecting", "live"]) {
      expect(fr.yemaMessaging.connection?.[k]).toBeTruthy();
      expect(en.yemaMessaging.connection?.[k]).toBeTruthy();
    }
  });

  it("conversation.typingIndicator présent FR + EN avec plural", () => {
    expect(fr.yemaMessaging.conversation.typingIndicator).toMatch(/plural/);
    expect(en.yemaMessaging.conversation.typingIndicator).toMatch(/plural/);
  });
});

describe("Sécurité Super Admin · aucun contenu pédagogique via Realtime", () => {
  // Les payloads Broadcast ne portent que conversationId + messageId + at ·
  // même si Super Admin s'abonnait à un canal msg:conv:XYZ, il ne recevrait
  // rien de sensible. Test complémentaire de la projection admin déjà
  // couvert par messaging-structure.test.ts §Admin projection.
  const src = read("lib/messaging/realtimePublisher.ts");

  it("aucune sélection body/transcript/storageKey dans le publisher", () => {
    expect(src).not.toMatch(/prisma\..*\.select[\s\S]*?body:\s*true/);
    expect(src).not.toMatch(/transcript/);
    expect(src).not.toMatch(/storageKey/);
  });
});
