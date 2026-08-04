"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardSectionHeader,
} from "@/features/dashboards/shared";
import type { RacinesChild } from "../types";

type Props = {
  profiles: RacinesChild[];
};

export function ChildrenSection({ profiles }: Props) {
  const t = useTranslations("yemaDashboards.studentRacines.children");

  if (profiles.length === 0) return null;

  return (
    <section id="foyer" aria-labelledby="foyer-title" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DashboardSectionHeader
        title={<span id="foyer-title">{t("title")}</span>}
        description={t("description")}
        actions={
          <Link
            href="/famille"
            style={{
              fontSize: 12,
              color: "var(--yema-gold-light)",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "var(--yema-r-pill)",
              border: "1px solid var(--yema-gold-edge)",
              minHeight: 36,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {t("manage")}
          </Link>
        }
      />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {profiles.map((child) => (
          <li key={child.id}>
            <DashboardCard>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--yema-gold-glow)",
                    border: "1px solid var(--yema-gold-edge)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--yema-gold-light)",
                    fontFamily: "var(--yema-font-mono)",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {child.prenom.charAt(0).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--yema-text)" }}>
                    {child.prenom}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--yema-text-muted)" }}>
                    {t("ageYears", { age: child.age })}
                    {child.activeLangue ? ` · ${child.activeLangue}` : ""}
                  </div>
                </div>
                <Link
                  href={`/famille/enfant/${child.id}`}
                  style={{
                    fontSize: 12,
                    color: "var(--yema-gold-light)",
                    textDecoration: "none",
                    padding: "8px 14px",
                    borderRadius: "var(--yema-r-pill)",
                    border: "1px solid var(--yema-gold-edge)",
                    minHeight: 36,
                    display: "inline-flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {t("open")}
                </Link>
              </div>
            </DashboardCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
