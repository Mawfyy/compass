import { MAP_NODE_TYPES } from "../../domain/map/enums";
import { createLearningMap } from "../../domain/map/learning-map";
import type { LearningGoal, LearningMap } from "../../domain/map/learning-map";
import { mapNodeSchema } from "../../domain/map/schemas";
import type { GenerateMapRequest } from "../../domain/map/schemas";
import type { MapGenerator } from "../map-generator";

export interface OpenRouterConfig {
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

const SYSTEM_PROMPT = `You are an expert curriculum designer. Produce a concise learning map as a single JSON object with one "root" key whose value is the root "goal" node.

Structure:
- 1 root "goal" node
- 3 "area" children
- Each area: 2-3 "topic" children
- Each topic: 2-3 leaf children (subtopic/skill/concept/tool)
- 1 "project" node under the goal (concrete task, not vague)

Leaf node "type" should match what the learner actually does:
- "course" = a formal, structured course to complete
- "reading" = a specific book, paper, or text to study
- "exercise" = hands-on drills, practice problems, or katas
- "case-study" = a real-world example to analyze
- "certification" = an exam or credential worth earning
- "skill"/"concept"/"tool"/"subtopic" = a unit of knowledge or capability

Every node has: id (kebab-case, unique), type, title, purpose (1 sentence), difficulty (Beginner/Intermediate/Advanced).

On "topic" nodes, include a "resources" array with 1-2 real, named sources (a specific course, book, tutorial, or docs). Each resource has: title (real name), type ("book"/"course"/"video"/"tutorial"/"documentation"/"paper"/"exercise"/"lecture"/"project"), and why (one line on how it helps). Never invent URLs.

Be concrete. Never use filler like "Core concepts", "Fundamentals", "Introduction". Name actual ideas.`;

const VALID_NODE_TYPES = new Set<string>(MAP_NODE_TYPES);

function normalizeNodeTypes(node: Record<string, unknown>): void {
  if (typeof node.type === "string" && !VALID_NODE_TYPES.has(node.type)) {
    node.type = "concept";
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === "object" && child !== null) {
        normalizeNodeTypes(child as Record<string, unknown>);
      }
    }
  }
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
 * Generative map provider backed by OpenRouter. Asks a generative LLM to
 * produce a full learning-map node tree, validates it against the domain
 * schema, and throws on any failure so the caller can fall back gracefully.
 */
export class OpenRouterMapGenerator implements MapGenerator {
  readonly id = "openrouter";
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: (input: string, init?: RequestInit) => Promise<Response>;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetch ?? ((input, init) => fetch(input, init));
  }

  async generate(request: GenerateMapRequest): Promise<LearningMap> {
    const content = await this.requestMapJson(request);
    const root = this.validateRoot(content);

    const goal: LearningGoal = {
      prompt: request.goal.trim(),
      level: request.level,
      goalKind: request.goalKind,
      depth: request.depth,
      hoursPerWeek: request.hoursPerWeek,
    };

    return createLearningMap({ goal, root });
  }

  private async requestMapJson(request: GenerateMapRequest): Promise<string> {
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
            {
              role: "user",
              content: `Goal: ${request.goal}\nLevel: ${request.level}\nKind: ${request.goalKind}\nDepth: ${request.depth}\nHours/week: ${request.hoursPerWeek}`,
            },
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
      return content;
    } finally {
      clearTimeout(timer);
    }
  }

  private validateRoot(content: string) {
    const parsed = parseJsonObject(content);
    const rootNode =
      "root" in parsed
        ? parsed.root
        : "goal" in parsed
          ? parsed.goal
          : parsed;
    if (typeof rootNode !== "object" || rootNode === null || Array.isArray(rootNode)) {
      throw new Error("OpenRouter output missing \"root\"");
    }
    normalizeNodeTypes(rootNode as Record<string, unknown>);
    const result = mapNodeSchema.safeParse(rootNode);
    if (!result.success) {
      throw new Error(`OpenRouter output invalid: ${JSON.stringify(result.error.issues)}`);
    }
    if (result.data.type !== "goal") {
      throw new Error(`OpenRouter root type must be "goal", got "${result.data.type}"`);
    }
    return result.data;
  }
}
