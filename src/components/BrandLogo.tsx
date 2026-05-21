"use client";

interface BrandLogoProps {
  variant?: "auth" | "nav" | "sidebar";
  tagline?: string;   // auth: displayed below wordmark
  subtitle?: string;  // sidebar: small caption below wordmark
}

const GREEN = "#10b981";
const ICON_BG = "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.08))";
const ICON_BORDER = "1px solid rgba(16,185,129,0.3)";

function YIcon({ size, fontSize, radius, shadow }: { size: number; fontSize: number; radius: number; shadow?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: ICON_BG,
      border: ICON_BORDER,
      display: "flex", alignItems: "center", justifyContent: "center",
      ...(shadow ? { boxShadow: shadow } : {}),
    }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize, color: GREEN, lineHeight: 1 }}>Y</span>
    </div>
  );
}

export default function BrandLogo({ variant = "auth", tagline, subtitle }: BrandLogoProps) {
  // ── Nav (landing header, demo header, footer) ──────────────────────────────
  if (variant === "nav") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <YIcon size={32} fontSize={13} radius={9} />
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>Yema</span>
      </div>
    );
  }

  // ── Sidebar (authenticated layout sidebars) ────────────────────────────────
  if (variant === "sidebar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <YIcon size={36} fontSize={14} radius={11} shadow="0 0 20px rgba(16,185,129,0.12)" />
        <div>
          <p style={{ margin: 0, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>Yema</p>
          {subtitle && (
            <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Auth (login / register pages) — vertical centered ─────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <YIcon size={52} fontSize={22} radius={14} shadow="0 0 40px rgba(16,185,129,0.1)" />
      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: "white", lineHeight: 1 }}>Yema</span>
      {tagline && (
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0, textAlign: "center" }}>{tagline}</p>
      )}
    </div>
  );
}
