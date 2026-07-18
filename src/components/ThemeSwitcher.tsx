"use client";

import { useTheme, Theme } from "@/contexts/ThemeContext";
import { useLocale } from "next-intl";

const LABELS: Record<"fr" | "en", Record<Theme, string>> = {
  fr: { light: "Clair", dark: "Sombre", auto: "Auto" },
  en: { light: "Light", dark: "Dark",   auto: "Auto" },
};

const ICONS: Record<Theme, string> = {
  light: "☀️",
  dark:  "🌙",
  auto:  "⚙️",
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale() as "fr" | "en";
  const labels = LABELS[locale] ?? LABELS.fr;

  const options: Theme[] = ["light", "dark", "auto"];

  return (
    <div
      role="group"
      aria-label={locale === "fr" ? "Choisir l'apparence" : "Choose appearance"}
      style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
    >
      {options.map(o => {
        const active = theme === o;
        return (
          <button
            key={o}
            onClick={() => setTheme(o)}
            aria-pressed={active}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: active
                ? "1px solid rgba(16,185,129,0.35)"
                : "1px solid rgba(255,255,255,0.09)",
              background: active
                ? "rgba(16,185,129,0.12)"
                : "rgba(255,255,255,0.04)",
              color: active ? "#10b981" : "rgba(255,255,255,0.5)",
              fontFamily: "'Syne', sans-serif",
              fontWeight: active ? 700 : 400,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all var(--dur-touch) var(--ease-enter)",
              minHeight: 40,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "1rem" }}>{ICONS[o]}</span>
            <span>{labels[o]}</span>
          </button>
        );
      })}
    </div>
  );
}
