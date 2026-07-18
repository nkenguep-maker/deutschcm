"use client";

import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import {
  IconSpark,
  IconSchreiben,
  IconSprechen,
  IconGrammatik,
  IconHoeren,
} from "@/components/landing/icons";

// Teacher · Studio · IA
// Point d'entrée pour composer une leçon IA-assistée. Pour l'instant,
// redirige vers /admin/courses/generate (le vrai outil de génération).
// Cette page présente les 4 formats de production et cadre la boucle
// "IA propose, tu valides" qui est au cœur de la doctrine YEMA.

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  formatsH: string;
  formats: Array<{ title: string; desc: string }>;
  ctaTitle: string;
  ctaBody: string;
  cta: string;
  hint: string;
}

const FR: Copy = {
  title: "Studio · IA",
  eye: "Studio",
  h: "Composer une leçon en dix minutes.",
  sub: "L'IA propose une trame, votre nom la publie. Quatre formats de production, chacun aligné sur une compétence CECRL.",
  formatsH: "Quatre formats",
  formats: [
    { title: "Lecture guidée",  desc: "Texte + questions ciblées de compréhension. Idéal pour introduire un nouveau vocabulaire." },
    { title: "Compréhension orale", desc: "Audio + transcript verrouillé. Trois niveaux de sous-titres selon la classe." },
    { title: "Production écrite",   desc: "Consigne libre, correction ciblée par vos soins. L'IA suggère des pistes, jamais publie." },
    { title: "Grammaire pratique",  desc: "Points de règle isolés en exercices courts. Correction immédiate, feedback humain optionnel." },
  ],
  ctaTitle: "Ouvrir l'outil de génération",
  ctaBody: "L'outil actuel est partagé avec l'espace administrateur. Une version enseignant·e dédiée arrivera dans les prochaines semaines.",
  cta: "Ouvrir le studio",
  hint: "Rien n'est publié tant que vous n'avez pas relu et validé. La maison propose, vous décidez.",
};

const EN: Copy = {
  title: "Studio · AI",
  eye: "Studio",
  h: "Compose a lesson in ten minutes.",
  sub: "AI drafts a path, your name publishes it. Four production formats, each aligned with a CEFR skill.",
  formatsH: "Four formats",
  formats: [
    { title: "Guided reading",     desc: "Text + focused comprehension questions. Ideal for introducing new vocabulary." },
    { title: "Listening",          desc: "Audio + locked transcript. Three subtitle levels depending on the class." },
    { title: "Free writing",        desc: "Open prompt, targeted correction by you. AI suggests directions, never publishes." },
    { title: "Practical grammar",   desc: "Isolated grammar points as short exercises. Instant feedback, human review optional." },
  ],
  ctaTitle: "Open the generation tool",
  ctaBody: "The current tool is shared with the admin space. A dedicated teacher version is coming in the next weeks.",
  cta: "Open the studio",
  hint: "Nothing is published until you review and approve. The house drafts, you decide.",
};

const ICONS = [IconHoeren, IconSprechen, IconSchreiben, IconGrammatik];

export default function TeacherStudioPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

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

        <section>
          <p className="dash-eye">{t.formatsH}</p>
          <div className="card-grid">
            {t.formats.map((f, i) => {
              const Icon = ICONS[i];
              return (
                <article key={f.title} className="card">
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: "var(--brass-glow)",
                    border: "1px solid var(--brass-edge)",
                    color: "var(--brass)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }} aria-hidden="true">
                    <Icon size={22} />
                  </div>
                  <h3 className="card-h">{f.title}</h3>
                  <p className="card-meta">{f.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section style={{
          padding: "22px 26px",
          background: "var(--brass-glow)",
          border: "1px solid var(--brass-edge)",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: "var(--espresso-2)",
            border: "1px solid var(--brass-edge)",
            color: "var(--brass)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }} aria-hidden="true">
            <IconSpark size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="subpage-eye" style={{ margin: 0 }}>{t.ctaTitle}</p>
            <p style={{ color: "var(--creme-soft)", fontSize: 13.5, margin: "8px 0 0", lineHeight: 1.55, maxWidth: "56ch" }}>
              {t.ctaBody}
            </p>
          </div>
          <Link href="/admin/courses/generate" className="subpage-cta">
            {t.cta}
          </Link>
        </section>

        <p style={{
          color: "var(--creme-mute)",
          fontSize: 12,
          fontFamily: "var(--font-jetbrains, monospace)",
          letterSpacing: "0.04em",
          margin: 0,
          maxWidth: "70ch",
        }}>
          {t.hint}
        </p>
      </section>
    </TeacherLayout>
  );
}
