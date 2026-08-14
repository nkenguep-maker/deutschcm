import "server-only";

const P1_REF = "kzzagbojjkivdzzcrmxn";

function isCanonicalP1SupabaseUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === "https:" &&
      url.hostname === `${P1_REF}.supabase.co` &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/"
    );
  } catch {
    return false;
  }
}

/**
 * Internal persona tooling may mutate fixtures and temporarily overlay roles.
 * It must never be available against Production Supabase or from a Vercel
 * Production deployment, even for the owner/tester email.
 *
 * Allowed contexts:
 * - a Vercel Preview wired to the canonical P-1 project; or
 * - an explicit local/CI P-1 runner with the non-production confirmation flag.
 */
export function isInternalTestEnvironment(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!isCanonicalP1SupabaseUrl(supabaseUrl)) return false;

  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION === "true"
  );
}
