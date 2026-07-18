// LegalShell — shell partagé pour les pages légales (terms + privacy).
// Palette Kaffeehaus, colonne éditoriale 720px, nav minimal.

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CefrStrip } from "./CefrStrip";
import { LandingBrand } from "./LandingBrand";

export function LegalShell({
  locale,
  eye,
  title,
  effective,
  updated,
  contactEmail,
  contactLine,
  children,
}: {
  locale: string;
  eye: string;
  title: string;
  effective: string;
  updated: string;
  contactEmail: string;
  contactLine: string;
  children: ReactNode;
}) {
  return (
    <div className="landing llegal">
      <header className="lauth-header">
        <Link href={`/${locale}`} className="lnav-brand">
          <LandingBrand />
        </Link>
        <Link href={`/${locale}`} className="lauth-alt-link">
          ← {locale === "en" ? "Back to YEMA" : "Retour à YEMA"}
        </Link>
      </header>

      <main className="container llegal-main">
        <div className="llegal-head">
          <div className="lsection-eye">{eye}</div>
          <h1 className="llegal-h">{title}</h1>
          <p className="llegal-meta">
            {locale === "en" ? "Effective: " : "Entrée en vigueur : "}
            {effective}
            {" · "}
            {locale === "en" ? "Last updated: " : "Dernière mise à jour : "}
            {updated}
          </p>
        </div>

        <div className="llegal-body">{children}</div>

        <aside className="llegal-contact">
          <p>
            {contactLine}{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </aside>
      </main>

      <footer className="lauth-foot">
        <CefrStrip current="A1" ariaLabel="Parcours YEMA — CECRL" />
      </footer>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="llegal-h2">{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="llegal-p">{children}</p>;
}

export function Ul({ items }: { items: readonly string[] }) {
  return (
    <ul className="llegal-ul">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function Callout({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning";
  children: ReactNode;
}) {
  return (
    <div className={`llegal-callout llegal-callout-${variant}`}>{children}</div>
  );
}
