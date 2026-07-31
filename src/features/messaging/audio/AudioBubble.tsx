"use client";

import { useTranslations } from "next-intl";
import { useAudioPlayback } from "./useAudioPlayback";

// P4.6-C.2 · rendu bulle AUDIO · brief §8.
//
// N'expose JAMAIS · nom de fichier, MIME, taille brute, bucket,
// storageKey, URL signée, assetId. Seule la durée + un état lecture
// simple sont montrés.

type Props = {
  assetId: string;
  durationMs: number | null;
  labelParentCopy?: boolean;
};

function fmtTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioBubble({ assetId, durationMs }: Props) {
  const t = useTranslations("yemaMessaging.audio");
  const { state, toggle, audioRef } = useAudioPlayback(assetId, durationMs);

  const total = state.durationMs ?? durationMs ?? 0;
  const progress = total > 0 ? Math.min(100, (state.currentTimeMs / total) * 100) : 0;
  const errorLabel = state.error === "unauthorized" ? t("errorUnauthorized")
    : state.error === "gone" ? t("errorGone")
    : state.error === "network" ? t("errorNetwork")
    : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
      <button
        type="button"
        onClick={toggle}
        disabled={state.loading}
        aria-label={state.playing ? t("pause") : t("play")}
        aria-busy={state.loading}
        style={{
          minHeight: 44, minWidth: 44,
          borderRadius: 999,
          border: "1px solid var(--yema-gold-edge)",
          background: state.playing ? "var(--yema-gold)" : "var(--yema-gold-glow)",
          color: state.playing ? "#1a1108" : "var(--yema-gold-light)",
          fontFamily: "inherit", fontSize: 16,
          cursor: state.loading ? "wait" : "pointer",
        }}
      >
        {state.loading ? "…" : state.playing ? "⏸" : "▶"}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 4, background: "var(--yema-border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--yema-gold)" }} />
        </div>
        <div className="yema-mono" style={{ fontSize: 10.5, color: "var(--yema-text-muted)", marginTop: 4 }}>
          {fmtTime(state.currentTimeMs)} / {fmtTime(total)}
        </div>
      </div>
      {errorLabel ? (
        <span role="alert" style={{ fontSize: 11, color: "var(--yema-alert)" }}>{errorLabel}</span>
      ) : null}
      {/* Element audio caché · aucun menu de téléchargement natif. */}
      <audio
        ref={audioRef}
        preload="none"
        controlsList="nodownload"
        // @ts-expect-error · attribut non-standard mais supporté pour renforcer UX.
        disablePictureInPicture=""
        style={{ display: "none" }}
      />
    </div>
  );
}
