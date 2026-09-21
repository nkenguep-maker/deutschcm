"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader, DashboardStatusChip } from "@/features/dashboards/shared";

type SessionRow = {
  id: string;
  childName: string;
  scheduledAt: string;
  durationMinutes: number;
  topic: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
};

export function FamilySessionsSection() {
  const t = useTranslations("yemaDashboards.family.sessions");
  const en = useLocale() === "en";
  const [items, setItems] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const copy = en ? { empty: "No coaching session scheduled yet.", error: "Sessions could not be loaded.", retry: "Retry", minutes: "min", scheduled: "Scheduled", completed: "Completed", cancelled: "Cancelled" } : { empty: "Aucune séance de coaching planifiée pour le moment.", error: "Impossible de charger les séances.", retry: "Réessayer", minutes: "min", scheduled: "Planifiée", completed: "Terminée", cancelled: "Annulée" };

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/family/sessions", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json() as { items?: SessionRow[] };
      setItems(json.items ?? []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const fmt = new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });
  const label = (status: SessionRow["status"]) => status === "SCHEDULED" ? copy.scheduled : status === "COMPLETED" ? copy.completed : copy.cancelled;

  return (
    <section id="seances" aria-labelledby="family-seances-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="family-seances-title">{t("title")}</span>} />
      {error ? <DashboardCard><DashboardEmptyState title={copy.error} action={<button type="button" onClick={load}>{copy.retry}</button>} /></DashboardCard> : null}
      {!error && !loading && items.length === 0 ? <DashboardCard><DashboardEmptyState title={copy.empty} /></DashboardCard> : null}
      {!error && items.length > 0 ? <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{items.map((item) => <li key={item.id}><DashboardCard><div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}><div style={{ flex: 1 }}><strong>{item.childName}</strong><div style={{ marginTop: 4 }}>{fmt.format(new Date(item.scheduledAt))} · {item.durationMinutes} {copy.minutes}</div>{item.topic ? <div style={{ marginTop: 4, opacity: .78 }}>{item.topic}</div> : null}</div><DashboardStatusChip tone={item.status === "CANCELLED" ? "muted" : item.status === "COMPLETED" ? "success" : "gold"}>{label(item.status)}</DashboardStatusChip></div></DashboardCard></li>)}</ul> : null}
    </section>
  );
}
