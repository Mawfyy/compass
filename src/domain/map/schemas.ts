import { z } from "zod";
import { DIFFICULTY_LEVELS, RESOURCE_TYPES } from "../enums";
import type { MapNode, MapProject, MapResource } from "./node";
import type { LearningMap } from "./learning-map";
import {
  LEARNING_DEPTHS,
  LEARNING_GOAL_KINDS,
  MAP_EDGE_KINDS,
  MAP_NODE_TYPES,
} from "./enums";

export const mapResourceSchema: z.ZodType<MapResource> = z.object({
  title: z.string().min(1),
  type: z.enum(RESOURCE_TYPES),
  author: z.string().optional(),
  difficulty: z.string().optional(),
  url: z.string().optional(),
  why: z.string().optional(),
  chapters: z.string().optional(),
});

export const mapProjectSchema: z.ZodType<MapProject> = z.object({
  title: z.string().min(1),
  brief: z.string().min(1),
});

export const mapNodeSchema: z.ZodType<MapNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.enum(MAP_NODE_TYPES),
    title: z.string().min(1),
    purpose: z.string().optional(),
    prerequisites: z.array(z.string().min(1)).optional(),
    difficulty: z.string().optional(),
    timeMinutes: z.number().int().positive().optional(),
    subtopics: z.array(z.string().min(1)).optional(),
    resources: z.array(mapResourceSchema).optional(),
    project: mapProjectSchema.optional(),
    next: z.array(z.string().min(1)).optional(),
    children: z.array(mapNodeSchema).optional(),
  }),
);

export const mapEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  kind: z.enum(MAP_EDGE_KINDS),
});

export const learningMapSchema: z.ZodType<LearningMap> = z.object({
  id: z.string().min(1),
  goal: z.object({
    prompt: z.string().min(1),
    level: z.enum(DIFFICULTY_LEVELS),
    goalKind: z.enum(LEARNING_GOAL_KINDS),
    depth: z.enum(LEARNING_DEPTHS),
    hoursPerWeek: z.number().int().positive(),
  }),
  root: mapNodeSchema,
  edges: z.array(mapEdgeSchema),
  createdAt: z.date(),
});

export const generateMapRequestSchema = z.object({
  goal: z.string().trim().min(3, "Describe what you want to learn"),
  level: z.enum(DIFFICULTY_LEVELS).default("beginner"),
  goalKind: z.enum(LEARNING_GOAL_KINDS).default("career"),
  depth: z.enum(LEARNING_DEPTHS).default("balanced"),
  hoursPerWeek: z.number().int().min(1).max(80).default(10),
});

export type GenerateMapRequest = z.infer<typeof generateMapRequestSchema>;

export const guideRequestSchema = z.object({
  goal: z.string().trim().min(3, "Describe what you want a guide for"),
});

export type GuideRequest = z.infer<typeof guideRequestSchema>;
