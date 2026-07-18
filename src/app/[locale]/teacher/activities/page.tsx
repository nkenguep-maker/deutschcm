"use client";

import { useState, type ReactElement } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import {
  IconSchreiben,
  IconSprechen,
  IconGrammatik,
  IconHoeren,
  IconAdaptif,
  IconLesen,
} from "@/components/landing/icons";

interface ActivityType {
  key: "writing" | "speaking" | "quiz" | "listening" | "review" | "free";
  Icon: (p: { size?: number }) => ReactElement;
  labelFR: string;
  labelEN: string;
  descFR: string;
  descEN: string;
}

const TYPES: ActivityType[] = [
  { key: "writing",   Icon: IconSchreiben, labelFR: "Écrit",         labelEN: "Writing",       descFR: "Rédaction guidée, correction ciblée.",       descEN: "Guided writing with focused correction." },
  { key: "speaking",  Icon: IconSprechen,  labelFR: "Oral",          labelEN: "Speaking",      descFR: "Enregistrement audio, feedback prononciation.", descEN: "Audio recording with pronunciation feedback." },
  { key: "quiz",      Icon: IconGrammatik, labelFR: "Quiz",          labelEN: "Quiz",          descFR: "Questions ciblées, résultats immédiats.",     descEN: "Focused questions, instant results." },
  { key: "listening", Icon: IconHoeren,    labelFR: "Compréhension", labelEN: "Listening",     descFR: "Audio + questions, sous-titres optionnels.",  descEN: "Audio + questions with optional subtitles." },
  { key: "review",    Icon: IconAdaptif,   labelFR: "Révision",      labelEN: "Review",        descFR: "Rappels espacés basés sur les erreurs passées.", descEN: "Spaced review based on past mistakes." },
  { key: "free",      Icon: IconLesen,     labelFR: "Libre",         labelEN: "Free-form",     descFR: "Consigne ouverte, correction humaine.",       descEN: "Open prompt, human correction." },
];

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  validationEye: string;
  validation: string;
  chooseH: string;
  soonEye: string;
  soonH: string;
  soonSub: string;
  soonLink: string;
  fields: {
    klass: [string, string];
    goal: [string, string];
    instructions: [string, string];
    deadline: [string, string];
  };
  back: string;
  cancel: string;
  createDraft: string;
  createHint: string;
}

const FR: Copy = {
  title: "Créer une activité",
  eye: "Activités",
  h: "Une consigne, une intention.",
  sub: "Compose une activité sur mesure — l'IA propose une piste, ton nom la valide.",
  validationEye: "Validation requise",
  validation: "Rien n'est publié tant que tu n'as pas relu et validé. YEMA propose, tu décides.",
  chooseH: "Choisir un type",
  soonEye: "Bientôt",
  soonH: "Studio complet en cours.",
  soonSub: "Publication, ressources partagées et suivi par activité arrivent dans les prochaines semaines. En attendant, les brouillons sont conservés localement.",
  soonLink: "Voir les corrections en cours",
  fields: {
    klass: ["Classe", "Groupe A1 Matin"],
    goal: ["Objectif pédagogique", "Ex : maîtriser les salutations formelles"],
    instructions: ["Consigne", "Décris ce que l'apprenant·e doit produire…"],
    deadline: ["Date limite", "JJ/MM/AAAA"],
  },
  back: "Retour",
  cancel: "Annuler",
  createDraft: "Enregistrer le brouillon",
  createHint: "Le brouillon reste sur ton espace. La publication demandera ta validation.",
};

const EN: Copy = {
  title: "Create an activity",
  eye: "Activities",
  h: "One prompt, one intention.",
  sub: "Compose a tailored activity — AI drafts a path, your name validates it.",
  validationEye: "Validation required",
  validation: "Nothing is published until you review and approve. AI drafts, you decide.",
  chooseH: "Pick a type",
  soonEye: "Coming",
  soonH: "Full studio in progress.",
  soonSub: "Publishing, shared resources and per-activity tracking will land in the coming weeks. Drafts stay local for now.",
  soonLink: "See pending corrections",
  fields: {
    klass: ["Class", "Morning A1 group"],
    goal: ["Learning goal", "e.g. master formal greetings"],
    instructions: ["Instructions", "Describe what the learner should produce…"],
    deadline: ["Deadline", "MM/DD/YYYY"],
  },
  back: "Back",
  cancel: "Cancel",
  createDraft: "Save draft",
  createHint: "Drafts stay in your space. Publishing will require your approval.",
};

