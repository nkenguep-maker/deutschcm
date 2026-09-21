import "server-only";

type TechnicalBetaEnv = {
  YEMA_TECHNICAL_BETA_COURSE_ACCESS?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

/**
 * Technical A1 access is a non-commercial Preview/local cohort.
 *
 * Safety contract:
 * - Vercel Production is ALWAYS strict AccessGrant mode.
 * - explicit "false" closes the cohort everywhere.
 * - explicit "true" opens it only outside Vercel Production.
 * - with no explicit flag, Vercel Preview and local development are open;
 *   generic production/CI environments remain closed.
 */
export function technicalBetaCourseAccessEnabled(
  env: TechnicalBetaEnv = process.env,
): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.YEMA_TECHNICAL_BETA_COURSE_ACCESS === "false") return false;
  if (env.YEMA_TECHNICAL_BETA_COURSE_ACCESS === "true") return true;
  return env.VERCEL_ENV === "preview" || env.NODE_ENV === "development";
}

export function isTechnicalBetaCourseAccessEnabled(): boolean {
  return technicalBetaCourseAccessEnabled(process.env);
}
