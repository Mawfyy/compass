import type { GenerateMapRequest } from "../../domain/map/schemas";
import type { MapNode } from "../../domain/map/node";
import { createMapNode } from "../../domain/map/node";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanGoalTitle(goal: string): string {
  const trimmed = goal
    .trim()
    .replace(/^i want to learn\s+/i, "")
    .replace(/^learn\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  if (trimmed.length === 0) return goal.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function difficultyFor(level: GenerateMapRequest["level"]): string {
  switch (level) {
    case "beginner":
      return "Beginner";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    case "expert":
      return "Expert";
    default:
      return "Intermediate";
  }
}

/**
 * A generic, deterministic scaffold used as the fallback when no template
 * matches and no generative provider is available. Also reused as the
 * graceful fallback when a generative provider fails.
 */
export function buildGenericRoot(
  goal: string,
  request: GenerateMapRequest,
): MapNode {
  const title = cleanGoalTitle(goal);
  const id = slugify(title) || "learning-goal";
  const difficulty = difficultyFor(request.level);

  const foundations: MapNode = createMapNode({
    id: `${id}-foundations`,
    type: "topic",
    title: "Foundations",
    difficulty,
    purpose: `The prerequisite knowledge you need before diving into ${title}.`,
    subtopics: ["Core concepts", "Key terminology", "Fundamental principles"],
  });

  const core: MapNode = createMapNode({
    id: `${id}-core`,
    type: "topic",
    title: `Core ${title}`,
    difficulty,
    purpose: `The central skills and concepts that define ${title}.`,
    prerequisites: [`${id}-foundations`],
    subtopics:
      request.depth === "practical"
        ? ["Hands-on skills", "Common tools", "Practical techniques"]
        : ["Core theory", "Hands-on skills", "Common tools", "Best practices"],
    resources: [
      {
        title: "A beginner-friendly introduction",
        type: "course",
        why: "A gentle, structured first pass over the core material.",
      },
    ],
    next: [`${id}-practice`],
  });

  const practice: MapNode = createMapNode({
    id: `${id}-practice`,
    type: "project",
    title: "Practice Project",
    purpose: `Apply what you have learned about ${title} to a real project.`,
    project: {
      title: `Build something with ${title}`,
      brief: `Choose a small, well-scoped project that exercises the core of ${title} and share the result.`,
    },
  });

  const areas: MapNode[] = [
    createMapNode({
      id: `${id}-area-foundations`,
      type: "area",
      title: "Foundations",
      purpose: "Everything you need before the core material.",
      children: [foundations],
    }),
    createMapNode({
      id: `${id}-area-core`,
      type: "area",
      title: "Core",
      purpose: `The heart of ${title}.`,
      children: [core],
    }),
  ];

  if (request.depth === "deep") {
    const advanced: MapNode = createMapNode({
      id: `${id}-advanced`,
      type: "topic",
      title: "Advanced Topics",
      difficulty: "Advanced",
      purpose: `Deeper, more specialized areas of ${title} for after the core.`,
      prerequisites: [`${id}-core`],
      subtopics: ["Specialized techniques", "Advanced patterns", "Open problems"],
    });
    areas.push(
      createMapNode({
        id: `${id}-area-advanced`,
        type: "area",
        title: "Advanced",
        purpose: "Specialized depth for after the core material.",
        children: [advanced],
      }),
    );
  }

  areas.push(
    createMapNode({
      id: `${id}-area-practice`,
      type: "area",
      title: "Practice",
      purpose: "Consolidate with concrete work.",
      children: [practice],
    }),
  );

  return createMapNode({
    id,
    type: "goal",
    title,
    purpose: `A structured learning path for ${title}, generated from your goal.`,
    children: areas,
  });
}
