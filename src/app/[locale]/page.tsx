"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useT } from "@/hooks/useT"
import LanguageSwitcher from "@/components/LanguageSwitcher"

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
    { value: "10.000+", label: t.statsUsers },
    { value: "A1→C1", label: t.statsLevels },
    { value: "95%", label: t.statsSuccess },
    { value: "50+", label: t.statsCenters },
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

  const testimonials = [
    { name: "Paul Nkengue", city: "Yaoundé", level: t.testimonial1Role, text: t.testimonial1Text, initials: "PN", color: "#10b981", stars: 5 },
    { name: "Prof. Marie Tchamba", city: "Douala", role: t.testimonial2Role, text: t.testimonial2Text, initials: "MT", color: "#3b82f6", stars: 5 },
    { name: "Institut Lingua Plus", city: "Bafoussam", role: t.testimonial3Role, text: t.testimonial3Text, initials: "IL", color: "#8b5cf6", stars: 5 },
  ]

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
    { q: t.faq6Q, a: t.faq6A },
  ]

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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.08))", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: "#10b981" }}>Y</span>
          </div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800 }}>
            Yema
          </span>
        </div>
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
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "100px 20px 60px" : "120px 40px 80px", position: "relative", textAlign: "center" }}>
        {/* Glows */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)", pointerEvents: "none", animation: "pulse 4s ease-in-out infinite" }} />

        <div style={{ maxWidth: 860, position: "relative", zIndex: 2 }}>
          {/* Badge */}
          <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 99, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>{t.badge}</span>
          </div>

          {/* Titre */}
          <h1 className="fade-up" style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 36 : 64, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
            {t.title}<br />
            <span style={{ color: "#10b981" }}>{t.titleAccent}</span>
          </h1>

          {/* Sous-titre */}
          <p className="fade-up" style={{ fontSize: isMobile ? 14 : 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 36, maxWidth: 600, margin: "0 auto 36px" }}>
            {t.subtitle}
          </p>

          {/* CTAs */}
          <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 48, flexWrap: "wrap" }}>
            <button onClick={() => router.push(`/${locale}/register`)}
              style={{ padding: "16px 32px", borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", boxShadow: "0 8px 32px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
              {t.ctaPrimary}
            </button>
            <button onClick={() => router.push(`/${locale}/simulateur`)}
              style={{ padding: "16px 32px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {t.ctaSecondary}
            </button>
          </div>

          {/* Stats */}
          <div className="fade-up" style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#10b981" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{stat.label}</div>
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
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>
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
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
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
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>
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
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0 }}>{lvl.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: lvl.color }}>{lvl.modules}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{t.modules}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMULATOR DEMO ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 48, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.simTitle}</span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, margin: "12px 0 16px", lineHeight: 1.2 }}>
              {t.simHeadline}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
              {t.simDesc}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[t.simVisa1, t.simVisa2, t.simVisa3, t.simVisa4, t.simVisa5].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#10b981", fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{s}</span>
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
                <p style={{ color: "white", fontSize: 12, fontWeight: 700, margin: 0 }}>Herr Klaus Bauer</p>
                <p style={{ color: "#10b981", fontSize: 9, margin: 0 }}>{t.simConsulOnline}</p>
              </div>
            </div>
            {[
              { role: "consul", text: "Guten Tag. Bitte zeigen Sie mir Ihren Reisepass.", translation: t.simMsg1 },
              { role: "user", text: "Guten Tag, Herr Bauer. Hier ist mein Reisepass.", translation: t.simMsg2 },
              { role: "consul", text: "Warum möchten Sie in Deutschland studieren?", translation: t.simMsg3 },
            ].map((msg, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "user" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: msg.role === "user" ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "white", fontSize: 12, margin: "0 0 3px" }}>{msg.text}</p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0, fontStyle: "italic" }}>{msg.translation}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", marginTop: 8 }}>
              <p style={{ color: "#10b981", fontSize: 10, fontWeight: 700, margin: "0 0 3px" }}>{t.simScoreLabel}</p>
              <div style={{ display: "flex", gap: 12 }}>
                {[[t.simGrammar,"8/10"],[t.simVocab,"7/10"],[t.simRelevance,"9/10"]].map(([label,val]) => (
                  <div key={label}>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>{label} </span>
                    <span style={{ color: "#10b981", fontSize: 10, fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 26 : 36, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>
            {t.testimonialsTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 20 }}>
            {testimonials.map((item, i) => (
              <div key={i} style={{ padding: "24px", borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                  {Array.from({ length: item.stars }).map((_, j) => <span key={j} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>&ldquo;{item.text}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: `${item.color}15`, border: `1px solid ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12, color: item.color }}>{item.initials}</span>
                  </div>
                  <div>
                    <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Syne',sans-serif" }}>{item.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>{item.city} · {item.level || item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CENTERS ── */}
      <section id="centres" style={{ padding: isMobile ? "60px 16px" : "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 48, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.b2bLabel}</span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, margin: "12px 0 16px", lineHeight: 1.2 }}>
              {t.centerTitle}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
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
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{item.text}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => router.push(`/${locale}/register`)}
                style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                {t.centerCta}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { plan: "Starter", price: "25.000", users: `5 teachers · 100 students`, color: "#10b981" },
              { plan: "Pro", price: "75.000", users: `20 teachers · 500 students`, color: "#f59e0b" },
              { plan: "Enterprise", price: t.centerOnDemand, users: `Unlimited · Dedicated support`, color: "#a78bfa" },
            ].map((p, i) => (
              <div key={i} style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${p.color}25`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", color: "white", fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}>{p.plan}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{p.users}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", color: p.color, fontSize: 16, fontWeight: 800, margin: "0 0 1px" }}>
                    {p.price === t.centerOnDemand ? p.price : `${p.price} XAF`}
                  </p>
                  {p.price !== t.centerOnDemand && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, margin: 0 }}>{t.centerPerMonth}</p>}
                </div>
              </div>
            ))}
          </div>
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
                <div style={{ padding: "0 20px 16px", color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.7 }}>
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
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: isMobile ? 14 : 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
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
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, marginTop: 16, letterSpacing: "0.04em" }}>
            {t.ctaFinalSocial}
          </p>

          {/* Divider */}
          <div style={{ margin: "44px auto", width: 48, height: 1, background: "rgba(255,255,255,0.08)" }} />

          {/* App store section */}
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20, fontWeight: 600 }}>
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
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Coming Soon</p>
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
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Coming Soon</p>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Google Play</p>
                </div>
              </div>
            </div>
          </div>

          {/* City line */}
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 28, letterSpacing: "0.06em" }}>
            {t.ctaFinalCities}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: isMobile ? "28px 20px" : "36px 40px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800 }}>Yema</span>
            <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.12)" }} />
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{t.footerMade}</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[t.footerLegal, t.footerTerms, t.footerPrivacy, t.footerContact].map(link => (
              <a key={link} href="#" style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, transition: "color 0.2s" }}
                onMouseOver={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)"}
                onMouseOut={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)"}>
                {link}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["WhatsApp", "Facebook", "Instagram"].map(s => (
              <a key={s} href="#" style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", fontSize: 11, transition: "border-color 0.2s, color 0.2s" }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.3)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)" }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)" }}>
                {s}
              </a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "16px auto 0", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.14)", fontSize: 10, lineHeight: 1.6 }}>
            Yema Languages provides independent CEFR-aligned language practice and is not affiliated with any official examination institute. ·
            Yema Languages propose une pratique linguistique indépendante alignée sur le CECRL et n&apos;est affiliée à aucun organisme officiel d&apos;examen.
          </p>
        </div>
      </footer>
    </div>
  )
}
