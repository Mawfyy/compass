import type { StudyGuide } from "@/domain/guide/schemas";

export const HISTORY_KEY = "compass:guide-history";
export const HISTORY_LIMIT = 10;

export interface HistoryEntry {
  goal: string;
  guide: StudyGuide;
  createdAt: number;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota/private-mode errors
  }
}

export function findHistoryByGoal(goal: string): HistoryEntry | undefined {
  const target = goal.trim().toLowerCase();
  if (!target) return undefined;
  return loadHistory().find((e) => e.goal.trim().toLowerCase() === target);
}