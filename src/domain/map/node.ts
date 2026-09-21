import type { ResourceType } from "../enums";
import { ValidationError } from "../errors";
import type { MapEdgeKind, MapNodeType } from "./enums";

export interface MapResource {
  title: string;
  type: ResourceType;
  author?: string;
  difficulty?: string;
  url?: string;
  why?: string;
  chapters?: string;
}

export interface MapProject {
  title: string;
  brief: string;
}

/**
 * A single node in a learning map. The full structure is a recursive tree
 * rooted at a `goal` node; `children` encode "is composed of" relationships
 * while `prerequisites` and `next` encode cross-cutting ordering hints.
 */
export interface MapNode {
  id: string;
  type: MapNodeType;
  title: string;
  purpose?: string;
  prerequisites?: string[];
  difficulty?: string;
  timeMinutes?: number;
  subtopics?: string[];
  resources?: MapResource[];
  project?: MapProject;
  next?: string[];
  children?: MapNode[];
}

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  kind: MapEdgeKind;
}

export interface NewMapNode {
  id: string;
  type: MapNodeType;
  title: string;
  purpose?: string;
  prerequisites?: string[];
  difficulty?: string;
  timeMinutes?: number;
  subtopics?: string[];
  resources?: MapResource[];
  project?: MapProject;
  next?: string[];
  children?: MapNode[];
}

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`Map node ${field} must not be empty`);
  }
  return trimmed;
}

export function createMapNode(input: NewMapNode): MapNode {
  const id = requireNonEmpty(input.id, "id");
  const title = requireNonEmpty(input.title, "title");
  if (input.timeMinutes != null && input.timeMinutes <= 0) {
    throw new ValidationError("timeMinutes must be positive");
  }
  return {
    id,
    type: input.type,
    title,
    purpose: input.purpose?.trim() || undefined,
    prerequisites: input.prerequisites,
    difficulty: input.difficulty,
    timeMinutes: input.timeMinutes,
    subtopics: input.subtopics,
    resources: input.resources,
    project: input.project,
    next: input.next,
    children: input.children,
  };
}
