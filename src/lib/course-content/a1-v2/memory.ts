import type { A1Card, A1LessonV2 } from "@/content/monde-a1-v2/types";

export type A1MemoryRow = {
  itemId: string;
  itemKind: string;
  intervalIndex: number;
  nextDueAt: Date | null;
  failureStreak: number;
  lastResult: boolean | null;
};

const DAY_MS = 86_400_000;

export function nextCardMemory(
  card: A1Card,
  current: A1MemoryRow | null,
  correct: boolean,
  now = new Date(),
) {
  if (!correct) {
    return {
      intervalIndex: 0,
      nextDueAt: now,
      failureStreak: (current?.failureStreak ?? 0) + 1,
      lastResult: false,
      lastSeenAt: now,
    };
  }

  const currentIndex = Math.max(0, Math.min(current?.intervalIndex ?? 0, card.srs.intervals.length - 1));
  const days = card.srs.intervals[currentIndex] ?? 1;
  return {
    intervalIndex: Math.min(currentIndex + 1, card.srs.intervals.length - 1),
    nextDueAt: new Date(now.getTime() + days * DAY_MS),
    failureStreak: 0,
    lastResult: true,
    lastSeenAt: now,
  };
}

export function nextObjectiveMemory(
  current: A1MemoryRow | null,
  correct: boolean,
  now = new Date(),
) {
  return {
    intervalIndex: 0,
    nextDueAt: null,
    failureStreak: correct ? 0 : (current?.failureStreak ?? 0) + 1,
    lastResult: correct,
    lastSeenAt: now,
  };
}

export function shouldTriggerRemediation(
  failureStreak: number,
  remediationRef?: string,
): boolean {
  return Boolean(remediationRef) && failureStreak >= 2;
}

export function selectWakeCards({
  lesson,
  cards,
  states,
  now = new Date(),
}: {
  lesson: A1LessonV2;
  cards: A1Card[];
  states: A1MemoryRow[];
  now?: Date;
}): A1Card[] {
  const count = lesson.reveil.itemCount ?? lesson.reveil.cardIds.length;
  if (count <= 0) return [];

  const stateById = new Map(states.filter((row) => row.itemKind === "CARD").map((row) => [row.itemId, row]));
  const configured = new Set(lesson.reveil.cardIds);
  const candidates = cards.filter((card) => configured.has(card.id) || stateById.has(card.id));

  return candidates
    .map((card) => {
      const state = stateById.get(card.id) ?? null;
      const due = !state?.nextDueAt || state.nextDueAt.getTime() <= now.getTime();
      const configuredPriority = configured.has(card.id) ? 1 : 0;
      return { card, state, due, configuredPriority };
    })
    .filter((item) => item.due || item.configuredPriority > 0)
    .sort((a, b) => {
      const missA = a.state?.failureStreak ?? 0;
      const missB = b.state?.failureStreak ?? 0;
      if (missA !== missB) return missB - missA;
      if (a.due !== b.due) return Number(b.due) - Number(a.due);
      if (a.configuredPriority !== b.configuredPriority) return b.configuredPriority - a.configuredPriority;
      const dueA = a.state?.nextDueAt?.getTime() ?? 0;
      const dueB = b.state?.nextDueAt?.getTime() ?? 0;
      return dueA - dueB;
    })
    .slice(0, count)
    .map((item) => item.card);
}
