// P4.4 · Dashboard Coach Racines. Métriques réelles uniquement · placeholders
// honnêtes pour les blocs non calculables.

import RootsCoachLayout from "./RootsCoachLayout";
import type { RootsCoachDashboardStats } from "@/lib/rootsCoach/queries";

interface Props {
  locale: string;
  stats: RootsCoachDashboardStats;
}

const COPY = {
  fr: {
    title: "Suivi Racines",
    circles: "Cercles actifs",
    profiles: "Profils suivis",
    circlesCapacity: (n: number, max: number) => `${n} / ${max}`,
    profilesCapacity: (n: number, max: number) => `${n} / ${max}`,
    languages: "Langues suivies",
    empty: "Aucun cercle actif pour le moment.",
    unavailable: "Donnée indisponible pour le moment",
    revenue: "Revenu",
    sessions: "Sessions",
    reviews: "Avis parent",
  },
  en: {
    title: "Racines Follow-up",
    circles: "Active circles",
    profiles: "Followed profiles",
    circlesCapacity: (n: number, max: number) => `${n} / ${max}`,
    profilesCapacity: (n: number, max: number) => `${n} / ${max}`,
    languages: "Languages followed",
    empty: "No active circle yet.",
    unavailable: "No data available yet",
    revenue: "Revenue",
    sessions: "Sessions",
    reviews: "Parent reviews",
  },
} as const;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-neutral-900" data-testid={`stat-${label}`}>{value}</div>
    </div>
  );
}

function UnavailableCard({ label, note }: { label: string; note: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-sm italic text-neutral-500">{note}</div>
    </div>
  );
}

export default function RootsCoachDashboardView({ locale, stats }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <RootsCoachLayout locale={locale} active="dashboard" title={c.title}>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label={c.circles}
          value={c.circlesCapacity(stats.activeCircleCount, stats.circleCapacityMax)}
        />
        <StatCard
          label={c.profiles}
          value={c.profilesCapacity(stats.activeChildProfileCount, stats.profileCapacityMax)}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="text-sm text-neutral-500">{c.languages}</p>
        {stats.languageBreakdown.length === 0 ? (
          <p className="mt-2 text-sm italic text-neutral-500">{c.empty}</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {stats.languageBreakdown.map((l) => (
              <li
                key={l.language}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-700"
              >
                {l.language} · {l.count}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UnavailableCard label={c.revenue} note={c.unavailable} />
        <UnavailableCard label={c.sessions} note={c.unavailable} />
        <UnavailableCard label={c.reviews} note={c.unavailable} />
      </div>
    </RootsCoachLayout>
  );
}
