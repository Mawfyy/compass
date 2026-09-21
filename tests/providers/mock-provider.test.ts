import { describe, it, expect } from "vitest";
import { MockProvider } from "../../src/providers/mock/mock-provider";
import type { DecisionAnswer } from "../../src/providers/decision-provider";

describe("MockProvider", () => {
  it("returns a default noul of 0.5", async () => {
    const provider = new MockProvider();
    const answers = await provider.evaluate("some text", [
      { id: "q", type: "noul", instructions: "Is this a question?" },
    ]);
    expect(answers.q).toEqual({ type: "noul", noul: 0.5 });
  });

  it("returns the first option for a default choice", async () => {
    const provider = new MockProvider();
    const answers = await provider.evaluate("x", [
      {
        id: "type",
        type: "choice",
        instructions: "What kind?",
        criteria: { book: "A book", course: "A course" },
      },
    ]);
    const answer = answers.type as Extract<DecisionAnswer, { type: "choice" }>;
    expect(answer.choice).toBe("book");
    expect(answer.probabilities.book).toBe(1);
    expect(answer.confidence).toBe(1);
  });

  it("honors per-question overrides", async () => {
    const provider = new MockProvider({
      q: { type: "noul", noul: 0.9 },
    });
    const answers = await provider.evaluate("x", [
      { id: "q", type: "noul", instructions: "yes?" },
    ]);
    expect(answers.q).toEqual({ type: "noul", noul: 0.9 });
  });

  it("records every call for assertions", async () => {
    const provider = new MockProvider();
    await provider.evaluate("first", [
      { id: "a", type: "noul", instructions: "a?" },
    ]);
    await provider.evaluate("second", [
      { id: "b", type: "noul", instructions: "b?" },
    ]);
    expect(provider.calls).toHaveLength(2);
    expect(provider.calls[0]?.state).toBe("first");
    expect(provider.calls[1]?.questions[0]?.id).toBe("b");
  });

  it("reports available health", async () => {
    const provider = new MockProvider();
    await expect(provider.health()).resolves.toEqual({
      available: true,
      latencyMs: 0,
    });
  });
});
