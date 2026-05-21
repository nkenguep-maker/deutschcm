"use client";

import React, { createContext, useContext, useEffect } from "react";

export type Theme = "light" | "dark" | "auto";
export type EffectiveTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  effectiveTheme: "dark",
  setTheme: () => {},
});

// Light mode not yet released — always dark
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", effectiveTheme: "dark", setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
