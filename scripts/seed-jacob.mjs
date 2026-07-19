// scripts/seed-jacob.mjs — Sprint « Le Foyer » étape 3.
// Crée un compte de test Jacob avec DES VRAIES DONNÉES en base pour
// que le foyer se remplisse comme en production :
//   · allemand B1, cap Franchir (par défaut, changeable via set-cap.mjs)
//   · 12 jours de braise (12 modules complétés sur 12 jours consécutifs)
//   · une classe active (« Deutsch B1 · Groupe du soir » · prof Marie K.)
//   · 3 écrits corrigés (assignments soumis + score)
//   · supportedLanguages = ["deutsch", "bassa"] pour tester la bascule
//     de langue (world ↔ sources) sur le foyer.
//
// Usage
//   node scripts/seed-jacob.mjs           # crée ou met à jour le compte
//   node scripts/seed-jacob.mjs --reset   # supprime puis recrée
//
// Requiert dans .env.local :
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Env loader (basique, évite dépendance dotenv) ────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
      }
    }
  } catch {
    // .env.local absent — on suppose que les vars sont déjà en env
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[seed-jacob] Missing SUPABASE env vars. Aborting.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = new PrismaClient();

// ── Jacob's identity ────────────────────────────────────────────
const JACOB = {
  email: "jacob@yema.test",
  password: "JacobFoyer-2026!",
  fullName: "Jacob Ateba",
  germanLevel: "B1",
  cap: "franchir",
  personalGoal:
    "Je vise l'entretien d'ambassade en septembre. Je veux répondre sans trembler.",
  activeLanguage: "deutsch",
  supportedLanguages: ["deutsch", "bassa"],
};

const TEACHER = {
  email: "marie.k@yema.test",
  password: "MarieProf-2026!",
  fullName: "Marie Kamdem",
  bio: "Prof d'allemand · B1 → C1 · préparation aux entretiens.",
};

const CLASSROOM_NAME = "Deutsch B1 · Groupe du soir";
const CLASSROOM_CODE = "DE-B1-SOIR-2026";

// ── Reset ────────────────────────────────────────────────────────
async function resetJacob() {
  console.log("[seed-jacob] --reset : suppression du compte Jacob…");
  const existing = await prisma.user.findUnique({ where: { email: JACOB.email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log("  · Prisma User supprimé");
  }
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const match = list?.users?.find((u) => u.email === JACOB.email);
  if (match) {
    await admin.auth.admin.deleteUser(match.id);
    console.log("  · Supabase auth user supprimé");
  }
}

// ── Ensure Supabase auth user, return id ─────────────────────────
async function ensureAuthUser(email, password, metadata = {}) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      user_metadata: { ...(existing.user_metadata ?? {}), ...metadata },
      password,
    });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return data.user.id;
}

