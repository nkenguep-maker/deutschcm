"use client";

interface Step {
  label: string;
  icon?: string;
}

interface Props {
  steps: Step[];
  current: number;
}

export default function OnboardingProgress({ steps, current }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 36 }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {/* Step circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: done ? "#10b981" : active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${done ? "#10b981" : active ? "#10b981" : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done ? "#fff" : active ? "#10b981" : "rgba(255,255,255,0.2)",
                fontWeight: 700, fontSize: done ? 16 : 14,
                transition: "all 0.3s ease",
                boxShadow: active ? "0 0 16px rgba(16,185,129,0.3)" : "none",
              }}>
                {done ? "✓" : (step.icon ?? String(i + 1))}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 400,
                color: done ? "#10b981" : active ? "#10b981" : "rgba(255,255,255,0.25)",
                whiteSpace: "nowrap", maxWidth: 70, textAlign: "center", lineHeight: 1.2,
              }}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div style={{
                width: 48, height: 2, margin: "0 4px", marginBottom: 22,
                background: done ? "#10b981" : "rgba(255,255,255,0.06)",
                transition: "background 0.3s ease",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
