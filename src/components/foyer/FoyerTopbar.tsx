"use client";

// FoyerTopbar · Sprint « Le Foyer » — refonte premium, étape 1.
// Barre haute distincte du sidebar app :
//   [logo Confluent Y]  ────────  [SpaceSwitcher?]  [avatar]
// Le SpaceSwitcher n'apparaît QUE si l'user a 2+ rôles (studient +
// teacher, par ex.). L'avatar reste visible même sans image (initiale).
// Le logo utilise BrandY variant="world" ou "sources" selon le
// territoire de la langue active — le tronc est toujours présent.

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandY } from "@/components/brand/BrandY";
import { SpaceSwitcher, type SpaceRole } from "@/components/SpaceSwitcher";

interface FoyerTopbarProps {
  locale: string;
  prenom: string;
  avatarUrl: string | null;
  territory: "world" | "sources";
}

export function FoyerTopbar({ locale, prenom, avatarUrl, territory }: FoyerTopbarProps) {
  const [roles, setRoles] = useState<SpaceRole[]>([]);
  const [activeSpace, setActiveSpace] = useState<SpaceRole>("STUDENT");

  useEffect(() => {
    let alive = true;
    fetch("/api/space", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        if (Array.isArray(d.userRoles)) setRoles(d.userRoles as SpaceRole[]);
        if (d.activeSpace) setActiveSpace(d.activeSpace as SpaceRole);
      })
      .catch(() => { /* silent — la topbar reste utile sans switcher */ });
    return () => { alive = false; };
  }, []);

  const initial = (prenom || "?").slice(0, 1).toUpperCase();

  return (
    <header className="foyer-topbar" aria-label="Foyer navigation">
      <Link href={`/${locale}`} className="foyer-topbar-brand" aria-label="YEMA — retour à l'accueil">
        <BrandY variant={territory === "sources" ? "sources" : "world"} state="static" size={36} />
      </Link>

      <div className="foyer-topbar-right">
        {roles.length >= 2 ? (
          <SpaceSwitcher roles={roles} activeSpace={activeSpace} />
        ) : null}

        <div className="foyer-topbar-avatar" aria-label={`Profil de ${prenom}`}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" />
          ) : (
            <span className="foyer-topbar-avatar-initial">{initial}</span>
          )}
        </div>
      </div>
    </header>
  );
}
