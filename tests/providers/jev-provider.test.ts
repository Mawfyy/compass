import { describe, it, expect } from "vitest";
import { JevProvider } from "../../src/providers/jev/jev-provider";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const USAGE = { input_tokens: 10, output_tokens: 5 };

describe("JevProvider", () => {
  it("maps a choice answer back to a DecisionAnswer", async () => {
    const provider = new JevProvider({
      apiKey: "test",
      fetch: async () =>
        jsonResponse({
          model: "jev-1.13.0",
          answers: {
            domain: {
              type: "choice",
              choice: "rust",
              confidence: 0.9,
              probabilities: { "ml-engineer": 0.05, rust: 0.9, other: 0.05 },
            },
          },
          usage: USAGE,
        }),
    });

    const answers = await provider.evaluate("learn Rust", [
      {
        id: "domain",
        type: "choice",
        instructions: "Which domain?",
        criteria: { rust: "Rust", other: "Other" },
      },
    ]);

    expect(answers.domain).toEqual({
      type: "choice",
      choice: "rust",
      confidence: 0.9,
      probabilities: { "ml-engineer": 0.05, rust: 0.9, other: 0.05 },
    });
  });

  it("translates noul criteria to the SDK true/false shape", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const provider = new JevProvider({
      apiKey: "test",
      fetch: async (_input, init) => {
        capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse({
          model: "jev-1.13.0",
          answers: { q: { type: "noul", noul: 0.7 } },
          usage: USAGE,
        });
      },
    });

    const answers = await provider.evaluate("some text", [
      {
        id: "q",
        type: "noul",
        instructions: "Is this about X?",
        criteria: { yes: "yes description", no: "no description" },
      },
    ]);

    expect(answers.q).toEqual({ type: "noul", noul: 0.7 });
    expect(capturedBody).toMatchObject({
      state: "some text",
      questions: {
        q: {
          type: "noul",
          instructions: "Is this about X?",
          criteria: { true: "yes description", false: "no description" },
        },
      },
    });
  });

  it("maps a score answer with its legend and probabilities", async () => {
    const provider = new JevProvider({
      apiKey: "test",
      fetch: async () =>
        jsonResponse({
          model: "jev-1.13.0",
          answers: {
            difficulty: {
              type: "score",
              score: 1.2,
              confidence: 0.8,
              legend: { "0": "Beginner", "1": "Intermediate", "2": "Advanced" },
              probabilities: { "0": 0.1, "1": 0.7, "2": 0.2 },
            },
          },
          usage: USAGE,
        }),
    });

    const answers = await provider.evaluate("resource", [
      {
        id: "difficulty",
        type: "score",
        instructions: "How hard?",
        criteria: ["Beginner", "Intermediate", "Advanced"],
      },
    ]);

    expect(answers.difficulty).toEqual({
      type: "score",
      score: 1.2,
      confidence: 0.8,
      legend: { "0": "Beginner", "1": "Intermediate", "2": "Advanced" },
      probabilities: { "0": 0.1, "1": 0.7, "2": 0.2 },
    });
  });

  it("reports unavailable health when the API errors", async () => {
    const provider = new JevProvider({
      apiKey: "test",
      fetch: async () => jsonResponse({ error: "boom" }, 500),
    });

    const health = await provider.health();
    expect(health.available).toBe(false);
  });
});
