import { describe, it, expect } from "vitest";
import { OpenRouterGuideGenerator } from "../../src/providers/openrouter/openrouter-guide-generator";

const validGuide = {
  intro: "A short intro.",
  prerequisites: "Basic Python helps.",
  phases: [
    {
      id: "phase-1",
      title: "Phase 1: Foundations",
      duration: "~2 weeks",
      body: "- Learn the basics",
      resources: [{ kind: "Course", name: "Intro course" }],
    },
    {
      id: "phase-2",
      title: "Phase 2: Practice",
      body: "- Build something",
      resources: [{ kind: "Exercise", name: "Build something" }],
    },
    {
      id: "phase-3",
      title: "Phase 3: Mastery",
      body: "- Deepen your knowledge",
      resources: [{ kind: "Project", name: "Capstone project" }],
    },
  ],
  milestones: "- Finish a project\n- Pass a review",
  profile: {
    level: "beginner",
    kind: "career",
    depth: "balanced",
    domain: "ml",
    handsOn: "high",
    hasTimeline: true,
  },
};

function openRouterResponse(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function capturingFetch(
  responses: Response[],
  onInit?: (init: RequestInit) => void,
) {
  let index = 0;
  return async (_input: string, init?: RequestInit): Promise<Response> => {
    if (init) onInit?.(init);
    const response = responses[Math.min(index, responses.length - 1)]!;
    index += 1;
    return response;
  };
}

function generatorWith(fetch: (input: string, init?: RequestInit) => Promise<Response>) {
  return new OpenRouterGuideGenerator({ apiKey: "sk-test", fetch });
}

describe("OpenRouterGuideGenerator", () => {
  it("returns a structured StudyGuide from valid JSON output", async () => {
    const generator = generatorWith(
      capturingFetch([openRouterResponse(JSON.stringify(validGuide))]),
    );
    const guide = await generator.generate("guide to ML engineering");
    expect(guide.intro).toBe("A short intro.");
    expect(guide.phases).toHaveLength(3);
    expect(guide.phases[0]!.title).toBe("Phase 1: Foundations");
    expect(guide.phases[0]!.resources?.[0]!.kind).toBe("Course");
    expect(guide.milestones).toContain("Finish a project");
    expect(guide.profile?.level).toBe("beginner");
  });

  it("sends a json_schema response_format and a system prompt with few-shot", async () => {
    let captured: RequestInit | undefined;
    const generator = generatorWith(
      capturingFetch(
        [openRouterResponse(JSON.stringify(validGuide))],
        (init) => {
          captured = init;
        },
      ),
    );
    await generator.generate("guide to ML engineering");

    expect(captured).toBeDefined();
    const headers = captured!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(captured!.body as string);
    expect(body.model).toBe("nvidia/nemotron-3-super-120b-a12b:free");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].content).toBe("guide to ML engineering");
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.name).toBe("study_guide");
    expect(body.response_format.json_schema.strict).toBe(true);
  });

  it("falls back to json_object when the model rejects json_schema", async () => {
    const initBodies: RequestInit[] = [];
    const generator = generatorWith(
      capturingFetch(
        [
          new Response("unsupported", { status: 400 }),
          openRouterResponse(JSON.stringify(validGuide)),
        ],
        (init) => initBodies.push(init),
      ),
    );
    const guide = await generator.generate("goal");
    expect(guide.phases).toHaveLength(3);
    expect(JSON.parse(initBodies[1]!.body as string).response_format).toEqual({
      type: "json_object",
    });
  });

  it("rejects on non-2xx responses", async () => {
    const generator = generatorWith(capturingFetch([new Response("boom", { status: 401 })]));
    await expect(generator.generate("goal")).rejects.toThrow(/OpenRouter 401/);
  });

  it("rejects on empty content", async () => {
    const generator = generatorWith(capturingFetch([openRouterResponse("")]));
    await expect(generator.generate("goal")).rejects.toThrow(/no content/);
  });

  it("repairs invalid structure once and returns the corrected guide", async () => {
    const invalid = JSON.stringify({ intro: "only intro" });
    const generator = generatorWith(
      capturingFetch([
        openRouterResponse(invalid),
        openRouterResponse(JSON.stringify(validGuide)),
      ]),
    );
    const guide = await generator.generate("goal");
    expect(guide.phases).toHaveLength(3);
  });

  it("rejects after exhausting repair attempts", async () => {
    const invalid = JSON.stringify({ intro: "only intro" });
    const generator = generatorWith(
      capturingFetch([openRouterResponse(invalid), openRouterResponse(invalid)]),
    );
    await expect(generator.generate("goal")).rejects.toThrow(/invalid/);
  });

  it("parses fenced JSON code blocks", async () => {
    const content = "```json\n" + JSON.stringify(validGuide) + "\n```";
    const generator = generatorWith(capturingFetch([openRouterResponse(content)]));
    const guide = await generator.generate("goal");
    expect(guide.phases).toHaveLength(3);
  });

  it("converts literal \\n sequences in markdown fields to real newlines", async () => {
    const withEscapes = {
      ...validGuide,
      intro: "line one\\nline two",
      milestones: "- one\\n- two",
      phases: validGuide.phases.map((phase) => ({
        ...phase,
        body: "- a\\n- b",
      })),
    };
    const generator = generatorWith(
      capturingFetch([openRouterResponse(JSON.stringify(withEscapes))]),
    );
    const guide = await generator.generate("goal");
    expect(guide.intro).toBe("line one\nline two");
    expect(guide.milestones).toBe("- one\n- two");
    expect(guide.phases[0]!.body).toBe("- a\n- b");
  });

  it("accepts phases without resources", async () => {
    const noResources = {
      ...validGuide,
      phases: validGuide.phases.map(({ resources: _r, ...phase }) => phase),
    };
    const generator = generatorWith(
      capturingFetch([openRouterResponse(JSON.stringify(noResources))]),
    );
    const guide = await generator.generate("goal");
    expect(guide.phases[0]!.resources).toBeUndefined();
  });

  it("sends plugins with web search when webSearch is enabled", async () => {
    let captured: RequestInit | undefined;
    const generator = new OpenRouterGuideGenerator({
      apiKey: "sk-test",
      webSearch: true,
      webSearchMaxResults: 3,
      fetch: capturingFetch(
        [openRouterResponse(JSON.stringify(validGuide))],
        (init) => { captured = init; },
      ),
    });
    await generator.generate("goal");
    const body = JSON.parse(captured!.body as string);
    expect(body.plugins).toEqual([{ id: "web", max_results: 3 }]);
  });

  it("omits plugins when webSearch is disabled", async () => {
    let captured: RequestInit | undefined;
    const generator = new OpenRouterGuideGenerator({
      apiKey: "sk-test",
      webSearch: false,
      fetch: capturingFetch(
        [openRouterResponse(JSON.stringify(validGuide))],
        (init) => { captured = init; },
      ),
    });
    await generator.generate("goal");
    const body = JSON.parse(captured!.body as string);
    expect(body.plugins).toBeUndefined();
  });

  it("accepts resources with url field", async () => {
    const withUrl = {
      ...validGuide,
      phases: validGuide.phases.map((phase) => ({
        ...phase,
        resources: [{ kind: "Course", name: "Intro course", url: "https://example.com/course" }],
      })),
    };
    const generator = generatorWith(
      capturingFetch([openRouterResponse(JSON.stringify(withUrl))]),
    );
    const guide = await generator.generate("goal");
    expect(guide.phases[0]!.resources?.[0]?.url).toBe("https://example.com/course");
  });
});