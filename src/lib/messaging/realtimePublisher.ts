import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// P4.6-B.1 / .2 · publisher Realtime côté serveur (privé).
//
// Après un write (sendMessage, markConversationReadForActor), on émet un
// event Broadcast minimal · aucun body, aucun kind sensible, aucune PII.
// Les clients autorisés (Supabase Auth authenticated + participant actif
// de la conversation via policies realtime.messages) reçoivent uniquement
// un "ping" qui déclenche un refetch via l'API (source de vérité = DB).
//
// P4.6-B.2 · le publisher utilise SUPABASE_SERVICE_ROLE_KEY qui bypass
// les RLS de realtime.messages · sans cela, aucune émission serveur ne
// serait possible sur un canal privé.
//
// Sécurité · les canaux clients sont créés avec `config.private: true`.
// Un client qui s'abonne sans y être participant (ou sans session auth)
// est refusé par la policy `messaging_realtime_subscribe`. Un client
// anon qui tenterait d'INSERT est refusé par `messaging_realtime_send_deny_client`.

const NULL = "";

let cachedServiceClient: ReturnType<typeof createSupabaseClient> | null = null;
function serviceClient() {
  if (cachedServiceClient) return cachedServiceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? NULL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ?? NULL;
  if (!url || !svc) return null;
  try {
    cachedServiceClient = createSupabaseClient(url, svc, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return cachedServiceClient;
  } catch {
    return null;
  }
}

export type MessagingBroadcastEvent =
  | { kind: "message_created"; conversationId: string; messageId: string; at: string }
  | { kind: "read_state_updated"; conversationId: string; at: string };

export function conversationChannelName(conversationId: string): string {
  return `msg:conv:${conversationId}`;
}
export function inboxUserChannelName(userId: string): string {
  return `msg:inbox:user:${userId}`;
}
export function inboxChildChannelName(childProfileId: string): string {
  return `msg:inbox:child:${childProfileId}`;
}

async function send(channel: string, event: MessagingBroadcastEvent): Promise<void> {
  const sb = serviceClient();
  if (!sb) return;
  try {
    // P4.6-B.2 · canal privé côté serveur également · service_role bypass
    // les policies mais on garde `private: true` par cohérence stricte
    // (isolate contre toute évolution de policy).
    const ch = sb.channel(channel, { config: { private: true } });
    await ch.send({ type: "broadcast", event: event.kind, payload: event });
    await ch.unsubscribe();
  } catch {
    // Best-effort · une panne Realtime ne doit jamais casser l'écriture DB.
    // Le polling fallback rattrapera l'événement.
  }
}

export async function broadcastMessageCreated(input: {
  conversationId: string;
  messageId: string;
  participantUserIds: readonly string[];
  participantChildProfileIds: readonly string[];
}): Promise<void> {
  const at = new Date().toISOString();
  const convEvent: MessagingBroadcastEvent = {
    kind: "message_created",
    conversationId: input.conversationId,
    messageId: input.messageId,
    at,
  };
  await send(conversationChannelName(input.conversationId), convEvent);
  await Promise.all([
    ...input.participantUserIds.map((uid) => send(inboxUserChannelName(uid), convEvent)),
    ...input.participantChildProfileIds.map((cid) => send(inboxChildChannelName(cid), convEvent)),
  ]);
}

export async function broadcastReadStateUpdated(input: {
  conversationId: string;
  participantUserIds: readonly string[];
  participantChildProfileIds: readonly string[];
}): Promise<void> {
  const at = new Date().toISOString();
  const event: MessagingBroadcastEvent = {
    kind: "read_state_updated",
    conversationId: input.conversationId,
    at,
  };
  await send(conversationChannelName(input.conversationId), event);
  await Promise.all([
    ...input.participantUserIds.map((uid) => send(inboxUserChannelName(uid), event)),
    ...input.participantChildProfileIds.map((cid) => send(inboxChildChannelName(cid), event)),
  ]);
}
