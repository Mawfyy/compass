/**
 * The seam for generative study-guide providers. Like `MapGenerator`, this
 * produces a full output from a single goal — but as a structured `StudyGuide`
 * rather than a `LearningMap`.
 */
import type { StudyGuide } from "../domain/guide/schemas";
import type { GoalProfile } from "../application/guide/goal-profile";

export interface GuideGenerator {
  readonly id: string;
  readonly model: string;

  generate(goal: string, profile?: GoalProfile): Promise<StudyGuide>;
}