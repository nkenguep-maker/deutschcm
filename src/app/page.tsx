import Link from "next/link";

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.45s ease both; }
        .float-badge { animation: float 4s ease-in-out infinite; }
      `}</style>

      <div
        className="relative min-h-screen w-full overflow-hidden"
        style={{ background: "#080c10", fontFamily: "'DM Mono', monospace" }}
      >
        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(100px)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #059669, transparent)", filter: "blur(80px)" }}
          />
          <div
            className="absolute bottom-1/3 left-0 w-72 h-72 rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #34d399, transparent)", filter: "blur(70px)" }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇩🇪</span>
            <span
              className="text-lg font-bold"
              style={{ color: "white", fontFamily: "'Syne', sans-serif" }}
            >
              Deutsch<span style={{ color: "#10b981" }}>CM</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                textDecoration: "none",
                fontFamily: "'Syne', sans-serif",
                boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
              }}
            >
              Commencer →
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-16 pb-24">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-8 fade-up float-badge"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#34d399",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }}
            />
            Plateforme d'apprentissage de l'allemand
          </div>

          {/* Headline */}
          <h1
            className="text-5xl font-black leading-tight mb-4 fade-up-2"
            style={{ color: "white", fontFamily: "'Syne', sans-serif", maxWidth: 640 }}
          >
            Apprenez l'allemand,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #10b981, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              vivez en Allemagne
            </span>
          </h1>

          <p
            className="text-sm leading-relaxed mb-10 fade-up-3"
            style={{ color: "rgba(255,255,255,0.45)", maxWidth: 460 }}
          >
            DeutschCM — la plateforme complète pour apprendre l'allemand du niveau A1 au C1.
            Cours interactifs, suivi de progression, et certificats reconnus.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 fade-up-4">
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                textDecoration: "none",
                fontFamily: "'Syne', sans-serif",
                boxShadow: "0 6px 30px rgba(16,185,129,0.4)",
              }}
            >
              Commencer gratuitement →
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Se connecter
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-20 fade-up-4">
            {[
              { value: "A1→C1", label: "Niveaux CECR" },
              { value: "5 manuels", label: "Goethe-Institut" },
              { value: "IA intégrée", label: "Corrections auto" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div
                  className="text-2xl font-black mb-1"
                  style={{ color: "#10b981", fontFamily: "'Syne', sans-serif" }}
                >
                  {value}
                </div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full fade-up-4" style={{ maxWidth: 720 }}>
            {[
              {
                emoji: "🎯",
                title: "Test de niveau",
                desc: "Évalue ton niveau CECR en 30 questions adaptées.",
              },
              {
                emoji: "📚",
                title: "Cours structurés",
                desc: "Lesen, Hören, Sprechen, Schreiben — les 4 compétences.",
              },
              {
                emoji: "🏆",
                title: "Suivi & XP",
                desc: "Progression gamifiée, streak quotidien, classements.",
              },
            ].map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-2xl text-left"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="text-2xl mb-3">{emoji}</div>
                <div
                  className="text-sm font-bold mb-1"
                  style={{ color: "white", fontFamily: "'Syne', sans-serif" }}
                >
                  {title}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer
          className="relative z-10 text-center pb-8 text-xs"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          © 2026 DeutschCM — Tous droits réservés
        </footer>
      </div>
    </>
  );
}
