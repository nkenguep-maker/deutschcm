"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useConversationSync } from "./hooks/useConversationSync";
import { useMessagingRealtime } from "./hooks/useMessagingRealtime";
import { MessageComposer } from "./MessageComposer";
import { AudioBubble } from "./audio/AudioBubble";
import type { ConversationType, MessageKind, PersonaId } from "./types";

type Props = {
  conversationId: string | null;
  conversationType: ConversationType | null;
  persona: PersonaId;
};

function isChildPersona(p: PersonaId): boolean {
  return p === "child_monde" || p === "child_racines";
}

function formatTime(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function bubbleStyleForKind(kind: MessageKind): React.CSSProperties {
  const base: React.CSSProperties = {
    maxWidth: 310,
    padding: "10px 14px",
    borderRadius: 14,
    background: "var(--yema-surface)",
    border: "1px solid var(--yema-border)",
    color: "var(--yema-text)",
    fontSize: 14,
    lineHeight: 1.4,
    wordBreak: "break-word",
  };
  if (kind === "CARD") return { ...base, background: "var(--yema-gold-glow)", borderColor: "var(--yema-gold-edge)" };
  if (kind === "SYSTEM") return { ...base, fontStyle: "italic", color: "var(--yema-text-muted)" };
  return base;
}

const TYPING_EXPIRY_MS = 5_000;

// P4.6-B.4 · presenceKey doit être unique PAR INSTANCE navigateur ·
// useId() donne la même valeur pour deux clients rendant le même tree
// (Student et Teacher se retrouveraient avec la même clé) → typing
// s'auto-filtre comme "soi". crypto.randomUUID au montage · module-scope
// helper pour rester "pur" côté React (react-hooks/purity).
function makePresenceKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pk-${crypto.randomUUID()}`;
  }
  return `pk-${Math.random().toString(36).slice(2, 12)}`;
}

export function ConversationView({ conversationId, conversationType, persona }: Props) {
  const t = useTranslations("yemaMessaging.conversation");
  const tK = useTranslations("yemaMessaging.kinds");
  const tTop = useTranslations("yemaMessaging");
  const tConn = useTranslations("yemaMessaging.connection");
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";

  // P4.6-B.2 · enfant sans session Supabase Auth · aucun canal Realtime
  // privé accessible (policies realtime.messages exigent auth.uid()).
  // Les enfants passent en polling exclusif via useConversationSync fast.
  const channelName = useMemo(
    () => (conversationId && !isChildPersona(persona) ? `msg:conv:${conversationId}` : null),
    [conversationId, persona],
  );
  // P4.6-B.2/B.4 · presenceKey opaque local · sert UNIQUEMENT à filtrer
  // sa propre entrée du state. Aucun autre client ne le voit.
  // Unique par instance navigateur (crypto.randomUUID) · évite la collision
  // useId observée entre deux clients rendant le même tree.
  const [presenceKey] = useState<string>(() => makePresenceKey());
  const [typingCount, setTypingCount] = useState<number>(0);

  // Realtime · un canal par conversation active. Cleanup au switch fil.
  const realtime = useMessagingRealtime({
    channelName,
    onEvent: () => {
      // On refetch systématiquement · la DB reste source de vérité.
      sync.refetch();
    },
    presence: {
      presenceKey,
      onSync: (state, selfKey) => {
        let count = 0;
        const now = Date.now();
        for (const [key, entries] of Object.entries(state)) {
          if (key === selfKey) continue;
          for (const e of entries) {
            if (e.kind === "typing") {
              const at = (e as { at?: number }).at;
              if (typeof at !== "number" || now - at < TYPING_EXPIRY_MS) {
                count += 1;
                break;
              }
            }
          }
        }
        setTypingCount(count);
      },
    },
  });

  const realtimeConnected = realtime.status === "connected";
  const sync = useConversationSync(conversationId, { realtimeConnected });

  // Expiration locale du typing indicator · si pas de resync presence.
  useEffect(() => {
    if (typingCount === 0) return;
    const timeout = setTimeout(() => setTypingCount(0), TYPING_EXPIRY_MS);
    return () => clearTimeout(timeout);
  }, [typingCount]);

  // Mark read après chargement (best-effort · fire-and-forget)
  useEffect(() => {
    if (!conversationId || sync.messages.length === 0) return;
    const last = sync.messages[sync.messages.length - 1];
    fetch(`/api/messaging/conversations/${conversationId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastReadMessageId: last.id }),
    }).catch(() => {});
  }, [conversationId, sync.messages]);

  const handleComposerActivity = () => {
    // Adulte uniquement · enfants n'émettent JAMAIS de signal de saisie
    // libre (composer guidé, aucun texte en cours).
    if (isChildPersona(persona)) return;
    realtime.sendTyping();
  };

  if (!conversationId) {
    return (
      <div style={{ padding: 40, color: "var(--yema-text-muted)", textAlign: "center" }}>
        {tTop("empty")}
      </div>
    );
  }

  const showLiveDropped =
    realtime.status === "dropped" || realtime.status === "reconnecting";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {showLiveDropped ? (
        <div
          role="status"
          style={{
            padding: "6px 14px",
            background: "var(--yema-surface-2)",
            color: "var(--yema-text-muted)",
            fontSize: 12,
            borderBottom: "1px solid var(--yema-border)",
          }}
        >
          {tConn(realtime.status === "reconnecting" ? "reconnecting" : "dropped")}
        </div>
      ) : null}

      <div
        role="log"
        aria-live="polite"
        style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
      >
        {sync.isLoading && sync.messages.length === 0 ? (
          <div style={{ color: "var(--yema-text-muted)" }}>{tTop("loading")}</div>
        ) : sync.messages.length === 0 ? (
          <div style={{ color: "var(--yema-text-muted)" }}>{tTop("empty")}</div>
        ) : (
          sync.messages.map((m) => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={bubbleStyleForKind(m.kind)}>
                {m.kind === "CARD" ? (
                  <div>
                    <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-gold-light)", marginBottom: 4 }}>
                      {tK("CARD")} · {m.cardType ?? ""}
                    </div>
                    {m.body ? <div>{m.body}</div> : null}
                  </div>
                ) : m.kind === "AUDIO" ? (
                  m.audioAssetId ? (
                    <AudioBubble assetId={m.audioAssetId} durationMs={null} />
                  ) : (
                    <div style={{ color: "var(--yema-text-muted)" }}>{t("audioPlaceholder")}</div>
                  )
                ) : m.kind === "SYSTEM" ? (
                  <div>{t("systemMessage")}</div>
                ) : (
                  <div>{m.body ?? ""}</div>
                )}
              </div>
              <div className="yema-mono" style={{ fontSize: 10.5, color: "var(--yema-text-faint)" }}>
                {t("sentAt", { time: formatTime(m.createdAt, loc) })}
                {m.senderType === "CHILD_PROFILE" ? (
                  <span style={{ marginLeft: 8, color: "var(--yema-gold-light)" }}>
                    · {t("parentCopyBadge")}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
        {typingCount > 0 ? (
          <div
            aria-live="polite"
            style={{
              padding: "4px 10px",
              fontSize: 12,
              color: "var(--yema-text-muted)",
              fontStyle: "italic",
            }}
          >
            {t("typingIndicator", { count: typingCount })}
          </div>
        ) : null}
      </div>
      <MessageComposer
        conversationId={conversationId}
        conversationType={conversationType}
        persona={persona}
        locale={loc}
        onSent={() => sync.refetch()}
        onActivity={handleComposerActivity}
      />
    </div>
  );
}
