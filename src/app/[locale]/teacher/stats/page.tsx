"use client";

import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import { IconChart, IconGroup, IconCheck, IconFlame } from "@/components/landing/icons";

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  expertiseNote: string;
  demoEye: string;
  demoBody: string;
  attnH: string;
  attnCards: [
    { label: string; sub: string },
    { label: string; sub: string },
    { label: string; sub: string },
    { label: string; sub: string },
  ];
  classH: string;
  weekLbl: string;
  skillsH: string;
  skills: [string, string, string, string];
  activityH: string;
  activityEmpty: string;
  impactH: string;
  impactSub: string;
  impactBody: string;
  nextH: string;
  nextCardH: string;
  nextCardSub: string;
  nextCta: string;
}

const FR: Copy = {
  title: "Suivi",
  eye: "Suivi",
  h: "Lire tes classes en un coup d'œil.",
  sub: "Points d'attention, progression, compétences à renforcer. Rien pour flatter, tout pour piloter.",
  expertiseNote: "Ton jugement reste central. Les chiffres suggèrent, ta lecture décide.",
  demoEye: "Données de démo",
  demoBody: "Ces indicateurs sont fictifs. Ils montrent la forme que prendra ton suivi dès que tes classes seront actives.",
  attnH: "Points d'attention",
  attnCards: [
    { label: "Apprenant·e·s en difficulté", sub: "Score < 5/10" },
    { label: "Inactif·ve·s cette semaine",  sub: "Aucune activité depuis 7 j" },
    { label: "En forte progression",        sub: "Score en hausse continue" },
    { label: "Objectif atteint",            sub: "Module complété" },
  ],
  classH: "Progression par classe",
  weekLbl: "4 dernières semaines",
  skillsH: "Compétences à renforcer",
  skills: ["Grammaire", "Vocabulaire", "Compréhension", "Expression"],
  activityH: "Activité récente",
  activityEmpty: "Ton activité s'accumulera ici dès les premiers rendus.",
  impactH: "Ton impact",
  impactSub: "En construction · disponible dès que tes premières classes tourneront.",
  impactBody: "Combien d'apprenant·e·s ont progressé d'un palier, combien de rendus corrigés, combien d'heures de pratique portées par ton accompagnement.",
  nextH: "Prochaine action",
  nextCardH: "Encourager les inactif·ve·s",
  nextCardSub: "Une personne n'a pas ouvert Yema depuis plus de 7 jours. Un mot suffit souvent.",
  nextCta: "Voir les apprenant·e·s",
};

const EN: Copy = {
  title: "Tracking",
  eye: "Tracking",
  h: "Read your classes at a glance.",
  sub: "Attention points, progress, skills to strengthen. Nothing to flatter — everything to steer.",
  expertiseNote: "Your judgement stays central. Numbers suggest, your reading decides.",
  demoEye: "Demo data",
  demoBody: "These indicators are placeholders. They preview what tracking looks like once your classes are active.",
  attnH: "Attention points",
  attnCards: [
    { label: "Learners struggling",       sub: "Score < 5/10" },
    { label: "Inactive this week",         sub: "No activity for 7 days" },
    { label: "Strong progress",            sub: "Score climbing steadily" },
    { label: "Goal reached",                sub: "Module completed" },
  ],
  classH: "Class progression",
  weekLbl: "Last 4 weeks",
  skillsH: "Skills to reinforce",
  skills: ["Grammar", "Vocabulary", "Comprehension", "Expression"],
  activityH: "Recent activity",
  activityEmpty: "Your activity will pile up here once submissions start coming in.",
  impactH: "Your impact",
  impactSub: "In progress · available once your first classes run.",
  impactBody: "How many learners moved up a level, how many submissions you graded, how many practice hours your guidance carried.",
  nextH: "Next action",
  nextCardH: "Encourage inactive learners",
  nextCardSub: "One person hasn't opened Yema for over 7 days. A short note often helps.",
  nextCta: "See learners",
};

const ATTN_VALUES = [2, 1, 3, 5];
const WEEKLY_DEMO = [
  { name: "Sem 1 · W1", A1: 6.2, A2: 5.8 },
  { name: "Sem 2 · W2", A1: 6.8, A2: 6.3 },
  { name: "Sem 3 · W3", A1: 7.1, A2: 6.9 },
  { name: "Sem 4 · W4", A1: 7.4, A2: 7.2 },
];
const SKILLS_PCT = [58, 72, 81, 44];

