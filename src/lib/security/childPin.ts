import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// P4.6 Lot 4A · hash canonique du PIN enfant.
//
// scrypt (Node crypto natif) · KDF résistant au brute-force, sans dépendance
// externe. Format sérialisé « scrypt$<salt_b64>$<hash_b64> ».
//
// Contraintes :
//   - PIN normalisé (trim, chars '0'-'9', 4 à 6 chiffres).
//   - Salt aléatoire 16 octets, hash 64 octets, N=2^15.
//   - Vérification en constant-time.
//   - Le PIN clair n'est jamais loggé.

const SCRYPT_N = 1 << 15; // 32768
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;
// N=32768, r=8 → 128 * N * r = 32 MiB · nécessite maxmem > 32 MiB.
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

const scryptAsync = promisify<
  Buffer,
  Buffer,
  number,
  { N: number; r: number; p: number; maxmem: number },
  Buffer
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrypt as any,
);

const PIN_RE = /^\d{4,6}$/;

export function normalizePin(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!PIN_RE.test(s)) return null;
  return s;
}

export async function hashChildPin(plainPin: string): Promise<string> {
  const pin = normalizePin(plainPin);
  if (!pin) throw new Error("invalid_pin_format");
  const salt = randomBytes(SALT_LEN);
  const key = await scryptAsync(Buffer.from(pin, "utf8"), salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyChildPin(plainPin: string, hashed: string): Promise<boolean> {
  const pin = normalizePin(plainPin);
  if (!pin) return false;
  const parts = hashed.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  if (salt.length !== SALT_LEN || expected.length !== KEY_LEN) return false;
  const actual = await scryptAsync(Buffer.from(pin, "utf8"), salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return timingSafeEqual(actual, expected);
}
