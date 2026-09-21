import type { DecisionProvider } from "../../providers/decision-provider";
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
  source: "jev" | "fallback";
}

const LEVELS: ProfileLevel[] = ["beginner", "intermediate", "advanced"];
const KINDS: ProfileKind[] = [
  "career",
  "academic",
  "hobby",
  "project",
  "certification",
];
const DEPTHS: ProfileDepth[] = ["practical", "balanced", "deep"];
const OTHER = "other";

function keywordMatches(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

function domainCriteria(domains: Domain[]): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const domain of domains) {
    criteria[domain.id] = domain.title;
  }
  criteria[OTHER] = "None of the above";
  return criteria;
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

function isLevel(value: string): value is ProfileLevel {
  return (LEVELS as string[]).includes(value);
}

function isKind(value: string): value is ProfileKind {
  return (KINDS as string[]).includes(value);
}

function isDepth(value: string): value is ProfileDepth {
  return (DEPTHS as string[]).includes(value);
}

export function fallbackProfile(goal: string): GoalProfile {
  return {
    level: "intermediate",
    kind: "career",
    depth: "balanced",
    domain: fallbackDomain(goal, DOMAINS),
    handsOn: "moderate",
    hasTimeline: false,
    source: "fallback",
  };
}

/**
 * Classifies a learner's goal across a handful of semantic dimensions using a
 * single parallel Jev judgment, so downstream generation (guide, and later
 * maps) can tailor its output. Falls back to deterministic defaults when no
 * provider is configured or the provider call fails.
 */
export async function profileGoal(
  provider: DecisionProvider | undefined,
  goal: string,
): Promise<GoalProfile> {
  if (!provider || provider.id === "mock") {
    return fallbackProfile(goal);
  }

  try {
    const answers = await provider.evaluate(goal, [
      {
        id: "level",
        type: "choice",
        instructions:
          "What is the learner's current proficiency level for this goal?",
        criteria: {
          beginner: "New to the subject with little or no prior exposure",
          intermediate: "Some prior experience, familiar with the basics",
          advanced: "Solid existing knowledge, aiming to specialize or master",
        },
      },
      {
        id: "kind",
        type: "choice",
        instructions:
          "What kind of goal is this? Choose the closest motivation or outcome.",
        criteria: {
          career: "Advance a career or land a specific role",
          academic: "Succeed in school, university, or research",
          hobby: "Personal interest or enjoyment",
          project: "Build or ship a specific concrete thing",
          certification: "Pass an exam or earn a credential",
        },
      },
      {
        id: "depth",
        type: "choice",
        instructions: "How deep should the learning go?",
        criteria: {
          practical: "Enough to apply it usefully right away",
          balanced: "Strong theory plus practical application",
          deep: "Mastery and underlying first principles",
        },
      },
      {
        id: "domain",
        type: "choice",
        instructions:
          "Which learning domain does this goal belong to? Choose the closest match, or `other` if none fit.",
        criteria: domainCriteria(DOMAINS),
      },
      {
        id: "handsOn",
        type: "score",
        instructions:
          "How hands-on is this goal, i.e. how much does it favor building and doing over reading and theory?",
        criteria: [
          "Mostly reading and theory; little building",
          "A mix of reading and applied building",
          "Primarily hands-on building and doing",
        ],
      },
      {
        id: "hasTimeline",
        type: "noul",
        instructions:
          "Does the learner's goal imply a specific time frame or deadline (e.g. by next month, in 3 months)?",
        criteria: {
          yes: "A concrete deadline or time box is implied",
          no: "No time constraint is implied",
        },
      },
    ]);

    const levelAnswer = answers.level;
    const kindAnswer = answers.kind;
    const depthAnswer = answers.depth;
    const domainAnswer = answers.domain;
    const handsOnAnswer = answers.handsOn;
    const timelineAnswer = answers.hasTimeline;

    const level =
      levelAnswer?.type === "choice" && isLevel(levelAnswer.choice)
        ? levelAnswer.choice
        : "intermediate";
    const kind =
      kindAnswer?.type === "choice" && isKind(kindAnswer.choice)
        ? kindAnswer.choice
        : "career";
    const depth =
      depthAnswer?.type === "choice" && isDepth(depthAnswer.choice)
        ? depthAnswer.choice
        : "balanced";

    let domain = fallbackDomain(goal, DOMAINS);
    if (
      domainAnswer?.type === "choice" &&
      domainAnswer.choice !== OTHER &&
      domainAnswer.choice
    ) {
      const match = DOMAINS.find(
        (domain) => domain.id === domainAnswer.choice,
      );
      if (match) domain = match.title;
    }

    let handsOn: ProfileHandsOn = "moderate";
    if (handsOnAnswer?.type === "score") {
      if (handsOnAnswer.score < 0.75) handsOn = "low";
      else if (handsOnAnswer.score <= 1.5) handsOn = "moderate";
      else handsOn = "high";
    }

    const hasTimeline =
      timelineAnswer?.type === "noul" ? timelineAnswer.noul >= 0.5 : false;

    return {
      level,
      kind,
      depth,
      domain,
      handsOn,
      hasTimeline,
      source: "jev",
    };
  } catch {
    return fallbackProfile(goal);
  }
}