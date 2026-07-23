// P4.3b · Dashboard Teacher rendu depuis données réelles.

import TeacherLayout from "@/components/TeacherLayout";
import type { TeacherDashboardStats } from "@/lib/teacher/queries";

interface Props {
  locale: string;
  teacher: { id: string; isVerified: boolean };
  center: { id: string; name: string; city: string } | null;
  stats: TeacherDashboardStats;
}

const COPY = {
  fr: {
    title: "Espace enseignant",
    classes: "Classes",
    students: "Étudiants actifs",
    pending: "Demandes en attente",
    unavailable: "Donnée indisponible pour le moment",
    avgProgress: "Progression moyenne",
    avgScore: "Score moyen",
    revenue: "Revenu",
    verified: "Compte vérifié",
    unverified: "Compte en attente de vérification",
    noCenter: "Aucun centre rattaché",
  },
  en: {
    title: "Teacher space",
    classes: "Classes",
    students: "Active students",
    pending: "Pending requests",
    unavailable: "No data available yet",
    avgProgress: "Average progress",
    avgScore: "Average score",
    revenue: "Revenue",
    verified: "Verified account",
    unverified: "Pending verification",
    noCenter: "No center attached",
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

export default function TeacherDashboardView({ locale, teacher, center, stats }: Props) {
  const c = locale === "en" ? COPY.en : COPY.fr;
  return (
    <TeacherLayout title={c.title}>
      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">
            {center ? `${center.name} · ${center.city}` : c.noCenter}
          </p>
          <p className={`mt-1 text-sm ${teacher.isVerified ? "text-emerald-700" : "text-amber-700"}`}>
            {teacher.isVerified ? c.verified : c.unverified}
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={c.classes} value={stats.classroomCount} />
        <StatCard label={c.students} value={stats.activeStudentCount} />
        <StatCard label={c.pending} value={stats.pendingRequestCount} />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UnavailableCard label={c.avgProgress} note={c.unavailable} />
        <UnavailableCard label={c.avgScore} note={c.unavailable} />
        <UnavailableCard label={c.revenue} note={c.unavailable} />
      </div>
    </TeacherLayout>
  );
}
