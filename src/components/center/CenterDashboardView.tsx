// P4.3a · Dashboard Center rendu depuis données réelles.
// Blocs "Donnée indisponible" pour les métriques non calculables (rétention,
// top students, revenu · aucune source réelle en P4.3a).

import CenterLayout from "@/components/CenterLayout";
import type { CenterDashboardStats } from "@/lib/center/queries";

interface Props {
  locale: string;
  center: { id: string; name: string; city: string; country: string; plan: string };
  stats: CenterDashboardStats;
}

const COPY = {
  fr: {
    teachers: "Enseignants",
    classes: "Classes",
    students: "Étudiants actifs",
    pending: "Inscriptions en attente",
    unavailable: "Donnée indisponible pour le moment",
    retention: "Rétention",
    topStudents: "Meilleurs étudiants",
    revenue: "Revenu mensuel",
  },
  en: {
    teachers: "Teachers",
    classes: "Classes",
    students: "Active students",
    pending: "Pending enrollments",
    unavailable: "No data available yet",
    retention: "Retention",
    topStudents: "Top students",
    revenue: "Monthly revenue",
  },
} as const;

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-neutral-900" data-testid={`stat-${label}`}>
        {value}
      </div>
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

export default function CenterDashboardView({ locale, center, stats }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <CenterLayout title={center.name} centerName={center.name} centerCity={center.city}>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={c.teachers} value={stats.teacherCount} />
        <StatCard label={c.classes} value={stats.classroomCount} />
        <StatCard label={c.students} value={stats.studentCount} />
        <StatCard label={c.pending} value={stats.pendingEnrollmentCount} />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UnavailableCard label={c.retention} note={c.unavailable} />
        <UnavailableCard label={c.topStudents} note={c.unavailable} />
        <UnavailableCard label={c.revenue} note={c.unavailable} />
      </div>
    </CenterLayout>
  );
}
