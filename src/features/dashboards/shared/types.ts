import type { ReactNode } from "react";

export type YemaUniverse = "monde" | "racines" | "neutral";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
};

export type NavGroup = {
  key: string;
  label?: string;
  items: NavItem[];
};

export type PersonaId =
  | "super_admin"
  | "teacher"
  | "coach_racines"
  | "center_admin"
  | "student_monde"
  | "student_racines"
  | "child_monde"
  | "child_racines";

export type StatusTone =
  | "neutral"
  | "gold"
  | "success"
  | "alert"
  | "muted";
