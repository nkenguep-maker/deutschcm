// Sidebar adaptative · le vocabulaire épouse le cap, pas la langue.
// Une seule source déclarative, filtrée à l'affichage par canAccess.
// Aucun if éparpillé dans le composant.
//
// Doctrine
//   Franchir     · espace « APPRENANT·E », espresso · vocabulaire projet
//   Grandir      · espace « APPRENANT·E », espresso · vocabulaire durée
//   Transmettre  · espace « TRANSMISSION », TERRE · aucun mot d'école
//   Moi          · espace « APPRENANT·E », espresso · sobre, sans pression
//
// Item.needs · liste de capacités que l'item requiert pour être affiché :
//   "classroom"  → user inscrit dans une Classroom active
//   "plan:paid"  → user a un SubscriptionPlan ≠ FREE
//   "grandir"    → cap Grandir uniquement
//   "franchir"   → cap Franchir uniquement
// L'item est retiré (jamais grisé, jamais cadenassé) si un de ses
// besoins n'est pas satisfait.

import type { Cap } from "./types";
import type { ReactElement } from "react";
import {
  IconHome,
  IconBook,
  IconChart,
  IconMic,
  IconClasse,
  IconContext,
  IconSettings,
  IconSpark,
  IconGroup,
} from "@/components/landing/icons";

type NeedKey = "classroom" | "plan:paid" | "franchir" | "grandir" | "moi" | "transmettre";

export interface NavItemDef {
  key: string;
  Icon: (p: { size?: number }) => ReactElement;
  labelFr: string;
  labelEn: string;
  href: string;
  needs?: NeedKey[];
}

export interface NavSectionDef {
  key: string;
  /** null = section silencieuse (pas de label rendu) */
  labelFr: string | null;
  labelEn: string | null;
  items: NavItemDef[];
}

export interface NavConfig {
  /** Étiquette d'espace affichée dans l'entête de la sidebar. */
  spaceLabelFr: string;
  spaceLabelEn: string;
  sections: NavSectionDef[];
}

// ── Communauté · discret, partout ─────────────────────────────────
const COMMUNAUTE_ITEM: NavItemDef = {
  key: "community",
  Icon: IconContext,
  labelFr: "Communauté",
  labelEn: "Community",
  href: "/discover",
};

// ── Paramètres · toujours en bas ──────────────────────────────────
const SETTINGS_SECTION: NavSectionDef = {
  key: "settings",
  labelFr: null,
  labelEn: null,
  items: [
    { key: "settings", Icon: IconSettings, labelFr: "Paramètres", labelEn: "Settings", href: "/settings" },
  ],
};

// ── FRANCHIR · projet, un but nommé (espresso) ────────────────────
const NAV_FRANCHIR: NavConfig = {
  spaceLabelFr: "Espace apprenant·e",
  spaceLabelEn: "Learner space",
  sections: [
    {
      key: "top",
      labelFr: null,
      labelEn: null,
      items: [
        { key: "home",     Icon: IconHome,  labelFr: "Accueil",       labelEn: "Home",     href: "/dashboard" },
        { key: "progress", Icon: IconChart, labelFr: "Ma progression",labelEn: "My progress", href: "/progress" },
      ],
    },
    {
      key: "apprendre",
      labelFr: "Apprendre",
      labelEn: "Learn",
      items: [
        { key: "lessons", Icon: IconBook,   labelFr: "Mes leçons",         labelEn: "My lessons",         href: "/courses" },
        { key: "class",   Icon: IconClasse, labelFr: "Ma classe",          labelEn: "My class",           href: "/classroom", needs: ["classroom"] },
        { key: "ecrits",  Icon: IconSpark,  labelFr: "Mes écrits corrigés",labelEn: "My reviewed writing",href: "/schreiben" },
        { key: "mocks",   Icon: IconChart,  labelFr: "Examens blancs",     labelEn: "Mock exams",         href: "/test-niveau", needs: ["franchir", "plan:paid"] },
      ],
    },
    {
      key: "sentrainer",
      labelFr: "S'entraîner",
      labelEn: "Practice",
      items: [
        { key: "veillee", Icon: IconMic,  labelFr: "La Veillée", labelEn: "The Veillée", href: "/hoeren" },
        { key: "quiz",    Icon: IconSpark,labelFr: "Quiz",       labelEn: "Quiz",        href: "/quiz" },
      ],
    },
    { key: "com", labelFr: null, labelEn: null, items: [COMMUNAUTE_ITEM] },
    SETTINGS_SECTION,
  ],
};

