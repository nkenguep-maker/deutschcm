"use client";

import { useState, useEffect, useRef } from "react";
import { subscribeToClassroom, broadcastMessage } from "@/lib/supabase/realtime";
import type { ChatMessage } from "@/lib/supabase/realtime";

const EMOJIS = ["👍", "🎯", "💪", "🔥"];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m0",
    userId: "teacher-1",
    userName: "Prof. Sophie Tanda",
    content: "Bienvenue dans la classe virtuelle ! N'hésitez pas à poser vos questions ici. 📚",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reactions: { "👍": ["s1", "s2", "s3"] },
    pinned: true,
  },
  {
    id: "m1",
    userId: "teacher-1",
    userName: "Prof. Sophie Tanda",
    content: "Pour demain : révisez les articles définis Der/Die/Das. Le quiz sera mis en ligne ce soir.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    reactions: { "🔥": ["s2"] },
  },
  {
    id: "m2",
    userId: "s1",
    userName: "Marie N.",
    content: "Merci prof ! Une question : on doit aussi réviser les pluriels ?",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    reactions: {},
  },
  {
    id: "m3",
    userId: "teacher-1",
    userName: "Prof. Sophie Tanda",
    content: "Oui Marie, les pluriels irréguliers sont au programme ! Focus sur -er, -en, -e et les umlauts.",
    createdAt: new Date(Date.now() - 900000).toISOString(),
    reactions: { "👍": ["s1"] },
  },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

interface Props {
  classroomId: string;
  currentUserId: string;
  currentUserName: string;
  isTeacher?: boolean;
}

export default function ClassroomChat({ classroomId, currentUserId, currentUserName, isTeacher }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToClassroom(classroomId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return unsub;
  }, [classroomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      reactions: {},
    };
    setMessages(prev => [...prev, msg]);
    setInput("");
    await broadcastMessage(classroomId, msg).catch(() => {});
    setSending(false);
  };

  const addReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const already = m.reactions[emoji]?.includes(currentUserId);
      const list = already
        ? m.reactions[emoji].filter(id => id !== currentUserId)
        : [...(m.reactions[emoji] ?? []), currentUserId];
      return { ...m, reactions: { ...m.reactions, [emoji]: list } };
    }));
  };

  const pinMessage = (msgId: string) => {
    if (!isTeacher) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m));
  };

  const pinnedMsgs = messages.filter(m => m.pinned);
  const regularMsgs = messages.filter(m => !m.pinned);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Pinned messages */}
      {pinnedMsgs.length > 0 && (
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(16,185,129,0.15)", flexShrink: 0 }}>
          {pinnedMsgs.map(m => (
            <div key={m.id} style={{
              background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 8, padding: "8px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#10b981" }}>📌 Épinglé</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{m.userName}</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{m.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {regularMsgs.map(msg => {
          const isMe = msg.userId === currentUserId;
          const isTch = msg.userName.includes("Prof.");
          return (
            <div key={msg.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: isTch
                  ? "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.1))"
                  : "rgba(255,255,255,0.06)",
                border: `1px solid ${isTch ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isTch ? "#10b981" : "rgba(255,255,255,0.4)",
                fontSize: 11, fontWeight: 700,
              }}>
                {msg.userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                  <span style={{
                    color: isTch ? "#10b981" : (isMe ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)"),
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {msg.userName} {isTch && <span style={{ fontSize: 9, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, padding: "1px 5px" }}>Professeur</span>}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{timeAgo(msg.createdAt)}</span>
                </div>
                <div style={{
                  background: isMe ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isMe ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "4px 12px 12px 12px",
                  padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.5, wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>

                {/* Reactions + actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  {EMOJIS.map(emoji => {
                    const count = msg.reactions[emoji]?.length ?? 0;
                    const reacted = msg.reactions[emoji]?.includes(currentUserId);
                    return (
                      <button key={emoji} onClick={() => addReaction(msg.id, emoji)} style={{
                        display: "flex", alignItems: "center", gap: 3,
                        background: reacted ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${reacted ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 20, padding: "2px 7px", cursor: "pointer",
                        fontSize: 12,
                      }}>
                        <span>{emoji}</span>
                        {count > 0 && <span style={{ color: reacted ? "#10b981" : "rgba(255,255,255,0.3)", fontSize: 10 }}>{count}</span>}
                      </button>
                    );
                  })}
                  {isTeacher && (
                    <button onClick={() => pinMessage(msg.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.2)", fontSize: 11, padding: "0 4px",
                    }}>
                      📌
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0, padding: "12px 14px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 8,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "8px 12px",
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Écrire un message... (Entrée pour envoyer)"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "rgba(255,255,255,0.8)", fontSize: 13, resize: "none",
              fontFamily: "inherit", lineHeight: 1.5,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
              background: input.trim() ? "#10b981" : "rgba(255,255,255,0.06)",
              color: input.trim() ? "#fff" : "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, flexShrink: 0, transition: "all 0.2s",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
