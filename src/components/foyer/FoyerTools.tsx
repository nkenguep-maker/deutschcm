"use client";

// FoyerTools · Sprint « Le Foyer » — refonte premium, étape 1.
// Une grille d'outils cap-configurée :
//   · Franchir / Grandir / Moi → écrit · quiz · Veillée · historique
//   · Transmettre              → contes · chansons · jeux · nos mots
// Étape 1 : squelette avec le set par défaut (Franchir). Étape 2
// alimente les 4 profils. Les tuiles restent Manrope 600 sur le titre,
// crème doux pour la ligne de description.

import Link from "next/link";
import { frTypo } from "@/components/landing/typo";
import type { Cap } from "@/components/foyer/types";

interface ToolSpec {
  key: string;
  title: string;
  desc: string;
  href: string;
}

interface Copy {
  title: string;
  tools: {
    standard: ToolSpec[];
    transmettre: ToolSpec[];
  };
}

interface FoyerToolsProps {
  locale: "fr" | "en";
  cap: Cap | null;
  copy: Copy;
}

export function FoyerTools({ locale, cap, copy }: FoyerToolsProps) {
  const t = (s: string) => (locale === "fr" ? frTypo(s) : s);
  const tools = cap === "transmettre" ? copy.tools.transmettre : copy.tools.standard;

  return (
    <section className="foyer-tools" aria-labelledby="foyer-tools-h">
      <p id="foyer-tools-h" className="maison-kicker">{t(copy.title)}</p>
      <div className="foyer-tools-grid">
        {tools.map((tool) => (
          <Link key={tool.key} href={tool.href} className="foyer-tool">
            <h3 className="foyer-tool-h">{t(tool.title)}</h3>
            <p className="foyer-tool-desc">{t(tool.desc)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
