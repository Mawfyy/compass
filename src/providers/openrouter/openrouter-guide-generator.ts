import { toJSONSchema } from "zod";
import type { GuideGenerator } from "../guide-generator";
import { guideSchema, type StudyGuide } from "../../domain/guide/schemas";

export interface OpenRouterGuideConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  webSearch?: boolean;
  webSearchMaxResults?: number;
  /** Custom transport, used by tests to stub the OpenRouter API. */
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

type GuideMessage = { role: string; content: string };

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_REPAIR_ATTEMPTS = 1;

const GUIDE_JSON_SCHEMA = toJSONSchema(guideSchema, {
  target: "draft-07",
  unrepresentable: "any",
}) as Record<string, unknown>;

const PROFILE_FIELDS = `level (one of beginner, intermediate, advanced), kind (career, academic, hobby, project, certification), depth (practical, balanced, deep), domain (a short 1-3 word slug), handsOn (low, moderate, high), hasTimeline (boolean)`;

const SYSTEM_PROMPT = `You are an expert study-guide writer. Given a learner's goal, produce a single, well-structured study guide as a JSON object.

First, classify the goal into a learner "profile" and use it to tailor the guide. The profile has these fields: ${PROFILE_FIELDS}. The "profile" object must be included in your JSON output.

Then write the guide tailored to that profile:
- Scale the starting point and topic difficulty to the learner's "level".
- Order and emphasize phases according to "depth": practical guides front-load doing; deep guides front-load theory and fundamentals.
- Adjust the resource mix to "handsOn": more [Exercise]/[Project] when high, more [Reading]/[Course] when low.
- When "hasTimeline" is true, add time pacing to phase durations and milestones.
- Treat "kind" and "domain" as context for concrete resource and milestone choices.

Respond with exactly this shape (no other keys):
{
  "intro": "a short 1-2 sentence paragraph framing the goal",
  "prerequisites": "a one-line note on what the learner should already know (omit if none)",
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase 1: <specific name, not filler>",
      "duration": "~N weeks",
      "body": "Markdown. Key topics (bullets) and concrete activities."
    }
  ],
  "milestones": "A short Markdown list of 2-3 checkpoints.",
  "profile": { "level": "...", "kind": "...", "depth": "...", "domain": "...", "handsOn": "...", "hasTimeline": false }
}

Requirements:
- 3-6 phases, ordered from foundations to mastery.
- Each phase "body" is Markdown: bullets for topics and concrete activities.
- "milestones" is Markdown: a 2-3 item list of concrete checkpoints.
- Never invent prices, completion certificates, or URLs unless they come from web search results. Never use filler titles like "Core concepts" or "Fundamentals".

You may optionally add a "resources" array to a phase when you can recommend specific, real books, courses, tools, or projects. Each resource is { "kind": "Course|Reading|Exercise|Project|Case Study|Certification|Tool|Docs", "name": "<real, specific name>", "note": "<optional one-line why/how>", "url": "<optional real URL>" }. Only include resources you are confident are real and correctly named; omit "resources" for a phase when unsure. Only include "url" for resources you found via web search — never guess a URL.

Here is an example of the expected structure and quality:

{
  "intro": "You want to become an ML engineer. This guide builds your foundations in programming and math, then takes you through classic and modern machine learning with hands-on projects.",
  "prerequisites": "Comfort with Python basics.",
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase 1: Python and math foundations",
      "duration": "~3 weeks",
      "body": "- Solve small programming drills daily\\n- Grasp the linear algebra and calculus needed for ML",
      "resources": [
        { "kind": "Course", "name": "MIT 18.06 Linear Algebra", "note": "Watch the lectures and do the problem sets" },
        { "kind": "Course", "name": "Kaggle Learn Python", "note": "Fast structured intro" }
      ]
    },
    {
      "id": "phase-2",
      "title": "Phase 2: Classic machine learning",
      "duration": "~4 weeks",
      "body": "- Implement the core algorithms yourself\\n- Build and evaluate a first end-to-end model",
      "resources": [
        { "kind": "Course", "name": "Andrew Ng Machine Learning Specialization" },
        { "kind": "Reading", "name": "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow" },
        { "kind": "Project", "name": "Predict housing prices on a Kaggle dataset" }
      ]
    },
    {
      "id": "phase-3",
      "title": "Phase 3: Deep learning and deployment",
      "duration": "~5 weeks",
      "body": "- Train neural networks with modern frameworks\\n- Ship a model behind a small API",
      "resources": [
        { "kind": "Course", "name": "DeepLearning.AI Deep Learning Specialization" },
        { "kind": "Tool", "name": "PyTorch", "note": "Primary deep-learning framework" },
        { "kind": "Project", "name": "Deploy an image classifier as a web service" }
      ]
    }
  ],
  "milestones": "- Pass a linear algebra problem set with no reference\\n- Build and evaluate a full ML pipeline\\n- Deploy a working model behind a live endpoint",
  "profile": { "level": "beginner", "kind": "career", "depth": "balanced", "domain": "machine-learning", "handsOn": "high", "hasTimeline": true }
}

Be concrete, specific, and practical. Use the learner's level of prior knowledge when stated.`;

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
 * The model sometimes emits literal `\n`/`\t` sequences inside markdown fields
 * (double-escaped JSON) instead of real newlines. Convert them so the markdown
 * renders correctly.
 */
