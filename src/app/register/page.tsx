"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

type Role = "STUDENT" | "TEACHER" | "CENTER_MANAGER";

const ROLES: { key: Role; emoji: string; label: string; sub: string; color: string }[] = [
  { key: "STUDENT",        emoji: "🎓", label: "Je suis apprenant",   sub: "J'apprends l'allemand (A1→C1)", color: "#10b981" },
  { key: "TEACHER",        emoji: "👨‍🏫", label: "Je suis enseignant", sub: "J'enseigne et gère des classes",  color: "#6366f1" },
  { key: "CENTER_MANAGER", emoji: "🏫", label: "Je gère un centre",   sub: "Centre de langues / établissement", color: "#eab308" },
];

const ONBOARDING_DEST: Record<Role, string> = {
  STUDENT: "/onboarding/student",
  TEACHER: "/onboarding/teacher",
  CENTER_MANAGER: "/onboarding/center",
};

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      document.cookie = `user_role=${selectedRole};path=/;max-age=2592000`;
      document.cookie = `onboarding_done=false;path=/;max-age=2592000`;
      router.push(ONBOARDING_DEST[selectedRole]);
      router.refresh();
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  const activeRole = selectedRole ? ROLES.find(r => r.key === selectedRole) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .slide-in { animation: slideIn 0.35s ease forwards; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0d1a12 inset !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>

      <div
        className="relative min-h-screen w-full flex items-center justify-center px-5 py-10"
        style={{ background: "#080c10", fontFamily: "'DM Mono', monospace" }}
      >
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(80px)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #059669, transparent)", filter: "blur(60px)" }}
          />
        </div>

        <div className="relative z-10 w-full fade-up" style={{ maxWidth: 420 }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))",
                border: "1px solid rgba(16,185,129,0.3)",
                boxShadow: "0 0 40px rgba(16,185,129,0.1)",
              }}
            >
             
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "white", fontFamily: "'Syne', sans-serif" }}
            >
              Yema
            </h1>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Commence ton voyage linguistique
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            }}
          >
            {/* ── Success state ── */}
            {success ? (
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
                >
                  ✉️
                </div>
                <h2
                  className="text-lg font-bold mb-2"
                  style={{ color: "white", fontFamily: "'Syne', sans-serif" }}
                >
                  Vérifie ta boîte mail
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Un lien de confirmation a été envoyé à{" "}
                  <span style={{ color: "#10b981" }}>{email}</span>.
                  <br /><br />
                  Clique sur le lien pour activer ton compte et accéder à l'espace{" "}
                  <span style={{ color: "#10b981" }}>
                    {activeRole?.label ?? ""}
                  </span>.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-6 px-6 py-3 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white",
                    fontFamily: "'Syne', sans-serif",
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                  }}
                >
                  Retour à la connexion
                </Link>
              </div>

            ) : selectedRole === null ? (
              /* ── Step 1 : role picker ── */
              <div className="slide-in">
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: "white", fontFamily: "'Syne', sans-serif" }}
                >
                  Créer un compte
                </h2>
                <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {t("chooseRoleHint")}
                </p>

                <div className="flex flex-col gap-3">
                  {ROLES.map(({ key, emoji, label, sub, color }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedRole(key)}
                      className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{
                        background: `${color}08`,
                        border: `1px solid ${color}25`,
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${color}15`)}
                      onMouseLeave={e => (e.currentTarget.style.background = `${color}08`)}
                    >
                      <div
                        className="text-2xl flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                      >
                        {emoji}
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-sm font-bold mb-0.5"
                          style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'Syne', sans-serif" }}
                        >
                          {t(key === "STUDENT" ? "roleStudent" : key === "TEACHER" ? "roleTeacher" : "roleCenter")}
                        </div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {t(key === "STUDENT" ? "roleStudentDesc" : key === "TEACHER" ? "roleTeacherDesc" : "roleCenterDesc")}
                        </div>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 18 }}>›</span>
                    </button>
                  ))}
                </div>
              </div>

            ) : (
              /* ── Step 2 : form ── */
              <div className="slide-in">
                {/* Role indicator + back button */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: `${activeRole!.color}15`,
                        border: `1px solid ${activeRole!.color}30`,
                        color: activeRole!.color,
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {activeRole!.emoji} {activeRole!.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="text-xs transition-all"
                    style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    ← Changer
                  </button>
                </div>

                {error && (
                  <div
                    className="mb-4 px-4 py-3 rounded-xl text-xs"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#f87171",
                    }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Nom complet</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Paul Nkengue"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                        fontFamily: "'DM Mono', monospace",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Adresse email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@example.com"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                        fontFamily: "'DM Mono', monospace",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Mot de passe</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                        fontFamily: "'DM Mono', monospace",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 mt-2"
                    style={{
                      background: loading
                        ? "rgba(16,185,129,0.4)"
                        : "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      fontFamily: "'Syne', sans-serif",
                      boxShadow: loading ? "none" : "0 4px 24px rgba(16,185,129,0.35)",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? tc("loading") : `${t("registerBtn")} →`}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>
              Déjà un compte ?{" "}
              <Link href="/login" style={{ color: "#10b981", textDecoration: "none" }}>
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
