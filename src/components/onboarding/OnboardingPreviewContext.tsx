"use client";

import { createContext, useContext, type ReactNode } from "react";

export type OnboardingSelectionMode = "live" | "preview" | "preconfirmation";

const OnboardingSelectionContext = createContext<OnboardingSelectionMode>("live");

export function OnboardingPreviewProvider({ children }: { children: ReactNode }) {
  return (
    <OnboardingSelectionContext.Provider value="preview">
      {children}
    </OnboardingSelectionContext.Provider>
  );
}

export function PreconfirmationOnboardingProvider({ children }: { children: ReactNode }) {
  return (
    <OnboardingSelectionContext.Provider value="preconfirmation">
      {children}
    </OnboardingSelectionContext.Provider>
  );
}

export function useOnboardingSelectionMode() {
  return useContext(OnboardingSelectionContext);
}
