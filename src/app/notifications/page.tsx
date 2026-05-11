"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";

interface Notif {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Il y a ${d}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const TYPE_ICON: Record<string, string> = {
  join_request: "📩",
  group_join_request: "👥",
  group_invite: "👥",
  request_accepted: "✅",
  request_refused: "❌",
  invite_accepted: "✅",
  invite_refused: "❌",
  assignment: "📝",
  badge: "🏆",
  default: "🔔",
};

const TYPE_LABEL: Record<string, string> = {
  join_request: "Inscription",
  group_join_request: "Groupe",
  group_invite: "Invitation",
  request_accepted: "Accepté",
  request_refused: "Refusé",
  invite_accepted: "Accepté",
  invite_refused: "Refusé",
  assignment: "Devoir",
  badge: "Badge",
};

const FILTER_TABS = [
  { key: "all", label: "Toutes" },
  { key: "unread", label: "Non lues" },
  { key: "action", label: "À traiter" },
];

const ACTION_TYPES = ["join_request", "group_join_request", "group_invite"];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/social?action=notifications")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.notifications) setNotifs(d.notifications); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch("/api/social", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
  };

  const handleRespond = async (notif: Notif, accept: boolean) => {
    setResponding(notif.id);
    const meta = notif.metadata ?? {};
    const body = notif.type === "join_request" || notif.type === "group_join_request"
      ? { action: "respond", requestId: meta.requestId, accept, classroomId: meta.classroomId }
      : { action: "respond", inviteId: meta.inviteId, accept };
    try {
      await fetch("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setNotifs(n => n.map(x => x.id === notif.id ? { ...x, isRead: true, type: accept ? "request_accepted" : "request_refused" } : x));
    } finally {
      setResponding(null);
    }
  };

  const filtered = notifs.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "action") return ACTION_TYPES.includes(n.type) && !n.isRead;
    return true;
  });

  const unreadCount = notifs.filter(n => !n.isRead).length;
  const actionCount = notifs.filter(n => ACTION_TYPES.includes(n.type) && !n.isRead).length;
  const accentColor = "#10b981";

  return (
    <Layout title="Notifications">
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>🔔 Notifications</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ color: accentColor, fontSize: 13, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FILTER_TABS.map(tab => {
            const count = tab.key === "unread" ? unreadCount : tab.key === "action" ? actionCount : notifs.length;
            const active = filter === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer",
                background: active ? `${accentColor}20` : "rgba(255,255,255,0.04)",
                color: active ? accentColor : "rgba(255,255,255,0.5)",
                border: active ? `1px solid ${accentColor}40` : "1px solid rgba(255,255,255,0.06)",
                display: "flex", gap: 6, alignItems: "center",
              }}>
                {tab.label}
                {count > 0 && (
                  <span style={{ background: active ? accentColor : "rgba(255,255,255,0.1)", color: active ? "white" : "rgba(255,255,255,0.5)", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 72, background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)", animation: "pulse 2s infinite" }} />
            ))
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 16px", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {filter === "unread" ? "Tout est lu !" : filter === "action" ? "Aucune action requise" : "Aucune notification"}
              </div>
              <div style={{ fontSize: 12 }}>Revenez plus tard</div>
            </div>
          ) : (
            filtered.map(n => {
              const isActionable = ACTION_TYPES.includes(n.type);
              const isDone = !isActionable || n.isRead;
              return (
                <div key={n.id} style={{
                  padding: "16px 18px", background: n.isRead ? "rgba(255,255,255,0.02)" : `${accentColor}08`,
                  border: `1px solid ${n.isRead ? "rgba(255,255,255,0.06)" : `${accentColor}20`}`,
                  borderRadius: 14, display: "flex", gap: 14, alignItems: "flex-start",
                  transition: "background 0.2s",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: n.isRead ? "rgba(255,255,255,0.05)" : `${accentColor}15`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {TYPE_ICON[n.type] ?? TYPE_ICON.default}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ color: "white", fontSize: 13, fontWeight: n.isRead ? 500 : 700 }}>{n.title}</span>
                        <span style={{
                          background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)",
                          borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 600,
                        }}>
                          {TYPE_LABEL[n.type] ?? n.type}
                        </span>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, flexShrink: 0, marginTop: 2 }}>{timeAgo(n.createdAt)}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5, margin: "0 0 10px" }}>{n.body}</p>

                    {isActionable && !isDone && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleRespond(n, true)}
                          disabled={responding === n.id}
                          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor, opacity: responding === n.id ? 0.6 : 1 }}
                        >
                          ✓ Accepter
                        </button>
                        <button
                          onClick={() => handleRespond(n, false)}
                          disabled={responding === n.id}
                          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", opacity: responding === n.id ? 0.6 : 1 }}
                        >
                          ✕ Refuser
                        </button>
                      </div>
                    )}
                  </div>

                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor, flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
