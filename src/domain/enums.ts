export const RESOURCE_TYPES = [
  "book",
  "course",
  "paper",
  "documentation",
  "tutorial",
  "video",
  "project",
  "exercise",
  "lecture",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
