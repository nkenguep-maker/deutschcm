"use client";

import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: "👥",
    title: "Suivi élèves en temps réel",
    desc: "Tableau de bord complet par élève : XP, progression, scores aux quiz, historique du simulateur d'ambassade. Identifiez instantanément les élèves en difficulté.",
  },
  {
    icon: "🎙️",
    title: "Simulateur IA intégré",
    desc: "Herr Klaus Bauer, notre consul IA, entraîne vos élèves à l'entretien ambassade en situation réelle. Scores grammaire, vocabulaire et fluidité à chaque session.",
  },
  {
    icon: "📱",
    title: "Paiements Mobile Money",
    desc: "Abonnements et frais de cours encaissés via MTN Mobile Money et Orange Money. Aucun compte bancaire nécessaire. Historique complet des transactions.",
  },
  {
    icon: "📊",
    title: "Analytics avancées",
    desc: "Taux de rétention J-30/60/90, classement des enseignants, progression A1→C1, export CSV. Prenez des décisions basées sur les données.",
  },
  {
    icon: "🏫",
    title: "Gestion multi-classes",
    desc: "Créez autant de classes que nécessaire. Codes d'accès uniques, gestion des devoirs, corrections en ligne, chat avec les élèves.",
  },
  {
    icon: "🌍",
    title: "Conçu pour le Cameroun",
    desc: "Interface en français, contenu centré sur la culture camerounaise, prix en FCFA, connexion optimisée pour les réseaux locaux.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "25 000",
    icon: "🌱",
    color: "#64748b",
    accentBg: "rgba(100,116,139,0.08)",
    accentBorder: "rgba(100,116,139,0.2)",
    teachers: 5,
    students: 100,
    features: ["5 enseignants", "100 élèves", "Dashboard centre", "Rapports mensuels", "Support email"],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    price: "75 000",
    icon: "⭐",
    color: "#eab308",
    accentBg: "rgba(234,179,8,0.08)",
    accentBorder: "rgba(234,179,8,0.3)",
    teachers: 20,
    students: 500,
    features: ["20 enseignants", "500 élèves", "Analytics avancées", "Export CSV/PDF", "Simulateur IA illimité", "Support prioritaire", "Mobile Money intégré"],
    cta: "Choisir Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "150 000",
    icon: "🏆",
    color: "#6366f1",
    accentBg: "rgba(99,102,241,0.08)",
    accentBorder: "rgba(99,102,241,0.2)",
    teachers: -1,
    students: -1,
    features: ["Enseignants illimités", "Élèves illimités", "API dédiée", "Formations sur site", "Manager dédié", "SLA 99,9%", "Personnalisation complète"],
    cta: "Contacter l'équipe",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Pr. Henriette Ngo Biyong",
    role: "Directrice",
    center: "Institut Goethe Yaoundé",
    city: "Yaoundé",
    flag: "🏛️",
    quote: "Depuis DeutschCM, nous avons réduit notre temps d'administration de 60%. Nos élèves progressent deux fois plus vite grâce au simulateur d'ambassade. Le résultat visa de nos apprenants est passé de 45% à 78%.",
    avatar: "HN",
    stars: 5,
  },
  {
    name: "M. Emmanuel Tchouala",
    role: "Fondateur",
    center: "Deutsch-Kamerun Center",
    city: "Douala",
    flag: "🏫",
    quote: "La facturation Mobile Money a été un game-changer. Nos élèves paient maintenant depuis leur téléphone en 2 minutes. Nous avons augmenté notre taux de renouvellement de 40%.",
    avatar: "ET",
    stars: 5,
  },
  {
    name: "Mme Rosine Abena",
    role: "Responsable pédagogique",
    center: "Sprache & Kultur Bafoussam",
    city: "Bafoussam",
    flag: "📚",
    quote: "Les analytics sont impressionnants. Je vois en temps réel quels élèves décrochent et j'interviens avant qu'ils abandonnent. Notre rétention à 90 jours est passée de 38% à 64%.",
    avatar: "RA",
    stars: 5,
  },
];

