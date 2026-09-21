import { describe, it, expect } from "vitest";
import { OpenRouterGuideGenerator } from "../../src/providers/openrouter/openrouter-guide-generator";
import type { GoalProfile } from "../../src/application/guide/goal-profile";

const validGuide = {
  intro: "A short intro.",
  prerequisites: "Basic Python helps.",
  phases: [
    {
      id: "phase-1",
      title: "Phase 1: Foundations",
      duration: "~2 weeks",
      body: "- [Course] Intro course",
    },
    {
      id: "phase-2",
      title: "Phase 2: Practice",
      body: "- [Exercise] Build something",
    },
  ],
  milestones: "- Finish a project\n- Pass a review",
};

function openRouterResponse(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function mockFetch(response: Response, onInit?: (init: RequestInit) => void) {
  return async (_input: string, init?: RequestInit): Promise<Response> => {
    if (init) onInit?.(init);
    return response;
  };
}

function generatorWith(fetch: (input: string, init?: RequestInit) => Promise<Response>) {
  return new OpenRouterGuideGenerator({ apiKey: "sk-test", fetch });
}

describe("OpenRouterGuideGenerator", () => {
  it("returns a structured StudyGuide from valid JSON output", async () => {
    const generator = generatorWith(
      mockFetch(openRouterResponse(JSON.stringify(validGuide))),
    );
    const guide = await generator.generate("guide to ML engineering");
    expect(guide.intro).toBe("A short intro.");
    expect(guide.phases).toHaveLength(2);
    expect(guide.phases[0]!.title).toBe("Phase 1: Foundations");
    expect(guide.milestones).toContain("Finish a project");
  });

  it("sends an OpenAI-compatible chat completion request with json_object", async () => {
    let captured: RequestInit | undefined;
    const generator = generatorWith(
      mockFetch(openRouterResponse(JSON.stringify(validGuide)), (init) => {
        captured = init;
      }),
    );
    await generator.generate("guide to ML engineering");

    expect(captured).toBeDefined();
    const headers = captured!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(captured!.body as string);
    expect(body.model).toBe("google/gemini-3.8-flash");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].content).toBe("guide to ML engineering");
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("rejects on non-2xx responses", async () => {
    const generator = generatorWith(mockFetch(new Response("boom", { status: 401 })));
    await expect(generator.generate("goal")).rejects.toThrow(/OpenRouter 401/);
  });

  it("rejects on empty content", async () => {
    const generator = generatorWith(mockFetch(openRouterResponse("")));
    await expect(generator.generate("goal")).rejects.toThrow(/no content/);
  });

  it("rejects on invalid structure (missing phases)", async () => {
    const generator = generatorWith(
      mockFetch(openRouterResponse(JSON.stringify({ intro: "only intro" }))),
    );
    await expect(generator.generate("goal")).rejects.toThrow(/invalid/);
  });

  it("parses fenced JSON code blocks", async () => {
    const content = "```json\n" + JSON.stringify(validGuide) + "\n```";
    const generator = generatorWith(mockFetch(openRouterResponse(content)));
    const guide = await generator.generate("goal");
    expect(guide.phases).toHaveLength(2);
  });

  it("includes the learner profile in the user message when provided", async () => {
    let captured: RequestInit | undefined;
    const generator = generatorWith(
      mockFetch(openRouterResponse(JSON.stringify(validGuide)), (init) => {
        captured = init;
      }),
    );
    const profile: GoalProfile = {
      level: "advanced",
      kind: "career",
      depth: "deep",
      domain: "ML Engineer",
      handsOn: "high",
      hasTimeline: true,
    };
    await generator.generate("guide to ML engineering", profile);

    const body = JSON.parse(captured!.body as string);
    const userMessage = body.messages[1].content as string;
    expect(userMessage).toContain("Goal: guide to ML engineering");
    expect(userMessage).toContain("Level: advanced");
    expect(userMessage).toContain("Kind: career");
    expect(userMessage).toContain("Depth: deep");
    expect(userMessage).toContain("Domain: ML Engineer");
    expect(userMessage).toContain("Hands-on emphasis: high");
    expect(userMessage).toContain("Has timeline: yes");
  });

  it("omits the profile block when no profile is provided", async () => {
    let captured: RequestInit | undefined;
    const generator = generatorWith(
      mockFetch(openRouterResponse(JSON.stringify(validGuide)), (init) => {
        captured = init;
      }),
    );
    await generator.generate("guide to ML engineering");

    const body = JSON.parse(captured!.body as string);
    expect(body.messages[1].content).toBe("guide to ML engineering");
  });
});