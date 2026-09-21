import PersonaOnboardingPage from "../../onboarding/persona/page";
import { OnboardingPreviewProvider } from "@/components/onboarding/OnboardingPreviewContext";

export default function OnboardingPreviewPage() {
  return (
    <OnboardingPreviewProvider>
      <PersonaOnboardingPage />
    </OnboardingPreviewProvider>
  );
}
