import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Hosted Supabase's built-in SMTP has a hard project-wide email quota. It is
  // useful in normal development, but it can block the 9-persona P-1 QA run.
  // When (and only when) the signup fails because that email quota is exhausted,
  // try the P-1-only server escape hatch. The server endpoint itself is
  // fail-closed outside the canonical P-1 Preview, so Production keeps the
  // standard Supabase behavior and all normal Auth rate limits.
  const originalSignUp = client.auth.signUp.bind(client.auth);
  type SignUpCredentials = Parameters<typeof originalSignUp>[0];

  client.auth.signUp = (async (credentials: SignUpCredentials) => {
    const result = await originalSignUp(credentials);
    const code = (result.error as { code?: string } | null)?.code?.toLowerCase() ?? "";
    const message = result.error?.message?.toLowerCase() ?? "";
    const emailQuotaExceeded = Boolean(
      result.error && (
        code === "over_email_send_rate_limit" ||
        message.includes("email rate limit exceeded")
      )
    );

    if (!emailQuotaExceeded || !("email" in credentials) || !credentials.email) {
      return result;
    }

    const password = "password" in credentials && typeof credentials.password === "string"
      ? credentials.password
      : "";
    const metadata = (credentials.options?.data ?? {}) as Record<string, unknown>;
    const firstName = typeof metadata.first_name === "string" ? metadata.first_name : "";
    const lastName = typeof metadata.last_name === "string" ? metadata.last_name : "";

    if (!password || !firstName || !lastName) return result;

    try {
      const qaResponse = await fetch("/api/qa/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password,
          firstName,
          lastName,
          metadata,
        }),
      });

      // 404 is the expected Production behavior. Any other QA failure should
      // also preserve the original Supabase error instead of hiding it.
      if (!qaResponse.ok) return result;

      const login = await client.auth.signInWithPassword({
        email: credentials.email,
        password,
      });
      if (login.error) {
        return { data: { user: null, session: null }, error: login.error };
      }

      return { data: login.data, error: null };
    } catch {
      return result;
    }
  }) as typeof client.auth.signUp;

  return client;
}
