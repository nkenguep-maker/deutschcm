"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { ConversationType, GuidedPhrase, PersonaId } from "./types";

// P4.6-B · composer texte adulte + guidé enfant. AUCUN champ libre enfant.
// Bouton audio et trombone visibles mais désactivés (flag audio false).

type Props = {
  conversationId: string;
  conversationType: ConversationType | null;
  persona: PersonaId;
  locale: "fr" | "en";
  onSent: () => void;
  // P4.6-B.1 · signal éphémère pour Realtime Presence (adulte uniquement).
  // Ignoré côté enfant · aucun signal de saisie libre pour eux.
  onActivity?: () => void;
};

function isChildPersona(p: PersonaId): boolean {
  return p === "child_monde" || p === "child_racines";
}

function guidedTypeFor(persona: PersonaId): ConversationType | null {
  if (persona === "child_monde") return "CHILD_WORLD_GUIDED";
  if (persona === "child_racines") return "CHILD_ROOTS_GUIDED";
  return null;
}

// Génère une idempotency key stable côté client. Défini au niveau module
// pour rester "pur du point de vue React" (react-hooks/purity refuse
// Math.random/Date.now dans le corps d'un composant, même dans un handler).
function makeIdempotencyKey(suffix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${crypto.randomUUID()}-${suffix}`;
  }
  return `${Math.random().toString(36).slice(2, 12)}-${suffix}`;
}

export function MessageComposer({ conversationId, persona, locale, onSent, onActivity }: Props) {
  const t = useTranslations("yemaMessaging.composer");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [phrases, setPhrases] = useState<GuidedPhrase[]>([]);

  const childType = guidedTypeFor(persona);
  const isChild = isChildPersona(persona);

  useEffect(() => {
    if (!isChild || !childType) return;
    fetch(`/api/messaging/guided-phrases?type=${childType}&locale=${locale}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((json: { phrases: GuidedPhrase[] }) => setPhrases(json.phrases))
      .catch(() => setPhrases([]));
  }, [isChild, childType, locale]);

  const sendText = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    const key = makeIdempotencyKey("text");
    try {
      const r = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "TEXT", body: body.trim(), idempotencyKey: key }),
      });
      if (r.ok) {
        setBody("");
        onSent();
      }
    } finally {
      setSending(false);
    }
  };

  const sendGuided = async (guidedPhraseId: string) => {
    if (sending) return;
    setSending(true);
    const key = makeIdempotencyKey(guidedPhraseId);
    try {
      const r = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "GUIDED_PHRASE", guidedPhraseId, idempotencyKey: key }),
      });
      if (r.ok) onSent();
    } finally {
      setSending(false);
    }
  };

  if (isChild) {
    return (
      <div style={{ padding: 12, borderTop: "1px solid var(--yema-border)", background: "var(--yema-surface)" }}>
        <div className="yema-mono" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)", marginBottom: 8 }}>
          {t("guidedTitle")}
        </div>
        {phrases.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--yema-text-muted)" }}>{t("guidedEmpty")}</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {phrases.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => sendGuided(p.id)}
                disabled={sending}
                style={{
                  minHeight: 44,
                  padding: "10px 16px",
                  borderRadius: "var(--yema-r-pill)",
                  border: "1px solid var(--yema-gold-edge)",
                  background: "var(--yema-gold-glow)",
                  color: "var(--yema-text)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  cursor: sending ? "wait" : "pointer",
                }}
              >
                {p.text}
              </button>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={t("audioSoon")}
            style={{
              minHeight: 44,
              minWidth: 44,
              borderRadius: 999,
              border: "1px solid var(--yema-border-strong)",
              background: "var(--yema-surface-2)",
              color: "var(--yema-text-faint)",
              fontFamily: "inherit",
              cursor: "not-allowed",
            }}
          >
            🎙
          </button>
          <span style={{ fontSize: 11, color: "var(--yema-text-faint)" }}>{t("microDisabled")}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, borderTop: "1px solid var(--yema-border)", background: "var(--yema-surface)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t("attachDisabled")}
          style={{
            minHeight: 44,
            minWidth: 44,
            borderRadius: 999,
            border: "1px solid var(--yema-border-strong)",
            background: "transparent",
            color: "var(--yema-text-faint)",
            fontFamily: "inherit",
            cursor: "not-allowed",
          }}
        >
          📎
        </button>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            onActivity?.();
          }}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          rows={2}
          style={{
            flex: 1,
            minHeight: 44,
            resize: "none",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--yema-border-strong)",
            background: "var(--yema-surface-2)",
            color: "var(--yema-text)",
            fontFamily: "inherit",
            fontSize: 14,
          }}
        />
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t("microDisabled")}
          style={{
            minHeight: 44,
            minWidth: 44,
            borderRadius: 999,
            border: "1px solid var(--yema-border-strong)",
            background: "transparent",
            color: "var(--yema-text-faint)",
            fontFamily: "inherit",
            cursor: "not-allowed",
          }}
        >
          🎙
        </button>
        <button
          type="button"
          onClick={sendText}
          disabled={sending || !body.trim()}
          style={{
            minHeight: 44,
            padding: "10px 18px",
            borderRadius: "var(--yema-r-pill)",
            border: "1px solid var(--yema-gold-dark)",
            background: "var(--yema-gold)",
            color: "#1a1108",
            fontFamily: "inherit",
            fontSize: 14,
            fontWeight: 600,
            cursor: sending || !body.trim() ? "not-allowed" : "pointer",
            opacity: sending || !body.trim() ? 0.6 : 1,
          }}
        >
          {sending ? t("sending") : t("send")}
        </button>
      </div>
    </div>
  );
}