// ── GRANDIR · durée, la vraie vie (espresso, zéro urgence) ────────
const NAV_GRANDIR: NavConfig = {
  spaceLabelFr: "Espace apprenant·e",
  spaceLabelEn: "Learner space",
  sections: [
    {
      key: "top",
      labelFr: null,
      labelEn: null,
      items: [
        { key: "home",     Icon: IconHome,  labelFr: "Accueil",        labelEn: "Home",       href: "/dashboard" },
        { key: "progress", Icon: IconChart, labelFr: "Ma progression", labelEn: "My progress",href: "/progress" },
      ],
    },
    {
      key: "apprendre",
      labelFr: "Apprendre",
      labelEn: "Learn",
      items: [
        { key: "lessons",  Icon: IconBook,   labelFr: "Mes leçons",         labelEn: "My lessons",         href: "/courses" },
        { key: "class",    Icon: IconClasse, labelFr: "Ma classe",          labelEn: "My class",           href: "/classroom", needs: ["classroom"] },
        { key: "procedure",Icon: IconGroup,  labelFr: "Ma procédure",       labelEn: "My procedure",       href: "/settings", needs: ["grandir"] },
        { key: "ecrits",   Icon: IconSpark,  labelFr: "Mes écrits corrigés",labelEn: "My reviewed writing",href: "/schreiben" },
      ],
    },
    {
      key: "sentrainer",
      labelFr: "S'entraîner",
      labelEn: "Practice",
      items: [
        { key: "veillee", Icon: IconMic,   labelFr: "La Veillée", labelEn: "The Veillée", href: "/hoeren" },
        { key: "quiz",    Icon: IconSpark, labelFr: "Quiz",       labelEn: "Quiz",        href: "/quiz" },
      ],
    },
    { key: "com", labelFr: null, labelEn: null, items: [COMMUNAUTE_ITEM] },
    SETTINGS_SECTION,
  ],
};

// ── TRANSMETTRE · foyer, aucun mot d'école (TERRE) ────────────────
const NAV_TRANSMETTRE: NavConfig = {
  spaceLabelFr: "Espace transmission",
  spaceLabelEn: "Transmission space",
  sections: [
    {
      key: "top",
      labelFr: null,
      labelEn: null,
      items: [
        { key: "home",   Icon: IconHome,  labelFr: "Accueil",       labelEn: "Home",        href: "/dashboard" },
        { key: "rituel", Icon: IconSpark, labelFr: "Notre rituel",  labelEn: "Our ritual",  href: "/progress" },
      ],
    },
    {
      key: "ecouter",
      labelFr: "Écouter ensemble",
      labelEn: "Listen together",
      items: [
        { key: "contes",   Icon: IconMic,  labelFr: "Les contes",     labelEn: "The tales",  href: "/hoeren" },
        { key: "chansons", Icon: IconMic,  labelFr: "Les chansons",   labelEn: "The songs",  href: "/hoeren?type=songs" },
        { key: "jeux",     Icon: IconSpark,labelFr: "Jeux à deux",    labelEn: "Games for two", href: "/quiz" },
      ],
    },
    {
      key: "langue",
      labelFr: "Notre langue",
      labelEn: "Our language",
      items: [
        { key: "nosmots", Icon: IconBook,   labelFr: "Nos mots",         labelEn: "Our words",     href: "/schreiben" },
        { key: "voix",    Icon: IconContext,labelFr: "Les voix du pays", labelEn: "Voices of home",href: "/hoeren" },
      ],
    },
    { key: "com", labelFr: null, labelEn: null, items: [COMMUNAUTE_ITEM] },
    SETTINGS_SECTION,
  ],
};