export default function TeacherStatsPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const attnIcons = [IconFlame, IconCheck, IconChart, IconGroup];

  return (
    <TeacherLayout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
        </header>

        <section style={{
          padding: "16px 20px",
          borderRadius: 12,
          background: "var(--brass-glow)",
          border: "1px solid var(--brass-edge)",
        }}>
          <p style={{
            color: "var(--creme-soft)",
            fontSize: 13.5,
            margin: 0,
            lineHeight: 1.5,
            maxWidth: "60ch",
          }}>{t.expertiseNote}</p>
        </section>

        <div style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px dashed var(--creme-hair)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <span className="status-pill pending">{t.demoEye}</span>
          <p style={{ margin: 0, color: "var(--creme-soft)", fontSize: 12.5, lineHeight: 1.5 }}>
            {t.demoBody}
          </p>
        </div>

        <section aria-labelledby="attn-h">
          <p className="dash-eye">{t.attnH}</p>
          <h3 id="attn-h" className="dash-block-h">{t.attnH}</h3>
          <div className="dash-stats">
            {t.attnCards.map((card, i) => {
              const Icon = attnIcons[i];
              return (
                <div key={card.label} className="dash-stat">
                  <p className="dash-stat-lbl">
                    <span className="dash-stat-icon" aria-hidden="true"><Icon size={13} /></span>
                    {card.label}
                  </p>
                  <p className="dash-stat-val">{ATTN_VALUES[i]}</p>
                  <p className="dash-stat-sub">{card.sub}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="class-h">
          <p className="dash-eye">{t.classH}</p>
          <h3 id="class-h" className="dash-block-h">{t.classH}</h3>
          <div style={{
            padding: 22,
            background: "var(--espresso-2)",
            border: "1px solid var(--creme-hair)",
            borderRadius: 14,
          }}>
            <p style={{
              color: "var(--creme-mute)",
              fontSize: 11.5,
              fontFamily: "var(--font-jetbrains, monospace)",
              letterSpacing: "0.04em",
              margin: "0 0 16px",
            }}>{t.weekLbl}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {WEEKLY_DEMO.map((week) => (
                <div key={week.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    color: "var(--creme-soft)",
                    fontFamily: "var(--font-jetbrains, monospace)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    width: 80,
                    flexShrink: 0,
                  }}>{week.name}</span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <MiniBar label="A1" pct={(week.A1 / 10) * 100} display={`${week.A1}`} />
                    <MiniBar label="A2" pct={(week.A2 / 10) * 100} display={`${week.A2}`} soft />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="skills-h">
          <p className="dash-eye">{t.skillsH}</p>
          <h3 id="skills-h" className="dash-block-h">{t.skillsH}</h3>
          <div className="dash-stats">
            {t.skills.map((skill, i) => (
              <div key={skill} className="dash-stat">
                <p className="dash-stat-lbl">{skill}</p>
                <p className="dash-stat-val" style={{
                  color: SKILLS_PCT[i] >= 70 ? "var(--brass)" : SKILLS_PCT[i] >= 50 ? "var(--creme)" : "var(--oxblood)",
                }}>
                  {SKILLS_PCT[i]}%
                </p>
                <div className="card-progress" style={{ marginTop: 6 }}>
                  <div className="card-progress-bar" style={{ width: `${SKILLS_PCT[i]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="activity-h">
          <p className="dash-eye">{t.activityH}</p>
          <h3 id="activity-h" className="dash-block-h">{t.activityH}</h3>
          <div className="empty-state">
            <p className="empty-state-sub">{t.activityEmpty}</p>
          </div>
        </section>

        <section aria-labelledby="impact-h" style={{
          padding: 24,
          background: "var(--espresso-2)",
          border: "1px solid var(--creme-hair)",
          borderRadius: 14,
        }}>
          <p className="subpage-eye" style={{ margin: 0 }}>{t.impactH}</p>
          <h3 id="impact-h" style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 18,
            color: "var(--creme)",
            margin: "6px 0 8px",
            fontWeight: 400,
          }}>{t.impactH}</h3>
          <p style={{ color: "var(--creme-mute)", fontSize: 12, margin: "0 0 12px", fontFamily: "var(--font-jetbrains, monospace)", letterSpacing: "0.04em" }}>
            {t.impactSub}
          </p>
          <p style={{ color: "var(--creme-soft)", fontSize: 13.5, margin: 0, maxWidth: "62ch", lineHeight: 1.55 }}>
            {t.impactBody}
          </p>
        </section>

        <section aria-labelledby="next-h">
          <p className="dash-eye">{t.nextH}</p>
          <h3 id="next-h" className="dash-block-h">{t.nextH}</h3>
          <div style={{
            padding: "20px 22px",
            borderRadius: 14,
            background: "var(--brass-glow)",
            border: "1px solid var(--brass-edge)",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 17,
                color: "var(--creme)",
                margin: "0 0 6px",
                fontWeight: 400,
              }}>{t.nextCardH}</p>
              <p style={{ color: "var(--creme-soft)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                {t.nextCardSub}
              </p>
            </div>
            <Link href="/teacher/students" className="subpage-cta">
              {t.nextCta}
            </Link>
          </div>
        </section>
      </section>
    </TeacherLayout>
  );
}

function MiniBar({ label, pct, display, soft }: { label: string; pct: number; display: string; soft?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="card-progress" style={{ flex: 1, height: 5 }}>
        <div className="card-progress-bar" style={{
          width: `${Math.min(100, pct)}%`,
          background: soft ? "rgba(184, 135, 62, 0.55)" : "var(--brass)",
        }} />
      </div>
      <span style={{
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: 11,
        color: "var(--creme-soft)",
        letterSpacing: "0.04em",
        width: 60,
        textAlign: "right",
      }}>{label} · {display}</span>
    </div>
  );
}
