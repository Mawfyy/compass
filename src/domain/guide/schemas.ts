import { z } from "zod";

export const resourceKindSchema = z.enum([
  "Course",
  "Reading",
  "Exercise",
  "Project",
  "Case Study",
  "Certification",
  "Tool",
  "Docs",
]);

export const resourceSchema = z.object({
  kind: resourceKindSchema,
  name: z.string().min(1),
  note: z.string().optional(),
  url: z.string().url().optional(),
});

export const profileSchema = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  kind: z.enum(["career", "academic", "hobby", "project", "certification"]),
  depth: z.enum(["practical", "balanced", "deep"]),
  domain: z.string(),
  handsOn: z.enum(["low", "moderate", "high"]),
  hasTimeline: z.boolean(),
});

export const guidePhaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  duration: z.string().optional(),
  body: z.string().min(1),
  resources: z.array(resourceSchema).optional(),
});

export const guideSchema = z.object({
  intro: z.string(),
  prerequisites: z.string().optional(),
  phases: z.array(guidePhaseSchema).min(3).max(6),
  milestones: z.string(),
  profile: profileSchema.optional(),
});

export const guideRequestSchema = z.object({
  goal: z.string().trim().min(3, "Describe what you want a guide for"),
});

export type ResourceKind = z.infer<typeof resourceKindSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type GuidePhase = z.infer<typeof guidePhaseSchema>;
export type StudyGuide = z.infer<typeof guideSchema>;
export type GuideRequest = z.infer<typeof guideRequestSchema>;