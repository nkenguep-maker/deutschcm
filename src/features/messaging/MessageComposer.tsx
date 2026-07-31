"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { ConversationType, GuidedPhrase, PersonaId } from "./types";
import { RecorderPanel } from "./audio/RecorderPanel";
import { useAudioRecorder } from "./audio/useAudioRecorder";

// P4.6-B/C · composer texte adulte + guidé enfant + AUDIO privé asynchrone.
// P4.6-C.2 · le bouton micro adulte devient actif si /api/messaging/audio-
// capability retourne enabled=true (dérivé de YEMA_MESSAGE_AUDIO_ENABLED,
// jamais exposé via NEXT_PUBLIC).

type Props = {
  conversationId: string;
  conversationType: ConversationType | null;
  persona: PersonaId;
  locale: "fr" | "en";
  onSent: () => void;
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

function makeIdempotencyKey(suffix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${crypto.randomUUID()}-${suffix}`;
  }
  return `${Math.random().toString(36).slice(2, 12)}-${suffix}`;
}

// Limites navigateur (alignées lib/messaging/audio/limits.ts serveur).
const MAX_MS_ADULT = 180_000;
const MAX_MS_CHILD = 60_000;

export function MessageComposer({ conversationId, persona, locale, onSent, onActivity }: Props) {
  const t = useTranslations("yemaMessaging.composer");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [phrases, setPhrases] = useState<GuidedPhrase[]>([]);
  const [audioAvailable, setAudioAvailable] = useState<boolean>(false);
  // idempotencyKey stable par cycle d'enregistrement · évite duplication
  // en cas de retry.
  const [audioClientMessageId, setAudioClientMessageId] = useState<string | null>(null);

  const childType = guidedTypeFor(persona);
  const isChild = isChildPersona(persona);
  const maxMs = isChild ? MAX_MS_CHILD : MAX_MS_ADULT;

  const rec = useAudioRecorder({ maxDurationMs: maxMs });

  useEffect(() => {
    if (!isChild || !childType) return;
    fetch(`/api/messaging/guided-phrases?type=${childType}&locale=${locale}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((json: { phrases: GuidedPhrase[] }) => setPhrases(json.phrases))
      .catch(() => setPhrases([]));
  }, [isChild, childType, locale]);

  // Détection capability audio · endpoint 404 si flag off (P4.6-C.2 exposé
  // uniquement via /api/messaging/audio-capability qui reflète le flag serveur).
  useEffect(() => {
    fetch("/api/messaging/audio-capability", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { enabled: boolean } | null) => setAudioAvailable(Boolean(j?.enabled)))
      .catch(() => setAudioAvailable(false));
  }, []);

  // Cleanup recorder au changement de conversation.
  useEffect(() => {
    return () => { rec.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

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
      if (r.ok) { setBody(""); onSent(); }
    } finally { setSending(false); }
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
    } finally { setSending(false); }
  };

  const sendAudio = async () => {
    const blob = rec.takeBlob();
    if (!blob) return;
    let key = audioClientMessageId;
    if (!key) { key = makeIdempotencyKey("audio"); setAudioClientMessageId(key); }
    rec.markUploading();
    try {
      const form = new FormData();
      form.set("file", blob, "recording");
      form.set("clientMessageId", key);
      const r = await fetch(`/api/messaging/conversations/${conversationId}/audio`, {
        method: "POST",
        body: form,
      });
      if (r.ok) {
        rec.markSent();
        setAudioClientMessageId(null);
        onSent();
        rec.reset();
      } else {
        rec.markError();
      }
    } catch {
      rec.markError();
    }
  };

  const startRecording = async () => {
    if (audioAvailable) await rec.start();
  };

  const cancelRecording = () => rec.cancel();
  const stopRecording = () => rec.stop();
  const discardRecording = () => { rec.discard(); setAudioClientMessageId(null); };

  const isRecordingActive =
    rec.snapshot.state === "REQUESTING_PERMISSION" ||
    rec.snapshot.state === "RECORDING" ||
    rec.snapshot.state === "RECORDED" ||
    rec.snapshot.state === "UPLOADING" ||
    rec.snapshot.state === "ERROR";

  // ─────────────── COMPOSER ENFANT ───────────────
  if (isChild) {
    return (
      <div style={{ padding: 12, borderTop: "1px solid var(--yema-border)", background: "var(--yema-surface)" }}>
        {isRecordingActive ? (
          <RecorderPanel
            variant="child"
            snapshot={rec.snapshot}
            maxDurationMs={maxMs}
            onStop={stopRecording}
            onCancel={cancelRecording}
            onDiscard={discardRecording}
            onSend={sendAudio}
          />
        ) : (
          <>
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
                      minHeight: 44, padding: "10px 16px",
                      borderRadius: "var(--yema-r-pill)",
                      border: "1px solid var(--yema-gold-edge)",
                      background: "var(--yema-gold-glow)",
                      color: "var(--yema-text)", fontFamily: "inherit", fontSize: 13,
                      cursor: sending ? "wait" : "pointer",
                    }}
                  >{p.text}</button>
                ))}
              </div>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
              {audioAvailable ? (
                <button
                  type="button"
                  onClick={startRecording}
                  aria-label={t("tapToSpeak")}
                  style={{
                    minHeight: 88, minWidth: 220,
                    borderRadius: "var(--yema-r-pill)",
                    border: "1px solid var(--yema-gold-edge)",
                    background: "var(--yema-gold-glow)",
                    color: "var(--yema-gold-light)",
                    fontFamily: "inherit", fontSize: 18, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🎙 {t("tapToSpeak")}
                </button>
              ) : (
                <span style={{ fontSize: 11, color: "var(--yema-text-faint)" }}>{t("microDisabled")}</span>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ─────────────── COMPOSER ADULTE ───────────────
  if (isRecordingActive) {
    return (
      <div style={{ padding: 12, borderTop: "1px solid var(--yema-border)", background: "var(--yema-surface)" }}>
        <RecorderPanel
          variant="adult"
          snapshot={rec.snapshot}
          maxDurationMs={maxMs}
          onStop={stopRecording}
          onCancel={cancelRecording}
          onDiscard={discardRecording}
          onSend={sendAudio}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 12, borderTop: "1px solid var(--yema-border)", background: "var(--yema-surface)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <button
          type="button" disabled aria-disabled="true"
          title={t("attachDisabled")}
          style={{ minHeight: 44, minWidth: 44, borderRadius: 999, border: "1px solid var(--yema-border-strong)", background: "transparent", color: "var(--yema-text-faint)", fontFamily: "inherit", cursor: "not-allowed" }}
        >📎</button>
        <textarea
          value={body}
          onChange={(e) => { setBody(e.target.value); onActivity?.(); }}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          rows={2}
          style={{ flex: 1, minHeight: 44, resize: "none", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--yema-border-strong)", background: "var(--yema-surface-2)", color: "var(--yema-text)", fontFamily: "inherit", fontSize: 14 }}
        />
        <button
          type="button"
          onClick={startRecording}
          disabled={!audioAvailable || body.trim().length > 0}
          aria-label={audioAvailable ? t("startRecording") : t("microDisabled")}
          title={audioAvailable ? t("startRecording") : t("microDisabled")}
          style={{
            minHeight: 44, minWidth: 44, borderRadius: 999,
            border: `1px solid ${audioAvailable && body.trim().length === 0 ? "var(--yema-gold-edge)" : "var(--yema-border-strong)"}`,
            background: "transparent",
            color: audioAvailable && body.trim().length === 0 ? "var(--yema-gold-light)" : "var(--yema-text-faint)",
            fontFamily: "inherit",
            cursor: audioAvailable && body.trim().length === 0 ? "pointer" : "not-allowed",
          }}
        >🎙</button>
        <button
          type="button"
          onClick={sendText}
          disabled={sending || !body.trim()}
          style={{
            minHeight: 44, padding: "10px 18px",
            borderRadius: "var(--yema-r-pill)",
            border: "1px solid var(--yema-gold-dark)",
            background: "var(--yema-gold)", color: "#1a1108",
            fontFamily: "inherit", fontSize: 14, fontWeight: 600,
            cursor: sending || !body.trim() ? "not-allowed" : "pointer",
            opacity: sending || !body.trim() ? 0.6 : 1,
          }}
        >{sending ? t("sending") : t("send")}</button>
      </div>
    </div>
  );
}
