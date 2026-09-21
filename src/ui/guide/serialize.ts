import type { StudyGuide } from "@/domain/guide/schemas";

export function serializeGuide(guide: StudyGuide): string {
  const lines: string[] = [];

  if (guide.intro.trim()) lines.push(guide.intro.trim(), "");

  if (guide.prerequisites?.trim()) {
    lines.push("## Prerequisites", "", guide.prerequisites.trim(), "");
  }

  for (const phase of guide.phases) {
    const heading = phase.duration
      ? `## ${phase.title} (${phase.duration})`
      : `## ${phase.title}`;
    lines.push(heading, "", phase.body.trim(), "");
  }

  if (guide.milestones.trim()) {
    lines.push("## Suggested milestones", "", guide.milestones.trim(), "");
  }

  return lines.join("\n").trim() + "\n";
}

export function slugify(goal: string): string {
  const slug = goal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "study"}-guide.md`;
}