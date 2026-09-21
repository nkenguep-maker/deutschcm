"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashboardCard, DashboardEmptyState, DashboardSectionHeader, DashboardStatusChip } from "@/features/dashboards/shared";
import type { CoachChildProfileRow } from "../types";

type SessionRow = {
  id: string;
  childProfileId: string;
  childName: string;
  scheduledAt: string;
  durationMinutes: number;
  topic: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
};

export function CoachSessionsSection({ learners }: { learners: CoachChildProfileRow[] }) {
  const t = useTranslations("yemaDashboards.coachRacines.sessions");
  const locale = useLocale();
  const en = locale === "en";
  const [items, setItems] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [childProfileId, setChildProfileId] = useState(learners[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [topic, setTopic] = useState("");

  const copy = useMemo(() => en ? {
    add: "Schedule a session", learner: "Learner", date: "Date and time", duration: "Duration", topic: "Focus (optional)", save: "Schedule", empty: "No session scheduled yet.", loadError: "Sessions could not be loaded.", cancel: "Cancel", cancelled: "Cancelled", scheduled: "Scheduled", completed: "Completed", minutes: "min", retry: "Retry",
  } : {
    add: "Planifier une séance", learner: "Apprenant", date: "Date et heure", duration: "Durée", topic: "Objectif (optionnel)", save: "Planifier", empty: "Aucune séance planifiée pour le moment.", loadError: "Impossible de charger les séances.", cancel: "Annuler", cancelled: "Annulée", scheduled: "Planifiée", completed: "Terminée", minutes: "min", retry: "Réessayer",
  }, [en]);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/roots-coach/sessions", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json() as { items?: SessionRow[] };
      setItems(json.items ?? []);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!childProfileId && learners[0]?.id) setChildProfileId(learners[0].id); }, [childProfileId, learners]);

  async function createSession() {
    if (!childProfileId || !scheduledAt || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/roots-coach/sessions", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ childProfileId, scheduledAt: new Date(scheduledAt).toISOString(), durationMinutes, topic }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setScheduledAt(""); setTopic("");
      await load();
    } catch { setError(true); }
    finally { setSaving(false); }
  }

  async function cancelSession(sessionId: string) {
    const res = await fetch("/api/roots-coach/sessions", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId }) });
    if (res.ok) await load(); else setError(true);
  }

  const fmt = new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });
  const statusLabel = (status: SessionRow["status"]) => status === "SCHEDULED" ? copy.scheduled : status === "COMPLETED" ? copy.completed : copy.cancelled;

  return (
    <section id="seances" aria-labelledby="seances-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader title={<span id="seances-title">{t("title")}</span>} />
      <DashboardCard>
        <h3 style={{ margin: 0 }}>{copy.add}</h3>
        {learners.length === 0 ? <div style={{ marginTop: 12 }}><DashboardEmptyState title={copy.empty} /></div> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 14 }}>
            <label>{copy.learner}<select value={childProfileId} onChange={(e) => setChildProfileId(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6 }}>{learners.map((l) => <option key={l.id} value={l.id}>{l.displayName}</option>)}</select></label>
            <label>{copy.date}<input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6 }} /></label>
            <label>{copy.duration}<select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} style={{ display: "block", width: "100%", marginTop: 6 }}><option value={30}>30 {copy.minutes}</option><option value={45}>45 {copy.minutes}</option><option value={60}>60 {copy.minutes}</option><option value={90}>90 {copy.minutes}</option></select></label>
            <label>{copy.topic}<input value={topic} maxLength={120} onChange={(e) => setTopic(e.target.value)} style={{ display: "block", width: "100%", marginTop: 6 }} /></label>
            <div style={{ alignSelf: "end" }}><button type="button" onClick={createSession} disabled={!childProfileId || !scheduledAt || saving}>{saving ? "…" : copy.save}</button></div>
          </div>
        )}
      </DashboardCard>
      {error ? <DashboardCard><DashboardEmptyState title={copy.loadError} action={<button type="button" onClick={load}>{copy.retry}</button>} /></DashboardCard> : null}
      {!error && !loading && items.length === 0 ? <DashboardCard><DashboardEmptyState title={copy.empty} /></DashboardCard> : null}
      {!error && items.length > 0 ? <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>{items.map((item) => <li key={item.id}><DashboardCard><div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div style={{ flex: 1 }}><strong>{item.childName}</strong><div style={{ marginTop: 4 }}>{fmt.format(new Date(item.scheduledAt))} · {item.durationMinutes} {copy.minutes}</div>{item.topic ? <div style={{ marginTop: 4, opacity: .78 }}>{item.topic}</div> : null}</div><DashboardStatusChip tone={item.status === "CANCELLED" ? "muted" : item.status === "COMPLETED" ? "success" : "gold"}>{statusLabel(item.status)}</DashboardStatusChip>{item.status === "SCHEDULED" ? <button type="button" onClick={() => cancelSession(item.id)}>{copy.cancel}</button> : null}</div></DashboardCard></li>)}</ul> : null}
    </section>
  );
}
