// P4.2 · Sécurité des tokens d'invitation Circle.
//
// Règle · le token brut n'est retourné qu'une seule fois à la création. Seul
// son hash SHA-256 est stocké en base et manipulé par le serveur. Aucune
// écriture logs / audit / réponses ne contient le token brut.
//
// Format · 32 bytes aléatoires · encodage base64url · 43 caractères (URL-safe).
// Espace d'entropie ≈ 2^256 · impossibilité pratique d'énumération.

import { createHash, randomBytes } from "node:crypto";

const RAW_TOKEN_BYTES = 32;

/** Génère un token brut cryptographiquement sûr, base64url. */
export function generateRawToken(): string {
  return randomBytes(RAW_TOKEN_BYTES).toString("base64url");
}

/** Hash SHA-256 hex du token · utilisé pour lookup et unique index. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/**
 * Hash SHA-256 hex d'un email (lowercased + trimmed) · utilisé pour indexer
 * les invitations sans révéler l'email par énumération / dump partiel.
 */
export function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/** Vérifie une correspondance token brut ↔ hash stocké en base. */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  return hashToken(rawToken) === storedHash;
}
