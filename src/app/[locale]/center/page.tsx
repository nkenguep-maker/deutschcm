"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useLocale } from "next-intl";
import CenterLayout from "@/components/CenterLayout";
import {
  IconTeacher,
  IconGroup,
  IconClasse,
  IconChart,
  IconMoney,
  IconSpark,
  IconCheck,
} from "@/components/landing/icons";

// Dashboard centre · Kaffeehaus.
// Code partage · métriques équipe · liste des enseignant·e·s · quick actions.

interface Stats {
  teacherCount: number;
  studentCount: number;
  classCount: number;
}

interface Teacher {
  id: string;
  name: string;
  specialty: string;
  classes: number;
  students: number;
  avgScore: number;
  status: string;
}

interface Copy {
  eye: string;
  greet: string;
  h1a: string;
  h1b: string;
  sub: string;
  codeEye: string;
  codeLbl: string;
  codeSub: string;
  copyCode: string;
  copied: string;
  statTeachers: string;
  statStudents: string;
  statClasses: string;
  statScore: string;
  statTeachersSub: string;
  statStudentsSub: string;
  statClassesSub: string;
  statScoreSub: string;
  teamEye: string;
  teamH: string;
  teamEmpty: string;
  teamInvite: string;
  teamOpen: string;
  actionsEye: string;
  actionsH: string;
  actionTeachTitle: string;
  actionTeachDesc: string;
  actionTeachCta: string;
  actionClassTitle: string;
  actionClassDesc: string;
  actionClassCta: string;
  actionBillTitle: string;
  actionBillDesc: string;
  actionBillCta: string;
}

const FR: Copy = {
  eye: "Espace centre",
  greet: "Bonjour.",
  h1a: "Ton centre ",
  h1b: "vivant.",
  sub: "Vue d'ensemble en un coup d'œil — équipe, apprenant·e·s, moyennes de classe. Partage le code du centre pour inscrire de nouveaux membres.",
  codeEye: "Code du centre",
  codeLbl: "Code d'invitation",
  codeSub:
    "À partager aux enseignant·e·s et apprenant·e·s pour rejoindre ton centre sur Yema.",
  copyCode: "Copier",
  copied: "Copié",
  statTeachers: "Enseignant·e·s",
  statTeachersSub: "Actifs",
  statStudents: "Apprenant·e·s",
  statStudentsSub: "Inscrits",
  statClasses: "Classes",
  statClassesSub: "En cours",
  statScore: "Score moyen",
  statScoreSub: "Toutes classes",
  teamEye: "Équipe pédagogique",
  teamH: "Qui enseigne quoi.",
  teamEmpty: "Aucun·e enseignant·e n'a encore rejoint le centre. Partage le code d'invitation ci-dessus.",
  teamInvite: "Inviter",
  teamOpen: "Voir",
  actionsEye: "Actions rapides",
  actionsH: "Piloter le centre.",
  actionTeachTitle: "Inviter un·e enseignant·e",
  actionTeachDesc: "Partage le code du centre ou envoie une invitation directe par email.",
  actionTeachCta: "Ouvrir",
  actionClassTitle: "Créer une classe",
  actionClassDesc: "Ouvre une nouvelle classe, choisis le niveau, assigne un·e enseignant·e.",
  actionClassCta: "Créer",
  actionBillTitle: "Facturation",
  actionBillDesc: "Consulte l'état de l'abonnement, télécharge les factures en XAF.",
  actionBillCta: "Voir",
};

const EN: Copy = {
  eye: "Center space",
  greet: "Hello.",
  h1a: "Your center, ",
  h1b: "alive.",
  sub: "One-glance overview — team, learners, class averages. Share the center code to onboard new members.",
  codeEye: "Center code",
  codeLbl: "Invitation code",
  codeSub:
    "Share with teachers and learners so they can join your center on Yema.",
  copyCode: "Copy",
  copied: "Copied",
  statTeachers: "Teachers",
  statTeachersSub: "Active",
  statStudents: "Learners",
  statStudentsSub: "Enrolled",
  statClasses: "Classes",
  statClassesSub: "Ongoing",
  statScore: "Avg. score",
  statScoreSub: "All classes",
  teamEye: "Teaching team",
  teamH: "Who teaches what.",
  teamEmpty:
    "No teacher has joined the center yet. Share the invitation code above.",
  teamInvite: "Invite",
  teamOpen: "Open",
  actionsEye: "Quick actions",
  actionsH: "Run the center.",
  actionTeachTitle: "Invite a teacher",
  actionTeachDesc: "Share the center code or send a direct email invitation.",
  actionTeachCta: "Open",
  actionClassTitle: "Create a class",
  actionClassDesc: "Open a new class, set the level, assign a teacher.",
  actionClassCta: "Create",
  actionBillTitle: "Billing",
  actionBillDesc: "Subscription status, invoices in XAF, downloadable.",
  actionBillCta: "See",
};

