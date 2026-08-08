"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "@/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BetaAcceptPage() {
  const locale = useLocale();
  const isEnglish = locale === "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universe, setUniverse] = useState<"monde" | "racines">("monde");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);

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
        body: JSON.stringify({ token, email, password, fullName, universe }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          response.status === 410
            ? (isEnglish ? "This invitation has expired." : "Cette invitation a expiré.")
            : (isEnglish ? "The invitation could not be activated." : "L’invitation n’a pas pu être activée."),
        );
        return;
      }

      if (payload.status === "existing") {
        setExisting(true);
        return;
      }

      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(isEnglish ? "Account created. Please sign in." : "Compte créé. Connectez-vous pour continuer.");
        return;
      }
      const syncResponse = await fetch("/api/auth/sync", { method: "POST" });
      if (!syncResponse.ok) {
        await supabase.auth.signOut();
        setError(isEnglish ? "Account created. Please sign in again." : "Compte créé. Reconnectez-vous pour continuer.");
        return;
      }
      await supabase.auth.refreshSession();
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
        <p className="text-xs uppercase tracking-[0.22em] text-[#d7b56d]">
          {isEnglish ? "Invitation" : "Invitation"}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {isEnglish ? "Enter the YEMA closed beta." : "Entrez dans la bêta fermée YEMA."}
        </h1>
        <p className="mt-4 leading-7 text-white/70">
          {isEnglish
            ? "Use the exact email address that received this link. The invitation does not grant any privileged role."
            : "Utilisez exactement l’adresse e-mail qui a reçu ce lien. L’invitation n’accorde aucun rôle privilégié."}
        </p>

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
            <span className="mb-2 block text-sm text-white/75">{isEnglish ? "Password" : "Mot de passe"}</span>
            <input className="min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none focus:border-[#d7b56d]" type="password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-white/75">{isEnglish ? "Universe" : "Univers"}</span>
            <select className="min-h-11 w-full rounded-xl border border-white/15 bg-[#18110b] px-4 py-3" value={universe} onChange={(e) => setUniverse(e.target.value === "racines" ? "racines" : "monde")}>
              <option value="monde">Monde</option>
              <option value="racines">Racines</option>
            </select>
          </label>

          {error ? <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}

          <button type="submit" disabled={loading || !token} className="min-h-11 w-full rounded-full bg-[#d7b56d] px-6 py-3 font-semibold text-[#0f0b07] disabled:cursor-not-allowed disabled:opacity-50">
            {loading
              ? (isEnglish ? "Activating…" : "Activation…")
              : (isEnglish ? "Activate my access" : "Activer mon accès")}
          </button>
        </form>
      </section>
    </main>
  );
}
