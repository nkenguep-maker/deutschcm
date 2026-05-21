"use client";

import { Link } from "@/navigation";
import TeacherLayout from "@/components/TeacherLayout";
import { useT } from "@/hooks/useT";

export default function ResourcesPage() {
  const { teacher: tT, nav: tNav, common: tC } = useT();

  const RESOURCE_CARDS = [
    { icon: "💬", title: tT.resource1Title, color: "#10b981" },
    { icon: "🌟", title: tT.resource2Title, color: "#f59e0b" },
    { icon: "📝", title: tT.resource3Title, color: "#6366f1" },
    { icon: "✈️", title: tT.resource4Title, color: "#3b82f6" },
  ];

  return (
    <TeacherLayout title={tNav.resources}>
      <div style={{ maxWidth: 800 }}>

        {/* Subtitle */}
        <p style={{ margin: "0 0 28px", color: "rgba(255,255,255,0.65)", fontSize: "0.86rem" }}>
          {tT.resourcesSubtitle}
        </p>

        {/* Resource cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(340px, 100%), 1fr))", gap: 14, marginBottom: 32 }}>
          {RESOURCE_CARDS.map((r, i) => (
            <div key={i} style={{ padding: "22px 20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", background: `${r.color}12`, border: `1px solid ${r.color}28` }}>
                {r.icon}
              </div>
              <div>
                <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.85)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.88rem" }}>{r.title}</p>
                <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                  {tT.resourcesComingSoon}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Teaching Studio link */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🎓</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: "0 0 4px", color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>{tT.studioTitle}</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", fontSize: "0.84rem", lineHeight: 1.55 }}>{tT.studioSubtitle}</p>
          </div>
          <Link href="/admin/courses/generate" style={{
            padding: "9px 18px", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)",
            color: "#10b981", fontSize: "0.75rem", fontFamily: "'Syne', sans-serif", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
          }}>
            → {tT.studioTitle}
          </Link>
        </div>

        {/* Teaching studio note */}
        <p style={{ marginTop: 12, color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", fontFamily: "'DM Mono', monospace" }}>
          {tT.studioPublishWarning}
        </p>
      </div>
    </TeacherLayout>
  );
}
