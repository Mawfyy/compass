/**
 * The seam for generative study-guide providers. Produces an entire
 * `StudyGuide` from a goal string.
 */
import type { StudyGuide } from "../domain/guide/schemas";

export interface GuideGenerator {
  readonly id: string;
  readonly model: string;

  generate(goal: string): Promise<StudyGuide>;
}