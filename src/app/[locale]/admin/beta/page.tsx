"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";

interface InviteResponse {
  ok?: boolean;
  invitationId?: string;
  inviteUrl?: string;
  emailSent?: boolean;
  expiresAt?: string;
  expiresInSeconds?: number;
  error?: string;
}

export default function AdminBetaPage() {
  const locale = useLocale();
  const isEnglish = locale === "en";
  const [email, setEmail] = useState("");
  const [inviteLocale, setInviteLocale] = useState<"fr" | "en">(locale === "en" ? "en" : "fr");
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [result, setResult] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setCopied(false);
    setRevoked(false);
    try {
      const response = await fetch("/api/admin/beta/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale: inviteLocale }),
      });
      const payload = (await response.json().catch(() => ({}))) as InviteResponse;
      setResult(response.ok ? payload : { error: payload.error ?? "request_failed" });
    } catch {
      setResult({ error: "network" });
    } finally {
      setLoading(false);
    }
  }

  async function copyInvite() {
    if (!result?.inviteUrl || revoked) return;
    await navigator.clipboard.writeText(result.inviteUrl);
    setCopied(true);
  }

  async function revokeInvite() {
    if (!result?.invitationId || revoked) return;
    setRevoking(true);
    try {
      const response = await fetch("/api/admin/beta/invite/revoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invitationId: result.invitationId }),
      });
      if (response.ok) {
        setRevoked(true);
        setCopied(false);
      }
    } finally {
      setRevoking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0b07] px-6 py-10 text-[#f7f1e8]">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d7b56d]">Admin · Beta</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {isEnglish ? "Invite a tester" : "Inviter un testeur"}
            </h1>
          </div>
          <Link href={`/${locale}/admin`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/75">
            {isEnglish ? "Back to admin" : "Retour à l’admin"}
          </Link>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="max-w-2xl leading-7 text-white/65">
            {isEnglish
              ? "The link is valid for 72 hours, bound to the invited email, usable once and grants beta admission only. It never grants Teacher, Center or Admin privileges."
              : "Le lien est valable 72 heures, lié à l’e-mail invité, utilisable une seule fois et n’accorde que l’accès bêta. Il n’accorde jamais les privilèges Enseignant, Centre ou Admin."}
          </p>

          <form onSubmit={createInvite} className="mt-7 grid gap-5 sm:grid-cols-[1fr_120px]">
            <label className="block">
              <span className="mb-2 block text-sm text-white/75">Email</span>
              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 outline-none focus:border-[#d7b56d]"
                placeholder="tester@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/75">{isEnglish ? "Language" : "Langue"}</span>
              <select
                value={inviteLocale}
                onChange={(e) => setInviteLocale(e.target.value === "en" ? "en" : "fr")}
                className="min-h-11 w-full rounded-xl border border-white/15 bg-[#18110b] px-3 py-3"
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="min-h-11 rounded-full bg-[#d7b56d] px-6 py-3 font-semibold text-[#0f0b07] disabled:opacity-50 sm:col-span-2"
            >
              {loading
                ? (isEnglish ? "Creating invitation…" : "Création de l’invitation…")
                : (isEnglish ? "Create and send invitation" : "Créer et envoyer l’invitation")}
            </button>
          </form>

          {result?.error ? (
            <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {isEnglish ? "The invitation could not be created." : "L’invitation n’a pas pu être créée."}
            </p>
          ) : null}

          {result?.inviteUrl ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium">
                {revoked
                  ? (isEnglish ? "Invitation revoked." : "Invitation révoquée.")
                  : result.emailSent
                    ? (isEnglish ? "Email sent." : "E-mail envoyé.")
                    : (isEnglish ? "Email delivery failed — use the fallback link below." : "L’envoi de l’e-mail a échoué — utilisez le lien de secours ci-dessous.")}
              </p>
              {!revoked ? <p className="mt-3 break-all text-xs leading-6 text-white/55">{result.inviteUrl}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyInvite}
                  disabled={revoked}
                  className="min-h-11 rounded-full border border-white/15 px-5 py-2 text-sm disabled:opacity-40"
                >
                  {copied
                    ? (isEnglish ? "Copied" : "Copié")
                    : (isEnglish ? "Copy fallback link" : "Copier le lien de secours")}
                </button>
                <button
                  type="button"
                  onClick={revokeInvite}
                  disabled={revoked || revoking}
                  className="min-h-11 rounded-full border border-red-300/25 px-5 py-2 text-sm text-red-100 disabled:opacity-40"
                >
                  {revoking
                    ? (isEnglish ? "Revoking…" : "Révocation…")
                    : (isEnglish ? "Revoke this link" : "Révoquer ce lien")}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
