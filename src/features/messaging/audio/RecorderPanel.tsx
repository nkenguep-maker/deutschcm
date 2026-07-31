"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { RecorderSnapshot } from "./useAudioRecorder";

// P4.6-C.2 · panneau RECORDING/RECORDED/UPLOADING partagé adulte+enfant.
// L'appelant décide des labels visuels via `variant`.
//
// Aucun contenu sensible n'apparaît · aucune URL blob externe stockée,
// aucun nom de fichier, uniquement durée + boutons + preview locale.

type Variant = "adult" | "child";

type Props = {
  variant: Variant;
  snapshot: RecorderSnapshot;
  maxDurationMs: number;
  onStop: () => void;
  onCancel: () => void;
  onDiscard: () => void;
  onSend: () => void;
};

function fmtTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecorderPanel({ variant, snapshot, maxDurationMs, onStop, onCancel, onDiscard, onSend }: Props) {
  const t = useTranslations("yemaMessaging.audio");
  const isChild = variant === "child";

  // Nettoyage preview URL lorsque le panneau est démonté.
  useEffect(() => {
    return () => {
      if (snapshot.previewUrl) {
        try { URL.revokeObjectURL(snapshot.previewUrl); } catch { /* noop */ }
      }
    };
  }, [snapshot.previewUrl]);

  const errorMsg = snapshot.state === "ERROR" && snapshot.errorReason
    ? t(`error.${snapshot.errorReason}`)
    : null;

  if (snapshot.state === "REQUESTING_PERMISSION") {
    return (
      <div aria-live="polite" style={{ padding: 12, color: "var(--yema-text-muted)", fontSize: 13 }}>
        {t("requestingPermission")}
      </div>
    );
  }

  if (snapshot.state === "RECORDING") {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--yema-surface-2)", borderRadius: 12 }}
      >
        <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: "var(--yema-alert)", flexShrink: 0 }} />
        <span className="yema-mono" style={{ fontSize: 13 }}>
          {fmtTime(snapshot.durationMs)} / {fmtTime(maxDurationMs)}
        </span>
        <span style={{ flex: 1, fontSize: 13, color: "var(--yema-text-muted)" }}>
          {isChild ? t("childListening") : t("recording")}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("cancel")}
          style={{ minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid var(--yema-border-strong)", background: "transparent", color: "var(--yema-text)", cursor: "pointer" }}
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onStop}
          aria-label={t("stop")}
          style={{ minHeight: 44, padding: "8px 16px", borderRadius: 999, border: "1px solid var(--yema-gold-dark)", background: "var(--yema-gold)", color: "#1a1108", fontWeight: 600, cursor: "pointer" }}
        >
          {t("stop")}
        </button>
      </div>
    );
  }

  if (snapshot.state === "RECORDED" || snapshot.state === "UPLOADING") {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--yema-surface-2)", borderRadius: 12 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span aria-hidden style={{ fontSize: 20 }}>🎧</span>
          <span className="yema-mono" style={{ fontSize: 13 }}>{fmtTime(snapshot.durationMs)}</span>
          {snapshot.previewUrl ? (
            <audio
              controls
              src={snapshot.previewUrl}
              controlsList="nodownload"
              preload="metadata"
              aria-label={t("previewLabel")}
              style={{ flex: 1, minWidth: 0 }}
            />
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onDiscard}
            disabled={snapshot.state === "UPLOADING"}
            aria-label={isChild ? t("recordAgain") : t("recordAgain")}
            style={{ minHeight: 44, padding: "8px 14px", borderRadius: 999, border: "1px solid var(--yema-border-strong)", background: "transparent", color: "var(--yema-text)", cursor: snapshot.state === "UPLOADING" ? "not-allowed" : "pointer" }}
          >
            {t("recordAgain")}
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={snapshot.state === "UPLOADING"}
            aria-busy={snapshot.state === "UPLOADING"}
            aria-label={t("send")}
            style={{ minHeight: 44, padding: "8px 18px", borderRadius: 999, border: "1px solid var(--yema-gold-dark)", background: "var(--yema-gold)", color: "#1a1108", fontWeight: 600, cursor: snapshot.state === "UPLOADING" ? "wait" : "pointer" }}
          >
            {snapshot.state === "UPLOADING" ? t("sending") : t("send")}
          </button>
        </div>
      </div>
    );
  }

  if (snapshot.state === "ERROR") {
    return (
      <div role="alert" style={{ padding: 12, color: "var(--yema-alert)", fontSize: 13 }}>
        {errorMsg}
      </div>
    );
  }

  return null;
}
