// P4.5-B2b3b-b1 Student UI · shell minimal pour les 3 pages Student.
// Volontairement plus léger que TeacherLayout · l'espace Student en P4.5-B1
// ne dispose pas encore d'une navigation multi-sections dédiée · on
// affiche le titre + un lien de retour vers la liste des devoirs.

"use client";

import Link from "next/link";
import { type ReactNode } from "react";

interface Props {
  locale: string;
  title?: string;
  children: ReactNode;
}

export default function StudentLayout({ locale, title, children }: Props) {
  return (
    <div className="min-h-screen" style={{ background: "var(--espresso)", color: "var(--creme)" }}>
      <header
        className="border-b"
        style={{ borderColor: "var(--brass-edge)", background: "var(--espresso)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href={`/${locale}/student/assignments`}
            className="flex items-center gap-2 focus:outline-none focus:ring-2"
            style={{ color: "var(--creme)" }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: "1.5px solid var(--brass-edge)",
                background: "var(--brass-glow)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontStyle: "italic", fontSize: 16, color: "var(--brass)",
              }}
            >Y</span>
            <span
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontStyle: "italic", fontSize: 18, letterSpacing: "-0.01em",
              }}
            >Yema</span>
          </Link>
          {title && (
            <h1
              className="text-sm font-medium"
              style={{ color: "var(--creme-soft)" }}
            >{title}</h1>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
