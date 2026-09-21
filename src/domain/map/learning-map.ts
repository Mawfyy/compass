import { randomUUID } from "node:crypto";
import type { DifficultyLevel } from "../enums";
import { ValidationError } from "../errors";
import type { MapEdge, MapNode } from "./node";
import type { LearningDepth, LearningGoalKind } from "./enums";

export interface LearningGoal {
  /** The raw text the learner typed. */
  prompt: string;
  level: DifficultyLevel;
  goalKind: LearningGoalKind;
  depth: LearningDepth;
  hoursPerWeek: number;
}

export interface LearningMap {
  id: string;
  goal: LearningGoal;
  root: MapNode;
  edges: MapEdge[];
  createdAt: Date;
}

export interface NewLearningMap {
  id?: string;
  goal: LearningGoal;
  root: MapNode;
  edges?: MapEdge[];
  createdAt?: Date;
}

/**
 * Derives the explicit edge list from a node tree: `part_of` edges from
 * children, `prerequisite` edges from a node's prerequisites, and `next`
 * edges from a node's next pointers.
 */
export function deriveEdges(root: MapNode): MapEdge[] {
  const edges: MapEdge[] = [];
  const seen = new Set<string>();

  const add = (id: string, source: string, target: string, kind: MapEdge["kind"]) => {
    if (source === target || seen.has(id)) return;
    seen.add(id);
    edges.push({ id, source, target, kind });
  };

  const walk = (node: MapNode) => {
    for (const child of node.children ?? []) {
      add(`part:${node.id}:${child.id}`, node.id, child.id, "part_of");
      walk(child);
    }
    for (const prerequisite of node.prerequisites ?? []) {
      add(`prereq:${prerequisite}:${node.id}`, prerequisite, node.id, "prerequisite");
    }
    for (const next of node.next ?? []) {
      add(`next:${node.id}:${next}`, node.id, next, "next");
    }
  };

  walk(root);
  return edges;
}

export function createLearningMap(input: NewLearningMap): LearningMap {
  if (input.goal.prompt.trim().length === 0) {
    throw new ValidationError("Learning goal prompt must not be empty");
  }
  if (input.goal.hoursPerWeek <= 0) {
    throw new ValidationError("hoursPerWeek must be positive");
  }
  return {
    id: input.id ?? randomUUID(),
    goal: input.goal,
    root: input.root,
    edges: input.edges ?? deriveEdges(input.root),
    createdAt: input.createdAt ?? new Date(),
  };
}
