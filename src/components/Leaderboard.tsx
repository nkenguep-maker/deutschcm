"use client";

import { useEffect, useState } from "react";
import { subscribeToLeaderboard } from "@/lib/supabase/realtime";

export interface LBEntry {
  userId: string;
  fullName: string;
  xpTotal: number;
  streakDays: number;
  level: string;
  avatar: string;
}

interface Props {
  classroomId: string;
  initialEntries: LBEntry[];
  currentUserId?: string;
}

const PODIUM_STYLES = [
  { height: 64, color: "#eab308", label: "🥇", bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.35)" },
  { height: 48, color: "#94a3b8", label: "🥈", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
  { height: 36, color: "#b45309", label: "🥉", bg: "rgba(180,83,9,0.12)", border: "rgba(180,83,9,0.3)" },
];

function Avatar({ name, size = 36, isMe }: { name: string; size?: number; isMe?: boolean }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: isMe
        ? "linear-gradient(135deg, #10b981, #059669)"
        : "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.08))",
      border: `2px solid ${isMe ? "#10b981" : "rgba(16,185,129,0.2)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: isMe ? "#fff" : "#10b981", fontWeight: 700,
      fontSize: size * 0.33, boxShadow: isMe ? "0 0 12px rgba(16,185,129,0.4)" : "none",
    }}>
      {initials}
    </div>
  );
}

export default function Leaderboard({ classroomId, initialEntries, currentUserId }: Props) {
  const [entries, setEntries] = useState<LBEntry[]>(initialEntries);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    const unsub = subscribeToLeaderboard(classroomId, (updated) => setEntries(updated));
    return () => { clearTimeout(timer); unsub(); };
  }, [classroomId]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const myRank = entries.findIndex(e => e.userId === currentUserId) + 1;

  return (
    <div style={{ color: "#e2e8f0" }}>
      {/* ── Podium ── */}
      {top3.length >= 3 && (
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          gap: 8, marginBottom: 20, paddingTop: 16,
        }}>
          {podiumOrder.map((entry, i) => {
            const rank = i === 0 ? 1 : i === 1 ? 0 : 2;
            const s = PODIUM_STYLES[rank];
            const isMe = entry.userId === currentUserId;
            return (
              <div key={entry.userId} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                transition: "transform 0.5s ease",
                transform: animated ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${i * 0.1}s`,
              }}>
                <Avatar name={entry.fullName} size={rank === 0 ? 48 : 38} isMe={isMe} />
                <div style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: "8px 8px 0 0", width: rank === 0 ? 88 : 72,
                  height: s.height, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                }}>
                  <span style={{ fontSize: rank === 0 ? 22 : 18 }}>{s.label}</span>
                  <div style={{ color: s.color, fontWeight: 800, fontSize: 11, fontFamily: "'Syne', sans-serif" }}>
                    {(entry.xpTotal / 1000).toFixed(1)}K XP
                  </div>
                </div>
                <div style={{ color: isMe ? "#10b981" : "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600, textAlign: "center", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.fullName.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rest of list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.map((entry, idx) => {
          const isMe = entry.userId === currentUserId;
          const rank = idx + 1;
          return (
            <div key={entry.userId} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 10,
              background: isMe ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${isMe ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)"}`,
              opacity: animated ? 1 : 0,
              transition: `opacity 0.4s ease ${idx * 0.05}s`,
            }}>
              <div style={{
                width: 22, textAlign: "center", flexShrink: 0, fontSize: 13,
                color: rank <= 3 ? PODIUM_STYLES[rank - 1].color : "rgba(255,255,255,0.25)",
                fontWeight: 700,
              }}>
                {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
              </div>
              <Avatar name={entry.fullName} size={28} isMe={isMe} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: isMe ? "#10b981" : "#e2e8f0", fontSize: 12,
                  fontWeight: isMe ? 700 : 400,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {entry.fullName} {isMe && <span style={{ fontSize: 10 }}>(vous)</span>}
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                  {entry.streakDays}🔥 · {entry.level}
                </div>
              </div>
              <div style={{ color: "#10b981", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {entry.xpTotal.toLocaleString()} XP
              </div>
            </div>
          );
        })}
      </div>

      {/* My position if not in top 10 */}
      {myRank > 10 && (
        <div style={{
          marginTop: 8, padding: "8px 12px", borderRadius: 10,
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
          color: "#10b981", fontSize: 12, textAlign: "center",
        }}>
          Votre position : #{myRank}
        </div>
      )}
    </div>
  );
}
