"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import {
  IconBook,
  IconCheck,
  IconSpark,
  IconClasse,
} from "@/components/landing/icons";

// Admin · Bibliothèque
// Vue globale du catalogue de cours. Affiche total, publiés, brouillons,
// classes. Lien vers /admin/courses/generate pour créer une leçon.

interface DBCourse {
  id: string;
  courseId: string;
  titleDE: string;
  level: string;
  modules: number;
  isPublished: boolean;
}

interface Copy {
  title: string;
  eye: string;
  h: string;
  sub: string;
  kpiTotal: string;
  kpiPublished: string;
  kpiDrafts: string;
  kpiLevels: string;
  loading: string;
  emptyH: string;
  emptySub: string;
  emptyCta: string;
  seeAll: string;
  studioCta: string;
}

const FR: Copy = {
  title: "Bibliothèque",
  eye: "Administration",
  h: "Le catalogue YEMA en un coup d'œil.",
  sub: "Vue globale de toutes les leçons produites, publiées ou en brouillon. La bibliothèque grandit chaque semaine.",
  kpiTotal: "Cours totaux",
  kpiPublished: "Publiés",
  kpiDrafts: "Brouillons",
  kpiLevels: "Niveaux couverts",
  loading: "Chargement…",
  emptyH: "La bibliothèque est vide. *À toi d'écrire.*",
  emptySub: "Ouvre le Studio pour composer la première leçon. L'IA propose, ton nom valide.",
  emptyCta: "Ouvrir le Studio",
  seeAll: "Ouvrir le Studio",
  studioCta: "Studio · IA",
};

const EN: Copy = {
  title: "Library",
  eye: "Administration",
  h: "The YEMA catalog at a glance.",
  sub: "Global view of every lesson produced, published or draft. The library grows every week.",
  kpiTotal: "Total courses",
  kpiPublished: "Published",
  kpiDrafts: "Drafts",
  kpiLevels: "Levels covered",
  loading: "Loading…",
  emptyH: "The library is empty. *Time to write.*",
  emptySub: "Open the Studio to compose the first lesson. AI drafts, your name validates.",
  emptyCta: "Open the Studio",
  seeAll: "Open the Studio",
  studioCta: "Studio · AI",
};

export default function AdminCoursesPage() {
  const locale = useLocale();
  const t = locale === "en" ? EN : FR;
  const [courses, setCourses] = useState<DBCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses?includeUnpublished=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.fallback && Array.isArray(d?.courses)) setCourses(d.courses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const published = courses.filter((c) => c.isPublished).length;
  const drafts = courses.length - published;
  const levelsSet = new Set(courses.map((c) => c.level));

  return (
    <Layout title={t.title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{t.eye}</p>
            <h2 className="subpage-h">{t.h}</h2>
            <p className="subpage-sub">{t.sub}</p>
          </div>
          <Link href="/admin/courses/generate" className="subpage-cta">
            <IconSpark size={14} />
            {t.studioCta}
          </Link>
        </header>

        <section className="dash-stats">
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconBook size={13} /></span>
              {t.kpiTotal}
            </p>
            <p className="dash-stat-val">{loading ? "—" : courses.length}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconCheck size={13} /></span>
              {t.kpiPublished}
            </p>
            <p className="dash-stat-val">{loading ? "—" : published}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconSpark size={13} /></span>
              {t.kpiDrafts}
            </p>
            <p className="dash-stat-val">{loading ? "—" : drafts}</p>
          </div>
          <div className="dash-stat">
            <p className="dash-stat-lbl">
              <span className="dash-stat-icon" aria-hidden="true"><IconClasse size={13} /></span>
              {t.kpiLevels}
            </p>
            <p className="dash-stat-val">{loading ? "—" : levelsSet.size}</p>
          </div>
        </section>

        {loading ? (
          <div className="empty-state">
            <p className="empty-state-sub">{t.loading}</p>
          </div>
        ) : courses.length === 0 ? (
          <StateBlock
            kind="empty"
            centered
            soul={t.emptyH}
            body={t.emptySub}
            action={{ label: t.emptyCta, href: "/admin/courses/generate" }}
          />
        ) : (
          <div className="data-table-wrap">
            <div className="data-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{locale === "en" ? "Title" : "Titre"}</th>
                    <th className="center">{locale === "en" ? "Level" : "Niveau"}</th>
                    <th className="center">{locale === "en" ? "Modules" : "Modules"}</th>
                    <th>{locale === "en" ? "Status" : "Statut"}</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: "var(--font-fraunces), Georgia, serif", color: "var(--creme)", fontSize: 14 }}>
                        {c.titleDE}
                      </td>
                      <td className="center">
                        <span className="status-pill active">{c.level}</span>
                      </td>
                      <td className="center" style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
                        {c.modules}
                      </td>
                      <td>
                        <span className={`status-pill ${c.isPublished ? "active" : "pending"}`}>
                          {c.isPublished
                            ? locale === "en" ? "Published" : "Publié"
                            : locale === "en" ? "Draft" : "Brouillon"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
