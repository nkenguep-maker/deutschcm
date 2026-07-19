"use client";

// /admin/applications · Sprint 8bis « La file des portes ».
// Deux onglets · Enseignants / Centres. Table des demandes avec statut,
// notes internes, tri par date. Boutons Accréditer et Décliner.
//
// Protégée par le middleware ADMIN existant.

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type ApplicationStatus = "RECEIVED" | "CONTACTED" | "MET" | "ACCREDITED" | "DECLINED";

interface TeacherApp {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  city: string;
  languages: string;
  experience: string;
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
}

interface CenterApp {
  id: string;
  centerName: string;
  email: string;
  whatsapp: string | null;
  city: string;
  status: ApplicationStatus;
  notes: string | null;
  createdAt: string;
}

type Tab = "teacher" | "center";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  RECEIVED:   "Reçue",
  CONTACTED:  "À contacter",
  MET:        "Entretien fait",
  ACCREDITED: "Accréditée",
  DECLINED:   "Déclinée",
};

const STATUSES: ApplicationStatus[] = ["RECEIVED", "CONTACTED", "MET", "ACCREDITED", "DECLINED"];

export default function AdminApplicationsPage() {
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("teacher");
  const [teachers, setTeachers] = useState<TeacherApp[]>([]);
  const [centers, setCenters] = useState<CenterApp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        fetch("/api/admin/applications?kind=teacher").then((r) => r.json()),
        fetch("/api/admin/applications?kind=center").then((r) => r.json()),
      ]);
      if (Array.isArray(t.items)) setTeachers(t.items);
      if (Array.isArray(c.items)) setCenters(c.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const updateStatus = async (kind: Tab, id: string, status: ApplicationStatus) => {
    await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, id, status }),
    });
    load();
  };

  const accredit = async (app: TeacherApp) => {
    if (!confirm(`Accréditer ${app.fullName} et créer le compte enseignant·e ?`)) return;
    await fetch("/api/admin/applications/accredit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: app.id }),
    });
    load();
  };

  const updateNotes = async (kind: Tab, id: string, notes: string) => {
    await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, id, notes }),
    });
  };

  return (
    <div className="admin-app-page">
      <header className="admin-app-head">
        <p className="maison-kicker">La file des portes</p>
        <h1 className="maison-h">
          Applications. <em>Deux onglets.</em>
        </h1>
        <p className="maison-lede">
          Chaque demande passe par la maison. Pas de compte créé sans rencontre.
        </p>
      </header>

      <div className="admin-app-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "teacher"}
          className={`admin-app-tab ${tab === "teacher" ? "on" : ""}`}
          onClick={() => setTab("teacher")}
        >
          Enseignants ({teachers.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "center"}
          className={`admin-app-tab ${tab === "center" ? "on" : ""}`}
          onClick={() => setTab("center")}
        >
          Centres ({centers.length})
        </button>
      </div>

      <main className="admin-app-body">
        {loading ? (
          <p>Chargement…</p>
        ) : tab === "teacher" ? (
          <TeacherTable
            items={teachers}
            onStatus={(id, s) => updateStatus("teacher", id, s)}
            onNotes={(id, n) => updateNotes("teacher", id, n)}
            onAccredit={accredit}
            locale={locale}
          />
        ) : (
          <CenterTable
            items={centers}
            onStatus={(id, s) => updateStatus("center", id, s)}
            onNotes={(id, n) => updateNotes("center", id, n)}
            locale={locale}
          />
        )}
      </main>
    </div>
  );
}

function TeacherTable({
  items, onStatus, onNotes, onAccredit, locale,
}: {
  items: TeacherApp[];
  onStatus: (id: string, s: ApplicationStatus) => void;
  onNotes: (id: string, n: string) => void;
  onAccredit: (app: TeacherApp) => void;
  locale: string;
}) {
  if (!items.length) return <p className="admin-app-empty">Aucune demande — la file est vide.</p>;
  return (
    <ul className="admin-app-list">
      {items.map((app) => (
        <li key={app.id} className={`admin-app-row admin-app-row-${app.status.toLowerCase()}`}>
          <div className="admin-app-row-head">
            <div>
              <p className="admin-app-name">{app.fullName}</p>
              <p className="admin-app-meta">
                {app.email} · {app.city} · {new Date(app.createdAt).toLocaleDateString(locale)}
                {app.whatsapp ? ` · ${app.whatsapp}` : ""}
              </p>
            </div>
            <select
              value={app.status}
              onChange={(e) => onStatus(app.id, e.target.value as ApplicationStatus)}
              className="admin-app-status"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="admin-app-row-body">
            <p className="admin-app-info"><strong>Langues</strong> · {app.languages}</p>
            <p className="admin-app-info"><strong>Diplôme / expérience</strong> · {app.experience}</p>
            <textarea
              className="admin-app-notes"
              placeholder="Notes internes…"
              defaultValue={app.notes ?? ""}
              onBlur={(e) => onNotes(app.id, e.target.value)}
              rows={2}
            />
            <div className="admin-app-actions">
              {app.status !== "ACCREDITED" ? (
                <button type="button" className="admin-app-btn admin-app-btn-primary"
                        onClick={() => onAccredit(app)}>
                  Accréditer + créer le compte
                </button>
              ) : (
                <span className="admin-app-tag">Accrédité·e ✓</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CenterTable({
  items, onStatus, onNotes, locale,
}: {
  items: CenterApp[];
  onStatus: (id: string, s: ApplicationStatus) => void;
  onNotes: (id: string, n: string) => void;
  locale: string;
}) {
  if (!items.length) return <p className="admin-app-empty">Aucune demande — la file est vide.</p>;
  return (
    <ul className="admin-app-list">
      {items.map((app) => (
        <li key={app.id} className={`admin-app-row admin-app-row-${app.status.toLowerCase()}`}>
          <div className="admin-app-row-head">
            <div>
              <p className="admin-app-name">{app.centerName}</p>
              <p className="admin-app-meta">
                {app.email} · {app.city} · {new Date(app.createdAt).toLocaleDateString(locale)}
                {app.whatsapp ? ` · ${app.whatsapp}` : ""}
              </p>
            </div>
            <select
              value={app.status}
              onChange={(e) => onStatus(app.id, e.target.value as ApplicationStatus)}
              className="admin-app-status"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="admin-app-row-body">
            <textarea
              className="admin-app-notes"
              placeholder="Notes internes…"
              defaultValue={app.notes ?? ""}
              onBlur={(e) => onNotes(app.id, e.target.value)}
              rows={2}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
