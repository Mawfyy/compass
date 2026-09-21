export const MAP_NODE_TYPES = [
  "goal",
  "area",
  "topic",
  "subtopic",
  "skill",
  "concept",
  "tool",
  "project",
  "milestone",
  "course",
  "reading",
  "exercise",
  "case-study",
  "certification",
] as const;
export type MapNodeType = (typeof MAP_NODE_TYPES)[number];

export const MAP_NODE_STATUSES = ["locked", "ready", "in_progress", "completed"] as const;
export type MapNodeStatus = (typeof MAP_NODE_STATUSES)[number];

export const MAP_EDGE_KINDS = ["part_of", "prerequisite", "next"] as const;
export type MapEdgeKind = (typeof MAP_EDGE_KINDS)[number];

export const LEARNING_GOAL_KINDS = [
  "career",
  "academic",
  "hobby",
  "project",
  "deep-understanding",
] as const;
export type LearningGoalKind = (typeof LEARNING_GOAL_KINDS)[number];

export const LEARNING_DEPTHS = ["practical", "balanced", "deep"] as const;
export type LearningDepth = (typeof LEARNING_DEPTHS)[number];
