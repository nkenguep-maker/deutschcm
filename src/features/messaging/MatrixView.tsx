"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { MatrixRow } from "./types";

export function MatrixView() {
  const t = useTranslations("yemaMessaging.matrix");
  const tTypes = useTranslations("yemaMessaging.types");
  const tKinds = useTranslations("yemaMessaging.kinds");
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messaging/matrix", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((json: { matrix: MatrixRow[] }) => setRows(json.matrix))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 12, color: "var(--yema-text-muted)" }}>…</div>;

  return (
    <section aria-labelledby="matrix-title" style={{ padding: 16 }}>
      <h2 id="matrix-title" style={{ margin: "0 0 12px", fontSize: 18, color: "var(--yema-text)" }}>
        {t("title")}
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {rows.map((r) => (
          <li key={r.type}>
            <article
              style={{
                border: "1px solid var(--yema-border)",
                borderRadius: 12,
                padding: 12,
                background: "var(--yema-surface)",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--yema-text)" }}>
                {tTypes(r.type)}
              </div>
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                <MatrixCell label={t("columnMembers")}>
                  {r.memberPersonas.length > 0 ? r.memberPersonas.join(", ") : "—"}
                </MatrixCell>
                <MatrixCell label={t("columnKinds")}>
                  {(r.allowedKindsForChildProfile.length > 0
                    ? r.allowedKindsForChildProfile
                    : r.allowedKindsForUser
                  ).map((k) => tKinds(k)).join(", ")}
                </MatrixCell>
                <MatrixCell label={t("columnContexts")}>
                  {r.requiredContexts.length > 0 ? r.requiredContexts.join(", ") : "—"}
                </MatrixCell>
                <MatrixCell label={t("columnReplies")}>
                  {r.supportsReplies ? t("repliesYes") : t("repliesNo")}
                </MatrixCell>
              </div>
              {r.guardianObserverPersonas.length > 0 ? (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--yema-gold-light)" }}>
                  Guardian observer: {r.guardianObserverPersonas.join(", ")}
                </div>
              ) : null}
              {r.readOnlyPersonas.length > 0 ? (
                <div style={{ marginTop: 4, fontSize: 12, color: "var(--yema-text-muted)" }}>
                  {t("readonly")}: {r.readOnlyPersonas.join(", ")}
                </div>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MatrixCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="yema-mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--yema-text-muted)" }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "var(--yema-text)", marginTop: 2 }}>{children}</div>
    </div>
  );
}
