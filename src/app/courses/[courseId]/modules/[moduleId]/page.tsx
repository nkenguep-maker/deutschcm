"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import LessonViewer from "@/components/LessonViewer";
import QuizEngine from "@/components/QuizEngine";
import { COURSE_MODULES, COURSE_TITLES } from "@/data/courses";
import type { CourseModule } from "@/types/courses";

// ─── Module type icons & colors ────────────────────────────────────────────────

const TYPE_CONFIG = {
  lesson: { icon: "📖", label: "Leçon", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  quiz: { icon: "✏️", label: "Quiz", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  conversation: { icon: "🎙️", label: "Simulation", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
};

// ─── Sidebar module item ────────────────────────────────────────────────────────

function ModuleItem({ mod, active, done, courseId }: { mod: CourseModule; active: boolean; done: boolean; courseId: string }) {
  const cfg = TYPE_CONFIG[mod.type];
  return (
    <Link
      href={`/courses/${courseId}/modules/${mod.id}`}
      style={{ textDecoration: "none" }}
    >
      <div style={{
        padding: "11px 12px",
        borderRadius: 12,
        border: active ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.06)",
        background: active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        transition: "all 0.15s",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.85rem",
          background: active ? cfg.bg : "rgba(255,255,255,0.05)",
          border: `1px solid ${active ? cfg.border : "rgba(255,255,255,0.08)"}`,
        }}>
          {done ? "✓" : cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            color: active ? "#10b981" : done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.8)",
            fontFamily: "'Syne', sans-serif",
            fontWeight: active ? 700 : 500,
            fontSize: "0.75rem",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {mod.title}
          </p>
          <p style={{
            margin: "2px 0 0",
            color: "rgba(255,255,255,0.25)",
            fontSize: "0.6rem",
            fontFamily: "'DM Mono', monospace",
          }}>
            {cfg.label} · {mod.xp} XP · {mod.duration}min
          </p>
        </div>
        {done && (
          <span style={{ color: "#10b981", fontSize: "0.7rem", flexShrink: 0 }}>✓</span>
        )}
        {active && (
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
        )}
      </div>
    </Link>
  );
}

// ─── Right panel ───────────────────────────────────────────────────────────────

function RightPanel({
  mod,
  nextMod,
  courseId,
  xpEarned,
  secondsSpent,
  completed,
}: {
  mod: CourseModule;
  nextMod?: CourseModule;
  courseId: string;
  xpEarned: number;
  secondsSpent: number;
  completed: boolean;
}) {
  const router = useRouter();
  const cfg = TYPE_CONFIG[mod.type];
  const mins = Math.floor(secondsSpent / 60);
  const secs = secondsSpent % 60;

  const tips: Record<CourseModule["type"], string[]> = {
    lesson: [
      "Lisez à voix haute pour mémoriser la prononciation.",
      "Répétez chaque conjugaison 3 fois pour la retenir.",
      "Associez chaque mot à une image mentale.",
    ],
    quiz: [
      "Prenez le temps de lire toutes les options avant de répondre.",
      "Eliminez d'abord les réponses clairement incorrectes.",
      "Si vous hésitez, faites confiance à votre premier instinct.",
    ],
    conversation: [
      "Parlez lentement et clairement, même en hésitant.",
      "Utilisez 'Könnten Sie das wiederholen?' si vous ne comprenez pas.",
      "Herr Bauer est strict mais patient — osez répondre !",
    ],
  };
  const tip = tips[mod.type][Math.floor(Date.now() / 10000) % tips[mod.type].length];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 16px", height: "100%", overflowY: "auto" }}>

      {/* XP card */}
      <div style={{
        borderRadius: 16, padding: "16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <p style={{ margin: "0 0 12px", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          ⚡ XP Session
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#10b981" }}>
            +{xpEarned}
          </span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>/ {mod.xp} XP</span>
        </div>
        <div style={{ marginTop: 10, height: 5, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.07)" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${Math.min(100, (xpEarned / mod.xp) * 100)}%`,
            background: "linear-gradient(90deg, #10b981, #059669)",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{
        borderRadius: 16, padding: "14px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <p style={{ margin: "0 0 2px", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          ⏱ Temps passé
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "white" }}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem" }}>/ {mod.duration}min estimé</span>
        </div>
        {/* Module type badge */}
        <div style={{
          padding: "6px 12px", borderRadius: 8, alignSelf: "flex-start",
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          color: cfg.color, fontSize: "0.68rem", fontFamily: "'Syne', sans-serif", fontWeight: 600,
        }}>
          {cfg.icon} {cfg.label}
        </div>
      </div>

      {/* Tip */}
      <div style={{
        borderRadius: 16, padding: "14px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <p style={{ margin: "0 0 8px", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          💡 Conseil
        </p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
          {tip}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      {/* Next module */}
      {nextMod && (
        <div style={{
          borderRadius: 16, padding: "14px 16px",
          background: completed ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
          border: completed ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <p style={{ margin: 0, fontSize: "0.65rem", color: completed ? "#10b981" : "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {completed ? "✓ Terminé · Module suivant" : "↓ Module suivant"}
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.8rem" }}>
            {nextMod.title}
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontFamily: "'DM Mono', monospace" }}>
            {TYPE_CONFIG[nextMod.type].icon} {TYPE_CONFIG[nextMod.type].label} · {nextMod.xp} XP
          </p>
          <button
            onClick={() => router.push(`/courses/${courseId}/modules/${nextMod.id}`)}
            style={{
              padding: "10px 16px", borderRadius: 12, border: "none",
              background: completed ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.07)",
              color: completed ? "white" : "rgba(255,255,255,0.5)",
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.78rem",
              cursor: "pointer",
              boxShadow: completed ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {completed ? "Continuer →" : "Passer au suivant →"}
          </button>
        </div>
      )}

      {/* Back to course */}
      <Link
        href="/courses"
        style={{
          padding: "9px 16px", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: "rgba(255,255,255,0.3)",
          fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.72rem",
          textDecoration: "none",
          display: "block",
          textAlign: "center",
          transition: "all 0.15s",
        }}
      >
        ← Retour aux cours
      </Link>
    </div>
  );
}

// ─── Conversation redirect ─────────────────────────────────────────────────────

function ConversationRedirect({ scenario, onComplete }: { scenario?: string; onComplete: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      height: "100%",
      textAlign: "center",
      padding: "32px",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "2rem",
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.25)",
      }}>
        🎙️
      </div>
      <div>
        <p style={{ margin: "0 0 8px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>
          Simulation avec Herr Bauer
        </p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", fontFamily: "'DM Mono', monospace", lineHeight: 1.6, maxWidth: 380 }}>
          Ce module t&apos;envoie vers le simulateur d&apos;ambassade pour pratiquer les compétences de cette leçon dans un entretien réel avec Herr Klaus Bauer.
        </p>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Link
          href={`/simulateur`}
          style={{
            padding: "13px 28px", borderRadius: 13, border: "none",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem",
            textDecoration: "none",
            boxShadow: "0 6px 24px rgba(16,185,129,0.35)",
          }}
        >
          Lancer le simulateur →
        </Link>
        <button
          onClick={onComplete}
          style={{
            padding: "13px 22px", borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          Marquer comme fait
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

// ─── DB module types ───────────────────────────────────────────────────────────

interface DBModule {
  id: string;
  title: string;
  description: string | null;
  type: string;
  content: Record<string, unknown> | null;
  videoUrl?: string | null;
  sortOrder: number;
  xpReward: number;
  isPublished: boolean;
}

// ─── DB Lesson Viewer ─────────────────────────────────────────────────────────

function DBLessonViewer({ module: mod, onComplete }: { module: DBModule; onComplete: () => void }) {
  // VIDEO module — MP4 (NotebookLM) or YouTube
  if (mod.type === "VIDEO") {
    const content = mod.content as Record<string, unknown> | null;
    const rawUrl = (content?.videoUrl ?? mod.videoUrl ?? "") as string;
    const isYouTube = /(?:youtube\.com|youtu\.be)/.test(rawUrl);
    const isMp4 = /\.(mp4|webm|ogg)($|\?)/.test(rawUrl) || rawUrl.includes("supabase.co/storage");
    const youtubeId = rawUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];

    return (
      <div style={{ padding: "24px 28px", overflowY: "auto", height: "100%" }}>
        <h2 style={{ margin: "0 0 8px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.15rem" }}>
          🎬 {mod.title}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.3)", borderRadius: 20, padding: "2px 10px", fontSize: 10, color: "#60a5fa", fontWeight: 700 }}>
            {isMp4 ? "📓 NotebookLM Video Overview" : "▶ YouTube"}
          </span>
        </div>

        {isYouTube && youtubeId && (
          <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: 14, overflow: "hidden", background: "#000", marginBottom: 24 }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
              title={mod.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>
        )}

        {isMp4 && (
          <div style={{ borderRadius: 14, overflow: "hidden", background: "#000", marginBottom: 24, border: "1px solid rgba(66,133,244,0.2)" }}>
            <video
              controls
              style={{ width: "100%", display: "block", maxHeight: 420 }}
              preload="metadata"
            >
              <source src={rawUrl} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        )}

        {!isYouTube && !isMp4 && rawUrl && (
          <a href={rawUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.25)", color: "#60a5fa", textDecoration: "none", fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
            🎬 Voir la vidéo ↗
          </a>
        )}

        {!rawUrl && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem", marginBottom: 24 }}>Aucune vidéo disponible.</p>
        )}

        {mod.description && (
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", marginBottom: 24, lineHeight: 1.6 }}>
            {mod.description}
          </p>
        )}
        <button
          onClick={onComplete}
          style={{ padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}
        >
          ✓ Vidéo terminée — Continuer
        </button>
      </div>
    );
  }

  const content = mod.content as Record<string, unknown> | null;
  const lektion = content?.lektion as Record<string, unknown> | undefined;
  const hoeren = content?.hoeren as Record<string, unknown> | undefined;
  const sprechen = content?.sprechen as Record<string, unknown> | undefined;
  const schreiben = content?.schreiben as Record<string, unknown> | undefined;

  const vocab = (lektion?.wortschatz as Record<string, unknown> | undefined)?.words as
    { de: string; article?: string; fr: string; example?: string }[] | undefined;
  const grammatik = lektion?.grammatik as
    { point: string; explication_fr: string; exemples?: { de: string; fr: string }[] } | undefined;
  const lesetext = lektion?.lesetext as { title: string; text: string } | undefined;

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", height: "100%" }}>
      {lektion && (
        <>
          <h2 style={{ margin: "0 0 20px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.15rem" }}>
            📖 {(lektion.titleDE as string) ?? mod.title}
          </h2>

          {grammatik && (
            <div style={{ marginBottom: 24, padding: 18, borderRadius: 14, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p style={{ margin: "0 0 6px", color: "#818cf8", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>
                📐 {grammatik.point}
              </p>
              <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", lineHeight: 1.6 }}>{grammatik.explication_fr}</p>
              {grammatik.exemples?.slice(0, 3).map((ex, i) => (
                <div key={i} style={{ fontSize: "0.75rem", marginBottom: 4 }}>
                  <span style={{ color: "#a5b4fc", fontFamily: "'DM Mono', monospace" }}>{ex.de}</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>→ {ex.fr}</span>
                </div>
              ))}
            </div>
          )}

          {vocab && vocab.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 12px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>
                📚 Vocabulaire ({vocab.length} mots)
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {vocab.slice(0, 12).map((w, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p style={{ margin: 0, color: "#10b981", fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: "0.8rem" }}>
                      {w.article ? `${w.article} ` : ""}{w.de}
                    </p>
                    <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.7rem" }}>{w.fr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lesetext && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 10px", color: "#f59e0b", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>
                📄 {lesetext.title}
              </p>
              <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", lineHeight: 1.75, fontFamily: "'DM Mono', monospace" }}>
                {lesetext.text}
              </div>
            </div>
          )}
        </>
      )}

      {hoeren && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", color: "#6366f1", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>🎧 Compréhension orale</p>
          {(hoeren.dialoge as { title: string; context_fr: string; script?: { sprecher: string; text: string }[] }[] | undefined)?.map((d, i) => (
            <div key={i} style={{ marginBottom: 14, padding: 14, borderRadius: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <p style={{ margin: "0 0 6px", color: "white", fontWeight: 700, fontSize: "0.8rem", fontFamily: "'Syne', sans-serif" }}>{d.title}</p>
              <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>{d.context_fr}</p>
              {d.script?.slice(0, 4).map((s, j) => (
                <div key={j} style={{ display: "flex", gap: 10, marginBottom: 5 }}>
                  <span style={{ color: "#818cf8", fontSize: "0.72rem", fontWeight: 700, minWidth: 60, flexShrink: 0 }}>{s.sprecher}</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace" }}>{s.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {sprechen && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>🎙️ Expression orale</p>
          {(sprechen.uebungen as { title: string; instruction_fr: string }[] | undefined)?.map((u, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 14, borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <p style={{ margin: "0 0 4px", color: "white", fontWeight: 700, fontSize: "0.8rem", fontFamily: "'Syne', sans-serif" }}>{u.title}</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>{u.instruction_fr}</p>
            </div>
          ))}
        </div>
      )}

      {schreiben && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", color: "#f59e0b", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}>✍️ Expression écrite</p>
          {(schreiben.uebungen as { title: string; instruction_fr: string; musterloesung?: string }[] | undefined)?.map((u, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 14, borderRadius: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <p style={{ margin: "0 0 4px", color: "white", fontWeight: 700, fontSize: "0.8rem", fontFamily: "'Syne', sans-serif" }}>{u.title}</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>{u.instruction_fr}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onComplete}
        style={{
          marginTop: 8, padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem",
          boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
        }}
      >
        ✓ Cours terminé — Continuer
      </button>
    </div>
  );
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;

  const staticModules = useMemo(() => COURSE_MODULES[courseId] ?? [], [courseId]);
  const isDBCourse = staticModules.length === 0;

  // DB course state
  const [dbModules, setDbModules] = useState<DBModule[]>([]);
  const [dbLoading, setDbLoading] = useState(isDBCourse);

  useEffect(() => {
    if (!isDBCourse) return;
    fetch(`/api/courses/${courseId}`)
      .then(r => r.json())
      .then(d => { if (d.course?.modules) setDbModules(d.course.modules); })
      .catch(() => {})
      .finally(() => setDbLoading(false));
  }, [courseId, isDBCourse]);

  // Static path
  const modules = staticModules;
  const currentModule = useMemo(() => modules.find((m) => m.id === moduleId), [modules, moduleId]);
  const currentIndex = useMemo(() => modules.findIndex((m) => m.id === moduleId), [modules, moduleId]);
  const nextModule = modules[currentIndex + 1];

  // DB path
  const dbCurrentModule = useMemo(() => dbModules.find(m => m.id === moduleId), [dbModules, moduleId]);
  const dbCurrentIndex = useMemo(() => dbModules.findIndex(m => m.id === moduleId), [dbModules, moduleId]);
  const dbNextModule = dbModules[dbCurrentIndex + 1];

  const courseInfo = COURSE_TITLES[courseId];

  const [seconds, setSeconds] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [doneModules, setDoneModules] = useState<Set<string>>(new Set());

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset on module change
  useEffect(() => {
    setSeconds(0);
    setXpEarned(0);
    setCompleted(false);
  }, [moduleId]);

  const handleLessonComplete = () => {
    setXpEarned(currentModule?.xp ?? 50);
    setCompleted(true);
    setDoneModules((prev) => new Set(prev).add(moduleId));
    if (nextModule) router.push(`/courses/${courseId}/modules/${nextModule.id}`);
  };

  const handleQuizComplete = (score: number) => {
    if (!currentModule) return;
    const ratio = score / (currentModule.quizContent?.questions.length ?? 5);
    const earned = Math.round(currentModule.xp * ratio);
    setXpEarned(earned);
    setCompleted(true);
    setDoneModules((prev) => new Set(prev).add(moduleId));
  };

  const handleConversationComplete = () => {
    setXpEarned(currentModule?.xp ?? 150);
    setCompleted(true);
    setDoneModules((prev) => new Set(prev).add(moduleId));
  };

  // ── DB course: loading ──
  if (isDBCourse && dbLoading) {
    return (
      <Layout title="Chargement…">
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Syne', sans-serif" }}>Chargement du cours…</p>
        </div>
      </Layout>
    );
  }

  // ── DB course: render ──
  if (isDBCourse && dbCurrentModule) {
    return (
      <Layout title={dbCurrentModule.title}>
        <div style={{ margin: "-32px -28px -48px", height: "calc(100vh - 64px)", display: "flex", overflow: "hidden", background: "#080c10" }}>
          {/* Sidebar */}
          <aside style={{ width: 240, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflowY: "auto", padding: "16px 10px" }}>
            <p style={{ margin: "0 0 12px 4px", color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Modules
            </p>
            {dbModules.map(m => {
              const active = m.id === moduleId;
              const done = doneModules.has(m.id);
              return (
                <Link key={m.id} href={`/courses/${courseId}/modules/${m.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "10px 12px", borderRadius: 10, marginBottom: 4, border: active ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.05)", background: active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)" }}>
                    <p style={{ margin: 0, color: active ? "#10b981" : done ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.75)", fontSize: "0.72rem", fontFamily: "'Syne', sans-serif", fontWeight: active ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {done ? "✓ " : ""}{m.title}
                    </p>
                    <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.25)", fontSize: "0.6rem" }}>{m.xpReward} XP</p>
                  </div>
                </Link>
              );
            })}
          </aside>

          {/* Main content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <DBLessonViewer
              module={dbCurrentModule}
              onComplete={() => {
                setXpEarned(dbCurrentModule.xpReward);
                setCompleted(true);
                setDoneModules(prev => new Set(prev).add(moduleId));
                if (dbNextModule) router.push(`/courses/${courseId}/modules/${dbNextModule.id}`);
              }}
            />
          </div>

          {/* Right panel (simplified) */}
          <div style={{ width: 220, borderLeft: "1px solid rgba(255,255,255,0.07)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>⚡ XP</p>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.8rem", color: "#10b981" }}>+{xpEarned}</span>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}> / {dbCurrentModule.xpReward} XP</span>
            </div>
            <Link href="/courses" style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.72rem", textDecoration: "none", display: "block", textAlign: "center" }}>
              ← Retour aux cours
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentModule) {
    return (
      <Layout title="Module introuvable">
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontSize: "2rem", marginBottom: 12 }}>🔍</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Syne', sans-serif" }}>
            Module introuvable.{" "}
            <Link href="/courses" style={{ color: "#10b981" }}>
              Retour aux cours
            </Link>
          </p>
        </div>
      </Layout>
    );
  }

  const levelColors: Record<string, string> = { A1: "#10b981", A2: "#14b8a6", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f97316" };
  const levelColor = levelColors[courseInfo?.level ?? "A1"] ?? "#10b981";

  return (
    <Layout title={courseInfo?.titleDE ?? "Module"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .mod-scroll::-webkit-scrollbar { width: 4px; }
        .mod-scroll::-webkit-scrollbar-track { background: transparent; }
        .mod-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
      `}</style>

      {/* Full-bleed 3-column layout */}
      <div style={{
        margin: "-32px -28px -48px",
        height: "calc(100vh - 64px)",
        display: "flex",
        overflow: "hidden",
        background: "#080c10",
      }}>

        {/* ════ LEFT SIDEBAR — Module list ════ */}
        <aside
          className="mod-scroll"
          style={{
            width: 240,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "16px 10px",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {/* Course header */}
          <div style={{
            padding: "12px 10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: "1.2rem" }}>{courseInfo?.icon ?? "📚"}</span>
              <div>
                <p style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.2 }}>
                  {courseInfo?.titleDE ?? courseId}
                </p>
                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace" }}>
                  {courseInfo?.titleFR}
                </p>
              </div>
            </div>
            <span style={{
              padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem",
              background: `${levelColor}18`,
              color: levelColor,
              border: `1px solid ${levelColor}33`,
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
            }}>
              {courseInfo?.level ?? "A1"}
            </span>
          </div>

          {/* Progression */}
          <div style={{ padding: "0 4px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62rem", fontFamily: "'DM Mono', monospace" }}>Progression</span>
              <span style={{ color: "#10b981", fontSize: "0.62rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
                {doneModules.size}/{modules.length}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.07)" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${(doneModules.size / modules.length) * 100}%`,
                background: "linear-gradient(90deg, #10b981, #059669)",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Module items */}
          <p style={{ margin: "0 0 4px 4px", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", fontFamily: "'Syne', sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Modules
          </p>
          {modules.map((mod) => (
            <ModuleItem
              key={mod.id}
              mod={mod}
              active={mod.id === moduleId}
              done={doneModules.has(mod.id)}
              courseId={courseId}
            />
          ))}
        </aside>

        {/* ════ CENTER — Module content ════ */}
        <main
          className="mod-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Module header */}
          <div style={{
            padding: "20px 28px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(8,12,16,0.8)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem",
                background: TYPE_CONFIG[currentModule.type].bg,
                border: `1px solid ${TYPE_CONFIG[currentModule.type].border}`,
              }}>
                {TYPE_CONFIG[currentModule.type].icon}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem", lineHeight: 1.2 }}>
                  {currentModule.title}
                </h2>
                <p style={{ margin: "3px 0 0", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontFamily: "'DM Mono', monospace" }}>
                  {currentModule.description} · {currentModule.xp} XP · {currentModule.duration}min
                </p>
              </div>
              {completed && (
                <span style={{
                  padding: "4px 12px", borderRadius: 8,
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                  color: "#10b981", fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.7rem",
                }}>
                  ✓ Terminé
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "24px 28px 32px" }}>
            {currentModule.type === "lesson" && currentModule.lessonContent && (
              <LessonViewer
                content={currentModule.lessonContent}
                level={courseInfo?.level ?? "A1"}
                title={currentModule.title}
                onComplete={handleLessonComplete}
              />
            )}

            {currentModule.type === "quiz" && currentModule.quizContent && (
              <QuizEngine
                questions={currentModule.quizContent.questions}
                xp={currentModule.xp}
                onComplete={handleQuizComplete}
              />
            )}

            {currentModule.type === "conversation" && (
              <ConversationRedirect
                scenario={currentModule.conversationScenario}
                onComplete={handleConversationComplete}
              />
            )}
          </div>
        </main>

        {/* ════ RIGHT PANEL ════ */}
        <aside
          className="mod-scroll"
          style={{
            width: 280,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <RightPanel
            mod={currentModule}
            nextMod={nextModule}
            courseId={courseId}
            xpEarned={xpEarned}
            secondsSpent={seconds}
            completed={completed}
          />
        </aside>
      </div>
    </Layout>
  );
}
