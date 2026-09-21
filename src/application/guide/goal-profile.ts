import { DOMAINS, type Domain } from "./domains";

export type ProfileLevel = "beginner" | "intermediate" | "advanced";
export type ProfileKind =
  | "career"
  | "academic"
  | "hobby"
  | "project"
  | "certification";
export type ProfileDepth = "practical" | "balanced" | "deep";
export type ProfileHandsOn = "low" | "moderate" | "high";

export interface GoalProfile {
  level: ProfileLevel;
  kind: ProfileKind;
  depth: ProfileDepth;
  domain: string;
  handsOn: ProfileHandsOn;
  hasTimeline: boolean;
}

function keywordMatches(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

function fallbackDomain(goal: string, domains: Domain[]): string {
  const lower = goal.toLowerCase();
  let best: Domain | null = null;
  let bestScore = 0;
  for (const domain of domains) {
    const score = domain.keywords.reduce(
      (total, keyword) => total + (keywordMatches(lower, keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = domain;
      bestScore = score;
    }
  }
  return bestScore > 0 ? (best as Domain).title : "";
}

export function profileGoal(goal: string): GoalProfile {
  return {
    level: "intermediate",
    kind: "career",
    depth: "balanced",
    domain: fallbackDomain(goal, DOMAINS),
    handsOn: "moderate",
    hasTimeline: false,
  };
}