function normalizeNewlines(text: string): string {
  return text.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "");
}

function normalizeGuide(guide: StudyGuide): StudyGuide {
  return {
    ...guide,
    intro: normalizeNewlines(guide.intro),
    prerequisites: guide.prerequisites
      ? normalizeNewlines(guide.prerequisites)
      : undefined,
    milestones: normalizeNewlines(guide.milestones),
    phases: guide.phases.map((phase) => ({
      ...phase,
      body: normalizeNewlines(phase.body),
      resources: phase.resources?.map((resource) => ({
        ...resource,
        name: normalizeNewlines(resource.name),
        note: resource.note ? normalizeNewlines(resource.note) : undefined,
      })),
    })),
  };
}

/**
 * Generative study-guide provider backed by OpenRouter. Asks a generative LLM
 * for a structured JSON guide, constrained by a JSON Schema, validates it
 * against the guide schema, and repairs invalid output once before failing.
 */
export class OpenRouterGuideGenerator implements GuideGenerator {
  readonly id = "openrouter";
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly webSearch: boolean;
  private readonly webSearchMaxResults: number;
  private readonly fetchFn: (input: string, init?: RequestInit) => Promise<Response>;

  constructor(config: OpenRouterGuideConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.webSearch = config.webSearch ?? false;
    this.webSearchMaxResults = config.webSearchMaxResults ?? 5;
    this.fetchFn = config.fetch ?? ((input, init) => fetch(input, init));
  }

  private async request(
    messages: GuideMessage[],
    responseFormat: Record<string, unknown>,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          response_format: responseFormat,
          ...(this.webSearch && {
            plugins: [{ id: "web", max_results: this.webSearchMaxResults }],
          }),
          messages,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async complete(messages: GuideMessage[]): Promise<string> {
    const response = await this.request(messages, {
      type: "json_schema",
      json_schema: {
        name: "study_guide",
        schema: GUIDE_JSON_SCHEMA,
        strict: true,
      },
    });

    // Some models reject the json_schema format; fall back to plain json_object.
    if (response.status === 400 || response.status === 422) {
      const fallback = await this.request(messages, { type: "json_object" });
      if (fallback.ok) {
        return this.contentOf(fallback);
      }
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 500)}`);
    }

    return this.contentOf(response);
  }

  private async contentOf(response: Response): Promise<string> {
    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("OpenRouter returned no content");
    }
    return content;
  }

  async generate(goal: string): Promise<StudyGuide> {
    const messages: GuideMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: goal },
    ];

    for (let attempt = 0; ; attempt++) {
      const content = await this.complete(messages);
      let parsed: Record<string, unknown>;
      try {
        parsed = parseJsonObject(content);
      } catch {
        if (attempt < MAX_REPAIR_ATTEMPTS) {
          messages.push(
            { role: "assistant", content },
            {
              role: "user",
              content:
                "Your previous response was not valid JSON. Return only a valid JSON object matching the requested schema.",
            },
          );
          continue;
        }
        throw new Error("OpenRouter guide invalid: could not parse JSON");
      }

      const result = guideSchema.safeParse(parsed);
      if (result.success) {
        return normalizeGuide(result.data);
      }

      if (attempt < MAX_REPAIR_ATTEMPTS) {
        const issues = JSON.stringify(result.error.issues);
        messages.push(
          { role: "assistant", content },
          {
            role: "user",
            content: `Your previous response failed validation with these errors: ${issues}. Return a corrected JSON object matching the requested schema.`,
          },
        );
        continue;
      }
      throw new Error(`OpenRouter guide invalid: ${JSON.stringify(result.error.issues)}`);
    }
  }
}