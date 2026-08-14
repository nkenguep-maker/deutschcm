import PersonaOnboardingPage from "../onboarding/persona/page";
import { PreconfirmationOnboardingProvider } from "@/components/onboarding/OnboardingPreviewContext";

export default function PreconfirmationOnboardingPage() {
  return (
    <PreconfirmationOnboardingProvider>
      <PersonaOnboardingPage />
    </PreconfirmationOnboardingProvider>
  );
}
