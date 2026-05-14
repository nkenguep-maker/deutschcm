"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

interface CenterData {
  id: string; name: string; city: string; region: string; avatar: string;
  verified: boolean; plan: string; teachers: number; students: number;
  classes: number; languages: string[]; code: string; successRate: number; yearsActive: number;
}

interface ClassData {
  id: string; teacherName: string; teacherAvatar: string; level: string;
  schedule: string; students: number; max: number; description: string; tags: string[];
  code: string; rating: number;
}

const CENTERS: Record<string, CenterData> = {
  ctr1: { id: "ctr1", name: "Institut Lingua Plus", city: "Yaoundé", region: "Centre", avatar: "LP", verified: true, plan: "pro", teachers: 8, students: 245, classes: 12, languages: ["", "🇬🇧", "🇪🇸"], code: "CENTRE-LINGUA", successRate: 87, yearsActive: 6 },
  ctr2: { id: "ctr2", name: "Goethe Center CM", city: "Douala", region: "Littoral", avatar: "GC", verified: true, plan: "enterprise", teachers: 12, students: 380, classes: 18, languages: ["", "🇬🇧"], code: "CENTRE-GOETHE", successRate: 92, yearsActive: 9 },
  ctr3: { id: "ctr3", name: "LangSchool Bafoussam", city: "Bafoussam", region: "Ouest", avatar: "LS", verified: false, plan: "starter", teachers: 4, students: 89, classes: 6, languages: ["", "🇫🇷"], code: "CENTRE-LANG01", successRate: 74, yearsActive: 3 },
  ctr4: { id: "ctr4", name: "DeutschAkademie Garoua", city: "Garoua", region: "Nord", avatar: "DA", verified: false, plan: "starter", teachers: 3, students: 45, classes: 4, languages: [""], code: "CENTRE-DEUT04", successRate: 68, yearsActive: 2 },
};

const CENTER_CLASSES: Record<string, ClassData[]> = {
  ctr1: [
    { id: "cls1", teacherName: "Prof. Marie Tchamba", teacherAvatar: "MT", level: "A1", schedule: "Lun/Mer 18h–20h", students: 12, max: 20, description: "Cours pour grands débutants — accent sur l'oral et la phonétique. Méthode Netzwerk A1.", tags: ["Débutant", "Oral", "Goethe"], code: "DEUTSCH-A1-2024", rating: 4.9 },
    { id: "cls4", teacherName: "Prof. Samuel Foto", teacherAvatar: "SF", level: "B2", schedule: "Mer/Sam 9h–11h", students: 5, max: 10, description: "B2 avancé — préparation TestDaF et études en Allemagne.", tags: ["B2", "TestDaF", "Académique"], code: "GOETHE-B2-SAM1", rating: 5.0 },
    { id: "cls8", teacherName: "Prof. Robert Essama", teacherAvatar: "RE", level: "B1", schedule: "Lun/Jeu 17h–19h", students: 7, max: 10, description: "Prépa TestDaF B1 — lecture, écriture, écoute. Taux de réussite 89%.", tags: ["B1", "TestDaF", "Goethe"], code: "ESSA-B1-TDF8", rating: 4.8 },
  ],
  ctr2: [
    { id: "cls2", teacherName: "Prof. Jean Mbarga", teacherAvatar: "JB", level: "A2", schedule: "Mar/Jeu 14h–16h", students: 8, max: 15, description: "Préparation Goethe A2 avec focus sur la compréhension orale et écrite.", tags: ["A2", "TELC", "Prépa"], code: "LINGUA-A2-0512", rating: 4.7 },
    { id: "cls6", teacherName: "Prof. David Kamga", teacherAvatar: "DK", level: "C1", schedule: "Sam/Dim 10h–12h", students: 6, max: 8, description: "Conversation niveau C1 — débats, actualités, culture allemande. 100% en ligne.", tags: ["C1", "Conversation", "En ligne"], code: "KAMG-C1-CONV", rating: 4.9 },
  ],
  ctr3: [
    { id: "cls3", teacherName: "Prof. Alice Ngo", teacherAvatar: "AN", level: "B1", schedule: "Ven 10h–12h", students: 14, max: 15, description: "Classe B1 intensive — grammaire avancée, expression écrite, simulation d'examens Goethe.", tags: ["B1", "Avancé", "Intensif"], code: "LANG-B1-NGO1", rating: 4.8 },
  ],
  ctr4: [
    { id: "cls5", teacherName: "Prof. Christine Bello", teacherAvatar: "CB", level: "A1", schedule: "Lun/Mer/Ven 16h–17h", students: 10, max: 12, description: "Allemand pour enfants (8–12 ans) — jeux, chansons, histoire. Pédagogie ludique.", tags: ["Enfants", "Ludique", "A1"], code: "BELL-A1-KID5", rating: 4.6 },
    { id: "cls7", teacherName: "Prof. Fatima Oumar", teacherAvatar: "FO", level: "A2", schedule: "Mar/Jeu 8h–10h", students: 3, max: 15, description: "A2 adultes — vocabulaire professionnel, voyage, administration.", tags: ["A2", "Adultes", "Professionnel"], code: "OUMA-A2-GAR7", rating: 4.5 },
  ],
};

