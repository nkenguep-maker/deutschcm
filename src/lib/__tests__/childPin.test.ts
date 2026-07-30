import { describe, expect, it } from "vitest";
import { hashChildPin, normalizePin, verifyChildPin } from "@/lib/security/childPin";

describe("normalizePin (Lot 4A)", () => {
  it("accepte 4 à 6 chiffres", () => {
    expect(normalizePin("1234")).toBe("1234");
    expect(normalizePin("12345")).toBe("12345");
    expect(normalizePin("123456")).toBe("123456");
  });
  it("trim les espaces", () => {
    expect(normalizePin("  1234 ")).toBe("1234");
  });
  it("rejette moins de 4 chiffres", () => {
    expect(normalizePin("123")).toBeNull();
  });
  it("rejette plus de 6 chiffres", () => {
    expect(normalizePin("1234567")).toBeNull();
  });
  it("rejette lettres et caractères spéciaux", () => {
    expect(normalizePin("12a4")).toBeNull();
    expect(normalizePin("12-34")).toBeNull();
    expect(normalizePin("")).toBeNull();
    expect(normalizePin(null)).toBeNull();
    expect(normalizePin(undefined)).toBeNull();
    expect(normalizePin(1234 as unknown as string)).toBeNull();
  });
});

describe("hashChildPin + verifyChildPin (Lot 4A · scrypt canonique)", () => {
  it("hash au format scrypt$<salt>$<hash>", async () => {
    const h = await hashChildPin("1234");
    const parts = h.split("$");
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe("scrypt");
    // base64 salt = 16 octets → ~24 chars (avec padding)
    expect(parts[1].length).toBeGreaterThanOrEqual(20);
    // base64 hash = 64 octets → ~88 chars
    expect(parts[2].length).toBeGreaterThanOrEqual(80);
  });

  it("hash différent à chaque appel (salt aléatoire)", async () => {
    const h1 = await hashChildPin("4242");
    const h2 = await hashChildPin("4242");
    expect(h1).not.toBe(h2);
  });

  it("verify OK avec le bon PIN", async () => {
    const h = await hashChildPin("9876");
    expect(await verifyChildPin("9876", h)).toBe(true);
  });

  it("verify KO avec un mauvais PIN", async () => {
    const h = await hashChildPin("1111");
    expect(await verifyChildPin("2222", h)).toBe(false);
    expect(await verifyChildPin("11111", h)).toBe(false);
  });

  it("verify KO avec un hash malformé (retourne false, pas throw)", async () => {
    expect(await verifyChildPin("1234", "bad-hash")).toBe(false);
    expect(await verifyChildPin("1234", "scrypt$abc")).toBe(false);
    expect(await verifyChildPin("1234", "argon2$salt$hash")).toBe(false);
  });

  it("verify KO avec un PIN invalide", async () => {
    const h = await hashChildPin("1234");
    expect(await verifyChildPin("abcd", h)).toBe(false);
    expect(await verifyChildPin("", h)).toBe(false);
  });

  it("hashChildPin refuse un PIN invalide dès l'entrée", async () => {
    await expect(hashChildPin("abc")).rejects.toThrow(/invalid_pin_format/);
  });
});