export default function CenterDashboard() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [centerName, setCenterName] = useState("");
  const [centerCity, setCenterCity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.centerName) setCenterName(d.centerName);
        if (d?.centerCity) setCenterCity(d.centerCity);
      })
      .catch(() => {});

    fetch("/api/center?action=code")
      .then((r) => r.json())
      .then((d) => {
        if (d?.code) setCode(d.code);
      })
      .catch(() => {});

    fetch("/api/center?action=stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setStats({
            teacherCount: d.teacherCount ?? 0,
            studentCount: d.studentCount ?? 0,
            classCount: d.classroomCount ?? 0,
          });
          if (d.teachers) setTeachers(d.teachers);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const avgScore =
    teachers.length > 0
      ? Math.round(
          teachers.reduce((s, t) => s + t.avgScore, 0) / teachers.length,
        )
      : 0;

  return (
    <CenterLayout title={t.eye} centerName={centerName} centerCity={centerCity}>
      <section className="dash">
        <header>
          <p className="dash-eye">{t.greet}</p>
        </header>

        <article className="dash-hero">
          <div>
            <h1 className="dash-hero-h">
              {t.h1a}
              <em>{t.h1b}</em>
            </h1>
            <p className="dash-hero-sub">{t.sub}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <Link href="/center/teachers" className="dash-hero-cta">
                {t.actionTeachTitle}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                     stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
                     strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="dash-hero-side">
            <div style={{
              display: "flex", flexDirection: "column", gap: 8, minWidth: 160,
            }}>
              <p style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 10.5,
                color: "var(--creme-mute)",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                margin: 0,
              }}>{locale === "en" ? "Enrolled" : "Inscrits"}</p>
              <p style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 60,
                fontWeight: 400,
                color: "var(--creme)",
                lineHeight: 1,
                margin: 0,
              }} aria-hidden="true">
                {loading ? "—" : stats?.studentCount ?? 0}
              </p>
            </div>
          </div>
        </article>

        <section className="dash-center-code" aria-label={t.codeEye}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="dash-center-code-lbl">{t.codeLbl}</p>
            <p className="dash-center-code-val">
              {loading ? "—" : code ?? "—"}
            </p>
            <p className="dash-center-code-sub">{t.codeSub}</p>
          </div>
          <button
            type="button"
            className="dash-center-code-copy"
            onClick={copyCode}
            disabled={!code}
            aria-live="polite"
          >
            {copied ? t.copied : t.copyCode}
          </button>
        </section>

        <section aria-label={t.statTeachers} className="dash-stats">
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconTeacher size={13} /></span>
              {t.statTeachers}
            </p>
            <p className="dash-stat-val">{loading ? "—" : stats?.teacherCount ?? 0}</p>
            <p className="dash-stat-sub">{t.statTeachersSub}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconGroup size={13} /></span>
              {t.statStudents}
            </p>
            <p className="dash-stat-val">{loading ? "—" : stats?.studentCount ?? 0}</p>
            <p className="dash-stat-sub">{t.statStudentsSub}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconClasse size={13} /></span>
              {t.statClasses}
            </p>
            <p className="dash-stat-val">{loading ? "—" : stats?.classCount ?? 0}</p>
            <p className="dash-stat-sub">{t.statClassesSub}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconCheck size={13} /></span>
              {t.statScore}
            </p>
            <p className="dash-stat-val">{loading ? "—" : avgScore || "—"}</p>
            <p className="dash-stat-sub">{t.statScoreSub}</p>
          </div>
        </section>

        <section aria-labelledby="center-team-h">
          <p className="dash-eye">{t.teamEye}</p>
          <h2 id="center-team-h" className="dash-block-h">{t.teamH}</h2>
          {teachers.length === 0 ? (
            <div className="dash-teacher-today">
              <p className="dash-teacher-empty">{t.teamEmpty}</p>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Link href="/center/teachers" className="dash-hero-cta">
                  {t.teamInvite}
                </Link>
              </div>
            </div>
          ) : (
            <div className="dash-center-team">
              {teachers.slice(0, 5).map((teach) => {
                const initials = teach.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <Link
                    key={teach.id}
                    href={`/center/teachers/${teach.id}`}
                    className="dash-center-team-row"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="dash-center-team-mono" aria-hidden="true">{initials}</div>
                    <div>
                      <p className="dash-center-team-name">{teach.name}</p>
                      <p className="dash-center-team-meta">
                        {teach.specialty} · {teach.classes}{" "}
                        {locale === "en" ? (teach.classes > 1 ? "classes" : "class") : "classe" + (teach.classes > 1 ? "s" : "")} · {teach.students}{" "}
                        {locale === "en" ? "learners" : "apprenant·e·s"}
                      </p>
                    </div>
                    <span className="dash-center-team-stat">
                      {teach.avgScore > 0 ? `${teach.avgScore}/100` : "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="center-actions-h">
          <p className="dash-eye">{t.actionsEye}</p>
          <h2 id="center-actions-h" className="dash-block-h">{t.actionsH}</h2>
          <div className="dash-actions">
            <Link href="/center/teachers" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconTeacher size={18} /></span>
              <h3 className="dash-action-title">{t.actionTeachTitle}</h3>
              <p className="dash-action-desc">{t.actionTeachDesc}</p>
              <p className="dash-action-cta">{t.actionTeachCta} →</p>
            </Link>
            <Link href="/center/classes" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconClasse size={18} /></span>
              <h3 className="dash-action-title">{t.actionClassTitle}</h3>
              <p className="dash-action-desc">{t.actionClassDesc}</p>
              <p className="dash-action-cta">{t.actionClassCta} →</p>
            </Link>
            <Link href="/center/billing" className="dash-action">
              <span className="dash-action-icon" aria-hidden="true"><IconMoney size={18} /></span>
              <h3 className="dash-action-title">{t.actionBillTitle}</h3>
              <p className="dash-action-desc">{t.actionBillDesc}</p>
              <p className="dash-action-cta">{t.actionBillCta} →</p>
            </Link>
          </div>
        </section>
      </section>
      {/* Suppress unused import warnings */}
      <span aria-hidden="true" style={{ display: "none" }}>
        <IconChart size={1} />
        <IconSpark size={1} />
      </span>
    </CenterLayout>
  );
}