// ── POUR MOI · sobre, sans pression (espresso) ────────────────────
const NAV_MOI: NavConfig = {
  spaceLabelFr: "Espace apprenant·e",
  spaceLabelEn: "Learner space",
  sections: [
    {
      key: "top",
      labelFr: null,
      labelEn: null,
      items: [
        { key: "home",     Icon: IconHome,  labelFr: "Accueil",        labelEn: "Home",        href: "/dashboard" },
        { key: "progress", Icon: IconChart, labelFr: "Ma progression", labelEn: "My progress", href: "/progress" },
      ],
    },
    {
      key: "apprendre",
      labelFr: "Apprendre",
      labelEn: "Learn",
      items: [
        { key: "lessons", Icon: IconBook,   labelFr: "Mes leçons", labelEn: "My lessons", href: "/courses" },
        { key: "class",   Icon: IconClasse, labelFr: "Ma classe",  labelEn: "My class",   href: "/classroom", needs: ["classroom"] },
      ],
    },
    {
      key: "sentrainer",
      labelFr: "S'entraîner",
      labelEn: "Practice",
      items: [
        { key: "veillee", Icon: IconMic,   labelFr: "La Veillée", labelEn: "The Veillée", href: "/hoeren" },
        { key: "quiz",    Icon: IconSpark, labelFr: "Quiz",       labelEn: "Quiz",        href: "/quiz" },
      ],
    },
    { key: "com", labelFr: null, labelEn: null, items: [COMMUNAUTE_ITEM] },
    SETTINGS_SECTION,
  ],
};

// ── Fallback (cap non posé) · minimum viable, invite à poser le cap ─
const NAV_DEFAULT: NavConfig = {
  spaceLabelFr: "Espace apprenant·e",
  spaceLabelEn: "Learner space",
  sections: [
    {
      key: "top",
      labelFr: null,
      labelEn: null,
      items: [
        { key: "home", Icon: IconHome, labelFr: "Accueil", labelEn: "Home", href: "/dashboard" },
      ],
    },
    {
      key: "apprendre",
      labelFr: "Apprendre",
      labelEn: "Learn",
      items: [
        { key: "lessons", Icon: IconBook, labelFr: "Mes leçons", labelEn: "My lessons", href: "/courses" },
      ],
    },
    { key: "com", labelFr: null, labelEn: null, items: [COMMUNAUTE_ITEM] },
    SETTINGS_SECTION,
  ],
};

export const NAV_BY_CAP: Record<Cap | "default", NavConfig> = {
  franchir: NAV_FRANCHIR,
  grandir: NAV_GRANDIR,
  transmettre: NAV_TRANSMETTRE,
  moi: NAV_MOI,
  default: NAV_DEFAULT,
};

// ── canAccess · filtre unique déclaratif ──────────────────────────

export interface AccessContext {
  cap: Cap | null;
  hasClassroom: boolean;
  paidPlan: boolean;
}

export function canAccess(item: NavItemDef, ctx: AccessContext): boolean {
  if (!item.needs?.length) return true;
  for (const need of item.needs) {
    if (need === "classroom" && !ctx.hasClassroom) return false;
    if (need === "plan:paid" && !ctx.paidPlan) return false;
    if (need === "franchir" && ctx.cap !== "franchir") return false;
    if (need === "grandir" && ctx.cap !== "grandir") return false;
    if (need === "transmettre" && ctx.cap !== "transmettre") return false;
    if (need === "moi" && ctx.cap !== "moi") return false;
  }
  return true;
}

export function getNavConfig(cap: Cap | null): NavConfig {
  return cap ? NAV_BY_CAP[cap] : NAV_BY_CAP.default;
}
