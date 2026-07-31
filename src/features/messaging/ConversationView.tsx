"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useConversationSync } from "./hooks/useConversationSync";
import { MessageComposer } from "./MessageComposer";
import type { ConversationType, MessageKind, PersonaId } from "./types";

type Props = {
  conversationId: string | null;
  conversationType: ConversationType | null;
  persona: PersonaId;
};

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

export function ConversationView({ conversationId, conversationType, persona }: Props) {
  const t = useTranslations("yemaMessaging.conversation");
  const tK = useTranslations("yemaMessaging.kinds");
  const tTop = useTranslations("yemaMessaging");
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const sync = useConversationSync(conversationId);

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

  if (!conversationId) {
    return (
      <div style={{ padding: 40, color: "var(--yema-text-muted)", textAlign: "center" }}>
        {tTop("empty")}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
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
                  <div style={{ color: "var(--yema-text-muted)" }}>{t("audioPlaceholder")}</div>
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
        {sync.connectionDropped ? (
          <div style={{ padding: 8, color: "var(--yema-alert)", fontSize: 12 }}>
            {tTop("connectionDropped")}
          </div>
        ) : null}
      </div>
      <MessageComposer
        conversationId={conversationId}
        conversationType={conversationType}
        persona={persona}
        locale={loc}
        onSent={() => sync.refetch()}
      />
    </div>
  );
}
