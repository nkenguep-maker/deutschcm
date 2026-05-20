"use client";

interface BrandLogoProps {
  variant?: "auth" | "nav";
  tagline?: string;
}

export default function BrandLogo({ variant = "auth", tagline }: BrandLogoProps) {
  if (variant === "nav") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.08))",
          border: "1px solid rgba(16,185,129,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: "#10b981" }}>Y</span>
        </div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "white" }}>Yema</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.08))",
        border: "1px solid rgba(16,185,129,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 40px rgba(16,185,129,0.1)",
      }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22, color: "#10b981" }}>Y</span>
      </div>
      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: "white", lineHeight: 1 }}>Yema</span>
      {tagline && (
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>{tagline}</p>
      )}
    </div>
  );
}
