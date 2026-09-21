import { describe, it, expect } from "vitest";
import { profileGoal } from "../../../src/application/guide/goal-profile";

describe("profileGoal", () => {
  it("returns a profile with sensible defaults", () => {
    const profile = profileGoal("learn Rust");
    expect(profile.level).toBe("intermediate");
    expect(profile.kind).toBe("career");
    expect(profile.depth).toBe("balanced");
    expect(profile.handsOn).toBe("moderate");
    expect(profile.hasTimeline).toBe(false);
  });

  it("detects a known domain by keyword", () => {
    const profile = profileGoal("I want to learn Rust and systems programming");
    expect(profile.domain).toBe("Rust & Systems Programming");
  });

  it("leaves domain empty for unknown goals", () => {
    const profile = profileGoal("become a better cook");
    expect(profile.domain).toBe("");
  });

  it("detects multiple domains", () => {
    const profile = profileGoal("machine learning with Python for data science");
    expect(profile.domain).toBeTruthy();
  });
});
