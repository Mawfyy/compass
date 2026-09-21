import { describe, it, expect } from "vitest";
import { OpenRouterMapGenerator } from "../../src/providers/openrouter/openrouter-map-generator";
import type { GenerateMapRequest } from "../../src/domain/map/schemas";

const request: GenerateMapRequest = {
  goal: "Learn computer science",
  level: "beginner",
  goalKind: "career",
  depth: "balanced",
  hoursPerWeek: 10,
};

const validRoot = {
  id: "cs",
  type: "goal",
  title: "Computer Science",
  children: [
    {
      id: "foundations",
      type: "area",
      title: "Foundations",
      children: [{ id: "algorithms", type: "topic", title: "Algorithms" }],
    },
    {
      id: "capstone",
      type: "project",
      title: "Capstone",
      project: { title: "Build something", brief: "Apply what you learned." },
    },
  ],
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
  return new OpenRouterMapGenerator({ apiKey: "sk-test", fetch });
}

describe("OpenRouterMapGenerator", () => {
  it("generates a LearningMap from valid JSON output", async () => {
    const generator = generatorWith(
      mockFetch(openRouterResponse(JSON.stringify({ root: validRoot }))),
    );
    const map = await generator.generate(request);

    expect(map.root.id).toBe("cs");
    expect(map.root.type).toBe("goal");
    expect(map.goal.prompt).toBe("Learn computer science");
    expect(map.edges.some((e) => e.kind === "part_of")).toBe(true);
  });

  it("sends an OpenAI-compatible chat completion request", async () => {
    let captured: RequestInit | undefined;
    const generator = generatorWith(
      mockFetch(
        openRouterResponse(JSON.stringify({ root: validRoot })),
        (init) => {
          captured = init;
        },
      ),
    );
    await generator.generate(request);

    expect(captured).toBeDefined();
    const headers = captured!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(captured!.body as string);
    expect(body.model).toBe("google/gemini-3.8-flash");
    expect(body.messages[0].role).toBe("system");
  });

  it("rejects on non-2xx responses", async () => {
    const generator = generatorWith(mockFetch(new Response("boom", { status: 401 })));
    await expect(generator.generate(request)).rejects.toThrow(/OpenRouter 401/);
  });

  it("rejects on malformed content", async () => {
    const generator = generatorWith(mockFetch(openRouterResponse("not json")));
    await expect(generator.generate(request)).rejects.toThrow();
  });

  it("rejects when the root is not a goal node", async () => {
    const content = JSON.stringify({
      root: { id: "x", type: "topic", title: "X" },
    });
    const generator = generatorWith(mockFetch(openRouterResponse(content)));
    await expect(generator.generate(request)).rejects.toThrow(/must be "goal"/);
  });

  it("accepts a top-level goal key instead of root", async () => {
    const content = JSON.stringify({ goal: validRoot });
    const generator = generatorWith(mockFetch(openRouterResponse(content)));
    const map = await generator.generate(request);
    expect(map.root.id).toBe("cs");
    expect(map.root.type).toBe("goal");
  });

  it("accepts a bare goal node without any wrapper", async () => {
    const generator = generatorWith(
      mockFetch(openRouterResponse(JSON.stringify(validRoot))),
    );
    const map = await generator.generate(request);
    expect(map.root.id).toBe("cs");
    expect(map.root.type).toBe("goal");
  });
});
