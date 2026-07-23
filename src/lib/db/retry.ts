// P4.2 hardening · Retry limité pour les conflits de sérialisation Postgres.
//
// PostgreSQL retourne `40001 serializable_failure` (Prisma P2034) quand une
// SSI concurrente est détectée. Le retry ré-exécute la transaction complète
// avec un backoff court. Au-delà de 3 tentatives, l'erreur est propagée
// pour être mappée en 409 `concurrent_membership_update` côté API.

export const MAX_SERIALIZATION_RETRIES = 3;
export const RETRY_BACKOFF_MS_BASE = 25;

function isSerializationFailure(e: unknown): boolean {
  const err = e as { code?: string; message?: string };
  return (
    err?.code === "40001" ||
    err?.code === "P2034" ||
    /serialization_failure|could not serialize/i.test(err?.message ?? "")
  );
}

export class ConcurrentUpdateError extends Error {
  constructor(
    public readonly code: "concurrent_membership_update" | "concurrent_invitation_update",
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ConcurrentUpdateError";
  }
}

export interface RetryOptions {
  max?: number;
  errorCode?: "concurrent_membership_update" | "concurrent_invitation_update";
}

/**
 * Exécute `fn` avec retries limités sur conflits Postgres sérialisation.
 * Toute autre erreur (permissions, validation, capacité) est propagée
 * immédiatement sans retry.
 */
export async function withSerializableRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const max = opts.max ?? MAX_SERIALIZATION_RETRIES;
  const errorCode = opts.errorCode ?? "concurrent_membership_update";
  let lastErr: unknown;
  for (let attempt = 0; attempt < max; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isSerializationFailure(e)) throw e;
      lastErr = e;
      // Backoff exponentiel léger · 25ms, 50ms, 100ms.
      await new Promise((res) => setTimeout(res, RETRY_BACKOFF_MS_BASE * Math.pow(2, attempt)));
    }
  }
  throw new ConcurrentUpdateError(
    errorCode,
    "operation could not complete due to concurrent updates",
    lastErr,
  );
}
