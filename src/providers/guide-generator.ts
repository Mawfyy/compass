/**
 * The seam for generative study-guide providers. Produces an entire
 * `StudyGuide` from a goal string.
 */
import type { StudyGuide } from "../domain/guide/schemas";
import type { GoalProfile } from "../application/guide/goal-profile";

export interface GuideGenerator {
  readonly id: string;
  readonly model: string;

  generate(goal: string, profile?: GoalProfile): Promise<StudyGuide>;
}