"use client";

import { useLocale } from "next-intl";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import { IconChart, IconSpark, IconCheck, IconContext } from "@/components/landing/icons";

// Admin · Système
// Vue de santé technique globale : uptime, coûts IA, quotas Supabase,
// job queues. Pour l'instant : squelette éditorial + placeholders sur
// les 4 métriques prévues. Chaque métrique aura son endpoint dédié
// plus tard (santé Vercel, Gemini usage, Supabase RLS logs).

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  cards: Array<{ label: string; hint: string }>;
  soonH: string;
  soonBody: string;
}

const FR: Copy = {
  title: "Système",
  eye: "Administration",
  h: "La santé technique en un coup d'œil.",
  sub: "Uptime, quotas IA, jobs en file, latence des espaces. Ces indicateurs guident les décisions techniques — jamais commerciales.",
  cards: [
    { label: "Disponibilité",     hint: "Uptime Vercel + Supabase" },
    { label: "Quota IA",          hint: "Tokens Gemini consommés ce mois" },
    { label: "File de traitement",hint: "Jobs corrections + tests en attente" },
    { label: "Latence espaces",   hint: "P95 par région, hors CDN" },
  ],
  soonH: "Métriques bientôt câblées. *Un jour à la fois.*",
  soonBody: "Chaque indicateur sera relié à un endpoint dédié (santé Vercel, usage Gemini, Supabase RLS logs, monitoring de queue). D'ici là, l'espace reste sobre.",
};

const EN: Copy = {
  title: "System",
  eye: "Administration",
  h: "Technical health at a glance.",
  sub: "Uptime, AI quotas, queued jobs, per-space latency. These signals guide technical decisions — never commercial ones.",
  cards: [
    { label: "Availability",  hint: "Vercel + Supabase uptime" },
    { label: "AI quota",      hint: "Gemini tokens used this month" },
    { label: "Job queue",     hint: "Pending corrections + tests" },
    { label: "Space latency", hint: "P95 per region, excluding CDN" },
  ],
  soonH: "Metrics being wired. *One day at a time.*",
  soonBody: "Each indicator will be tied to its own endpoint (Vercel health, Gemini usage, Supabase RLS logs, queue monitoring). Until then, this space stays sober.",
};

const ICONS = [IconCheck, IconSpark, IconChart, IconContext];

export default function AdminSystemPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  return (
    <Layout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
        </header>

        <section className="dash-stats">
          {t.cards.map((c, i) => {
            const Icon = ICONS[i];
            return (
              <div key={c.label} className="dash-stat">
                <p className="dash-stat-lbl">
                  <span className="dash-stat-icon" aria-hidden="true"><Icon size={13} /></span>
                  {c.label}
                </p>
                <p className="dash-stat-val" style={{ color: "var(--creme-mute)" }}>—</p>
                <p className="dash-stat-sub">{c.hint}</p>
              </div>
            );
          })}
        </section>

        <StateBlock
          kind="empty"
          soul={t.soonH}
          body={t.soonBody}
        />
      </section>
    </Layout>
  );
}
