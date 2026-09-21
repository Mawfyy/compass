import { describe, it, expect } from "vitest";
import { generateMapRequestSchema } from "../../../src/domain/map/schemas";

describe("generateMapRequestSchema", () => {
  it("applies defaults when only a goal is provided", () => {
    const parsed = generateMapRequestSchema.parse({ goal: "Learn TypeScript" });
    expect(parsed).toEqual({
      goal: "Learn TypeScript",
      level: "beginner",
      goalKind: "career",
      depth: "balanced",
      hoursPerWeek: 10,
    });
  });

  it("rejects a goal shorter than 3 characters", () => {
    const result = generateMapRequestSchema.safeParse({ goal: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown level", () => {
    const result = generateMapRequestSchema.safeParse({ goal: "Learn", level: "guru" });
    expect(result.success).toBe(false);
  });
});
