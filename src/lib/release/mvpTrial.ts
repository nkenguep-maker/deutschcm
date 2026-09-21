import "server-only";

export const MVP_TRIAL_DAYS = 30;
export const MVP_TRIAL_KIND = "MVP_TRIAL" as const;

const COHORT_RE = /^[a-z0-9][a-z0-9_-]{1,39}$/;

export function getMvpTrialConfig():
  | { enabled: false }
  | { enabled: true; cohort: string } {
  if (process.env.YEMA_MVP_TRIAL_ENABLED !== "true") {
    return { enabled: false };
  }

  const cohort = process.env.YEMA_MVP_TRIAL_COHORT?.trim().toLowerCase() ?? "";
  if (!COHORT_RE.test(cohort)) {
    throw new Error(
      "YEMA_MVP_TRIAL_COHORT must be 2-40 lowercase letters, digits, _ or - when trial is enabled",
    );
  }

  return { enabled: true, cohort };
}
