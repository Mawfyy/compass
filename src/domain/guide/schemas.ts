import { z } from "zod";

export const guidePhaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  duration: z.string().optional(),
  body: z.string().min(1),
});

export const guideSchema = z.object({
  intro: z.string(),
  prerequisites: z.string().optional(),
  phases: z.array(guidePhaseSchema).min(1),
  milestones: z.string(),
});

export type GuidePhase = z.infer<typeof guidePhaseSchema>;
export type StudyGuide = z.infer<typeof guideSchema>;