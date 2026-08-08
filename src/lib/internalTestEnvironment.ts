import "server-only";

const P1_REF = "kzzagbojjkivdzzcrmxn";
const FORBIDDEN_REFS = [
  "sbjhvlrkbyjckdxujjsk",
  "mamofhrurksyuuolucea",
  "qggwvonfumuimjfsgpdz",
];

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
  if (!supabaseUrl.includes(P1_REF)) return false;
  if (FORBIDDEN_REFS.some((ref) => supabaseUrl.includes(ref))) return false;

  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.P1_BASELINE_CONFIRMED_NOT_PRODUCTION === "true"
  );
}
