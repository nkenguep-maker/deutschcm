"use client";

import { useLocale } from "next-intl";
import Layout from "@/components/Layout";
import { StateBlock } from "@/components/StateBlock";
import { Link } from "@/navigation";

// Admin · Centres
// Liste globale de tous les centres YEMA (organismes clients).
// Pour le moment : état vide éditorial + lien direct vers /center
// (l'espace vitrine d'un centre) pour vérifier.

export default function AdminCentersPage() {
  const locale = useLocale();
  const title = locale === "en" ? "Centers" : "Centres";
  const eye = locale === "en" ? "Administration" : "Administration";
  const h = locale === "en"
    ? "Language centers on YEMA."
    : "Centres de langues sur YEMA.";
  const sub = locale === "en"
    ? "Global directory of registered institutions. Each row is a paying account with its own team, learners and billing cycle."
    : "Annuaire global des institutions inscrites. Chaque ligne est un compte payant avec son équipe, ses apprenant·e·s et son cycle de facturation.";

  return (
    <Layout title={title}>
      <section className="subpage">
        <header className="subpage-head">
          <div>
            <p className="subpage-eye">{eye}</p>
            <h2 className="subpage-h">{h}</h2>
            <p className="subpage-sub">{sub}</p>
          </div>
        </header>

        <StateBlock
          kind="empty"
          centered
          soul={locale === "en"
            ? "The directory is being built. *One center at a time.*"
            : "L'annuaire se construit. *Un centre à la fois.*"}
          body={locale === "en"
            ? "The first onboarded centers will appear here soon, with search, plan filter and per-center dashboards."
            : "Les premiers centres onboardés apparaîtront ici bientôt, avec recherche, filtre par plan et dashboards par centre."}
          action={{
            label: locale === "en" ? "See an example center" : "Voir un exemple",
            href: `/${locale}/center`,
          }}
        />

        <p style={{
          color: "var(--creme-mute)",
          fontSize: 12,
          fontFamily: "var(--font-jetbrains, monospace)",
          letterSpacing: "0.04em",
          margin: 0,
        }}>
          {locale === "en"
            ? "Manage per-center roles via "
            : "Gérer les rôles par centre via "}
          <Link href="/admin/roles" style={{ color: "var(--brass)" }}>
            /admin/roles
          </Link>
          {locale === "en"
            ? " · payment integration wired but not yet exposed here."
            : " · le paiement est câblé mais pas encore exposé ici."}
        </p>
      </section>
    </Layout>
  );
}