const LEVEL_COLORS: Record<string, string> = { A1: "#10b981", A2: "#34d399", B1: "#3b82f6", B2: "#8b5cf6", C1: "#f59e0b", C2: "#ef4444" };
const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: "#64748b" },
  pro: { label: "Pro", color: "#6366f1" },
  enterprise: { label: "Enterprise", color: "#f59e0b" },
};

function Av({ initials, size = 38, color = "#10b981" }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${color}, ${color}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export default function CenterDetailPage() {
  const { centerId } = useParams<{ centerId: string }>();
  const router = useRouter();
  const center = CENTERS[centerId];
  const classes = CENTER_CLASSES[centerId] ?? [];

  if (!center) {
    return (
      <Layout title="Détail Centre">
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏫</div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Centre introuvable</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 20 }}>Ce centre n'existe pas ou a été supprimé.</div>
          <button onClick={() => router.push("/discover")} style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ← Retour à Découvrir
          </button>
        </div>
      </Layout>
    );
  }

  const plan = PLAN_LABEL[center.plan];

  return (
    <Layout title="Détail Centre">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap')`}</style>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 60px" }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ marginBottom: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 14px", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}
        >← Retour</button>

        {/* Center header */}
        <div style={{ padding: "28px 28px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 20 }}>
            <Av initials={center.avatar} size={60} color="#f59e0b" />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }}>{center.name}</span>
                {center.verified && <span title="Vérifié par Yema" style={{ fontSize: 14 }}>✅</span>}
                <span style={{ background: `${plan.color}20`, color: plan.color, border: `1px solid ${plan.color}40`, borderRadius: 7, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{plan.label}</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                📍 {center.city}, {center.region} · {center.yearsActive} ans d'activité
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {center.languages.map(l => <span key={l} style={{ fontSize: 18 }}>{l}</span>)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", borderRadius: 10, padding: "8px 16px", marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 22 }}>{center.successRate}%</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Réussite Goethe</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { v: center.teachers, l: "Enseignants", icon: "👨‍🏫" },
              { v: center.students, l: "Élèves inscrits", icon: "👥" },
              { v: center.classes, l: "Classes actives", icon: "🏫" },
            ].map(s => (
              <div key={s.l} style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 8px" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: 20 }}>{s.v}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Classes list */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ color: "white", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, margin: "0 0 16px" }}>
            Classes disponibles · {classes.length}
          </h2>

          {classes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Aucune classe disponible pour ce centre.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {classes.map(cls => {
                const lc = LEVEL_COLORS[cls.level] ?? "#10b981";
                const pct = (cls.students / cls.max) * 100;
                const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";
                return (
                  <div key={cls.id} style={{ padding: "20px 22px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Av initials={cls.teacherAvatar} size={36} color={lc} />
                        <div>
                          <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{cls.teacherName}</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>📅 {cls.schedule}</div>
                        </div>
                      </div>
                      <span style={{ background: `${lc}20`, color: lc, border: `1px solid ${lc}40`, borderRadius: 7, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{cls.level}</span>
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{cls.description}</p>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {cls.tags.map(t => (
                        <span key={t} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t}</span>
                      ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ flex: 1, marginRight: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Places</span>
                          <span style={{ color: barColor, fontSize: 11, fontWeight: 700 }}>{cls.students}/{cls.max}</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                      </div>
                      <Link href={`/discover/class/${cls.id}`} style={{
                        padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
                        boxShadow: "0 3px 10px rgba(16,185,129,0.25)", whiteSpace: "nowrap",
                      }}>
                        Voir la classe →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA join center */}
        <div style={{ padding: "24px 24px", borderRadius: 18, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", textAlign: "center" }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Rejoindre {center.name}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 16 }}>
            Contactez le centre via le code <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 5, fontSize: 12 }}>{center.code}</code> ou rejoignez une classe directement.
          </div>
          <button
            onClick={() => router.push("/discover")}
            style={{ padding: "10px 24px", borderRadius: 12, background: "linear-gradient(135deg, #eab308, #ca8a04)", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(234,179,8,0.3)" }}
          >
            🏫 Demander à rejoindre
          </button>
        </div>
      </div>
    </Layout>
  );
}
