import { describe, it, expect } from "vitest";
import { serializeGuide, slugify } from "../../src/ui/guide/serialize";
import type { StudyGuide } from "../../src/domain/guide/schemas";

const guide: StudyGuide = {
  intro: "Become an ML engineer.",
  prerequisites: "Basic Python.",
  phases: [
    {
      id: "phase-1",
      title: "Phase 1: Foundations",
      duration: "~2 weeks",
      body: "- [Course] Intro\n- [Reading] Book",
    },
    {
      id: "phase-2",
      title: "Phase 2: Practice",
      body: "- [Exercise] Build something",
    },
  ],
  milestones: "- Finish a project",
};

describe("serializeGuide", () => {
  it("serializes a guide to Markdown", () => {
    const md = serializeGuide(guide);
    expect(md).toContain("Become an ML engineer.");
    expect(md).toContain("## Prerequisites");
    expect(md).toContain("## Phase 1: Foundations (~2 weeks)");
    expect(md).toContain("## Phase 2: Practice");
    expect(md).toContain("## Suggested milestones");
    expect(md).toContain("- [Course] Intro");
  });

  it("omits prerequisites section when absent", () => {
    const md = serializeGuide({ ...guide, prerequisites: undefined });
    expect(md).not.toContain("## Prerequisites");
  });
});

describe("slugify", () => {
  it("slugifies a goal into a filename", () => {
    expect(slugify("Become an ML Engineer!")).toBe("become-an-ml-engineer-guide.md");
  });

  it("falls back to study-guide.md for empty goals", () => {
    expect(slugify("!!!")).toBe("study-guide.md");
  });
});