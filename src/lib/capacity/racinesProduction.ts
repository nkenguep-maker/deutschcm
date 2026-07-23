// P4.5-A · Quotas Racines par ChildProfile (§3, §6 doctrine).
//
// Doctrine · le quota est calculé PAR profil enfant, pas par Circle, car un
// enfant peut appartenir à plusieurs Circles (langue distincte). Les
// semaines et mois sont **UTC calendaires** · aucun calcul depuis le
// fuseau navigateur.
//
//   maximum 8 productions assignées par mois par profil
//   maximum 2 productions assignées par semaine par profil
//   oral · maximum 3 minutes (180 s)
//   écrit · maximum 250 mots
//
// Un `CircleAssignment` cible soit tout le Circle (via memberships CHILD
// ACTIVE), soit une sélection via `CircleAssignmentTarget`. Chaque cible
// compte comme une production planifiée pour le profil ciblé.
//
// Ces helpers doivent être appelés DANS une transaction (Serializable + lock
// applicatif) pour garantir l'idempotence sous concurrence · deux
// publications simultanées ne peuvent pas dépasser 2/semaine ni 8/mois.

import type { PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export const MAX_ROOTS_PRODUCTIONS_PER_WEEK = 2;
export const MAX_ROOTS_PRODUCTIONS_PER_MONTH = 8;
export const MAX_ROOTS_WRITTEN_WORDS = 250;
export const MAX_ROOTS_AUDIO_SECONDS = 180;

export type CapacityDimension = "weekly" | "monthly";

export class RootsProductionCapacityError extends Error {
  constructor(
    public readonly code:
      | "roots_weekly_production_limit_reached"
      | "roots_monthly_production_limit_reached",
    message: string,
    public readonly detail: {
      dimension: CapacityDimension;
      limit: number;
      attemptedCount: number;
      childProfileId: string;
      windowStartUtc: string;
      windowEndUtc: string;
    },
  ) {
    super(message);
    this.name = "RootsProductionCapacityError";
  }
}

export class RootsProductionFormatError extends Error {
  constructor(
    public readonly code:
      | "written_production_too_long"
      | "audio_production_too_long"
      | "invalid_production_format",
    message: string,
    public readonly detail?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RootsProductionFormatError";
  }
}

/**
 * Retourne le début (inclusif) et la fin (exclusif) de la semaine ISO
 * calendaire (lundi 00:00 UTC → lundi suivant 00:00 UTC) contenant `at`.
 * Convention UTC · pas de dépendance au fuseau navigateur.
 */
export function isoWeekBoundsUtc(at: Date): { start: Date; end: Date } {
  const d = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  const day = d.getUTCDay();
  // Lundi = 1 · dimanche = 0. On veut décaler vers le lundi précédent.
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - daysSinceMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

/**
 * Retourne le début et la fin du mois calendaire UTC contenant `at`.
 * Convention UTC · le 1er du mois 00:00 UTC → 1er du mois suivant 00:00 UTC.
 */
export function utcMonthBounds(at: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
  const end = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));
  return { start, end };
}

/**
 * Compte le nombre de productions PLANIFIÉES (assignments publiés) qui
 * ciblent ce profil enfant dans la fenêtre `[from, to)`. Une production
 * ciblée = row `circle_assignment_targets` OU aucun target (cible tout le
 * Circle · le profil est CHILD ACTIVE du Circle).
 *
 * Fenêtre glissante · on considère `publishedAt` du CircleAssignment (les
 * DRAFT ne comptent pas encore vers le quota).
 */
async function countPlannedProductionsForChild(
  tx: TxClient,
  childProfileId: string,
  from: Date,
  to: Date,
): Promise<number> {
  // Circles où l'enfant est CHILD ACTIVE.
  const memberships = await tx.circleMembership.findMany({
    where: {
      childProfileId,
      role: "CHILD",
      status: "ACTIVE",
    },
    select: { circleId: true },
  });
  const circleIds = memberships.map((m) => m.circleId);
  if (circleIds.length === 0) return 0;

  // Assignments publiés dans la fenêtre, sur ces Circles.
  const assignments = await tx.circleAssignment.findMany({
    where: {
      circleId: { in: circleIds },
      status: "PUBLISHED",
      publishedAt: { gte: from, lt: to },
    },
    select: { id: true, targets: { select: { childProfileId: true } } },
  });

  let count = 0;
  for (const a of assignments) {
    if (a.targets.length === 0) {
      // Cible tout le Circle · l'enfant est ACTIVE → +1.
      count += 1;
    } else if (a.targets.some((t) => t.childProfileId === childProfileId)) {
      count += 1;
    }
  }
  return count;
}