// ── Main ─────────────────────────────────────────────────────────
async function run() {
  if (process.argv.includes("--reset")) {
    await resetJacob();
  }

  console.log("[seed-jacob] création du compte enseignant…");
  const teacherSbId = await ensureAuthUser(TEACHER.email, TEACHER.password, {
    fullName: TEACHER.fullName,
    activeSpace: "TEACHER",
  });
  const teacherUser = await prisma.user.upsert({
    where: { supabaseId: teacherSbId },
    create: {
      supabaseId: teacherSbId,
      email: TEACHER.email,
      fullName: TEACHER.fullName,
      role: "TEACHER",
      isValidated: true,
      onboardingDone: true,
      germanLevel: "C1",
    },
    update: { fullName: TEACHER.fullName, role: "TEACHER" },
  });
  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    create: {
      userId: teacherUser.id,
      bio: TEACHER.bio,
      speciality: ["B1", "B2"],
      languages: ["deutsch"],
      yearsExp: 9,
      isVerified: true,
    },
    update: { bio: TEACHER.bio, isVerified: true },
  });

  console.log("[seed-jacob] création du compte Jacob…");
  const jacobSbId = await ensureAuthUser(JACOB.email, JACOB.password, {
    fullName: JACOB.fullName,
    cap: JACOB.cap,
    personalGoal: JACOB.personalGoal,
    activeLanguage: JACOB.activeLanguage,
    supportedLanguages: JACOB.supportedLanguages,
  });
  const jacob = await prisma.user.upsert({
    where: { supabaseId: jacobSbId },
    create: {
      supabaseId: jacobSbId,
      email: JACOB.email,
      fullName: JACOB.fullName,
      role: "STUDENT",
      germanLevel: JACOB.germanLevel,
      onboardingDone: true,
      isValidated: true,
      city: "Douala",
      country: "CM",
    },
    update: {
      fullName: JACOB.fullName,
      germanLevel: JACOB.germanLevel,
      role: "STUDENT",
    },
  });

  // ── Classroom ──────────────────────────────────────────────────
  console.log("[seed-jacob] création de la classe + inscription…");
  const classroom = await prisma.classroom.upsert({
    where: { code: CLASSROOM_CODE },
    create: {
      name: CLASSROOM_NAME,
      description: "Prépa B1 · rythme soir · petits groupes.",
      teacherId: teacher.id,
      level: "B1",
      code: CLASSROOM_CODE,
      isActive: true,
    },
    update: { name: CLASSROOM_NAME, isActive: true },
  });
  await prisma.classroomEnrollment.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: jacob.id } },
    create: { classroomId: classroom.id, userId: jacob.id, isActive: true },
    update: { isActive: true },
  });

  // ── Braise · 12 modules complétés sur 12 jours consécutifs ─────
  console.log("[seed-jacob] génération de 12 jours de braise…");
  const modules = await prisma.module.findMany({
    where: { isPublished: true, course: { level: "B1" } },
    take: 12,
    orderBy: [{ course: { level: "asc" } }, { sortOrder: "asc" }],
  });
  const fallback = modules.length < 12
    ? await prisma.module.findMany({
        where: { isPublished: true },
        take: 12 - modules.length,
        orderBy: [{ course: { level: "asc" } }, { sortOrder: "asc" }],
      })
    : [];
  const allModules = [...modules, ...fallback].slice(0, 12);
  if (allModules.length < 12) {
    console.warn(
      `  · ${allModules.length}/12 modules publiés disponibles — la braise sera partielle.`,
    );
  }
  const today = new Date();
  today.setHours(20, 30, 0, 0);
  for (let i = 0; i < allModules.length; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const mod = allModules[i];
    await prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId: jacob.id, moduleId: mod.id } },
      create: {
        userId: jacob.id,
        moduleId: mod.id,
        status: "COMPLETED",
        completedAt: day,
        score: 0.7 + Math.random() * 0.25,
      },
      update: { status: "COMPLETED", completedAt: day },
    });
  }
  console.log(`  · ${allModules.length} module(s) marqués COMPLETED`);

  // ── 3 écrits corrigés (Assignment + AssignmentSubmission) ─────
  console.log("[seed-jacob] génération de 3 écrits corrigés…");
  const ecritsSpec = [
    { title: "Lettre de motivation universitaire", score: 82, feedback: "Structure claire. Attention aux subordonnées avec « weil »." },
    { title: "Courriel à l'ambassade — rendez-vous", score: 88, feedback: "Ton juste. Une ou deux formules trop directes à adoucir." },
    { title: "Récit d'une décision qui vous a marqué", score: 76, feedback: "Vocabulaire riche. Le prétérit reste hésitant, à retravailler." },
  ];
  for (const spec of ecritsSpec) {
    const assignment = await prisma.assignment.upsert({
      where: { id: `seed-jacob-${spec.title.slice(0, 20).replace(/\s+/g, "-")}` },
      create: {
        id: `seed-jacob-${spec.title.slice(0, 20).replace(/\s+/g, "-")}`,
        classroomId: classroom.id,
        title: spec.title,
        description: "Écrit noté par Marie Kamdem · retour dans la semaine.",
        maxScore: 100,
      },
      update: { title: spec.title },
    });
    await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_userId: { assignmentId: assignment.id, userId: jacob.id },
      },
      create: {
        assignmentId: assignment.id,
        userId: jacob.id,
        score: spec.score,
        feedback: spec.feedback,
      },
      update: { score: spec.score, feedback: spec.feedback },
    });
  }
  console.log("  · 3 écrits corrigés créés");

  console.log("\n[seed-jacob] ✔ terminé.");
  console.log(`  Email    : ${JACOB.email}`);
  console.log(`  Password : ${JACOB.password}`);
  console.log(`  Cap      : ${JACOB.cap}  (change via set-cap.mjs)`);
  console.log(`  Langue   : ${JACOB.activeLanguage} (bascule via /api/language/switch)`);
  console.log(`  Classe   : ${CLASSROOM_NAME} · code ${CLASSROOM_CODE}`);
  console.log(`  Braise   : ${allModules.length} jours consécutifs`);

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error("[seed-jacob] erreur :", e);
  await prisma.$disconnect();
  process.exit(1);
});
