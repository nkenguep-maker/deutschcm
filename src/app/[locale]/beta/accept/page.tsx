"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BetaAcceptPage() {
  const locale = useLocale();
  const isEnglish = locale === "en";
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universe, setUniverse] = useState<"monde" | "racines">("monde");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const inviteToken = fragment.get("token") ?? "";
    setToken(inviteToken);
    setTokenReady(true);

    // Keep the secret out of browser history, screenshots and copied URLs once
    // it has been loaded into this in-memory component state.
    if (inviteToken) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError(isEnglish ? "This invitation link is incomplete." : "Ce lien d’invitation est incomplet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/beta/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, email, password: password || undefined, fullName, universe }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload?.code === "password_required") {
          setError(
            isEnglish
              ? "Choose a password of at least eight characters for your new account."
              : "Choisissez un mot de passe d’au moins huit caractères pour votre nouveau compte.",
          );
        } else {
          setError(
            response.status === 410
              ? (isEnglish ? "This invitation has expired." : "Cette invitation a expiré.")
              : response.status === 409
                ? (isEnglish ? "This invitation is already used or has been revoked." : "Cette invitation a déjà été utilisée ou a été révoquée.")
                : (isEnglish ? "The invitation could not be activated." : "L’invitation n’a pas pu être activée."),
          );
        }
        return;
      }

      if (payload.status === "existing") {
        setToken("");
        setPassword("");
        setExisting(true);
        return;
      }

      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setToken("");
        setPassword("");
        setError(isEnglish ? "Account created. Please sign in." : "Compte créé. Connectez-vous pour continuer.");
        return;
      }
      const syncResponse = await fetch("/api/auth/sync", { method: "POST" });
      if (!syncResponse.ok) {
        await supabase.auth.signOut();
        setToken("");
        setPassword("");
        setError(isEnglish ? "Account created. Please sign in again." : "Compte créé. Reconnectez-vous pour continuer.");
        return;
      }
      await supabase.auth.refreshSession();
      setToken("");
      setPassword("");
      router.push(universe === "racines" ? "/onboarding/racines" : "/onboarding/monde");
      router.refresh();
    } catch {
      setError(isEnglish ? "Unable to activate the invitation right now." : "Impossible d’activer l’invitation pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  if (existing) {
    return (
      <main className="min-h-screen bg-[#0f0b07] text-[#f7f1e8] px-6 py-16 flex items-center justify-center">
        <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
          <p className="text-xs uppercase tracking-[0.22em] text-[#d7b56d]">YEMA · Beta</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {isEnglish ? "Your access is active." : "Votre accès est actif."}
          </h1>
          <p className="mt-4 leading-7 text-white/70">
            {isEnglish
              ? "This email already has a YEMA account. Your beta admission has been added without changing your password or roles."
              : "Cette adresse possède déjà un compte YEMA. L’accès bêta a été ajouté sans modifier votre mot de passe ni vos rôles."}
          </p>
          <Link href={`/${locale}/login`} className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[#d7b56d] px-6 py-3 font-medium text-[#0f0b07]">
            {isEnglish ? "Sign in" : "Se connecter"}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0b07] text-[#f7f1e8] px-6 py-12 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[#d7b56d]">Invitation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {isEnglish ? "Enter the YEMA closed beta." : "Entrez dans la bêta fermée YEMA."}
        </h1>
        <p className="mt-4 leading-7 text-white/70">
          {isEnglish
            ? "Use the exact email address that received this link. If you already have a YEMA account, leave the password empty. The invitation never grants a privileged role."
            : "Utilisez exactement l’adresse e-mail qui a reçu ce lien. Si vous avez déjà un compte YEMA, laissez le mot de passe vide. L’invitation n’accorde jamais de rôle privilégié."}
        </p>

        {!tokenReady ? (
          <p className="mt-8 text-sm text-white/60">{isEnglish ? "Reading invitation…" : "Lecture de l’invitation…"}</p>
        ) : !token ? (
          <p role="alert" className="mt-8 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {isEnglish ? "This invitation link is incomplete." : "Ce lien d’invitation est incomplet."}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm text-white/75">{isEnglish ? "Name" : "Nom"}</span>
              <input className="min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none focus:border-[#d7b56d]" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} autoComplete="name" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/75">Email</span>
              <input className="min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none focus:border-[#d7b56d]" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/75">
                {isEnglish ? "Password · new accounts only" : "Mot de passe · nouveaux comptes uniquement"}
              </span>
              <input className="min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none focus:border-[#d7b56d]" type="password" minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/75">{isEnglish ? "Universe" : "Univers"}</span>
              <select className="min-h-11 w-full rounded-xl border border-white/15 bg-[#18110b] px-4 py-3" value={universe} onChange={(e) => setUniverse(e.target.value === "racines" ? "racines" : "monde")}>
                <option value="monde">Monde</option>
                <option value="racines">Racines</option>
              </select>
            </label>

            {error ? <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}

            <button type="submit" disabled={loading} className="min-h-11 w-full rounded-full bg-[#d7b56d] px-6 py-3 font-semibold text-[#0f0b07] disabled:cursor-not-allowed disabled:opacity-50">
              {loading
                ? (isEnglish ? "Activating…" : "Activation…")
                : (isEnglish ? "Activate my access" : "Activer mon accès")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
