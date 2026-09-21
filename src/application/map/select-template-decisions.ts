import type { DecisionProvider } from "../../providers/decision-provider";
import type { MapTemplate } from "./map-templates";

function keywordMatches(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

/** Deterministic keyword matcher, used when no AI provider is configured. */
export function selectTemplateByKeywords(
  goal: string,
  templates: MapTemplate[],
): MapTemplate | null {
  const lower = goal.toLowerCase();
  let best: MapTemplate | null = null;
  let bestScore = 0;
  for (const template of templates) {
    const score = template.keywords.reduce(
      (total, keyword) => total + (keywordMatches(lower, keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = template;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

const OTHER = "other";

function templateCriteria(templates: MapTemplate[]): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const template of templates) {
    criteria[template.id] = template.root.title;
  }
  criteria[OTHER] = "None of the above — build a custom scaffold";
  return criteria;
}

/** Selects a template with Jev via a single choice judgment over known domains. */
export async function selectTemplateWithProvider(
  provider: DecisionProvider,
  goal: string,
  templates: MapTemplate[],
): Promise<MapTemplate | null> {
  const answers = await provider.evaluate(goal, [
    {
      id: "domain",
      type: "choice",
      instructions:
        "Which learning domain does this goal belong to? Choose the closest match, or `other` if none fit.",
      criteria: templateCriteria(templates),
    },
  ]);

  const answer = answers.domain;
  if (!answer || answer.type !== "choice") return null;
  if (answer.choice === OTHER) return null;
  return templates.find((template) => template.id === answer.choice) ?? null;
}

export async function selectTemplate(
  provider: DecisionProvider | undefined,
  goal: string,
  templates: MapTemplate[],
): Promise<MapTemplate | null> {
  if (!provider || provider.id === "mock") {
    return selectTemplateByKeywords(goal, templates);
  }
  return selectTemplateWithProvider(provider, goal, templates);
}
