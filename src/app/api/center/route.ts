// P4.3a hardening · Endpoint legacy déprécié.
//
// Cette route acceptait un `centerId` client comme source d'autorité (query,
// body, header) ainsi qu'une projection large (enseignants + classrooms +
// enrollments imbriqués). Elle est remplacée par les endpoints scopés
// `/api/center/{me,dashboard,teachers,classes,students,enrollments}` qui
// résolvent le centre via `resolveCenterActor()` côté serveur.
//
// Aucun client interne n'utilise plus cette route (grep exhaustif · voir
// docs/YEMA_P4_3A_CENTER_REAL_DATA.md §12). On répond 404 stable pour tout
// verbe et tout scénario · aucun oracle sur l'existence des tenants, aucun
// leak cross-center possible.

import { NextResponse } from "next/server";

function deprecated() {
  return NextResponse.json(
    { error: "Not found", code: "center_endpoint_deprecated" },
    { status: 404 },
  );
}

export async function GET() { return deprecated(); }
export async function POST() { return deprecated(); }
export async function PUT() { return deprecated(); }
export async function PATCH() { return deprecated(); }
export async function DELETE() { return deprecated(); }
