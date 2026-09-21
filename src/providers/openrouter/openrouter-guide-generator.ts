import type { GuideGenerator } from "../guide-generator";
import type { GoalProfile } from "../../application/guide/goal-profile";
import { guideSchema, type StudyGuide } from "../../domain/guide/schemas";

export interface OpenRouterGuideConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  /** Custom transport, used by tests to stub the OpenRouter API. */
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "google/gemini-3.8-flash";
const DEFAULT_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `You are an expert study-guide writer. Given a learner's goal, produce a single, well-structured study guide as a JSON object.

Respond with exactly this shape (no other keys):
{
  "intro": "a short 1-2 sentence paragraph framing the goal",
  "prerequisites": "a one-line note on what the learner should already know (omit if none)",
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase 1: <specific name, not filler>",
      "duration": "~N weeks",
      "body": "Markdown. Key topics (bullets) and concrete activities. Label each resource/activity with its kind in brackets: [Course], [Reading], [Exercise], [Case Study], [Certification]. Give real, specific names."
    }
  ],
  "milestones": "A short Markdown list of 2-3 checkpoints."
}

Requirements:
- 3-6 phases, ordered from foundations to mastery.
- Each phase "body" is Markdown: bullets for topics, and concrete activities with [Kind] labels and real, specific resource names.
- "milestones" is Markdown: a 2-3 item list of concrete checkpoints.
- Never invent URLs, prices, or completion certificates. Never use filler titles like "Core concepts" or "Fundamentals".

When the user message includes a learner profile, use it to tailor the guide:
- Scale the starting point and topic difficulty to the learner's "level".
- Order and emphasize phases according to "depth": practical guides front-load doing; deep guides front-load theory and fundamentals.
- Adjust the resource mix to match "hands-on emphasis" (more [Exercise]/[Project] when high, more [Reading]/[Course] when low).
- When a timeline is implied ("Has timeline: yes"), add time pacing to phase durations and milestones.
- Treat "kind" and "domain" as context for concrete resource and milestone choices.

Be concrete, specific, and practical. Use the learner's level of prior knowledge when stated.`;

function buildUserMessage(goal: string, profile?: GoalProfile): string {
  if (!profile) return goal;
  const lines = [
    `Goal: ${goal}`,
    `Level: ${profile.level}`,
    `Kind: ${profile.kind}`,
    `Depth: ${profile.depth}`,
    `Domain: ${profile.domain || "unspecified"}`,
    `Hands-on emphasis: ${profile.handsOn}`,
    `Has timeline: ${profile.hasTimeline ? "yes" : "no"}`,
  ];
  return lines.join("\n");
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const parsed: unknown = JSON.parse(fenced?.[1] ?? trimmed);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("OpenRouter output was not a JSON object");
  }
  return parsed as Record<string, unknown>;
}

/**
 * Generative study-guide provider backed by OpenRouter. Asks a generative LLM
 * for a structured JSON guide and validates it against the guide schema.
 */
export class OpenRouterGuideGenerator implements GuideGenerator {
  readonly id = "openrouter";
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: (input: string, init?: RequestInit) => Promise<Response>;

  constructor(config: OpenRouterGuideConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetch ?? ((input, init) => fetch(input, init));
  }

  async generate(goal: string, profile?: GoalProfile): Promise<StudyGuide> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserMessage(goal, profile) },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 500)}`);
      }

      const data = (await response.json()) as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        throw new Error("OpenRouter returned no content");
      }

      const parsed = parseJsonObject(content);
      const result = guideSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`OpenRouter guide invalid: ${JSON.stringify(result.error.issues)}`);
      }
      return result.data;
    } finally {
      clearTimeout(timer);
    }
  }
}