const FAQS = [
  { q: "Comment migrer mes données existantes ?", a: "Notre équipe vous accompagne dans la migration gratuite de vos données élèves depuis Excel, Google Sheets ou tout autre système en moins de 48h." },
  { q: "Les paiements Mobile Money sont-ils sécurisés ?", a: "Oui, nous utilisons les APIs officielles MTN MoMo et Orange Money avec chiffrement bout-en-bout. Toutes les transactions sont journalisées et auditables." },
  { q: "Puis-je tester avant de payer ?", a: "Absolument. Le plan Starter est gratuit le premier mois avec toutes les fonctionnalités Pro incluses. Aucune carte bancaire requise." },
  { q: "Y a-t-il une formation pour les enseignants ?", a: "Oui, chaque compte inclut 2h de formation en ligne et un accès à notre base de connaissances. Le plan Enterprise inclut des formations sur site." },
];

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({ nom: "", email: "", centre: "", ville: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          }}>🇩🇪</div>
          <span className="syne" style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>
            Deutsch<span style={{ color: "#eab308" }}>CM</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, fontSize: "0.75rem", marginLeft: 8 }}>pour Centres</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="#features" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>Fonctionnalités</a>
          <a href="#pricing" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>Tarifs</a>
          <a href="#testimonials" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>Témoignages</a>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none" }}>Connexion</Link>
          <a href="#contact" className="btn-gold" style={{
            background: "linear-gradient(135deg, #eab308, #ca8a04)",
            color: "#080c10", borderRadius: 9, padding: "8px 20px",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>Demander une démo</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: "90px 40px 80px", textAlign: "center",
        background: "linear-gradient(180deg, rgba(234,179,8,0.04) 0%, transparent 100%)",
      }}>
        {/* BG decorations */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(234,179,8,0.08), transparent)", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
          <div className="hero-float" style={{ fontSize: 64, marginBottom: 24 }}>🏫</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
            background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)",
            borderRadius: 20, padding: "6px 16px",
          }}>
            <span style={{ color: "#eab308", fontSize: 12, fontWeight: 700 }}>✦ Conçu pour le Cameroun</span>
          </div>
          <h1 className="syne" style={{
            fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 800, lineHeight: 1.1,
            color: "#f8fafc", margin: "0 0 20px",
          }}>
            Digitalisez votre<br />
            <span style={{ color: "#eab308" }}>centre de langues</span><br />
            au Cameroun
          </h1>
          <p style={{
            fontSize: 18, color: "rgba(255,255,255,0.5)", maxWidth: 580, margin: "0 auto 36px",
            lineHeight: 1.7,
          }}>
            Gérez enseignants, élèves, devoirs et paiements depuis une seule plateforme.
            Avec le simulateur d&apos;ambassade IA et les analytics avancées.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#contact" className="btn-gold" style={{
              background: "linear-gradient(135deg, #eab308, #ca8a04)",
              color: "#080c10", borderRadius: 12, padding: "14px 28px",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
            }}>
              Demander une démo gratuite →
            </a>
            <Link href="/register" style={{
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 28px",
              fontSize: 15, textDecoration: "none",
            }}>
              Créer un compte
            </Link>
          </div>
          {/* Social proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 40 }}>
            {[
              { value: "30+", label: "Centres partenaires" },
              { value: "2 800+", label: "Élèves actifs" },
              { value: "98%", label: "Satisfaction centres" },
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
            Tout ce dont votre centre a besoin
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
            Une suite complète pensée pour les instituts de langues camerounais
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
              Tarifs transparents en XAF
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Sans frais cachés. Paiement mensuel par Mobile Money.</p>
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
                  }}>⭐ Le plus populaire</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 12 }}>{plan.icon}</div>
                <div className="syne" style={{ color: plan.color, fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ marginBottom: 8 }}>
                  <span className="syne" style={{ color: plan.color, fontWeight: 800, fontSize: 30 }}>{plan.price}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}> XAF/mois</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 20 }}>
                  {plan.teachers === -1 ? "Enseignants illimités" : `${plan.teachers} enseignants`} ·{" "}
                  {plan.students === -1 ? "Élèves illimités" : `${plan.students} élèves`}
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
            Ils font confiance à DeutschCM
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Centres partenaires au Cameroun</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 28,
            }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                {Array.from({ length: t.stars }).map((_, j) => (
                  <span key={j} style={{ color: "#eab308", fontSize: 16 }}>★</span>
                ))}
              </div>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(234,179,8,0.25), rgba(161,120,0,0.1))",
                  border: "1px solid rgba(234,179,8,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#eab308", fontWeight: 700, fontSize: 14,
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t.role} · {t.center}</div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{t.flag} {t.city}</div>
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
            Questions fréquentes
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
              Demandez votre démo gratuite
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
              Notre équipe vous rappelle sous 24h pour une démonstration personnalisée.
            </p>
          </div>

          {contactSent ? (
            <div style={{
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 16, padding: "40px 32px", textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div className="syne" style={{ color: "#10b981", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
                Demande reçue !
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                Notre équipe vous contacte dans les 24h ouvrées. En attendant, vous pouvez créer votre compte gratuitement.
              </div>
              <Link href="/register" style={{
                display: "inline-block", marginTop: 20,
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                color: "#080c10", borderRadius: 10, padding: "10px 24px",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}>
                Créer mon compte →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleContact} style={{
              background: "rgba(13,17,23,0.8)", border: "1px solid rgba(234,179,8,0.15)",
              borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 16,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Nom complet", key: "nom", placeholder: "Dr. Henriette Ngo Biyong" },
                  { label: "Email professionnel", key: "email", placeholder: "direction@votre-centre.cm" },
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
                  { label: "Nom du centre", key: "centre", placeholder: "Institut Goethe Yaoundé" },
                  { label: "Ville", key: "ville", placeholder: "Yaoundé, Douala..." },
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
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Message (optionnel)</label>
                <textarea value={contactForm.message} onChange={e => setContactForm(c => ({ ...c, message: e.target.value }))}
                  placeholder="Nous avons 8 enseignants et 150 élèves. Intéressé par le plan Pro..."
                  rows={3}
                  style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <button type="submit" className="btn-gold" style={{
                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                color: "#080c10", border: "none", borderRadius: 10, padding: "13px 0",
                fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%",
              }}>
                Envoyer ma demande de démo →
              </button>
              <p style={{ margin: 0, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                Premier mois gratuit · Aucune carte bancaire requise
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
        <div>© 2025 DeutschCM · Conçu au Cameroun 🇨🇲</div>
        <div style={{ display: "flex", gap: 24 }}>
          <Link href="/login" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Connexion</Link>
          <Link href="/register" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Inscription</Link>
          <Link href="/center" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Espace Centre</Link>
        </div>
      </footer>
    </div>
  );
}
