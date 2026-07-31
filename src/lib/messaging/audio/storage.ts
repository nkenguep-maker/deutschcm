import "server-only";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { AUDIO_BUCKET_NAME, AUDIO_SIGNED_URL_TTL_SECONDS } from "./limits";

// P4.6-C.1 · helper Storage privé pour messagerie audio.
//
// Utilise SUPABASE_SERVICE_ROLE_KEY server-only. Aucun accès direct
// depuis un composant client. Aucun bucket public.

let cachedAdmin: ReturnType<typeof createSupabaseAdmin> | null = null;
function admin() {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    cachedAdmin = createSupabaseAdmin(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return cachedAdmin;
  } catch {
    return null;
  }
}

/**
 * Construit la clé Storage canonique. AUCUNE PII dans le chemin.
 * Format · v1/<conversationId>/<audioAssetId>.<extension>
 */
export function buildStorageKey(input: {
  conversationId: string;
  audioAssetId: string;
  extension: string;
}): string {
  const safeExt = /^[a-z0-9]{1,5}$/.test(input.extension) ? input.extension : "bin";
  return `v1/${input.conversationId}/${input.audioAssetId}.${safeExt}`;
}

export interface UploadResult {
  ok: boolean;
  error?: string;
}

/**
 * Upload privé server-side · service_role · aucune URL retournée.
 */
export async function uploadAudioObject(input: {
  storageKey: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<UploadResult> {
  const sb = admin();
  if (!sb) return { ok: false, error: "service_role_missing" };
  const { error } = await sb.storage.from(AUDIO_BUCKET_NAME).upload(
    input.storageKey,
    input.buffer,
    {
      contentType: input.mimeType,
      cacheControl: "no-store",
      upsert: false,
    },
  );
  if (error) return { ok: false, error: error.message.slice(0, 200) };
  return { ok: true };
}

/**
 * Supprime un objet · utilisé pour rollback + cleanup. Idempotent
 * (retourne ok:true si déjà absent).
 */
export async function deleteAudioObject(storageKey: string): Promise<UploadResult> {
  const sb = admin();
  if (!sb) return { ok: false, error: "service_role_missing" };
  const { error } = await sb.storage.from(AUDIO_BUCKET_NAME).remove([storageKey]);
  if (error) {
    // Not found is not an error for our cleanup contract.
    if (/not\s+found/i.test(error.message)) return { ok: true };
    return { ok: false, error: error.message.slice(0, 200) };
  }
  return { ok: true };
}

export interface SignedPlaybackUrl {
  url: string;
  expiresAt: string; // ISO
}

/**
 * Génère une URL signée courte · TTL ≤ 300s (§7). Aucune persistance,
 * aucun cache. L'appelant doit poser Cache-Control: private, no-store.
 */
export async function createPlaybackSignedUrl(input: {
  storageKey: string;
  ttlSeconds?: number;
}): Promise<{ ok: true; data: SignedPlaybackUrl } | { ok: false; error: string }> {
  const sb = admin();
  if (!sb) return { ok: false, error: "service_role_missing" };
  const ttl = Math.min(input.ttlSeconds ?? AUDIO_SIGNED_URL_TTL_SECONDS, AUDIO_SIGNED_URL_TTL_SECONDS);
  const { data, error } = await sb.storage
    .from(AUDIO_BUCKET_NAME)
    .createSignedUrl(input.storageKey, ttl);
  if (error || !data?.signedUrl) return { ok: false, error: error?.message ?? "no_url" };
  return {
    ok: true,
    data: {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    },
  };
}