export async function assertRootsAssignmentWeeklyCapacity(
  tx: TxClient,
  input: { childProfileId: string; at?: Date },
): Promise<void> {
  const at = input.at ?? new Date();
  const { start, end } = isoWeekBoundsUtc(at);
  const current = await countPlannedProductionsForChild(tx, input.childProfileId, start, end);
  if (current >= MAX_ROOTS_PRODUCTIONS_PER_WEEK) {
    throw new RootsProductionCapacityError(
      "roots_weekly_production_limit_reached",
      "weekly production limit reached for this child profile",
      {
        dimension: "weekly",
        limit: MAX_ROOTS_PRODUCTIONS_PER_WEEK,
        attemptedCount: current + 1,
        childProfileId: input.childProfileId,
        windowStartUtc: start.toISOString(),
        windowEndUtc: end.toISOString(),
      },
    );
  }
}

export async function assertRootsAssignmentMonthlyCapacity(
  tx: TxClient,
  input: { childProfileId: string; at?: Date },
): Promise<void> {
  const at = input.at ?? new Date();
  const { start, end } = utcMonthBounds(at);
  const current = await countPlannedProductionsForChild(tx, input.childProfileId, start, end);
  if (current >= MAX_ROOTS_PRODUCTIONS_PER_MONTH) {
    throw new RootsProductionCapacityError(
      "roots_monthly_production_limit_reached",
      "monthly production limit reached for this child profile",
      {
        dimension: "monthly",
        limit: MAX_ROOTS_PRODUCTIONS_PER_MONTH,
        attemptedCount: current + 1,
        childProfileId: input.childProfileId,
        windowStartUtc: start.toISOString(),
        windowEndUtc: end.toISOString(),
      },
    );
  }
}

/**
 * Compte les mots d'un texte selon la convention `split(/\s+/)` (espaces
 * blancs Unicode). Retourne 0 pour une chaîne vide. Un mot = une séquence
 * non-vide entre séparateurs.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/u).length;
}

export interface SubmissionFormatInput {
  productionType: "WRITTEN" | "AUDIO" | "MIXED";
  writtenContent?: string | null;
  audioDurationSeconds?: number | null;
}

/**
 * Valide format d'une submission selon le `productionType` attendu.
 *
 * - WRITTEN · writtenContent obligatoire, ≤ 250 mots, pas d'audio.
 * - AUDIO · audioDurationSeconds obligatoire, ≤ 180 s, pas d'écrit.
 * - MIXED · les deux acceptés, chacun respecte sa limite s'il est fourni,
 *   au moins un des deux doit être présent.
 */
export function assertRootsSubmissionFormat(input: SubmissionFormatInput): void {
  const written = input.writtenContent ?? "";
  const audio = input.audioDurationSeconds ?? null;
  const hasWritten = written.trim().length > 0;
  const hasAudio = typeof audio === "number" && audio > 0;

  switch (input.productionType) {
    case "WRITTEN":
      if (!hasWritten) {
        throw new RootsProductionFormatError(
          "invalid_production_format",
          "written production requires writtenContent",
          { productionType: "WRITTEN" },
        );
      }
      if (hasAudio) {
        throw new RootsProductionFormatError(
          "invalid_production_format",
          "written production cannot include audio",
          { productionType: "WRITTEN" },
        );
      }
      break;
    case "AUDIO":
      if (!hasAudio) {
        throw new RootsProductionFormatError(
          "invalid_production_format",
          "audio production requires audioDurationSeconds",
          { productionType: "AUDIO" },
        );
      }
      if (hasWritten) {
        throw new RootsProductionFormatError(
          "invalid_production_format",
          "audio production cannot include written content",
          { productionType: "AUDIO" },
        );
      }
      break;
    case "MIXED":
      if (!hasWritten && !hasAudio) {
        throw new RootsProductionFormatError(
          "invalid_production_format",
          "mixed production requires at least written or audio content",
          { productionType: "MIXED" },
        );
      }
      break;
  }

  if (hasWritten) {
    const words = countWords(written);
    if (words > MAX_ROOTS_WRITTEN_WORDS) {
      throw new RootsProductionFormatError(
        "written_production_too_long",
        `written production exceeds ${MAX_ROOTS_WRITTEN_WORDS} words`,
        { limit: MAX_ROOTS_WRITTEN_WORDS, attemptedCount: words },
      );
    }
  }
  if (hasAudio && audio !== null && audio > MAX_ROOTS_AUDIO_SECONDS) {
    throw new RootsProductionFormatError(
      "audio_production_too_long",
      `audio production exceeds ${MAX_ROOTS_AUDIO_SECONDS} seconds`,
      { limit: MAX_ROOTS_AUDIO_SECONDS, attemptedCount: audio },
    );
  }
}
