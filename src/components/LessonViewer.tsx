"use client";

import { useState } from "react";
import type { LessonContent } from "@/types/courses";

interface LessonViewerProps {
  content: LessonContent;
  level?: string;
  title?: string;
  onComplete: () => void;
}

function DEWord({ children }: { children: string }) {
  return (
    <span style={{ color: "#10b981", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
      {children}
    </span>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 16,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <h3 style={{
          margin: 0,
          color: "white",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "0.9rem",
        }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function LessonViewer({ content, level = "A1", title = "Lektion", onComplete }: LessonViewerProps) {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const handlePlay = (idx: number) => {
    setPlayingIdx(idx);
    setTimeout(() => setPlayingIdx(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .playing { animation: pulse 0.5s ease infinite; }
        .vocab-row:hover { background: rgba(255,255,255,0.04) !important; }
        .sentence-card:hover { border-color: rgba(16,185,129,0.25) !important; }
      `}</style>

      {/* Introduction */}
      <SectionCard title="Introduction" icon="📖">
        <p style={{
          margin: 0,
          color: "rgba(255,255,255,0.7)",
          fontSize: "0.85rem",
          lineHeight: 1.7,
          fontFamily: "'DM Mono', monospace",
        }}>
          {content.introduction}
        </p>
      </SectionCard>

      {/* Grammar */}
      <SectionCard title={content.grammar.title} icon="📐">
        <p style={{
          margin: 0,
          color: "rgba(255,255,255,0.6)",
          fontSize: "0.82rem",
          lineHeight: 1.6,
          fontFamily: "'DM Mono', monospace",
        }}>
          {content.grammar.explanation}
        </p>

        {content.grammar.conjugation && (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.82rem",
            }}>
              <thead>
                <tr>
                  {["Pronom", "Forme", "Exemple"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.grammar.conjugation.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "9px 12px", color: "rgba(255,255,255,0.45)", fontFamily: "'DM Mono', monospace" }}>
                      {row.pronoun}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <DEWord>{row.form}</DEWord>
                    </td>
                    <td style={{ padding: "9px 12px", color: "rgba(255,255,255,0.65)", fontFamily: "'DM Mono', monospace" }}>
                      {row.example.split(/(\b[A-ZÄÖÜ][a-zäöüß]+\b)/g).map((part, pi) => {
                        const isDE = /^[A-ZÄÖÜ]/.test(part) && part.length > 2;
                        return isDE ? <DEWord key={pi}>{part}</DEWord> : <span key={pi}>{part}</span>;
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {content.grammar.examples.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{
              margin: 0,
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.65rem",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}>
              Exemples
            </p>
            {content.grammar.examples.map((ex, i) => (
              <div key={i} style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(16,185,129,0.12)",
                fontSize: "0.8rem",
                fontFamily: "'DM Mono', monospace",
                color: "rgba(255,255,255,0.7)",
              }}>
                {ex.split(/→/).map((part, pi) => (
                  pi === 0
                    ? <DEWord key={pi}>{part.trim()}</DEWord>
                    : <span key={pi}> → {part}</span>
                ))}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Vocabulary */}
      <SectionCard title="Vocabulaire" icon="📝">
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr",
            padding: "8px 14px",
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            {["Deutsch 🇩🇪", "Français 🇫🇷", "Exemple"].map((h) => (
              <span key={h} style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.62rem",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}>
                {h}
              </span>
            ))}
          </div>

          {content.vocabulary.map((item, i) => (
            <div
              key={i}
              className="vocab-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1.5fr",
                padding: "11px 14px",
                borderBottom: i < content.vocabulary.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: "transparent",
                transition: "background 0.1s",
              }}
            >
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: "#10b981", fontSize: "0.85rem" }}>
                {item.de}
              </span>
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", fontFamily: "'DM Mono', monospace" }}>
                {item.fr}
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", fontStyle: "italic" }}>
                {item.example}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Example sentences */}
      <SectionCard title="Phrases clés" icon="🗣️">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {content.sentences.map((s, i) => (
            <div
              key={i}
              className="sentence-card"
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "border-color 0.15s",
              }}
            >
              <button
                onClick={() => handlePlay(i)}
                title="Écouter (simulé)"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: "1px solid rgba(16,185,129,0.25)",
                  background: playingIdx === i ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.08)",
                  color: "#10b981",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                <span className={playingIdx === i ? "playing" : ""}>
                  {playingIdx === i ? "▶" : "🔊"}
                </span>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: "0 0 4px",
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#34d399",
                }}>
                  {s.de}
                </p>
                <p style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.75rem",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {s.fr}
                </p>
              </div>
              <span style={{
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(16,185,129,0.08)",
                color: "rgba(16,185,129,0.6)",
                fontSize: "0.6rem",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {level}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* CTA */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 8, paddingBottom: 16 }}>
        <button
          onClick={onComplete}
          style={{
            padding: "14px 40px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            boxShadow: "0 6px 24px rgba(16,185,129,0.35)",
            letterSpacing: "0.02em",
          }}
        >
          Commencer le Quiz →
        </button>
      </div>
    </div>
  );
}
