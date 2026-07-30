import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CHILD_SESSION_COOKIE_NAME,
  CHILD_SESSION_TTL_SECONDS,
  encodeChildSession,
  verifyChildSession,
} from "@/lib/security/childSession";

const SAVED_ENV = { ...process.env };

describe("childSession · encode/verify (Lot 5)", () => {
  beforeEach(() => {
    process.env.YEMA_CHILD_SESSION_SECRET = "a".repeat(64);
  });
  afterEach(() => {
    for (const k of Object.keys(process.env)) {
      if (!(k in SAVED_ENV)) delete process.env[k];
    }
    Object.assign(process.env, SAVED_ENV);
  });

  it("expose la constante COOKIE_NAME + TTL 30 min", () => {
    expect(CHILD_SESSION_COOKIE_NAME).toBe("yema_child_session");
    expect(CHILD_SESSION_TTL_SECONDS).toBe(30 * 60);
  });

  it("encode + verify round-trip renvoie le childProfileId", () => {
    const cookie = encodeChildSession("child_abc");
    expect(cookie).toBeTruthy();
    const check = verifyChildSession(cookie!);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.payload.childProfileId).toBe("child_abc");
  });

  it("payload contient exp = iat + TTL", () => {
    const nowSec = 1_700_000_000;
    const cookie = encodeChildSession("child_x", nowSec);
    const check = verifyChildSession(cookie!, nowSec);
    if (check.ok) {
      expect(check.payload.iat).toBe(nowSec);
      expect(check.payload.exp).toBe(nowSec + CHILD_SESSION_TTL_SECONDS);
    } else {
      throw new Error("expected ok");
    }
  });

  it("expiration détectée après TTL", () => {
    const nowSec = 1_700_000_000;
    const cookie = encodeChildSession("child_y", nowSec)!;
    const later = nowSec + CHILD_SESSION_TTL_SECONDS + 1;
    const check = verifyChildSession(cookie, later);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("expired");
  });

  it("tamper : modification body → bad_signature", () => {
    const cookie = encodeChildSession("child_z")!;
    // Change 1 char du body → signature invalide.
    const [body, sig] = cookie.split(".");
    const tampered = body.slice(0, -1) + (body.slice(-1) === "A" ? "B" : "A") + "." + sig;
    const check = verifyChildSession(tampered);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("bad_signature");
  });

  it("tamper : modification signature → bad_signature", () => {
    const cookie = encodeChildSession("child_z")!;
    const [body, sig] = cookie.split(".");
    const tampered = body + "." + sig.slice(0, -1) + (sig.slice(-1) === "A" ? "B" : "A");
    const check = verifyChildSession(tampered);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("bad_signature");
  });

  it("secret différent → bad_signature (invalidation session après rotation)", () => {
    const cookie = encodeChildSession("child_after_rotate")!;
    process.env.YEMA_CHILD_SESSION_SECRET = "b".repeat(64);
    const check = verifyChildSession(cookie);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("bad_signature");
  });

  it("aucun secret → encode retourne null, verify → no_secret", () => {
    delete process.env.YEMA_CHILD_SESSION_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    expect(encodeChildSession("x")).toBe(null);
    // Générer un cookie avec un autre secret puis vérifier sans secret.
    process.env.YEMA_CHILD_SESSION_SECRET = "c".repeat(64);
    const cookie = encodeChildSession("child_ns")!;
    delete process.env.YEMA_CHILD_SESSION_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    const check = verifyChildSession(cookie);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("no_secret");
  });

  it("cookie malformé (pas de point) → malformed", () => {
    const check = verifyChildSession("no-dot-here");
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("malformed");
  });

  it("cookie payload non-JSON → malformed", () => {
    const badBody = Buffer.from("not-json").toString("base64").replace(/=/g, "");
    const sig = "abc";
    const check = verifyChildSession(`${badBody}.${sig}`);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(["malformed", "bad_signature"]).toContain(check.reason);
  });
});
