"use client";

// OnboardingProgress — Kaffeehaus. Filet horizontal avec pastilles laiton.
// Pastille active au brass, précédentes cochées, suivantes en attente.

interface Step {
  label: string;
}

interface Props {
  steps: Step[];
  current: number;
}

export default function OnboardingProgress({ steps, current }: Props) {
  return (
    <ol
      className="lonboard-progress"
      aria-label="Progression de l'onboarding"
    >
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "on" : "next";
        return (
          <li
            key={i}
            className={`lonboard-progress-step ${state}`}
            aria-current={state === "on" ? "step" : undefined}
          >
            <span className="lonboard-progress-dot" aria-hidden="true">
              {state === "done" ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 6.5 5 9.5 10 3.5" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </span>
            <span className="lonboard-progress-lbl">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
