import { describe, it, expect } from "vitest";
import {
  serializeGuide,
  slugify,
  extractPhaseTasks,
  serializeGuideToIcs,
} from "../../src/ui/guide/serialize";
import type { StudyGuide } from "../../src/domain/guide/schemas";

const guide: StudyGuide = {
  intro: "Become an ML engineer.",
  prerequisites: "Basic Python.",
  phases: [
    {
      id: "phase-1",
      title: "Phase 1: Foundations",
      duration: "~2 weeks",
      body: "- Learn linear algebra\n- Practice Python drills",
      resources: [
        { kind: "Course", name: "Intro" },
        { kind: "Reading", name: "Book" },
      ],
    },
    {
      id: "phase-2",
      title: "Phase 2: Practice",
      body: "- Build a neural network",
      resources: [{ kind: "Exercise", name: "Build something" }],
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

describe("extractPhaseTasks", () => {
  it("extracts task bullet points from markdown body", () => {
    const tasks = extractPhaseTasks("- Learn linear algebra\n- Practice Python drills\nSome note line");
    expect(tasks).toEqual(["Learn linear algebra", "Practice Python drills"]);
  });

  it("returns empty array when body has no bullets", () => {
    expect(extractPhaseTasks("Just a plain text paragraph.")).toEqual([]);
  });
});

describe("serializeGuideToIcs", () => {
  it("generates a valid iCalendar .ics string", () => {
    const ics = serializeGuideToIcs("Become an ML Engineer", guide);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Phase 1: Foundations - Compass Study Guide");
    expect(ics).toContain("SUMMARY:Phase 2: Practice - Compass Study Guide");
  });
});