"use client";

// Client Component · logique Foyer Racines extraite du server component
// dashboard/page.tsx (P2 aiguille par univers · Racines conserve son shell
// existant en attendant P3).

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { StateBlock } from "@/components/StateBlock";
import { FoyerTopbar } from "@/components/foyer/FoyerTopbar";
import { FoyerHead } from "@/components/foyer/FoyerHead";
import { FoyerHero } from "@/components/foyer/FoyerHero";
import { FoyerSpine } from "@/components/foyer/FoyerSpine";
import { FoyerCapCard } from "@/components/foyer/FoyerCapCard";
import { ClasseStrip } from "@/components/foyer/ClasseStrip";
import { AutreVoixStrip } from "@/components/foyer/AutreVoixStrip";
import { FoyerTools } from "@/components/foyer/FoyerTools";
import type { FoyerData } from "@/components/foyer/types";
import { COPY_FR, COPY_EN } from "@/components/foyer/copy";

const HERO_ANCHOR = "foyer-hero-anchor";

export function FoyerClient() {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const copy = loc === "en" ? COPY_EN : COPY_FR;

  const [data, setData] = useState<FoyerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/foyer")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("foyer_fetch_failed"))))
      .then((d) => setData(d as FoyerData))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <StateBlock
        kind="loading"
        soul={loc === "en" ? "The house is opening — *just a moment.*" : "La maison s'ouvre — *un instant.*"}
      />
    );
  }
  if (error || !data) {
    return (
      <StateBlock
        kind="error"
        soul={loc === "en" ? "The voice got lost on the way. *Not yours.*" : "La voix s'est perdue en route. *Pas la vôtre.*"}
        action={{ label: loc === "en" ? "Try again" : "Réessayer", onClick: () => window.location.reload() }}
      />
    );
  }

  const territoryClass =
    data.cap === "transmettre"
      ? "territory-sources"
      : `territory-${data.activeLangue.territory}`;
  const capClass = data.cap ? `foyer-cap-${data.cap}` : "foyer-cap-none";
  const otherLanguages = data.langues.filter((l) => l.id !== data.activeLangue.id);

  return (
    <div className={`foyer ${territoryClass} ${capClass}`}>
      <FoyerTopbar
        locale={locale}
        prenom={data.prenom}
        avatarUrl={data.avatarUrl}
        territory={data.activeLangue.territory}
      />
      <FoyerHead
        prenom={data.prenom}
        locale={loc}
        urlLocale={locale}
        cap={data.cap}
        braise={data.braise}
        copy={copy.head}
        reprendreHref={`#${HERO_ANCHOR}`}
      />
      <FoyerHero
        locale={loc}
        urlLocale={locale}
        cap={data.cap}
        nextLesson={data.nextLesson}
        copy={copy.hero}
        anchorId={HERO_ANCHOR}
      />
      <div className="foyer-row">
        <FoyerSpine locale={loc} langue={data.activeLangue} copy={copy.spine} />
        <FoyerCapCard
          locale={loc}
          urlLocale={locale}
          cap={data.cap}
          personalGoal={data.personalGoal}
          capContext={data.nextLesson.capContext}
          copy={copy.capCard}
        />
      </div>
      <ClasseStrip
        locale={loc}
        urlLocale={locale}
        classe={data.classe}
        copy={copy.classe}
      />
      <AutreVoixStrip
        locale={loc}
        active={data.activeLangue}
        otherLanguages={otherLanguages}
        copy={copy.autreVoix}
      />
      <FoyerTools
        locale={loc}
        cap={data.cap}
        copy={copy.tools(locale)}
      />
    </div>
  );
}
