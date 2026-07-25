// P4.5-QA · store de nonces à usage unique (in-memory, TTL borné).
//
// Doctrine · le mode QA est utilisé exclusivement en Preview single-instance.
// Un store in-memory par process suffit (chaque Preview redéployée démarre
// avec un store vide). Un attaquant qui aurait un token de bootstrap
// signé ne peut pas le rejouer une seconde fois sur la même instance.
//
// Limitations documentées dans docs/YEMA_QA_PREVIEW_PERSONAS.md ·
// - un cold start réinitialise le store · un token consommé mais non
//   marqué avant restart peut être rejoué. Le TTL 10 min du token
//   limite la fenêtre.
// - une Preview multi-région recevra un store distinct par région.
//   Un token à usage unique peut être consommé une fois par région ·
//   accepté comme risque pour un usage QA interne.

import "server-only";

interface NonceEntry {
  nonce: string;
  consumedAt: number;
  expiresAt: number;
}

// Global process-scoped store · un seul par instance Node.
// Utilise un Map pour lookup O(1). Nettoyage LRU à chaque insertion.
const NONCE_STORE: Map<string, NonceEntry> = new Map();
const MAX_STORE_SIZE = 5000;

function pruneExpired(): void {
  const now = Math.floor(Date.now() / 1000);
  for (const [k, v] of NONCE_STORE.entries()) {
    if (v.expiresAt <= now) NONCE_STORE.delete(k);
  }
  // LRU cap · si le store dépasse la taille max, supprimer les plus anciens.
  if (NONCE_STORE.size > MAX_STORE_SIZE) {
    const entries = [...NONCE_STORE.entries()]
      .sort((a, b) => a[1].consumedAt - b[1].consumedAt);
    const drop = entries.slice(0, entries.length - MAX_STORE_SIZE);
    for (const [k] of drop) NONCE_STORE.delete(k);
  }
}

export function isNonceConsumed(nonce: string): boolean {
  pruneExpired();
  return NONCE_STORE.has(nonce);
}

export function markNonceConsumed(nonce: string, expiresAtSeconds: number): void {
  pruneExpired();
  NONCE_STORE.set(nonce, {
    nonce,
    consumedAt: Math.floor(Date.now() / 1000),
    expiresAt: expiresAtSeconds,
  });
}

// Test-only helper · vider le store (ne pas exporter en runtime prod).
export function _resetNonceStoreForTests(): void {
  NONCE_STORE.clear();
}
