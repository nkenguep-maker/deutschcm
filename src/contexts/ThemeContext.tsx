"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";
export type EffectiveTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "auto",
  effectiveTheme: "dark",
  setTheme: () => {},
});

function resolveEffective(theme: Theme): EffectiveTheme {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  // Auto: system preference first, then time-of-day fallback
  if (typeof window !== "undefined") {
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    const h = new Date().getHours();
    return h >= 7 && h < 19 ? "light" : "dark";
  }
  return "dark";
}

function applyTheme(eff: EffectiveTheme) {
  document.documentElement.dataset.theme = eff;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("auto");
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>("dark");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = (localStorage.getItem("yema-theme") as Theme | null) ?? "auto";
    const eff = resolveEffective(stored);
    setThemeState(stored);
    setEffectiveTheme(eff);
    applyTheme(eff);
  }, []);

  // Watch system preference changes when in auto mode
  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const eff = resolveEffective("auto");
      setEffectiveTheme(eff);
      applyTheme(eff);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem("yema-theme", t);
    const eff = resolveEffective(t);
    setThemeState(t);
    setEffectiveTheme(eff);
    applyTheme(eff);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