export default function TeacherActivitiesPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const [selected, setSelected] = useState<ActivityType | null>(null);

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

        <div style={{
          padding: "16px 20px",
          borderRadius: 12,
          background: "var(--brass-glow)",
          border: "1px solid var(--brass-edge)",
        }}>
          <p style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--brass)",
            margin: "0 0 6px",
          }}>{t.validationEye}</p>
          <p style={{ color: "var(--creme-soft)", fontSize: 13.5, margin: 0, lineHeight: 1.5, maxWidth: "62ch" }}>
            {t.validation}
          </p>
        </div>

        {!selected ? (
          <>
            <section>
              <p className="dash-eye">{t.chooseH}</p>
              <div className="card-grid">
                {TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    className="card"
                    onClick={() => setSelected(type)}
                    style={{
                      cursor: "pointer",
                      textAlign: "left",
                      color: "inherit",
                      transition: "border-color var(--dur-touch) var(--ease-enter)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brass)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--creme-hair)")}
                  >
                    <div style={{
                      width: 44, height: 44,
                      borderRadius: 12,
                      background: "var(--brass-glow)",
                      border: "1px solid var(--brass-edge)",
                      color: "var(--brass)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }} aria-hidden="true">
                      <type.Icon size={22} />
                    </div>
                    <h3 className="card-h">{locale === "en" ? type.labelEN : type.labelFR}</h3>
                    <p className="card-meta">{locale === "en" ? type.descEN : type.descFR}</p>
                  </button>
                ))}
              </div>
            </section>

            <section style={{
              padding: "20px 24px",
              borderRadius: 14,
              border: "1px dashed var(--creme-hair)",
              background: "rgba(244, 235, 220, 0.02)",
            }}>
              <p className="dash-eye" style={{ margin: 0 }}>{t.soonEye}</p>
              <h3 style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 18,
                color: "var(--creme)",
                margin: "6px 0 8px",
                fontWeight: 400,
              }}>{t.soonH}</h3>
              <p style={{ color: "var(--creme-soft)", fontSize: 13.5, margin: "0 0 14px", lineHeight: 1.55, maxWidth: "62ch" }}>
                {t.soonSub}
              </p>
              <Link href="/teacher/assignments" className="row-btn">{t.soonLink}</Link>
            </section>
          </>
        ) : (
          <div style={{
            padding: 24,
            background: "var(--espresso-2)",
            border: "1px solid var(--creme-hair)",
            borderRadius: 14,
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{
                alignSelf: "flex-start",
                background: "transparent",
                border: "none",
                color: "var(--creme-soft)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--font-jetbrains, monospace)",
                letterSpacing: "0.06em",
              }}
            >
              ← {t.back}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 10,
                background: "var(--brass-glow)",
                border: "1px solid var(--brass-edge)",
                color: "var(--brass)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }} aria-hidden="true">
                <selected.Icon size={20} />
              </div>
              <h3 style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 20,
                color: "var(--creme)",
                margin: 0,
                fontWeight: 400,
              }}>{locale === "en" ? selected.labelEN : selected.labelFR}</h3>
            </div>

            <div className="modal-form">
              {(Object.keys(t.fields) as Array<keyof Copy["fields"]>).map((key) => {
                const [label, ph] = t.fields[key];
                const id = `activity-${key}`;
                return (
                  <div key={key} className="modal-field">
                    <label htmlFor={id} className="modal-lbl">{label}</label>
                    {key === "instructions" ? (
                      <textarea id={id} rows={4} className="modal-textarea" placeholder={ph} />
                    ) : (
                      <input id={id} className="modal-input" placeholder={ph}
                             type={key === "deadline" ? "date" : "text"} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button type="button" className="subpage-cta ghost" onClick={() => setSelected(null)}>
                {t.cancel}
              </button>
              <button type="button" className="subpage-cta">
                {t.createDraft}
              </button>
            </div>

            <p style={{
              color: "var(--creme-mute)",
              fontSize: 12,
              margin: 0,
              fontFamily: "var(--font-jetbrains, monospace)",
              letterSpacing: "0.04em",
            }}>
              {t.createHint}
            </p>
          </div>
        )}
      </section>
    </TeacherLayout>
  );
}
