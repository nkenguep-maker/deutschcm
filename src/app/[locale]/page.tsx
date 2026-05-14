"use client"
import { useState, useEffect } from "react"
import { useRouter } from "@/navigation"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/LanguageSwitcher"

export default function LandingPage() {
  const router = useRouter()
  const t = useTranslations("landing")
  const tNav = useTranslations("nav")
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
    { value: "10.000+", label: "Apprenants" },
    { value: "A1→C1", label: "Niveaux CEFR" },
    { value: "95%", label: "Taux de réussite" },
    { value: "50+", label: "Centres partenaires" },
  ]

  const features = [
    { icon: "🏛️", title: "Simulateur Ambassade IA", desc: "Entraînez-vous avec Herr Bauer, consul allemand virtuel. Scoring en temps réel sur grammaire, vocabulaire et pertinence.", badge: "Exclusif" },
    { icon: "🎧", title: "Dialogues Audio Natifs", desc: "Voix allemandes authentiques générées par voix natives. Dialogues adaptés à chaque niveau A1→C1." },
    { icon: "🎙️", title: "Reconnaissance Vocale", desc: "Parlez en allemand, l'IA analyse votre prononciation et corrige vos erreurs en français instantanément.", badge: "IA" },
    { icon: "✍️", title: "Correction Schreiben IA", desc: "Rédigez en allemand, Gemini corrige grammaire, vocabulaire et style avec explications détaillées.", badge: "Gemini" },
    { icon: "🎯", title: "Quiz Adaptatif", desc: "La difficulté s'ajuste automatiquement selon vos performances. Plus vous progressez, plus c'est challengeant.", badge: "Adaptatif" },
    { icon: "👨‍🏫", title: "Classes Virtuelles", desc: "Rejoignez la classe d'un enseignant ou créez votre groupe de révision. Suivi en temps réel.", badge: "Social" },
    { icon: "🏫", title: "Solution Centres", desc: "Dashboard complet pour les centres de langues. Gérez enseignants, élèves et classes depuis un seul endroit.", badge: "B2B" },
    { icon: "📊", title: "Analytics Progression", desc: "Suivez votre progression sur 5 compétences : Lesen, Hören, Sprechen, Schreiben, Grammatik.", badge: "Insights" },
  ]

  const levels = [
    { level: "A1", name: "Débutant", desc: "Salutations, famille, chiffres, routine quotidienne", modules: 48, color: "#10b981", locked: false },
    { level: "A2", name: "Élémentaire", desc: "Vie urbaine, médias, santé, voyages", modules: 48, color: "#34d399", locked: false },
    { level: "B1", name: "Intermédiaire", desc: "Travail, société, culture, environnement", modules: 60, color: "#60a5fa", locked: true },
    { level: "B2", name: "Avancé", desc: "Sciences, économie, médias, histoire", modules: 40, color: "#a78bfa", locked: true },
    { level: "C1", name: "Maîtrise", desc: "Philosophie, littérature, carrière internationale", modules: 40, color: "#f59e0b", locked: true },
  ]

  const testimonials = [
    { name: "Paul Nkengue", city: "Yaoundé", level: "B1 obtenu", text: "En 6 mois, j'ai atteint le B1 grâce au simulateur ambassade. Mon entretien de visa s'est parfaitement passé !", avatar: "🇨🇲", stars: 5 },
    { name: "Prof. Marie Tchamba", city: "Douala", role: "Enseignante", text: "Mes élèves progressent 2x plus vite avec les outils IA. La correction automatique me fait gagner un temps précieux.", avatar: "👩‍🏫", stars: 5 },
    { name: "Institut Lingua Plus", city: "Bafoussam", role: "Centre partenaire", text: "150 élèves gérés depuis un seul tableau de bord. Les analyses de progression sont excellentes.", avatar: "🏫", stars: 5 },
  ]

  const faqs = [
    { q: "Comment fonctionne le simulateur ambassade ?", a: "Vous conversez en temps réel avec Herr Bauer, un agent consulaire IA alimenté par notre IA. Il analyse votre allemand et vous donne un score détaillé après chaque échange." },
    { q: "Le plan gratuit est-il vraiment gratuit ?", a: "Oui, totalement gratuit. Pas de carte bancaire requise. Accès complet au niveau A1 avec 3 leçons par jour et 3 sessions simulateur par mois." },
    { q: "Les certifications Goethe sont-elles reconnues ?", a: "Les examens Goethe-Zertifikat sont reconnus mondialement pour les visas allemands. Yema vous prépare spécifiquement à ces examens du A1 au C1." },
    { q: "Puis-je rejoindre la classe d'un enseignant ?", a: "Oui ! Entrez le code de classe de votre enseignant lors de l'inscription ou depuis votre tableau de bord. Votre enseignant validera votre accès." },
    { q: "Y a-t-il une app mobile ?", a: "La plateforme est optimisée pour mobile (iOS et Android) via le navigateur. Une app native est en développement." },
    { q: "Comment devenir centre partenaire ?", a: "Contactez-nous sur WhatsApp. Nous offrons 30 jours gratuits pour tester la solution centre avec votre équipe." },
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
          <span style={{ fontSize: 24 }}></span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800 }}>
            Yema
          </span>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {["Fonctionnalités", "Niveaux", "Tarifs", "Centres"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", transition: "color 0.2s" }}
                onMouseOver={e => (e.target as HTMLElement).style.color = "white"}
                onMouseOut={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
              >
                {item}
              </a>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <LanguageSwitcher style={{ marginRight: 4 }} />
          <button onClick={() => router.push("/login")}
            style={{ padding: isMobile ? "8px 14px" : "9px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: 12, cursor: "pointer" }}>
            {tNav("login")}
          </button>
          <button onClick={() => router.push("/register")}
            style={{ padding: isMobile ? "8px 14px" : "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
            {isMobile ? t("getStarted") : tNav("register")}
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
            <span style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>{t("badge")}</span>
          </div>

          {/* Titre */}
          <h1 className="fade-up" style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 36 : 64, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
            {t("title")}<br />
            <span style={{ color: "#10b981" }}>{t("titleAccent")}</span>
          </h1>

          {/* Sous-titre */}
          <p className="fade-up" style={{ fontSize: isMobile ? 14 : 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 36, maxWidth: 600, margin: "0 auto 36px" }}>
            {t("subtitle")}
          </p>

          {/* CTAs */}
          <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 48, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/register")}
              style={{ padding: "16px 32px", borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", boxShadow: "0 8px 32px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
              {t("ctaPrimary")}
            </button>
            <button onClick={() => router.push("/simulateur")}
              style={{ padding: "16px 32px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {t("ctaSecondary")}
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
      <section id="fonctionnalités" style={{ padding: isMobile ? "60px 16px" : "80px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>
            12 outils IA intégrés pour un apprentissage complet
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
                <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 99, background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700, whiteSpace: "nowrap" }}>{f.badge}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── NIVEAUX ── */}
      <section id="niveaux" style={{ padding: isMobile ? "60px 16px" : "80px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
              Programme officiel Goethe-Institut
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>
              Basé sur Netzwerk neu (A1-B1) et Aspekte neu (B2-C1)
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
                    {!lvl.locked && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: `${lvl.color}15`, color: lvl.color, fontWeight: 700 }}>Disponible</span>}
                    {lvl.locked && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>🔒 Premium</span>}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0 }}>{lvl.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: lvl.color }}>{lvl.modules}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>modules</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMULATEUR DEMO ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 48, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Fonctionnalité phare</span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, margin: "12px 0 16px", lineHeight: 1.2 }}>
              Simulez un vrai entretien consulaire
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
              Herr Bauer, notre consul IA, vous pose les vraies questions d'un entretien de visa allemand. Chaque réponse est analysée et notée sur la grammaire, le vocabulaire et la pertinence.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {["Visa étudiant (§16b AufenthG)", "Visa travail / EU Blue Card", "Visa touriste Schengen", "Regroupement familial", "Renouvellement de titre"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#10b981", fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{s}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/simulateur")}
              style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
              Essayer gratuitement →
            </button>
          </div>

          {/* Mock conversation */}
          <div style={{ padding: "20px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏛️</div>
              <div>
                <p style={{ color: "white", fontSize: 12, fontWeight: 700, margin: 0 }}>Herr Klaus Bauer</p>
                <p style={{ color: "#10b981", fontSize: 9, margin: 0 }}>Agent consulaire · En ligne</p>
              </div>
            </div>
            {[
              { role: "consul", text: "Guten Tag. Bitte zeigen Sie mir Ihren Reisepass.", translation: "Bonjour. Montrez-moi votre passeport." },
              { role: "user", text: "Guten Tag, Herr Bauer. Hier ist mein Reisepass.", translation: "Voici mon passeport." },
              { role: "consul", text: "Warum möchten Sie in Deutschland studieren?", translation: "Pourquoi souhaitez-vous étudier en Allemagne ?" },
            ].map((msg, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "user" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: msg.role === "user" ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ color: "white", fontSize: 12, margin: "0 0 3px" }}>{msg.text}</p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0, fontStyle: "italic" }}>{msg.translation}</p>
                </div>
              </div>
            ))}
            <div style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", marginTop: 8 }}>
              <p style={{ color: "#10b981", fontSize: 10, fontWeight: 700, margin: "0 0 3px" }}>📊 Score en temps réel</p>
              <div style={{ display: "flex", gap: 12 }}>
                {[["Grammaire","8/10"],["Vocab","7/10"],["Pertinence","9/10"]].map(([label,val]) => (
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

      {/* ── TÉMOIGNAGES ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 26 : 36, fontWeight: 800, textAlign: "center", marginBottom: 48 }}>
            Ils nous font confiance
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ padding: "24px", borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                  {Array.from({ length: t.stars }).map((_, j) => <span key={j} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{t.avatar}</span>
                  <div>
                    <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: "0 0 2px", fontFamily: "'Syne',sans-serif" }}>{t.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0 }}>{t.city} · {t.level || t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CENTRES ── */}
      <section id="centres" style={{ padding: isMobile ? "60px 16px" : "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 48, alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Solution B2B</span>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, margin: "12px 0 16px", lineHeight: 1.2 }}>
              Vous gérez un centre de langues ?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
              Dashboard centralisé pour gérer tous vos enseignants, élèves et classes. Suivi en temps réel, analytics avancés et facturation simplifiée.
            </p>
            {[
              { icon: "👨‍🏫", text: "Dashboard enseignant avec suivi élèves" },
              { icon: "📊", text: "Analytics progression en temps réel" },
              { icon: "🏛️", text: "Simulateur ambassade intégré" },
              { icon: "📱", text: "Accès mobile pour tous les élèves" },
              { icon: "💳", text: "Facturation Mobile Money simplifiée" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{item.text}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => router.push("/register")}
                style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}>
                Demander une démo →
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { plan: "Starter", price: "25.000", users: "5 enseignants · 100 élèves", color: "#10b981" },
              { plan: "Pro", price: "75.000", users: "20 enseignants · 500 élèves", color: "#f59e0b" },
              { plan: "Enterprise", price: "Sur devis", users: "Illimité · Support dédié", color: "#a78bfa" },
            ].map((p, i) => (
              <div key={i} style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${p.color}25`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", color: "white", fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}>{p.plan}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{p.users}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "'Syne',sans-serif", color: p.color, fontSize: 16, fontWeight: 800, margin: "0 0 1px" }}>
                    {p.price === "Sur devis" ? p.price : `${p.price} XAF`}
                  </p>
                  {p.price !== "Sur devis" && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, margin: 0 }}>/mois</p>}
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
            Questions fréquentes
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

      {/* ── CTA FINAL ── */}
      <section style={{ padding: isMobile ? "60px 16px" : "80px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px", animation: "float 3s ease-in-out infinite" }}>
           
          </div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 28 : 40, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
            Commencez aujourd'hui.<br />
            <span style={{ color: "#10b981" }}>C'est gratuit.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, marginBottom: 32 }}>
            Pas de carte bancaire. Pas d'engagement. Accès immédiat au niveau A1 complet.
          </p>
          <button onClick={() => router.push("/register")}
            style={{ padding: "18px 48px", borderRadius: 16, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif", boxShadow: "0 12px 40px rgba(16,185,129,0.35)" }}>
            🚀 Créer mon compte gratuitement
          </button>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 16 }}>
            Déjà +10.000 apprenants au Cameroun et en Afrique
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: isMobile ? "32px 16px" : "40px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}></span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800 }}>
            Yema
          </span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginLeft: 8 }}>
            Fait avec ❤️ au Cameroun 🇨🇲
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {["Mentions légales", "CGU", "Confidentialité", "Contact"].map(link => (
            <a key={link} href="#" style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{link}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["WhatsApp", "Facebook", "Instagram"].map(s => (
            <a key={s} href="#" style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{s}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}