"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useT } from "@/hooks/useT"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { createClient } from "@/lib/supabase/client"
import BrandLogo from "@/components/BrandLogo"

export default function LandingPage() {
  const router = useRouter()
  const locale = useLocale()
  const { landing: t, nav: tNav } = useT()
  const [scrolled, setScrolled] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const stats = [
    { value: t.stat1Value, label: t.stat1Label },
    { value: t.stat2Value, label: t.stat2Label },
    { value: t.stat3Value, label: t.stat3Label },
    { value: t.stat4Value, label: t.stat4Label },
  ]

  const features = [
    { icon: "🏛️", title: t.feature1Title, desc: t.feature1Desc, badge: t.feature1Badge },
    { icon: "🎧", title: t.feature2Title, desc: t.feature2Desc },
    { icon: "🎙️", title: t.feature3Title, desc: t.feature3Desc, badge: t.feature3Badge },
    { icon: "✍️", title: t.feature4Title, desc: t.feature4Desc, badge: t.feature4Badge },
    { icon: "🎯", title: t.feature5Title, desc: t.feature5Desc, badge: t.feature5Badge },
    { icon: "👨‍🏫", title: t.feature6Title, desc: t.feature6Desc, badge: t.feature6Badge },
    { icon: "🏫", title: t.feature7Title, desc: t.feature7Desc, badge: t.feature7Badge },
    { icon: "📊", title: t.feature8Title, desc: t.feature8Desc, badge: t.feature8Badge },
  ]

  const levels = [
    { level: "A1", name: t.level1Name, desc: t.level1Desc, modules: 48, color: "#10b981", locked: false },
    { level: "A2", name: t.level2Name, desc: t.level2Desc, modules: 48, color: "#34d399", locked: false },
    { level: "B1", name: t.level3Name, desc: t.level3Desc, modules: 60, color: "#60a5fa", locked: true },
    { level: "B2", name: t.level4Name, desc: t.level4Desc, modules: 40, color: "#a78bfa", locked: true },
    { level: "C1", name: t.level5Name, desc: t.level5Desc, modules: 40, color: "#f59e0b", locked: true },
  ]

  const problems = [
    { title: t.problem1Title, desc: t.problem1Desc, icon: "📚" },
    { title: t.problem2Title, desc: t.problem2Desc, icon: "💸" },
    { title: t.problem3Title, desc: t.problem3Desc, icon: "🌍" },
  ]

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
    { q: t.faq6Q, a: t.faq6A },
  ]

  async function handleTestLevel() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push(`/${locale}/test-niveau`)
    } else {
      router.push(`/${locale}/register?next=/${locale}/test-niveau`)
    }
  }

  const navItems = [
    { label: t.navFeatures, href: "#features" },
    { label: t.navLevels, href: "#levels" },
    { label: t.navPricing, href: "#pricing" },
    { label: t.navCenters, href: "#centres" },
  ]

  return (
    <div style={{ background: "#080c10", color: "white", fontFamily: "'DM Mono',monospace", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:0.25;transform:scale(1.05)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .fade-up { animation: fadeUp 0.6s ease both; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: isMobile ? "12px 16px" : "16px 40px",
        background: scrolled ? "rgba(8,12,16,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s"
      }}>
        <BrandLogo variant="nav" />
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {navItems.map(item => (
              <a key={item.href} href={item.href}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", transition: "color 0.2s" }}
                onMouseOver={e => (e.target as HTMLElement).style.color = "white"}
                onMouseOut={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <LanguageSwitcher style={{ marginRight: 4 }} />
          <button onClick={() => router.push(`/${locale}/login`)}
            style={{ padding: isMobile ? "8px 14px" : "9px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: 12, cursor: "pointer" }}>
            {tNav.login}
          </button>
          <button onClick={() => router.push(`/${locale}/register`)}
            style={{ padding: isMobile ? "8px 14px" : "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
            {isMobile ? t.getStarted : tNav.register}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "100px 20px 72px" : "120px 40px 96px", position: "relative", textAlign: "center" }}>
        {/* Glows */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)", pointerEvents: "none", animation: "pulse 4s ease-in-out infinite" }} />

        <div style={{ maxWidth: 860, position: "relative", zIndex: 2 }}>
          {/* Badge */}
          <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 99, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.28)", marginBottom: 36 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>{t.badge}</span>
          </div>

          {/* Titre */}
          <h1 className="fade-up" style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: isMobile ? 38 : 66,
            fontWeight: 900,
            lineHeight: 1.12,
            marginBottom: 28,
            letterSpacing: "-0.025em",
            color: "#f0f4f8",
          }}>
            {t.title}<br />
            <span style={{ color: "#10b981" }}>{t.titleAccent}</span>
          </h1>

          {/* Sous-titre */}
          <p className="fade-up" style={{
            fontSize: isMobile ? 15 : 18,
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.75,
            maxWidth: 580,
            margin: "0 auto 16px",
            fontWeight: 400,
          }}>
            {t.subtitle}
          </p>
          <p className="fade-up" style={{
            fontSize: isMobile ? 13 : 14,
            color: "rgba(255,255,255,0.58)",
            lineHeight: 1.65,
            maxWidth: 480,
            margin: "0 auto 40px",
            letterSpacing: "0.01em",
          }}>
            {t.subtitle2}
          </p>

          {/* CTAs */}
          <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <button onClick={() => router.push(`/${locale}/register`)}
              style={{ padding: isMobile ? "14px 28px" : "16px 34px", borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: isMobile ? 14 : 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", boxShadow: "0 8px 32px rgba(16,185,129,0.32)", display: "flex", alignItems: "center", gap: 8 }}>
              {t.ctaPrimary}
            </button>
            <button onClick={handleTestLevel}
              style={{ padding: isMobile ? "14px 28px" : "16px 34px", borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 14 : 15, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {t.ctaSecondary}
            </button>
          </div>
          <p className="fade-up" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 8, marginBottom: 44, letterSpacing: "0.03em" }}>
            {t.ctaMicro}
          </p>

          {/* Stats */}
          <div className="fade-up" style={{ display: "flex", gap: isMobile ? 24 : 40, justifyContent: "center", flexWrap: "wrap", paddingTop: 4 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: isMobile ? 64 : 80, maxWidth: isMobile ? 120 : 160 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: stat.value.length > 4 ? (isMobile ? 14 : 16) : (isMobile ? 24 : 28), fontWeight: 800, color: "#10b981", lineHeight: 1.2 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.70)", marginTop: 4, lineHeight: 1.3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px", background: "rgba(16,185,129,0.02)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 800, marginBottom: 12 }}>
              {t.visionTitle}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
              {t.visionSubtitle}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 16 : 24 }}>
            {[
              { label: t.vision1Label, title: t.vision1Title, desc: t.vision1Desc, num: "01" },
              { label: t.vision2Label, title: t.vision2Title, desc: t.vision2Desc, num: "02" },
              { label: t.vision3Label, title: t.vision3Title, desc: t.vision3Desc, num: "03" },
            ].map((v, i) => (
              <div key={i} style={{ padding: "28px 24px", borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.12)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 16, right: 20, fontFamily: "'Syne',sans-serif", fontSize: 40, fontWeight: 900, color: "rgba(16,185,129,0.08)" }}>{v.num}</div>
                <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, display: "block", marginBottom: 10 }}>{v.label}</span>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>{v.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: isMobile ? "60px 16px" : "80px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
            {t.featuresTitle}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 16 }}>
            {t.featuresSubtitle}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? 10 : 16 }}>
          {features.map((f, i) => (
            <div key={i} style={{ padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", transition: "border-color 0.2s" }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.25)"}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, margin: 0 }}>{f.title}</h3>
                {f.badge && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 99, background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700, whiteSpace: "nowrap" }}>{f.badge}</span>}
              </div>
              <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEVELS ── */}
      <section id="levels" style={{ padding: isMobile ? "60px 16px" : "80px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
              {t.levelsTitle}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 16 }}>
              {t.levelsSubtitle}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {levels.map((lvl, i) => (
              <div key={i} style={{ padding: "20px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${lvl.locked ? "rgba(255,255,255,0.06)" : `${lvl.color}30`}`, display: "flex", alignItems: "center", gap: 20, opacity: lvl.locked ? 0.6 : 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${lvl.color}15`, border: `1px solid ${lvl.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 900, color: lvl.color }}>{lvl.level}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, margin: 0 }}>{lvl.name}</h3>
                    {!lvl.locked && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: `${lvl.color}15`, color: lvl.color, fontWeight: 700 }}>{t.available}</span>}
                    {lvl.locked && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>{t.locked}</span>}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, margin: 0 }}>{lvl.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: lvl.color }}>{lvl.modules}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.62)" }}>{t.modules}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY GERMANY ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 56, alignItems: "start" }}>
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 26 : 34, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
              {t.germanyTitle}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.8, margin: 0 }}>
              {t.germanyText}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[t.germany1, t.germany2, t.germany3, t.germany4].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ color: "#10b981", fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMULATOR DEMO ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 48, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.simTitle}</span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, margin: "12px 0 16px", lineHeight: 1.2 }}>
              {t.simHeadline}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              {t.simDesc}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[t.simVisa1, t.simVisa2, t.simVisa3, t.simVisa4, t.simVisa5].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#10b981", fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.78)" }}>{s}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push(`/${locale}/simulateur`)}
              style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
              {t.simCta}
            </button>
          </div>

          {/* Mock conversation */}
          <div style={{ padding: "20px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏛️</div>
              <div>
                <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: 0 }}>Herr Klaus Bauer</p>
                <p style={{ color: "#10b981", fontSize: 12, margin: 0 }}>{t.simConsulOnline}</p>
              </div>
            </div>
            {[
              { role: "consul", text: "Hallo! Bitte stellen Sie sich vor.", translation: t.simMsg1 },
              { role: "user", text: "Hallo. Ich heiße Paul. Ich komme aus Kamerun.", translation: t.simMsg2 },
              { role: "consul", text: "Warum möchten Sie Deutsch lernen?", translation: t.simMsg3 },
            ].map((msg, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "user" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: msg.role === "user" ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "white", fontSize: 12, margin: "0 0 3px" }}>{msg.text}</p>
                  <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, margin: 0, fontStyle: "italic" }}>{msg.translation}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", marginTop: 8 }}>
              <p style={{ color: "#10b981", fontSize: 10, fontWeight: 700, margin: "0 0 3px" }}>{t.simScoreLabel}</p>
              <div style={{ display: "flex", gap: 12 }}>
                {[[t.simGrammar,"8/10"],[t.simVocab,"7/10"],[t.simRelevance,"9/10"]].map(([label,val]) => (
                  <div key={label}>
                    <span style={{ color: "rgba(255,255,255,0.62)", fontSize: 12 }}>{label} </span>
                    <span style={{ color: "#10b981", fontSize: 12, fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMS ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 26 : 36, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>
            {t.testimonialsTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 20 }}>
            {problems.map((p, i) => (
              <div key={i} style={{ padding: "28px 24px", borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{p.icon}</div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>{p.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CENTERS ── */}
      <section id="centres" style={{ padding: isMobile ? "60px 16px" : "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 48, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.b2bLabel}</span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, margin: "12px 0 16px", lineHeight: 1.2 }}>
              {t.centerTitle}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              {t.centerDesc}
            </p>
            {[
              { icon: "👨‍🏫", text: t.centerFeature1 },
              { icon: "📊", text: t.centerFeature2 },
              { icon: "🏛️", text: t.centerFeature3 },
              { icon: "📱", text: t.centerFeature4 },
              { icon: "💳", text: t.centerFeature5 },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.78)" }}>{item.text}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => router.push(`/${locale}/register`)}
                style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                {t.centerCta}
              </button>
            </div>
          </div>

          {locale === "en" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "🎓", label: t.centerAudience1Label, desc: t.centerAudience1Desc, color: "#10b981" },
                { icon: "👨‍🏫", label: t.centerAudience2Label, desc: t.centerAudience2Desc, color: "#60a5fa" },
                { icon: "🏫", label: t.centerAudience3Label, desc: t.centerAudience3Desc, color: "#a78bfa" },
              ].map((a, i) => (
                <div key={i} style={{ padding: "20px 22px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${a.color}20` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                    <p style={{ fontFamily: "'Syne',sans-serif", color: "white", fontSize: 14, fontWeight: 700, margin: 0 }}>{a.label}</p>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{a.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { plan: "Essentiel", users: "Petit centre · équipe réduite", color: "#10b981" },
                { plan: "Pro", users: "Centre en croissance · plusieurs classes", color: "#f59e0b" },
                { plan: "Enterprise", users: "Illimité · support dédié", color: "#a78bfa" },
              ].map((p, i) => (
                <div key={i} style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${p.color}25`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: "'Syne',sans-serif", color: "white", fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}>{p.plan}</p>
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0 }}>{p.users}</p>
                  </div>
                  <p style={{ fontFamily: "'Syne',sans-serif", color: p.color, fontSize: 14, fontWeight: 800, margin: 0 }}>{t.centerOnDemand}</p>
                </div>
              ))}
              <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 13, lineHeight: 1.6, margin: "4px 0 0", fontStyle: "italic" }}>
                {t.centerReassurance}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 24 : 36, fontWeight: 800, textAlign: "center", marginBottom: 40 }}>
            {t.faqTitle}
          </h2>
          {faqs.map((faq, i) => (
            <div key={i} style={{ marginBottom: 8, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{ width: "100%", padding: "16px 20px", background: "none", border: "none", color: "white", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>
                {faq.q}
                <span style={{ color: "#10b981", fontSize: 18, transition: "transform 0.2s", transform: faqOpen === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              {faqOpen === i && (
                <div style={{ padding: "0 20px 16px", color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: isMobile ? "80px 20px 100px" : "100px 40px 120px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 900, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.25),transparent)" }} />

        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 2 }}>
          {/* Live badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 99, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Beta · Open Access</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 36 : 56, fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 20 }}>
            {t.ctaFinalTitle}<br />
            <span style={{ color: "#10b981", textShadow: "0 0 60px rgba(16,185,129,0.35)" }}>{t.ctaFinalSub}</span>
          </h2>

          {/* Sub-description */}
          <p style={{ color: "rgba(255,255,255,0.68)", fontSize: isMobile ? 14 : 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
            {t.ctaFinalDesc}
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => router.push(`/${locale}/register`)}
            style={{ padding: isMobile ? "16px 36px" : "18px 52px", borderRadius: 16, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: isMobile ? 15 : 17, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", boxShadow: "0 16px 48px rgba(16,185,129,0.32), 0 0 0 1px rgba(16,185,129,0.2) inset", transition: "box-shadow 0.2s, transform 0.15s", letterSpacing: "0.01em" }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(16,185,129,0.44), 0 0 0 1px rgba(16,185,129,0.3) inset"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)" }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(16,185,129,0.32), 0 0 0 1px rgba(16,185,129,0.2) inset"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)" }}
          >
            {t.ctaFinalBtn} →
          </button>

          {/* Social proof pill */}
          <p style={{ color: "rgba(255,255,255,0.58)", fontSize: 13, marginTop: 16, letterSpacing: "0.04em" }}>
            {t.ctaFinalSocial}
          </p>

          {/* Divider */}
          <div style={{ margin: "44px auto", width: 48, height: 1, background: "rgba(255,255,255,0.08)" }} />

          {/* App store section */}
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20, fontWeight: 600 }}>
            {t.ctaFinalAppLabel}
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {/* App Store badge — not clickable */}
            <div style={{ position: "relative", cursor: "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", minWidth: 160, opacity: 0.6 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="rgba(255,255,255,0.7)" />
                </svg>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Coming Soon</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>App Store</p>
                </div>
              </div>
            </div>

            {/* Google Play badge — not clickable */}
            <div style={{ position: "relative", cursor: "default" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", minWidth: 160, opacity: 0.6 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3.18 23.76c.3.16.64.2.97.1L15.5 12 12 8.5 3.18 23.76z" fill="rgba(255,100,100,0.8)" />
                  <path d="M21.54 10.27L18.78 8.7 15 12l3.78 3.3 2.76-1.57c.79-.45.79-1.57 0-2.02v-.44z" fill="rgba(255,200,0,0.8)" />
                  <path d="M3.18.24C2.86.08 2.5.08 2.2.28 1.85.52 1.6.93 1.6 1.4v21.2c0 .47.25.88.6 1.12.3.2.64.2.97.1L15.5 12 3.18.24z" fill="rgba(100,200,100,0.8)" />
                  <path d="M15.5 12L3.18.24c.3-.16.64-.14.97.1l11.35 6.16L15.5 12z" fill="rgba(100,160,255,0.8)" />
                </svg>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Coming Soon</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Google Play</p>
                </div>
              </div>
            </div>
          </div>

          {/* City line */}
          <p style={{ color: "rgba(255,255,255,0.52)", fontSize: 13, marginTop: 28, letterSpacing: "0.06em" }}>
            {t.ctaFinalCities}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: isMobile ? "28px 20px" : "36px 40px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            <BrandLogo variant="nav" />
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: isMobile ? 13 : 15, letterSpacing: "0.01em", lineHeight: 1.4 }}>{t.footerTagline}</span>
            <span style={{ color: "rgba(255,255,255,0.48)", fontSize: 13 }}>{t.footerMade}</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: t.footerLegal, href: `/${locale}/terms` },
              { label: t.footerTerms, href: `/${locale}/terms` },
              { label: t.footerPrivacy, href: `/${locale}/privacy` },
              { label: t.footerContact, href: "mailto:legal@yema.app" },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ color: "rgba(255,255,255,0.58)", fontSize: 13, transition: "color 0.2s" }}
                onMouseOver={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.9)"}
                onMouseOut={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.58)"}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["WhatsApp", "Facebook", "Instagram"].map(s => (
              <a key={s} href="#" style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)", fontSize: 13, transition: "border-color 0.2s, color 0.2s" }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.3)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)" }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)" }}>
                {s}
              </a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "16px auto 0", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.6 }}>
            {t.footerDisclaimer}
          </p>
        </div>
      </footer>
    </div>
  )
}
