"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader } from "@/features/dashboards/shared";

type SessionRow = { id: string; childName: string; scheduledAt: string; note: string | null; status: string };

export function CoachSessionNotesSection() {
  const t = useTranslations("yemaDashboards.coachRacines.sessionNotes");
  const en = useLocale() === "en";
  const [items, setItems] = useState<SessionRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const copy = en ? { empty: "No session to document yet.", save: "Save note", retry: "Retry", error: "Notes could not be loaded." } : { empty: "Aucune séance à documenter pour le moment.", save: "Enregistrer la note", retry: "Réessayer", error: "Impossible de charger les notes." };

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/roots-coach/sessions", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json() as { items?: SessionRow[] };
      const rows = json.items ?? [];
      setItems(rows);
      setDrafts(Object.fromEntries(rows.map((row) => [row.id, row.note ?? ""])));
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(sessionId: string) {
    const body = (drafts[sessionId] ?? "").trim();
    if (!body) return;
    setSavingId(sessionId);
    const res = await fetch("/api/roots-coach/sessions/note", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, body }) });
    if (res.ok) await load(); else setError(true);
    setSavingId(null);
  }

  const fmt = new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });
  return (
    <section id="notes-de-seance" aria-labelledby="notes-de-seance-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="notes-de-seance-title">{t("title")}</span>} />
      {error ? <DashboardCard><DashboardEmptyState title={copy.error} action={<button type="button" onClick={load}>{copy.retry}</button>} /></DashboardCard> : null}
      {!error && !loading && items.length === 0 ? <DashboardCard><DashboardEmptyState title={copy.empty} /></DashboardCard> : null}
      {!error ? items.map((row) => <DashboardCard key={row.id}><div style={{ fontWeight: 600 }}>{row.childName}</div><div style={{ marginTop: 4, opacity: .72 }}>{fmt.format(new Date(row.scheduledAt))}</div><label style={{ display: "block", marginTop: 12 }}><span className="sr-only">{copy.save}</span><textarea value={drafts[row.id] ?? ""} maxLength={2000} onChange={(e) => setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))} rows={4} style={{ width: "100%" }} /></label><div style={{ marginTop: 10 }}><button type="button" onClick={() => save(row.id)} disabled={savingId === row.id || !(drafts[row.id] ?? "").trim()}>{savingId === row.id ? "…" : copy.save}</button></div></DashboardCard>) : null}
    </section>
  );
}
