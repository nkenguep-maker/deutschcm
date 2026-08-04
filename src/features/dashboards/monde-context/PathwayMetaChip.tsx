"use client";

import { useTranslations } from "next-intl";
import { resolveMondePath } from "@/features/dashboards/student-monde/ivory";

// Lot 7B · chip Monde discret · réutilisé par Teacher/Family/Coach lorsque
// pertinent · rend uniquement le nom du parcours + éventuellement le niveau.
// AUCUN if/else par parcours ailleurs · la source unique est
// resolveMondePath.
//
// Style · mono chip, tons neutres, jamais or (or réservé au signal actif
// unique par écran). Aucun drapeau, aucune nationalité inférée.

type Props = {
  learningGoal: string | null | undefined;
  level?: string | null;
  fallbackKey?: "unknown_short" | "unknown_long";
};

export function PathwayMetaChip({ learningGoal, level, fallbackKey = "unknown_short" }: Props) {
  const t = useTranslations("yemaDashboards.mondeContext");
  const path = resolveMondePath({ learningGoal: learningGoal ?? null });

  const label = path
    ? t(`pathwayLabel.${path}`)
    : t(`fallback.${fallbackKey}`);

  const meta = [label, level].filter(Boolean).join(" · ");

  return (
    <span
      className="monde-mono"
      style={{
        color: "var(--monde-text-muted, #9C9184)",
        fontFamily: "var(--monde-font-mono, ui-monospace, monospace)",
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        whiteSpace: "nowrap",
        flex: "none",
      }}
    >
      {meta}
    </span>
  );
}
