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

export function extractPhaseTasks(body: string): string[] {
  if (!body) return [];
  const lines = body.split("\n");
  const tasks: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(?:[-*+]|\d+\.)\s+/.test(trimmed)) {
      const taskText = trimmed.replace(/^(?:[-*+]|\d+\.)\s+/, "").trim();
      if (taskText) {
        tasks.push(taskText);
      }
    }
  }
  return tasks;
}

export function serializeGuideToIcs(goal: string, guide: StudyGuide): string {
  const now = new Date();
  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const formatDateSimple = (d: Date) =>
    d.toISOString().replace(/-/g, "").split("T")[0];

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Compass Study Guide Generator//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:Study Plan: ${goal.replace(/[\n\r]/g, " ")}`,
  ];

  let startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);

  guide.phases.forEach((phase, index) => {
    let durationDays = 7;
    if (phase.duration) {
      const match = phase.duration.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (phase.duration.includes("week")) {
          durationDays = num * 7;
        } else if (phase.duration.includes("day")) {
          durationDays = num;
        } else if (phase.duration.includes("month")) {
          durationDays = num * 30;
        }
      }
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const summary = `${phase.title} - Compass Study Guide`;
    const description = phase.body.replace(/\n/g, "\\n").replace(/,/g, "\\,");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${now.getTime()}-${index}@compass.app`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART;VALUE=DATE:${formatDateSimple(startDate)}`,
      `DTEND;VALUE=DATE:${formatDateSimple(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );

    startDate = new Date(endDate);
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}