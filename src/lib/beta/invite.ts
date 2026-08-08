import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const INVITE_VERSION = 1;
const MAX_TTL_SECONDS = 72 * 60 * 60;
const CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_CHARS = 2048;

interface BetaInvitePayload {
  v: 1;
  emailHash: string;
  iat: number;
  exp: number;
  nonce: string;
}

export class BetaInviteError extends Error {
  constructor(
    public readonly code:
      | "beta_disabled"
      | "invite_secret_missing"
      | "invite_invalid"
      | "invite_expired"
      | "invite_email_mismatch",
  ) {
    super(code);
  }
}

export function isClosedBetaEnabled(): boolean {
  return process.env.YEMA_CLOSED_BETA_ENABLED === "true";
}

function inviteSecret(): string {
  const secret = process.env.YEMA_BETA_INVITE_SECRET ?? "";
  if (secret.length < 32) throw new BetaInviteError("invite_secret_missing");
  return secret;
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashInviteEmail(email: string): string {
  return createHash("sha256").update(normalizeInviteEmail(email), "utf8").digest("hex");
}

function encodePayload(payload: BetaInvitePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", inviteSecret()).update(encodedPayload, "utf8").digest("base64url");
}

export function createBetaInviteToken(params: {
  email: string;
  nowSeconds?: number;
  ttlSeconds?: number;
}): string {
  if (!isClosedBetaEnabled()) throw new BetaInviteError("beta_disabled");

  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttl = Math.min(Math.max(params.ttlSeconds ?? MAX_TTL_SECONDS, 60), MAX_TTL_SECONDS);
  const payload: BetaInvitePayload = {
    v: INVITE_VERSION,
    emailHash: hashInviteEmail(params.email),
    iat: now,
    exp: now + ttl,
    nonce: randomBytes(24).toString("base64url"),
  };
  const encoded = encodePayload(payload);
  return `${encoded}.${sign(encoded)}`;
}

function parsePayload(encoded: string): BetaInvitePayload {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new BetaInviteError("invite_invalid");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BetaInviteError("invite_invalid");
  }
  const payload = value as Partial<BetaInvitePayload>;
  if (
    payload.v !== INVITE_VERSION ||
    typeof payload.emailHash !== "string" || !/^[a-f0-9]{64}$/.test(payload.emailHash) ||
    typeof payload.iat !== "number" || !Number.isInteger(payload.iat) ||
    typeof payload.exp !== "number" || !Number.isInteger(payload.exp) ||
    typeof payload.nonce !== "string" || payload.nonce.length < 24 || payload.nonce.length > 128 ||
    payload.exp <= payload.iat || payload.exp - payload.iat > MAX_TTL_SECONDS
  ) {
    throw new BetaInviteError("invite_invalid");
  }
  return payload as BetaInvitePayload;
}

export function verifyBetaInviteToken(params: {
  token: string;
  email: string;
  nowSeconds?: number;
}): BetaInvitePayload {
  if (!isClosedBetaEnabled()) throw new BetaInviteError("beta_disabled");
  if (!params.token || params.token.length > MAX_TOKEN_CHARS) {
    throw new BetaInviteError("invite_invalid");
  }

  const parts = params.token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new BetaInviteError("invite_invalid");
  }
  const [encoded, suppliedSignature] = parts;
  const expectedSignature = sign(encoded);
  const supplied = Buffer.from(suppliedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new BetaInviteError("invite_invalid");
  }

  const payload = parsePayload(encoded);
  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.iat > now + CLOCK_SKEW_SECONDS) throw new BetaInviteError("invite_invalid");
  if (payload.exp <= now) throw new BetaInviteError("invite_expired");
  if (payload.emailHash !== hashInviteEmail(params.email)) {
    throw new BetaInviteError("invite_email_mismatch");
  }
  return payload;
}
