// P4.2 · Sécurité du token d'invitation.

import { describe, it, expect } from "vitest";
import { generateRawToken, hashToken, hashEmail, verifyToken } from "../invitations/tokens";

describe("invitation token · sécurité", () => {
  it("génère un token de 32 bytes encodé base64url (43 chars)", () => {
    const t = generateRawToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it("génère un token unique à chaque appel (10 000 iterations)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10_000; i++) set.add(generateRawToken());
    expect(set.size).toBe(10_000);
  });
  it("hashToken retourne 64 hex chars (SHA-256)", () => {
    const h = hashToken("abc");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });
  it("hashToken est déterministe · pas d'entropie", () => {
    expect(hashToken("same")).toBe(hashToken("same"));
  });
  it("hashToken diffère pour deux tokens distincts", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
  it("hashEmail normalise (lowercase + trim)", () => {
    expect(hashEmail("Paul@Example.Com")).toBe(hashEmail("paul@example.com"));
    expect(hashEmail("  paul@example.com  ")).toBe(hashEmail("paul@example.com"));
  });
  it("verifyToken retourne true seulement si hash correspond", () => {
    const raw = generateRawToken();
    const h = hashToken(raw);
    expect(verifyToken(raw, h)).toBe(true);
    expect(verifyToken(generateRawToken(), h)).toBe(false);
    expect(verifyToken(raw + "x", h)).toBe(false);
  });
});
