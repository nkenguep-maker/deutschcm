"use client";

import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import TeacherLayout from "@/components/TeacherLayout";
import {
  IconSprechen,
  IconSpark,
  IconSchreiben,
  IconContext,
  IconBook,
} from "@/components/landing/icons";

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  cards: Array<{ title: string; desc: string }>;
  soon: string;
  studioEye: string;
  studioH: string;
  studioSub: string;
  studioCta: string;
  hint: string;
}

const FR: Copy = {
  title: "Ressources",
  eye: "Ressources partagées",
  h: "Une bibliothèque en construction.",
  sub: "Ressources partagées entre enseignant·e·s Yema — bientôt disponibles. En attendant, le Studio te permet déjà de composer des leçons complètes.",
  cards: [
    { title: "Scénarios de conversation", desc: "Situations réalistes pour la pratique orale : administratif, quotidien, professionnel." },
    { title: "Modèles d'activité",         desc: "Trames prêtes à l'emploi pour quiz, dictée, jeu de rôles, correction ciblée." },
    { title: "Corrigés types",              desc: "Grilles d'évaluation et exemples de retours humains pour cadrer la relecture." },
    { title: "Contextes pan-africains",    desc: "Situations ancrées dans le quotidien africain — marché, palabre, voyage." },
  ],
  soon: "Bientôt",
  studioEye: "Studio",
  studioH: "Composer une leçon IA maintenant.",
  studioSub: "Le Studio te laisse composer une leçon complète en quelques minutes. Rien n'est publié tant que tu n'as pas relu.",
  studioCta: "Ouvrir le Studio",
  hint: "La bibliothèque partagée entre enseignant·e·s ouvrira quand la première cohorte aura testé le Studio et validé les premières trames.",
};

const EN: Copy = {
  title: "Resources",
  eye: "Shared resources",
  h: "A library under construction.",
  sub: "Resources shared between Yema teachers — coming soon. Meanwhile, the Studio already lets you build full lessons.",
  cards: [
    { title: "Conversation scenarios", desc: "Real situations for oral practice: administrative, daily, professional." },
    { title: "Activity templates",     desc: "Ready-to-use frames for quizzes, dictation, role-plays, focused correction." },
    { title: "Grading rubrics",        desc: "Evaluation grids and human-feedback examples to frame your review." },
    { title: "Pan-African contexts",   desc: "Situations rooted in African daily life — market, palaver, travel." },
  ],
  soon: "Coming",
  studioEye: "Studio",
  studioH: "Compose an AI lesson now.",
  studioSub: "The Studio lets you compose a full lesson in minutes. Nothing is published until you review it.",
  studioCta: "Open the Studio",
  hint: "The shared library will open once the first teacher cohort has tested the Studio and validated the first templates.",
};

export default function TeacherResourcesPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const icons = [IconSprechen, IconSchreiben, IconBook, IconContext];

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

        <div className="card-grid">
          {t.cards.map((c, i) => {
            const Icon = icons[i];
            return (
              <article key={c.title} className="card">
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
                <h3 className="card-h">{c.title}</h3>
                <p className="card-meta">{c.desc}</p>
                <span className="status-pill pending" style={{ alignSelf: "flex-start" }}>{t.soon}</span>
              </article>
            );
          })}
        </div>

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
            <p className="subpage-eye" style={{ margin: 0 }}>{t.studioEye}</p>
            <h3 style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 18,
              color: "var(--creme)",
              margin: "6px 0 6px",
              fontWeight: 400,
            }}>{t.studioH}</h3>
            <p style={{ color: "var(--creme-soft)", fontSize: 13, margin: 0, lineHeight: 1.55 }}>
              {t.studioSub}
            </p>
          </div>
          <Link href="/admin/courses/generate" className="subpage-cta">
            {t.studioCta}
          </Link>
        </section>

        <p style={{
          color: "var(--creme-mute)",
          fontSize: 12,
          fontFamily: "var(--font-jetbrains, monospace)",
          letterSpacing: "0.04em",
          margin: 0,
          maxWidth: "68ch",
        }}>
          {t.hint}
        </p>
      </section>
    </TeacherLayout>
  );
}
