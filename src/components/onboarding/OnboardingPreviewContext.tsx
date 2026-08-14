"use client";

import { createContext, useContext, type ReactNode } from "react";

const OnboardingPreviewContext = createContext(false);

export function OnboardingPreviewProvider({ children }: { children: ReactNode }) {
  return (
    <OnboardingPreviewContext.Provider value>
      {children}
    </OnboardingPreviewContext.Provider>
  );
}

export function useOnboardingPreview() {
  return useContext(OnboardingPreviewContext);
}
