import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(REPO, path), "utf8");

describe("P4.7 · messaging hardening", () => {
  it("rate limits message creation using recent database rows", () => {
    const rateLimit = read("src/lib/messaging/rateLimit.ts");
    const messages = read("src/lib/messaging/messages.ts");
    const route = read("src/app/api/messaging/conversations/[conversationId]/messages/route.ts");

    expect(rateLimit).toContain("prisma.messagingMessage.count");
    expect(rateLimit).toContain("senderUserId: actor.userId!");
    expect(rateLimit).toContain("senderChildProfileId: actor.childProfileId!");
    expect(rateLimit).toContain("createdAt: { gte: since }");
    expect(rateLimit).toContain("YEMA_MESSAGING_USER_MESSAGES_PER_5_MINUTES");
    expect(rateLimit).toContain("YEMA_MESSAGING_CHILD_MESSAGES_PER_5_MINUTES");
    expect(messages).toContain("hasReachedMessageSendQuota(actor)");
    expect(route).toContain("status: 429");
    expect(route).toContain('"Retry-After": "300"');
  });

  it("keeps idempotent retries ahead of the quota check", () => {
    const messages = read("src/lib/messaging/messages.ts");
    const idempotencyLookup = messages.indexOf("conv_idem_unique");
    const rateLimitCheck = messages.indexOf("hasReachedMessageSendQuota(actor)");

    expect(idempotencyLookup).toBeGreaterThan(-1);
    expect(rateLimitCheck).toBeGreaterThan(idempotencyLookup);
  });

  it("only attaches ready audio owned by the actor in the same conversation", () => {
    const messages = read("src/lib/messaging/messages.ts");

    expect(messages).toContain("ownerUserId: true");
    expect(messages).toContain("ownerChildProfileId: true");
    expect(messages).toContain("conversationId: true");
    expect(messages).toContain("asset?.ownerUserId === actor.userId");
    expect(messages).toContain("asset?.ownerChildProfileId === actor.childProfileId");
    expect(messages).toContain("asset.conversationId !== input.conversationId");
    expect(messages).toContain('asset.status !== "READY"');
  });

  it("refuses cross-conversation reply targets inside the server service", () => {
    const messages = read("src/lib/messaging/messages.ts");

    expect(messages).toContain("id: input.replyToMessageId");
    expect(messages).toContain("conversationId: input.conversationId");
    expect(messages).toContain('error: "reply_target_invalid"');
  });

  it("bounds text and idempotency inputs server-side", () => {
    const messages = read("src/lib/messaging/messages.ts");
    const route = read("src/app/api/messaging/conversations/[conversationId]/messages/route.ts");

    expect(messages).toContain("const MAX_TEXT_CHARS = 4_000");
    expect(messages).toContain("const MAX_IDEMPOTENCY_KEY_CHARS = 128");
    expect(messages).toContain('error: "text_too_long"');
    expect(messages).toContain('error: "idempotency_key_invalid"');
    expect(route).toContain('"idempotency_key_invalid"');
  });

  it("keeps the generic JSON route text/guided-only", () => {
    const route = read("src/app/api/messaging/conversations/[conversationId]/messages/route.ts");

    expect(route).toContain('["TEXT", "GUIDED_PHRASE"]');
    expect(route).not.toContain('"TEXT", "AUDIO"');
    expect(route).not.toContain("audioAssetId:");
    expect(route).not.toContain("cardType:");
    expect(route).not.toContain("cardPayload:");
    expect(route).not.toContain("replyToMessageId:");
    expect(route).toContain("CARD et SYSTEM sont émis par");
  });
});
