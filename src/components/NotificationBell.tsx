"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  return `Il y a ${Math.floor(h / 24)}j`;
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

export default function NotificationBell({ accentColor = "#10b981" }: { accentColor?: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/social?action=notifications")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.notifications) { setNotifs(d.notifications.slice(0, 20)); setUnread(d.unreadCount ?? 0); }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    setLoading(true);
    await fetch("/api/social", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
    setLoading(false);
  };

  const handleRespond = async (notif: Notif, accept: boolean) => {
    const meta = notif.metadata ?? {};
    const body = notif.type === "join_request" || notif.type === "group_join_request"
      ? { action: "respond", requestId: meta.requestId, accept, classroomId: meta.classroomId }
      : { action: "respond", inviteId: meta.inviteId, accept };
    await fetch("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    // Mark this notif as read and update state
    setNotifs(n => n.map(x => x.id === notif.id ? { ...x, isRead: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  const isActionable = (type: string) => ["join_request", "group_join_request", "group_invite"].includes(type);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) setTimeout(markAllRead, 3000); }}
        style={{
          width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", position: "relative", fontSize: 16,
          color: "rgba(255,255,255,0.7)",
        }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 18, height: 18, borderRadius: "50%",
            background: "#ef4444", color: "white",
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #080c10",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 44, right: 0, width: 340, zIndex: 200,
          background: "rgba(13,17,23,0.98)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>🔔 Notifications</span>
            <div style={{ display: "flex", gap: 8 }}>
              {unread > 0 && (
                <button onClick={markAllRead} disabled={loading} style={{ color: accentColor, fontSize: 11, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Tout lire
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                Aucune notification
              </div>
            ) : notifs.slice(0, 8).map(n => (
              <div key={n.id} style={{
                padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: n.isRead ? "transparent" : `${accentColor}08`,
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {TYPE_ICON[n.type] ?? TYPE_ICON.default}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "white", fontSize: 12, fontWeight: n.isRead ? 400 : 700, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.4, marginBottom: 6 }}>{n.body}</div>
                  {isActionable(n.type) && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleRespond(n, true)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}>
                        ✓ Accepter
                      </button>
                      <button onClick={() => handleRespond(n, false)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                        ✕ Refuser
                      </button>
                    </div>
                  )}
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
                {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
            <Link href="/notifications" onClick={() => setOpen(false)} style={{ color: accentColor, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              Voir toutes les notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
