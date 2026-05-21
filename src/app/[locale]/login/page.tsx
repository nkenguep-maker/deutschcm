"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

type Role = "STUDENT" | "TEACHER" | "CENTER_MANAGER";

const ROLE_KEYS: { key: Role; emoji: string }[] = [
  { key: "STUDENT",        emoji: "🎓" },
  { key: "TEACHER",        emoji: "👨‍🏫" },
  { key: "CENTER_MANAGER", emoji: "🏫" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [selectedRole, setSelectedRole] = useState<Role>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoleLabel = (key: Role) =>
    t(key === "STUDENT" ? "roleStudent" : key === "TEACHER" ? "roleTeacher" : "roleCenter");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setError(t("errorInvalid"));
      setLoading(false);
      return;
    }

    try {
      const profileRes = await fetch("/api/auth/profile");
      const profile = await profileRes.json();

      const role: string = profile.role || "STUDENT";
      const onboardingDone: boolean = profile.onboardingDone || false;

      document.cookie = `user_role=${role};path=/;max-age=2592000`;
      document.cookie = `onboarding_done=${onboardingDone};path=/;max-age=2592000`;

      if (!onboardingDone) {
        if (role === "CENTER_MANAGER") { router.push("/onboarding/center"); return; }
        if (role === "TEACHER")        { router.push("/onboarding/teacher"); return; }
        if (role === "ADMIN")          { router.push("/admin"); return; }
        router.push("/onboarding/student");
      } else {
        if (next) { router.push(next); return; }
        if (role === "CENTER_MANAGER") { router.push("/center"); return; }
        if (role === "TEACHER")        { router.push("/teacher"); return; }
        if (role === "ADMIN")          { router.push("/admin"); return; }
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0d1a12 inset !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>

      <div
        className="relative min-h-screen w-full flex items-center justify-center px-5"
        style={{ background: "#080c10", fontFamily: "'DM Mono', monospace" }}
      >
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(80px)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #059669, transparent)", filter: "blur(60px)" }}
          />
        </div>

        <div className="relative z-10 w-full fade-up" style={{ maxWidth: 400 }}>
          <div className="flex justify-center mb-8">
            <BrandLogo tagline={t("tagline")} />
          </div>

          <div
            className="rounded-3xl p-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            }}
          >
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: "white", fontFamily: "'Syne', sans-serif" }}
            >
              {t("loginTitle")}
            </h2>
            <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.60)" }}>
              {t("loginSubtitle")} 👋
            </p>

            <div className="flex gap-2 mb-6">
              {ROLE_KEYS.map(({ key, emoji }) => {
                const active = selectedRole === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedRole(key)}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                      border: active ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: active ? "#10b981" : "rgba(255,255,255,0.65)",
                      fontFamily: "'Syne', sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-base">{emoji}</span>
                    <span>{getRoleLabel(key)}</span>
                  </button>
                );
              })}
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

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
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
                <label className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {t("password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                {loading ? tc("loading") : `${t("loginBtn")} →`}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.56)" }}>
            {t("noAccount")}{" "}
            <Link href="/register" style={{ color: "#10b981", textDecoration: "none" }}>
              {t("subscribe")}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
