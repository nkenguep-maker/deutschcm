import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CHILD_SESSION_COOKIE_NAME,
  CHILD_SESSION_TTL_SECONDS,
  encodeChildSession,
  pinVersionMatches,
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
    const cookie = encodeChildSession("child_abc", null);
    expect(cookie).toBeTruthy();
    const check = verifyChildSession(cookie!);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.payload.childProfileId).toBe("child_abc");
  });

  it("payload contient exp = iat + TTL", () => {
    const nowSec = 1_700_000_000;
    const cookie = encodeChildSession("child_x", null, nowSec);
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
    const cookie = encodeChildSession("child_y", null, nowSec)!;
    const later = nowSec + CHILD_SESSION_TTL_SECONDS + 1;
    const check = verifyChildSession(cookie, later);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("expired");
  });

  it("tamper : modification body → bad_signature", () => {
    const cookie = encodeChildSession("child_z", null)!;
    // Change 1 char du body → signature invalide.
    const [body, sig] = cookie.split(".");
    const tampered = body.slice(0, -1) + (body.slice(-1) === "A" ? "B" : "A") + "." + sig;
    const check = verifyChildSession(tampered);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("bad_signature");
  });

  it("tamper : modification signature → bad_signature", () => {
    const cookie = encodeChildSession("child_z", null)!;
    const [body, sig] = cookie.split(".");
    const tampered = body + "." + sig.slice(0, -1) + (sig.slice(-1) === "A" ? "B" : "A");
    const check = verifyChildSession(tampered);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("bad_signature");
  });

  it("secret différent → bad_signature (invalidation session après rotation)", () => {
    const cookie = encodeChildSession("child_after_rotate", null)!;
    process.env.YEMA_CHILD_SESSION_SECRET = "b".repeat(64);
    const check = verifyChildSession(cookie);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toBe("bad_signature");
  });

  it("aucun secret → encode retourne null, verify → no_secret", () => {
    delete process.env.YEMA_CHILD_SESSION_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    expect(encodeChildSession("x", null)).toBe(null);
    // Générer un cookie avec un autre secret puis vérifier sans secret.
    process.env.YEMA_CHILD_SESSION_SECRET = "c".repeat(64);
    const cookie = encodeChildSession("child_ns", null)!;
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

describe("pinVersionMatches · invalidation session après changement PIN (Lot 5.1)", () => {
  it("pv encodé = 0 quand aucun PIN au moment de l'émission", () => {
    process.env.YEMA_CHILD_SESSION_SECRET = "d".repeat(64);
    const cookie = encodeChildSession("child_no_pin", null)!;
    const check = verifyChildSession(cookie);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.payload.pv).toBe(0);
  });

  it("pv encodé = timestamp ms du pinUpdatedAt", () => {
    process.env.YEMA_CHILD_SESSION_SECRET = "e".repeat(64);
    const pinDate = new Date("2026-07-30T10:00:00.000Z");
    const cookie = encodeChildSession("child_with_pin", pinDate)!;
    const check = verifyChildSession(cookie);
    if (check.ok) expect(check.payload.pv).toBe(pinDate.getTime());
    else throw new Error("expected ok");
  });

  it("pinVersionMatches : version identique DB → true", () => {
    const d = new Date("2026-07-30T10:00:00.000Z");
    expect(pinVersionMatches(d.getTime(), d)).toBe(true);
  });

  it("pinVersionMatches : version différente DB → false (session invalidée)", () => {
    const dOld = new Date("2026-07-30T10:00:00.000Z");
    const dNew = new Date("2026-07-30T11:00:00.000Z");
    expect(pinVersionMatches(dOld.getTime(), dNew)).toBe(false);
  });

  it("pinVersionMatches : cookie sans PIN (pv=0) vs DB avec PIN → false", () => {
    const dNew = new Date();
    expect(pinVersionMatches(0, dNew)).toBe(false);
  });

  it("pinVersionMatches : cookie avec PIN vs DB sans PIN (rare, PIN supprimé) → false", () => {
    const dOld = new Date();
    expect(pinVersionMatches(dOld.getTime(), null)).toBe(false);
  });

  it("pinVersionMatches : cookie pv=0 et DB null → true (les deux sans PIN)", () => {
    expect(pinVersionMatches(0, null)).toBe(true);
  });

  it("cas end-to-end : encode avec pinA puis DB passe à pinB → mismatch détecté", () => {
    process.env.YEMA_CHILD_SESSION_SECRET = "f".repeat(64);
    const pinInitial = new Date("2026-01-01T00:00:00.000Z");
    const cookie = encodeChildSession("child_e2e", pinInitial)!;
    const check = verifyChildSession(cookie);
    if (!check.ok) throw new Error("expected ok");
    // Simule changement PIN côté DB
    const pinChanged = new Date("2026-06-01T00:00:00.000Z");
    expect(pinVersionMatches(check.payload.pv, pinChanged)).toBe(false);
  });
});
