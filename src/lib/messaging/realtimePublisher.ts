import "server-only";
import { createBrowserClient } from "@supabase/ssr";

// P4.6-B.1 · publisher Realtime côté serveur.
//
// Après un write (sendMessage, markConversationReadForActor), on émet un
// event Broadcast minimal · aucun body, aucun kind sensible, aucune PII.
// Les clients autorisés reçoivent uniquement un "ping" qui déclenche un
// refetch via l'API (source de vérité = DB).
//
// Choix technique · pattern Broadcast (pas postgres_changes) · évite :
//   - migration d'ajout à la publication supabase_realtime,
//   - RLS complexe sur messaging_* (permission = matrice applicative),
//   - fuite de payloads bruts vers des abonnés non-participants.
//
// Sécurité · le canal est nommé par conversationId opaque (cuid). Un
// client qui s'abonne sans y être participant recevra seulement le ping ;
// tout refetch API sera bloqué par assertConversationAccess.

const NULL_URL = "";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? NULL_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? NULL_URL;
  if (!url || !key) return null;
  try {
    return createBrowserClient(url, key, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
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
  const sb = client();
  if (!sb) return;
  try {
    const ch = sb.channel(channel);
    await ch.send({ type: "broadcast", event: event.kind, payload: event });
    // On ne garde pas le channel actif · un send() unique suffit pour
    // notifier les abonnés existants côté Realtime.
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
