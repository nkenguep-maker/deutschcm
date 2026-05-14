"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

export default function LandingPage() {
  const t = useTranslations("centerLanding");
  const [contactForm, setContactForm] = useState({ nom: "", email: "", centre: "", ville: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FEATURES = [
    { icon: "👥", title: t("feat1Title"), desc: t("feat1Desc") },
    { icon: "🎙️", title: t("feat2Title"), desc: t("feat2Desc") },
    { icon: "📱", title: t("feat3Title"), desc: t("feat3Desc") },
    { icon: "📊", title: t("feat4Title"), desc: t("feat4Desc") },
    { icon: "🏫", title: t("feat5Title"), desc: t("feat5Desc") },
    { icon: "🌍", title: t("feat6Title"), desc: t("feat6Desc") },
  ];

  const PLANS = [
    {
      name: "Starter",
      price: "25 000",
      icon: "🌱",
      color: "#64748b",
      accentBg: "rgba(100,116,139,0.08)",
      accentBorder: "rgba(100,116,139,0.2)",
      teachersLabel: t("planStarterTeachers"),
      studentsLabel: t("planStarterStudents"),
      features: [t("planStarterF1"), t("planStarterF2"), t("planStarterF3"), t("planStarterF4"), t("planStarterF5")],
      cta: t("planStarterCta"),
      popular: false,
    },
    {
      name: "Pro",
      price: "75 000",
      icon: "⭐",
      color: "#eab308",
      accentBg: "rgba(234,179,8,0.08)",
      accentBorder: "rgba(234,179,8,0.3)",
      teachersLabel: t("planProTeachers"),
      studentsLabel: t("planProStudents"),
      features: [t("planProF1"), t("planProF2"), t("planProF3"), t("planProF4"), t("planProF5"), t("planProF6"), t("planProF7")],
      cta: t("planProCta"),
      popular: true,
    },
    {
      name: "Enterprise",
      price: "150 000",
      icon: "🏆",
      color: "#6366f1",
      accentBg: "rgba(99,102,241,0.08)",
      accentBorder: "rgba(99,102,241,0.2)",
      teachersLabel: t("planEnterpriseTeachers"),
      studentsLabel: t("planEnterpriseStudents"),
      features: [t("planEnterpriseF1"), t("planEnterpriseF2"), t("planEnterpriseF3"), t("planEnterpriseF4"), t("planEnterpriseF5"), t("planEnterpriseF6"), t("planEnterpriseF7")],
      cta: t("planEnterpriseCta"),
      popular: false,
    },
  ];

  const TESTIMONIALS = [
    {
      name: "Pr. Henriette Ngo Biyong",
      role: t("testimonial1Role"),
      center: "Institut Goethe Yaoundé",
      city: "Yaoundé",
      flag: "🏛️",
      quote: t("testimonial1Quote"),
      avatar: "HN",
      stars: 5,
    },
    {
      name: "M. Emmanuel Tchouala",
      role: t("testimonial2Role"),
      center: "Deutsch-Kamerun Center",
      city: "Douala",
      flag: "🏫",
      quote: t("testimonial2Quote"),
      avatar: "ET",
      stars: 5,
    },
    {
      name: "Mme Rosine Abena",
      role: t("testimonial3Role"),
      center: "Sprache & Kultur Bafoussam",
      city: "Bafoussam",
      flag: "📚",
      quote: t("testimonial3Quote"),
      avatar: "RA",
      stars: 5,
    },
  ];

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
  };

  return (
    <div style={{
      background: "#080c10", color: "#e2e8f0",
      fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');
        .syne { font-family: 'Syne', sans-serif; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .btn-gold:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-gold { transition: all 0.2s; }
        .feat-card:hover { border-color: rgba(234,179,8,0.3) !important; background: rgba(234,179,8,0.03) !important; }
        .feat-card { transition: all 0.2s; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .hero-float { animation: float 4s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.6s ease forwards; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", background: "rgba(8,12,16,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(234,179,8,0.1)",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(161,120,0,0.08))",
            border: "1px solid rgba(234,179,8,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
          }}></div>
          <span className="syne" style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>
            Yema
            <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, fontSize: "0.75rem", marginLeft: 8 }}>{t("navForCenters")}</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="#features" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>{t("navFeatures")}</a>
          <a href="#pricing" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>{t("navPricing")}</a>
          <a href="#testimonials" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>{t("navTestimonials")}</a>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>{t("navLogin")}</Link>
          <a href="#contact" className="btn-gold" style={{
            background: "linear-gradient(135deg, #eab308, #ca8a04)",
            color: "#080c10", borderRadius: 9, padding: "8px 20px",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>{t("navDemo")}</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "90px 40px 80px", textAlign: "center",
        background: "linear-gradient(180deg, rgba(234,179,8,0.04) 0%, transparent 100%)",
      }}>
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(234,179,8,0.08), transparent)", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
          <div className="hero-float" style={{ fontSize: 64, marginBottom: 24 }}>🏫</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
            background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)",
            borderRadius: 20, padding: "6px 16px",
          }}>
            <span style={{ color: "#eab308", fontSize: 12, fontWeight: 700 }}>{t("heroBadge")}</span>
          </div>
          <h1 className="syne" style={{
            fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 800, lineHeight: 1.1,
            color: "#f8fafc", margin: "0 0 20px",
          }}>
            {t("heroTitle1")}<br />
            <span style={{ color: "#eab308" }}>{t("heroTitleAccent")}</span><br />
            {t("heroTitle2")}
          </h1>
          <p style={{
            fontSize: 18, color: "rgba(255,255,255,0.5)", maxWidth: 580, margin: "0 auto 36px",
            lineHeight: 1.7,
          }}>
            {t("heroSubtitle")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#contact" className="btn-gold" style={{
              background: "linear-gradient(135deg, #eab308, #ca8a04)",
              color: "#080c10", borderRadius: 12, padding: "14px 28px",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
            }}>
              {t("heroCtaDemo")}
            </a>
            <Link href="/register" style={{
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 28px",
              fontSize: 15, textDecoration: "none",
            }}>
              {t("heroCtaRegister")}
            </Link>
          </div>
          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 40 }}>
            {[
              { value: "30+", label: t("stat1Label") },
              { value: "2 800+", label: t("stat2Label") },
              { value: "98%", label: t("stat3Label") },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div className="syne" style={{ color: "#eab308", fontWeight: 800, fontSize: 22 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="syne" style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", margin: "0 0 12px" }}>
            {t("featuresTitle")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
            {t("featuresSubtitle")}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feat-card" style={{
              background: "rgba(13,17,23,0.6)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "24px 20px",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div className="syne" style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{f.title}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "80px 40px", background: "rgba(234,179,8,0.02)", borderTop: "1px solid rgba(234,179,8,0.08)", borderBottom: "1px solid rgba(234,179,8,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 className="syne" style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", margin: "0 0 12px" }}>
              {t("pricingTitle")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>{t("pricingSubtitle")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                background: plan.popular ? plan.accentBg : "rgba(13,17,23,0.8)",
                border: `2px solid ${plan.popular ? plan.accentBorder : "rgba(255,255,255,0.07)"}`,
                borderRadius: 18, padding: "28px 24px", display: "flex", flexDirection: "column",
                position: "relative",
              }}>
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #eab308, #ca8a04)",
                    color: "#080c10", borderRadius: 20, padding: "4px 16px",
                    fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
                  }}>{t("planPopular")}</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 12 }}>{plan.icon}</div>
                <div className="syne" style={{ color: plan.color, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ marginBottom: 8 }}>
                  <span className="syne" style={{ color: plan.color, fontWeight: 800, fontSize: 30 }}>{plan.price}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}> {t("planPerMonth")}</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 20 }}>
                  {plan.teachersLabel} · {plan.studentsLabel}
                </div>
                <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                      <span style={{ color: plan.color, fontSize: 14, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="btn-gold" style={{
                  display: "block", textAlign: "center", textDecoration: "none",
                  background: plan.popular ? "linear-gradient(135deg, #eab308, #ca8a04)" : `rgba(${plan.color === "#6366f1" ? "99,102,241" : "100,116,139"},0.12)`,
                  color: plan.popular ? "#080c10" : plan.color,
                  border: `1px solid ${plan.popular ? "transparent" : plan.color + "44"}`,
                  borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14,
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: "80px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="syne" style={{ fontSize: 36, fontWeight: 800, color: "#f1f5f9", margin: "0 0 12px" }}>
            {t("testimonialsTitle")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>{t("testimonialsSubtitle")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {TESTIMONIALS.map((item, i) => (
            <div key={i} style={{
              background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 28,
            }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                {Array.from({ length: item.stars }).map((_, j) => (
                  <span key={j} style={{ color: "#eab308", fontSize: 16 }}>★</span>
                ))}
              </div>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(234,179,8,0.25), rgba(161,120,0,0.1))",
                  border: "1px solid rgba(234,179,8,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#eab308", fontWeight: 700, fontSize: 14,
                }}>
                  {item.avatar}
                </div>
                <div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{item.role} · {item.center}</div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{item.flag} {item.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "60px 40px", background: "rgba(13,17,23,0.5)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 className="syne" style={{ fontSize: 30, fontWeight: 800, color: "#f1f5f9", margin: "0 0 32px", textAlign: "center" }}>
            {t("faqTitle")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: "rgba(13,17,23,0.8)", border: `1px solid ${openFaq === i ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, overflow: "hidden", transition: "border 0.2s",
              }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  padding: "18px 20px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>{faq.q}</span>
                  <span style={{ color: "#eab308", fontSize: 18, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 18px", color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.65 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT / DEMO FORM ── */}
      <section id="contact" style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 className="syne" style={{ fontSize: 34, fontWeight: 800, color: "#f1f5f9", margin: "0 0 12px" }}>
              {t("contactTitle")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
              {t("contactSubtitle")}
            </p>
          </div>

          {contactSent ? (
            <div style={{
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 16, padding: "40px 32px", textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div className="syne" style={{ color: "#10b981", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
                {t("contactSuccessTitle")}
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                {t("contactSuccessDesc")}
              </div>
              <Link href="/register" style={{
                display: "inline-block", marginTop: 20,
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                color: "#080c10", borderRadius: 10, padding: "10px 24px",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}>
                {t("contactSuccessBtn")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleContact} style={{
              background: "rgba(13,17,23,0.8)", border: "1px solid rgba(234,179,8,0.15)",
              borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 16,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: t("contactFullName"), key: "nom", placeholder: "Dr. Henriette Ngo Biyong" },
                  { label: t("contactEmail"), key: "email", placeholder: "direction@votre-centre.cm" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input type={f.key === "email" ? "email" : "text"} required
                      value={contactForm[f.key as keyof typeof contactForm]}
                      onChange={e => setContactForm(c => ({ ...c, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: t("contactCenter"), key: "centre", placeholder: "Institut Goethe Yaoundé" },
                  { label: t("contactCity"), key: "ville", placeholder: "Yaoundé, Douala..." },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{f.label}</label>
                    <input type="text" required
                      value={contactForm[f.key as keyof typeof contactForm]}
                      onChange={e => setContactForm(c => ({ ...c, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>{t("contactMessage")}</label>
                <textarea value={contactForm.message} onChange={e => setContactForm(c => ({ ...c, message: e.target.value }))}
                  placeholder="We have 8 teachers and 150 students. Interested in the Pro plan..."
                  rows={3}
                  style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <button type="submit" className="btn-gold" style={{
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                color: "#080c10", border: "none", borderRadius: 10, padding: "13px 0",
                fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%",
              }}>
                {t("contactSubmit")}
              </button>
              <p style={{ margin: 0, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                {t("contactFree")}
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: "rgba(255,255,255,0.25)", fontSize: 12,
      }}>
        <div>{t("footerCopyright")}</div>
        <div style={{ display: "flex", gap: 24 }}>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>{t("footerLogin")}</Link>
          <Link href="/register" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>{t("footerRegister")}</Link>
          <Link href="/center" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>{t("footerCenter")}</Link>
        </div>
      </footer>
    </div>
  );
}
