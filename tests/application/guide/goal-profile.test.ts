import { describe, it, expect } from "vitest";
import {
  profileGoal,
  fallbackProfile,
} from "../../../src/application/guide/goal-profile";
import { MockProvider } from "../../../src/providers/mock/mock-provider";
import type {
  DecisionAnswerMap,
  DecisionProvider,
} from "../../../src/providers/decision-provider";

function cannedProvider(answers: DecisionAnswerMap): DecisionProvider {
  return {
    id: "jev",
    model: "test",
    version: "1",
    async evaluate() {
      return answers;
    },
    async health() {
      return { available: true };
    },
  };
}

function throwingProvider(): DecisionProvider {
  return {
    id: "jev",
    model: "test",
    version: "1",
    async evaluate() {
      throw new Error("boom");
    },
    async health() {
      return { available: true };
    },
  };
}

describe("profileGoal", () => {
  it("returns a fallback profile when no provider is configured", async () => {
    const profile = await profileGoal(undefined, "learn Rust");
    expect(profile.source).toBe("fallback");
    expect(profile.level).toBe("intermediate");
    expect(profile.kind).toBe("career");
    expect(profile.depth).toBe("balanced");
    expect(profile.hasTimeline).toBe(false);
  });

  it("returns a fallback profile when the provider is mock", async () => {
    const profile = await profileGoal(new MockProvider(), "learn Rust");
    expect(profile.source).toBe("fallback");
  });

  it("maps Jev choice/score/noul answers to a typed profile", async () => {
    const provider = cannedProvider({
      level: {
        type: "choice",
        choice: "advanced",
        probabilities: { advanced: 1 },
        confidence: 1,
      },
      kind: {
        type: "choice",
        choice: "project",
        probabilities: { project: 1 },
        confidence: 1,
      },
      depth: {
        type: "choice",
        choice: "deep",
        probabilities: { deep: 1 },
        confidence: 1,
      },
      domain: {
        type: "choice",
        choice: "rust",
        probabilities: { rust: 1 },
        confidence: 1,
      },
      handsOn: {
        type: "score",
        score: 2,
        legend: { "0": "a", "1": "b", "2": "c" },
        probabilities: { "2": 1 },
        confidence: 1,
      },
      hasTimeline: { type: "noul", noul: 0.9 },
    });

    const profile = await profileGoal(provider, "learn Rust");
    expect(profile).toEqual({
      level: "advanced",
      kind: "project",
      depth: "deep",
      domain: "Rust & Systems Programming",
      handsOn: "high",
      hasTimeline: true,
      source: "jev",
    });
  });

  it("normalizes the hands-on score edge cases", async () => {
    const lowProvider = cannedProvider({
      level: {
        type: "choice",
        choice: "beginner",
        probabilities: { beginner: 1 },
        confidence: 1,
      },
      kind: {
        type: "choice",
        choice: "hobby",
        probabilities: { hobby: 1 },
        confidence: 1,
      },
      depth: {
        type: "choice",
        choice: "practical",
        probabilities: { practical: 1 },
        confidence: 1,
      },
      domain: {
        type: "choice",
        choice: "other",
        probabilities: { other: 1 },
        confidence: 1,
      },
      handsOn: {
        type: "score",
        score: 0.5,
        legend: { "0": "a", "1": "b", "2": "c" },
        probabilities: { "0": 1 },
        confidence: 1,
      },
      hasTimeline: { type: "noul", noul: 0.1 },
    });

    const profile = await profileGoal(lowProvider, "read classics");
    expect(profile.level).toBe("beginner");
    expect(profile.kind).toBe("hobby");
    expect(profile.depth).toBe("practical");
    expect(profile.handsOn).toBe("low");
    expect(profile.hasTimeline).toBe(false);
    expect(profile.domain).toBe("");
  });

  it("falls back gracefully when the provider call throws", async () => {
    const profile = await profileGoal(throwingProvider(), "learn Rust");
    expect(profile.source).toBe("fallback");
    expect(profile.level).toBe("intermediate");
  });
});

describe("fallbackProfile", () => {
  it("detects a known domain by keyword", () => {
    const profile = fallbackProfile("I want to learn Rust and systems programming");
    expect(profile.domain).toBe("Rust & Systems Programming");
  });

  it("leaves domain empty for unknown goals", () => {
    const profile = fallbackProfile("become a better cook");
    expect(profile.domain).toBe("");
  });
});