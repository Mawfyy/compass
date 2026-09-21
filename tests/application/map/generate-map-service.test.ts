import { describe, it, expect } from "vitest";
import { GenerateMapService } from "../../../src/application/map/generate-map-service";
import {
  generateMapRequestSchema,
  learningMapSchema,
  mapNodeSchema,
} from "../../../src/domain/map/schemas";
import { createLearningMap, deriveEdges } from "../../../src/domain/map/learning-map";
import { createMapNode } from "../../../src/domain/map/node";
import type { MapGenerator } from "../../../src/providers/map-generator";

const service = new GenerateMapService();

function request(
  goal: string,
  overrides: Record<string, unknown> = {},
): ReturnType<typeof generateMapRequestSchema.parse> {
  return generateMapRequestSchema.parse({ goal, ...overrides });
}

describe("GenerateMapService", () => {
  it("matches the ML template for machine-learning goals", async () => {
    const map = await service.generate(request("I want to become an ML engineer"));
    expect(map.root.id).toBe("ml-engineer");
    expect(map.root.title).toBe("ML Engineer");
    expect(map.root.type).toBe("goal");
  });

  it("matches the Rust template", async () => {
    const map = await service.generate(request("learn Rust systems programming"));
    expect(map.root.id).toBe("rust");
  });

  it("matches the distributed systems template", async () => {
    const map = await service.generate(request("learn distributed systems"));
    expect(map.root.id).toBe("distributed-systems");
  });

  it("builds a generic scaffold for unknown goals", async () => {
    const map = await service.generate(request("learn watercolor painting"));
    expect(map.root.type).toBe("goal");
    expect(map.root.id).toBe("watercolor-painting");
    expect(map.root.children?.map((c) => c.title)).toEqual([
      "Foundations",
      "Core",
      "Practice",
    ]);
  });

  it("adds an Advanced area when depth is deep", async () => {
    const map = await service.generate(request("learn origami", { depth: "deep" }));
    const titles = map.root.children?.map((c) => c.title);
    expect(titles).toContain("Advanced");
  });

  it("is deterministic", async () => {
    const a = await service.generate(request("learn cooking", { level: "intermediate" }));
    const b = await service.generate(request("learn cooking", { level: "intermediate" }));
    expect(a.root).toEqual(b.root);
    expect(a.edges).toEqual(b.edges);
  });

  it("produces schema-valid maps", async () => {
    const map = await service.generate(request("learn ML"));
    expect(() => learningMapSchema.parse(map)).not.toThrow();
    expect(() => mapNodeSchema.parse(map.root)).not.toThrow();
  });
});

describe("GenerateMapService with a generator", () => {
  it("delegates to the generator when provided", async () => {
    const generator: MapGenerator = {
      id: "test",
      model: "test-v1",
      async generate(req) {
        return createLearningMap({
          goal: {
            prompt: req.goal,
            level: req.level,
            goalKind: req.goalKind,
            depth: req.depth,
            hoursPerWeek: req.hoursPerWeek,
          },
          root: createMapNode({ id: "from-generator", type: "goal", title: "Generated" }),
        });
      },
    };
    const service = new GenerateMapService(undefined, generator);
    const map = await service.generate(request("learn anything"));
    expect(map.root.id).toBe("from-generator");
  });

  it("falls back to a scaffold when the generator throws", async () => {
    const failing: MapGenerator = {
      id: "test",
      model: "test-v1",
      async generate() {
        throw new Error("boom");
      },
    };
    const service = new GenerateMapService(undefined, failing);
    const map = await service.generate(request("learn watercolor painting"));
    expect(map.root.type).toBe("goal");
    expect(map.root.id).toBe("watercolor-painting");
  });
});

describe("deriveEdges", () => {
  it("derives part_of, prerequisite, and next edges", () => {
    const root = createMapNode({
      id: "goal",
      type: "goal",
      title: "Goal",
      children: [
        createMapNode({
          id: "topic",
          type: "topic",
          title: "Topic",
          prerequisites: ["prereq"],
          next: ["next-topic"],
          children: [
            createMapNode({ id: "sub", type: "subtopic", title: "Sub" }),
          ],
        }),
      ],
    });

    expect(deriveEdges(root)).toEqual([
      { id: "part:goal:topic", source: "goal", target: "topic", kind: "part_of" },
      { id: "part:topic:sub", source: "topic", target: "sub", kind: "part_of" },
      { id: "prereq:prereq:topic", source: "prereq", target: "topic", kind: "prerequisite" },
      { id: "next:topic:next-topic", source: "topic", target: "next-topic", kind: "next" },
    ]);
  });
});
